import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import PptxGenJS from 'pptxgenjs';

// ANSUT branding
const TANGO = 'F18120';
const FUN_BLUE = '205EB3';
const DARK = '1A1A2E';
const GRAY = '6B7280';
const LIGHT_BG = 'F9FAFB';
const WHITE = 'FFFFFF';
const GREEN = '059669';
const AMBER = 'D97706';
const RED = 'DC2626';

const MODULE_LABELS: Record<string, string> = {
  governance: 'Gouvernance',
  finance: 'Finance',
  operational: 'Opérationnel',
  rh: 'Ressources Humaines',
  risque: 'Cadre de Risque',
  pta: 'Plan de Travail Annuel',
};

const SUB_DOMAIN_LABELS: Record<string, string> = {
  reporting_reglementaire: 'Reporting réglementaire',
  gouvernance_ethique: 'Gouvernance & Éthique',
  marches_publics: 'Passation des Marchés Publics',
  relations_publiques: 'Dons, Honoraires & Relations Publiques',
  execution_budgetaire: 'Exécution budgétaire',
  rentabilite: 'Rentabilité & Performance',
  ressources_specifiques: 'Ressources Spécifiques',
  dette: 'Endettement',
  deploiement_infra: 'Déploiement Infrastructures',
  relations_operateurs: 'Relations Opérateurs',
  service_universel: 'Service Universel',
  projets_programmes: 'Projets & Programmes',
  effectifs: 'Effectifs & Organisation',
  performance: 'Performance & Productivité',
  competences: 'Développement Compétences',
  couts_rh: 'Maîtrise Coûts RH',
  risque_strategique: 'Risque Stratégique',
  risque_financier: 'Risque Financier',
  risque_operationnel: 'Risque Opérationnel',
  risque_technologique: 'Risque Technologique',
  risque_gouvernance: 'Risque Gouvernance',
  pta_gouvernance: 'Gouvernance',
  pta_operationnel: 'Opérationnel',
  pta_finance: 'Finance',
};

function getStatus(
  value: number | null,
  target: number | null,
  alert: number | null,
  critical: number | null,
  unit: string,
): 'atteint' | 'partiel' | 'non_atteint' {
  if (value === null || target === null) return 'non_atteint';
  const isInverse = unit === '%' ? value <= target : value >= target;
  if (!isInverse) {
    if (critical !== null && value >= critical) return 'non_atteint';
    if (alert !== null && value >= alert) return 'partiel';
    return 'partiel';
  }
  if (alert !== null) {
    const isAlertInverse = unit === '%' ? value <= alert : value >= alert;
    return isAlertInverse ? 'atteint' : 'partiel';
  }
  return 'atteint';
}

function statusColor(s: string) {
  if (s === 'atteint') return GREEN;
  if (s === 'partiel') return AMBER;
  return RED;
}

function statusLabel(s: string) {
  if (s === 'atteint') return 'Atteint';
  if (s === 'partiel') return 'Partiel';
  return 'Non atteint';
}

