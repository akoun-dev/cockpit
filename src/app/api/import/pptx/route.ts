import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { requireAdmin } from '@/lib/require-auth';

// ─── XML helpers ──────────────────────────────────────────────────────────────

function getTagText(xml: string, tag: string): string {
  // Handle both <a:t>text</a:t> and <a:t><![CDATA[text]]></a:t>
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?</${tag}>`, 'gs');
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) {
    matches.push(m[1].trim());
  }
  return matches.join(' ');
}

function parseTableRows(tableXml: string): string[][] {
  const rows: string[][] = [];
  // Split by <a:tr> rows
  const trRegex = /<a:tr[^>]*>([\s\S]*?)<\/a:tr>/g;
  let trMatch: RegExpExecArray | null;
  while ((trMatch = trRegex.exec(tableXml)) !== null) {
    const trContent = trMatch[1];
    const cells: string[] = [];
    // Extract text from each <a:tc> cell
    const tcRegex = /<a:tc[^>]*>([\s\S]*?)<\/a:tc>/g;
    let tcMatch: RegExpExecArray | null;
    while ((tcMatch = tcRegex.exec(trContent)) !== null) {
      const cellText = getTagText(tcMatch[1], 'a:t');
      cells.push(cellText);
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}

// ─── KPI code pattern ────────────────────────────────────────────────────────

const KPI_CODE_REGEX = /\b([A-Z]{2,5}-\d{2,3})\b/;

function extractCode(cell: string): string | null {
  const match = cell.match(KPI_CODE_REGEX);
  return match ? match[1] : null;
}

function parseValue(val: string): number | null {
  // Handle "88.38 %", "88,38%", "88.38", "N/A", ""
  if (!val || val.trim() === '' || val.trim() === 'N/A' || val.trim() === '-') return null;
  const cleaned = val.replace(/[%\s]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (session instanceof Response) return session

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const yearStr = formData.get('year') as string | null;
    const quarterStr = formData.get('quarter') as string | null;
    const monthStr = formData.get('month') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!file.name.endsWith('.pptx')) {
      return NextResponse.json({ error: 'Le fichier doit être au format .pptx' }, { status: 400 });
    }

    const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();
    const quarter = quarterStr ? parseInt(quarterStr) : null;
    const month = monthStr ? parseInt(monthStr) : null;

    // Parse PPTX (it's a ZIP file)
    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);

    // Find all slide XML files
    const slideFiles: string[] = [];
    zip.forEach((path) => {
      if (/^ppt\/slides\/slide\d+\.xml$/.test(path)) {
        slideFiles.push(path);
      }
    });
    slideFiles.sort();

    // Extract all tables from all slides
    const allRows: string[][] = [];
    for (const slidePath of slideFiles) {
      const slideXml = await zip.file(slidePath)?.async('text');
      if (!slideXml) continue;

      // Find all <a:tbl> table elements
      const tblRegex = /<a:tbl[^>]*>([\s\S]*?)<\/a:tbl>/g;
      let tblMatch: RegExpExecArray | null;
      while ((tblMatch = tblRegex.exec(slideXml)) !== null) {
        const rows = parseTableRows(tblMatch[1]);
        allRows.push(...rows);
      }
    }

    // Try to find KPI data in the rows
    const indicators = await db.indicator.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true, domain: true },
    });

    const codeToIndicator = new Map(indicators.map((i) => [i.code, i]));

    const parsed: {
      code: string;
      name: string | null;
      domain: string | null;
      value: number | null;
      found: boolean;
    }[] = [];

    for (const row of allRows) {
      for (const cell of row) {
        const code = extractCode(cell);
        if (code && codeToIndicator.has(code)) {
          // Try to find the value in the same row
          let value: number | null = null;
          for (const otherCell of row) {
            const v = parseValue(otherCell);
            if (v !== null) {
              value = v;
              break;
            }
          }
          const ind = codeToIndicator.get(code)!;
          parsed.push({
            code,
            name: ind.name,
            domain: ind.domain,
            value,
            found: true,
          });
        }
      }
    }

    // Deduplicate by code (keep first occurrence)
    const seen = new Set<string>();
    const unique = parsed.filter((p) => {
      if (seen.has(p.code)) return false;
      seen.add(p.code);
      return true;
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'IMPORT_PPTX_PREVIEW',
        category: 'import',
        details: `Prévisualisation import PPTX: ${unique.length} indicateurs trouvés dans ${slideFiles.length} slides`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    });

    return NextResponse.json({
      fileName: file.name,
      slidesScanned: slideFiles.length,
      tablesFound: allRows.length,
      indicatorsFound: unique.length,
      indicators: unique,
      year,
      quarter,
      month,
    });
  } catch (error) {
    console.error('PPTX import error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'import du fichier PowerPoint' }, { status: 500 });
  }
}

// ─── PUT handler (apply import) ───────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin()
    if (session instanceof Response) return session

    const body = await request.json();
    const { indicators, year, quarter, month } = body as {
      indicators: { code: string; value: number }[];
      year: number;
      quarter: number | null;
      month: number | null;
    };

    if (!indicators || !Array.isArray(indicators)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    // Look up indicator IDs by code
    const codes = indicators.map((i) => i.code);
    const dbIndicators = await db.indicator.findMany({
      where: { code: { in: codes } },
      select: { id: true, code: true },
    });

    const codeToId = new Map(dbIndicators.map((i) => [i.code, i.id]));

    let updated = 0;
    let created = 0;

    for (const item of indicators) {
      const indicatorId = codeToId.get(item.code);
      if (!indicatorId) continue;

      const period = quarter ? `T${quarter}` : month ? `M${String(month).padStart(2, '0')}` : `A${year}`;

      // Upsert the indicator value
      const existing = await db.indicatorValue.findFirst({
        where: {
          indicatorId,
          year,
          ...(quarter ? { quarter } : {}),
          ...(month ? { month } : {}),
        },
      });

      if (existing) {
        await db.indicatorValue.update({
          where: { id: existing.id },
          data: { value: item.value, period },
        });
        updated++;
      } else {
        await db.indicatorValue.create({
          data: {
            indicatorId,
            value: item.value,
            year,
            period,
            ...(quarter ? { quarter } : {}),
            ...(month ? { month } : {}),
          },
        });
        created++;
      }
    }

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'IMPORT_PPTX',
        category: 'import',
        userId: session.user.id,
        details: `Import PPTX appliqué : ${updated} mis à jour, ${created} créés (total: ${indicators.length})`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    });

    return NextResponse.json({
      success: true,
      updated,
      created,
      total: indicators.length,
    });
  } catch (error) {
    console.error('PPTX apply import error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'application des données' }, { status: 500 });
  }
}