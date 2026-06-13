import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // ── Auth via query param ──────────────────────────────────────
  const secret = request.nextUrl.searchParams.get('secret');
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // ── Read settings ──────────────────────────────────────────
    const settings = await db.systemSetting.findMany({
      where: { key: { in: ['emailAlerts', 'reportFrequency', 'recipientEmail'] } },
    });

    const getVal = (key: string): string | null => {
      const s = settings.find((s) => s.key === key);
      if (!s) return null;
      try { return JSON.parse(s.value); } catch { return s.value; }
    };

    const emailAlerts = getVal('emailAlerts');
    const recipientEmail = getVal('recipientEmail');

    if (emailAlerts !== 'true' || !recipientEmail) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: emailAlerts !== 'true' ? 'Alertes email désactivées' : 'Aucun destinataire configuré',
      });
    }

    // ── Fetch dashboard data ─────────────────────────────────────
    const indicators = await db.indicator.findMany({
      include: {
        values: { orderBy: { period: 'desc' }, take: 1 },
      },
    });

    const total = indicators.length;
    let atteint = 0, partiel = 0, nonAtteint = 0, sansValeur = 0;

    for (const ind of indicators) {
      const val = ind.values?.[0]?.value;
      if (val === null || val === undefined) { sansValeur++; continue; }

      const target = ind.targetValue;
      if (target !== null) {
        const unit = ind.unit || '%';
        const isPercentage = unit === '%';
        const inverse = isPercentage;
        const above = inverse ? val <= target : val >= target;
        const alert = ind.alertValue;

        if (above) { atteint++; }
        else if (alert !== null) {
          const isAlertInverse = isPercentage ? val <= alert : val >= alert;
          if (isAlertInverse) { partiel++; }
          else { nonAtteint++; }
        } else { partiel++; }
      } else {
        nonAtteint++;
      }
    }

    const percent = total > 0 ? Math.round((atteint / total) * 100) : 0;

    // ── Build HTML report ─────────────────────────────────────────
    const now = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: sans-serif; color: #1a2332; padding: 24px; }
  h1 { color: #f18120; font-size: 20px; margin-bottom: 4px; }
  .date { color: #64748b; font-size: 12px; margin-bottom: 20px; }
  .grid { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; flex: 1; min-width: 100px; text-align: center; }
  .card .val { font-size: 24px; font-weight: bold; }
  .card .lbl { font-size: 11px; color: #64748b; margin-top: 4px; }
  .atteint .val { color: #10b981; }
  .partiel .val { color: #f59e0b; }
  .non .val { color: #ef4444; }
  .total .val { color: #1a2332; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 10px; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; }
  td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
</style></head>
<body>
  <h1>Rapport périodique — Cockpit DG</h1>
  <p class="date">Généré le ${now}</p>

  <div class="grid">
    <div class="card total"><div class="val">${total}</div><div class="lbl">Indicateurs</div></div>
    <div class="card atteint"><div class="val">${atteint}</div><div class="lbl">Atteint</div></div>
    <div class="card partiel"><div class="val">${partiel}</div><div class="lbl">Partiel</div></div>
    <div class="card non"><div class="val">${nonAtteint}</div><div class="lbl">Non atteint</div></div>
    <div class="card total"><div class="val">${percent}%</div><div class="lbl">Taux global</div></div>
  </div>

  <table>
    <thead><tr><th>Code</th><th>Indicateur</th><th>Valeur</th><th>Cible</th><th>Statut</th></tr></thead>
    <tbody>
      ${indicators.slice(0, 50).map((ind) => {
        const val = ind.values?.[0]?.value;
        const target = ind.targetValue;
        const st = val !== null && target !== null
          ? (() => {
              const unit = ind.unit || '%';
              const inverse = unit === '%';
              const above = inverse ? val <= target : val >= target;
              if (above) return 'Atteint';
              if (ind.alertValue !== null) {
                const isAlertInverse = unit === '%' ? val <= ind.alertValue : val >= ind.alertValue;
                return isAlertInverse ? 'Partiel' : 'Non atteint';
              }
              return 'Partiel';
            })()
          : '—';
        const color = st === 'Atteint' ? '#10b981' : st === 'Partiel' ? '#f59e0b' : st === 'Non atteint' ? '#ef4444' : '#94a3b8';
        return `<tr><td style="font-family:monospace">${ind.code}</td><td>${ind.name}</td><td>${val ?? '—'}</td><td>${target ?? '—'}</td><td style="color:${color};font-weight:600">${st}</td></tr>`;
      }).join('')}
    </tbody>
  </table>
  ${indicators.length > 50 ? `<p style="font-size:11px;color:#94a3b8;margin-top:8px">… et ${indicators.length - 50} indicateurs supplémentaires</p>` : ''}

  <div class="footer">
    Rapport automatique · ANSUT Cockpit DG · ${now}
  </div>
</body>
</html>`;

    // ── Send email ─────────────────────────────────────────────
    const sent = await sendEmail({
      to: recipientEmail,
      subject: `Rapport périodique Cockpit DG — ${now}`,
      html,
    });

    return NextResponse.json({
      ok: true,
      sent,
      totalIndicators: total,
      stats: { atteint, partiel, nonAtteint, sansValeur, percent },
    });
  } catch (error) {
    console.error('[cron/report] Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la génération du rapport' }, { status: 500 });
  }
}