// GET /api/export/pptx
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modName = searchParams.get('module') ?? 'governance';
    const year = searchParams.get('year');
    const quarter = searchParams.get('quarter');
    const month = searchParams.get('month');

    // Fetch indicators
    const where: Record<string, unknown> = { domain: modName, isActive: true };
    const valuesWhere: Record<string, unknown> = {};
    if (year) valuesWhere.year = parseInt(year, 10);
    if (quarter) valuesWhere.quarter = parseInt(quarter, 10);
    if (month) valuesWhere.month = parseInt(month, 10);

    const indicators = await db.indicator.findMany({
      where,
      include: {
        values: {
          where: Object.keys(valuesWhere).length > 0 ? valuesWhere : undefined,
          orderBy: [{ year: 'asc' }, { quarter: 'asc' }, { month: 'asc' }],
        },
        department: { select: { name: true } },
      },
      orderBy: [{ order: 'asc' }, { code: 'asc' }],
    });

    // Group by sub-domain
    const grouped = new Map<string, typeof indicators>();
    for (const ind of indicators) {
      const sd = ind.subDomain || 'autre';
      if (!grouped.has(sd)) grouped.set(sd, []);
      grouped.get(sd)!.push(ind);
    }

    const moduleLabel = MODULE_LABELS[modName] || modName;

    // Filter label
    let filterLabel = String(year || 2025);
    if (quarter) filterLabel += ` — T${quarter}`;
    if (month) filterLabel += ` — M${month}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    // ── Build PPTX ──
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5
    pptx.author = 'ANSUT Cockpit DG';
    pptx.subject = `Rapport ${moduleLabel}`;
    pptx.title = `Cockpit DG — ${moduleLabel}`;

    // Shared table header options
    const hdrOpts: PptxGenJS.TextPropsOptions = {
      bold: true, fontSize: 9, color: WHITE, fontFace: 'Calibri',
      align: 'center', valign: 'middle',
    };
    const cellOpts: PptxGenJS.TextPropsOptions = {
      fontSize: 8.5, color: DARK, fontFace: 'Calibri', valign: 'middle',
    };
    const cellCenter: PptxGenJS.TextPropsOptions = {
      ...cellOpts, align: 'center',
    };
    const cellRight: PptxGenJS.TextPropsOptions = {
      ...cellOpts, align: 'right',
    };

    // ─── SLIDE 1: Title ───
    const slide1 = pptx.addSlide();
    // Full-width blue bar at top
    slide1.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.3, fill: { color: FUN_BLUE },
    });
    // Tango accent bar
    slide1.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0.3, w: '100%', h: 0.06, fill: { color: TANGO },
    });
    // Title
    slide1.addText('ANSUT', {
      x: 0.8, y: 1.2, w: 8, h: 0.7,
      fontSize: 28, bold: true, color: FUN_BLUE, fontFace: 'Calibri',
    });
    slide1.addText('Cockpit Direction Générale', {
      x: 0.8, y: 1.9, w: 8, h: 0.5,
      fontSize: 16, color: GRAY, fontFace: 'Calibri',
    });
    // Module name
    slide1.addText(moduleLabel, {
      x: 0.8, y: 2.8, w: 8, h: 0.8,
      fontSize: 36, bold: true, color: TANGO, fontFace: 'Calibri',
    });
    // Separator
    slide1.addShape(pptx.ShapeType.rect, {
      x: 0.8, y: 3.7, w: 4, h: 0.04, fill: { color: TANGO },
    });
    // Meta
    slide1.addText(
      [
        { text: 'Période : ', options: { fontSize: 11, color: GRAY } },
        { text: filterLabel, options: { fontSize: 11, bold: true, color: DARK } },
      ],
      { x: 0.8, y: 3.95, w: 6, h: 0.35, fontFace: 'Calibri' },
    );
    slide1.addText(
      [
        { text: 'Indicateurs : ', options: { fontSize: 11, color: GRAY } },
        { text: String(indicators.length), options: { fontSize: 11, bold: true, color: DARK } },
      ],
      { x: 0.8, y: 4.3, w: 6, h: 0.35, fontFace: 'Calibri' },
    );
    slide1.addText(
      [
        { text: 'Sous-domaines : ', options: { fontSize: 11, color: GRAY } },
        { text: String(grouped.size), options: { fontSize: 11, bold: true, color: DARK } },
      ],
      { x: 0.8, y: 4.65, w: 6, h: 0.35, fontFace: 'Calibri' },
    );
    // Date bottom right
    slide1.addText(`Généré le ${dateStr}`, {
      x: 7, y: 6.2, w: 5.5, h: 0.35,
      fontSize: 9, color: GRAY, fontFace: 'Calibri', align: 'right',
    });
    // Bottom bar
    slide1.addShape(pptx.ShapeType.rect, {
      x: 0, y: 7.14, w: '100%', h: 0.06, fill: { color: TANGO },
    });
    slide1.addShape(pptx.ShapeType.rect, {
      x: 0, y: 7.2, w: '100%', h: 0.3, fill: { color: FUN_BLUE },
    });

    // ─── SLIDE 2: Summary / Synthesis ───
    const slide2 = pptx.addSlide();
    slide2.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0, w: '100%', h: 0.6, fill: { color: FUN_BLUE },
    });
    slide2.addText(`Synthèse — ${moduleLabel}`, {
      x: 0.5, y: 0.08, w: 10, h: 0.45,
      fontSize: 18, bold: true, color: WHITE, fontFace: 'Calibri',
    });
    slide2.addShape(pptx.ShapeType.rect, {
      x: 0, y: 0.6, w: '100%', h: 0.04, fill: { color: TANGO },
    });

    // Summary KPIs
    let totalAtteint = 0;
    let totalPartiel = 0;
    let totalNonAtteint = 0;
    let totalNoValue = 0;
    for (const ind of indicators) {
      const latest = ind.values.length > 0 ? ind.values[ind.values.length - 1] : null;
      if (!latest) { totalNoValue++; continue; }
      const s = getStatus(latest.value, ind.targetValue, ind.alertValue, ind.criticalValue, ind.unit);
      if (s === 'atteint') totalAtteint++;
      else if (s === 'partiel') totalPartiel++;
      else totalNonAtteint++;
    }

    // KPI summary cards
    const cards = [
      { label: 'Atteint', value: totalAtteint, color: GREEN },
      { label: 'Partiel', value: totalPartiel, color: AMBER },
      { label: 'Non atteint', value: totalNonAtteint, color: RED },
      { label: 'Sans valeur', value: totalNoValue, color: GRAY },
    ];
    const cardW = 2.6;
    const cardH = 1.5;
    const cardGap = 0.4;
    const cardStartX = (13.33 - (cards.length * cardW + (cards.length - 1) * cardGap)) / 2;

    cards.forEach((c, i) => {
      const cx = cardStartX + i * (cardW + cardGap);
      const cy = 1.1;
      // Card background
      slide2.addShape(pptx.ShapeType.roundRect, {
        x: cx, y: cy, w: cardW, h: cardH,
        fill: { color: LIGHT_BG },
        rectRadius: 0.1,
        line: { color: 'E5E7EB', width: 1 },
      });
      // Left accent
      slide2.addShape(pptx.ShapeType.rect, {
        x: cx, y: cy + 0.2, w: 0.06, h: cardH - 0.4, fill: { color: c.color },
      });
      // Value
      slide2.addText(String(c.value), {
        x: cx + 0.25, y: cy + 0.15, w: cardW - 0.4, h: 0.7,
        fontSize: 32, bold: true, color: c.color, fontFace: 'Calibri', align: 'center',
      });
      // Label
      slide2.addText(c.label, {
        x: cx + 0.25, y: cy + 0.85, w: cardW - 0.4, h: 0.4,
        fontSize: 11, color: GRAY, fontFace: 'Calibri', align: 'center',
      });
    });

    // Sub-domain summary table
    const sdRows = Array.from(grouped.entries()).map(([key, inds]) => {
      let a = 0, p = 0, n = 0;
      for (const ind of inds) {
        const latest = ind.values.length > 0 ? ind.values[ind.values.length - 1] : null;
        if (!latest) { n++; continue; }
        const s = getStatus(latest.value, ind.targetValue, ind.alertValue, ind.criticalValue, ind.unit);
        if (s === 'atteint') a++;
        else if (s === 'partiel') p++;
        else n++;
      }
      return {
        label: SUB_DOMAIN_LABELS[key] || key.replace(/_/g, ' '),
        total: inds.length,
        atteint: a,
        partiel: p,
        non_atteint: n,
      };
    });

    const sdTableRows: PptxGenJS.TableCell[][] = [
      [
        { text: 'Sous-domaine', options: hdrOpts },
        { text: 'Total', options: hdrOpts },
        { text: 'Atteint', options: hdrOpts },
        { text: 'Partiel', options: hdrOpts },
        { text: 'Non atteint', options: hdrOpts },
        { text: 'Taux atteinte', options: hdrOpts },
      ],
      ...sdRows.map((r) => {
        const rate = r.total > 0 ? Math.round((r.atteint / r.total) * 100) : 0;
        const rateColor = rate >= 75 ? GREEN : rate >= 50 ? AMBER : RED;
        return [
          { text: r.label, options: { ...cellOpts, bold: true } },
          { text: String(r.total), options: cellCenter },
          { text: String(r.atteint), options: { ...cellCenter, color: GREEN, bold: true } },
          { text: String(r.partiel), options: { ...cellCenter, color: AMBER, bold: true } },
          { text: String(r.non_atteint), options: { ...cellCenter, color: RED, bold: true } },
          { text: `${rate}%`, options: { ...cellCenter, color: rateColor, bold: true } },
        ];
      }),
    ];

    slide2.addTable(sdTableRows, {
      x: 0.5, y: 3.0,
      w: 12.33,
      colW: [5.5, 1.3, 1.5, 1.5, 1.5, 1.53],
      rowH: [0.35, ...sdRows.map(() => 0.3)],
      border: { pt: 0.5, color: 'E5E7EB' },
      autoPage: false,
    });

    // Bottom bar
    slide2.addShape(pptx.ShapeType.rect, {
      x: 0, y: 7.14, w: '100%', h: 0.06, fill: { color: TANGO },
    });
    slide2.addShape(pptx.ShapeType.rect, {
      x: 0, y: 7.2, w: '100%', h: 0.3, fill: { color: FUN_BLUE },
    });

    // ─── SLIDES 3+: One per sub-domain ───
    for (const [sdKey, sdIndicators] of grouped) {
      const sdLabel = SUB_DOMAIN_LABELS[sdKey] || sdKey.replace(/_/g, ' ');
      const slide = pptx.addSlide();

      // Header
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: '100%', h: 0.55, fill: { color: FUN_BLUE },
      });
      slide.addText(`${moduleLabel} — ${sdLabel}`, {
        x: 0.5, y: 0.08, w: 10, h: 0.4,
        fontSize: 14, bold: true, color: WHITE, fontFace: 'Calibri',
      });
      slide.addText(`${sdIndicators.length} indicateurs`, {
        x: 10, y: 0.08, w: 2.8, h: 0.4,
        fontSize: 10, color: 'FFFFFFAA', fontFace: 'Calibri', align: 'right',
      });
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0.55, w: '100%', h: 0.04, fill: { color: TANGO },
      });

      // Table
      const tableRows: PptxGenJS.TableCell[][] = [
        [
          { text: 'Code', options: hdrOpts },
          { text: 'Indicateur', options: hdrOpts },
          { text: 'Unité', options: hdrOpts },
          { text: 'Cible', options: hdrOpts },
          { text: 'Valeur', options: hdrOpts },
          { text: 'Écart', options: hdrOpts },
          { text: 'Statut', options: hdrOpts },
          { text: 'Période', options: hdrOpts },
        ],
      ];

      for (const ind of sdIndicators) {
        const latest = ind.values.length > 0 ? ind.values[ind.values.length - 1] : null;
        const val = latest?.value ?? null;
        const period = latest?.period ?? '—';
        const target = ind.targetValue;
        const ecart = val !== null && target !== null ? val - target : null;

        const st = getStatus(val, target, ind.alertValue, ind.criticalValue, ind.unit);
        const stCol = statusColor(st);
        const stLbl = statusLabel(st);

        const ecartStr = ecart !== null
          ? `${ecart > 0 ? '+' : ''}${ecart.toFixed(1)}`
          : '—';
        const ecartColor = ecart !== null
          ? (ind.unit === '%' ? (ecart <= 0 ? GREEN : RED) : (ecart >= 0 ? GREEN : RED))
          : GRAY;

        const row: PptxGenJS.TableCell[] = [
          {
            text: ind.code + (ind.isPriority ? ' ★' : ''),
            options: { ...cellOpts, bold: true, fontSize: 8, color: ind.isPriority ? TANGO : DARK },
          },
          { text: ind.name, options: { ...cellOpts, fontSize: 8 } },
          { text: ind.unit, options: cellCenter },
          { text: target !== null ? String(target) : '—', options: cellRight },
          { text: val !== null ? String(val) : '—', options: { ...cellRight, bold: true, color: val !== null ? DARK : GRAY } },
          { text: ecartStr, options: { ...cellRight, color: ecartColor, bold: true, fontSize: 8 } },
          { text: stLbl, options: { ...cellCenter, color: stCol, bold: true, fontSize: 8 } },
          { text: period, options: { ...cellCenter, fontSize: 7.5, color: GRAY } },
        ];
        tableRows.push(row);
      }

      // Split into pages if too many rows (max ~12 per slide)
      const maxRows = 12;
      const dataRows = tableRows.slice(1);
      const pages: typeof dataRows[] = [];
      for (let i = 0; i < dataRows.length; i += maxRows) {
        pages.push(dataRows.slice(i, i + maxRows));
      }

      let contSlide: PptxGenJS.Slide | undefined;
      for (let pi = 0; pi < pages.length; pi++) {
        if (pi > 0) {
          // Add continuation slide
          contSlide = pptx.addSlide();
          contSlide.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0, w: '100%', h: 0.55, fill: { color: FUN_BLUE },
          });
          contSlide.addText(`${moduleLabel} — ${sdLabel} (suite)`, {
            x: 0.5, y: 0.08, w: 10, h: 0.4,
            fontSize: 14, bold: true, color: WHITE, fontFace: 'Calibri',
          });
          contSlide.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0.55, w: '100%', h: 0.04, fill: { color: TANGO },
          });

          contSlide.addTable([tableRows[0], ...pages[pi]], {
            x: 0.3, y: 0.8,
            w: 12.73,
            colW: [1.3, 4.0, 0.9, 1.0, 1.0, 1.0, 1.3, 1.23],
            rowH: [0.35, ...pages[pi].map(() => 0.33)],
            border: { pt: 0.5, color: 'E5E7EB' },
            autoPage: false,
          });

          contSlide.addShape(pptx.ShapeType.rect, {
            x: 0, y: 7.14, w: '100%', h: 0.06, fill: { color: TANGO },
          });
          contSlide.addShape(pptx.ShapeType.rect, {
            x: 0, y: 7.2, w: '100%', h: 0.3, fill: { color: FUN_BLUE },
          });
        } else {
          slide.addTable([tableRows[0], ...pages[0]], {
            x: 0.3, y: 0.8,
            w: 12.73,
            colW: [1.3, 4.0, 0.9, 1.0, 1.0, 1.0, 1.3, 1.23],
            rowH: [0.35, ...pages[0].map(() => 0.33)],
            border: { pt: 0.5, color: 'E5E7EB' },
            autoPage: false,
          });
        }
      }

      // Bottom bar (only on last slide of sub-domain)
      const targetSlide = pages.length > 1 ? contSlide! : slide;
      targetSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 7.14, w: '100%', h: 0.06, fill: { color: TANGO },
      });
      targetSlide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 7.2, w: '100%', h: 0.3, fill: { color: FUN_BLUE },
      });
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT_PPTX',
        category: 'export',
        details: `Export PPTX ${indicators.length} indicateurs du module "${modName}"`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    });

    // Generate buffer
    const buf = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;

    // Send as downloadable file
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="cockpit_${modName}_${now.toISOString().slice(0, 10)}.pptx"`,
        'Content-Length': String(buf.length),
      },
    });
  } catch (error) {
    console.error('[GET /api/export/pptx]', error);
    return NextResponse.json(
      { error: 'Failed to generate PPTX export' },
      { status: 500 },
    );
  }
}