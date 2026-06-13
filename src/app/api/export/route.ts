import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { buildAuthOptions } from '@/lib/auth';

// GET /api/export — returns structured export data
// Query params: module, format (pdf/excel), year, quarter, month, periodStart, periodEnd
export async function GET(request: NextRequest) {
  try {
    const authOptions = await buildAuthOptions();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modName = searchParams.get('module') ?? 'governance';
    const format = searchParams.get('format') ?? 'pdf';
    const year = searchParams.get('year');
    const quarter = searchParams.get('quarter');
    const month = searchParams.get('month');
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');

    // 1. Read export settings from SystemSetting table
    const settingKeys = [
      'pdfTemplate',
      'pptTemplate',
      'excelTemplate',
      'defaultExportFormat',
      'includeLogo',
      'includeGenerationDate',
    ];
    const settingRows = await db.systemSetting.findMany({
      where: { key: { in: settingKeys } },
    });
    const settings: Record<string, unknown> = {};
    for (const row of settingRows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }

    // 2. Build indicator query
    const where: Record<string, unknown> = {
      domain: modName,
      isActive: true,
    };

    const indicatorValuesWhere: Record<string, unknown> = {};

    if (year) {
      indicatorValuesWhere.year = parseInt(year, 10);
    }
    if (quarter) {
      indicatorValuesWhere.quarter = parseInt(quarter, 10);
    }
    if (month) {
      indicatorValuesWhere.month = parseInt(month, 10);
    }

    // 3. Fetch indicators with values
    const indicators = await db.indicator.findMany({
      where,
      include: {
        values: {
          where: Object.keys(indicatorValuesWhere).length > 0 ? indicatorValuesWhere : undefined,
          orderBy: [{ year: 'asc' }, { quarter: 'asc' }, { month: 'asc' }],
        },
        department: {
          select: { name: true },
        },
      },
      orderBy: [{ order: 'asc' }, { code: 'asc' }],
    });

    // 4. Format response
    const formattedIndicators = indicators.map((ind) => {
      const latestValue = ind.values.length > 0 ? ind.values[ind.values.length - 1] : null;
      return {
        code: ind.code,
        name: ind.name,
        subDomain: ind.subDomain,
        unit: ind.unit,
        targetValue: ind.targetValue,
        alertValue: ind.alertValue,
        criticalValue: ind.criticalValue,
        isPriority: ind.isPriority,
        department: ind.department?.name ?? null,
        values: ind.values.map((v) => ({
          year: v.year,
          quarter: v.quarter,
          month: v.month,
          period: v.period,
          value: v.value,
          comment: v.comment,
        })),
        latestValue: latestValue?.value ?? null,
        latestPeriod: latestValue?.period ?? null,
      };
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT_DATA',
        category: 'export',
        details: `Export ${formattedIndicators.length} indicateurs (${format}) du module "${modName}"`,
        ipAddress: request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? undefined,
      },
    });

    return NextResponse.json({
      format,
      module: modName,
      moduleLabel: modName,
      filters: {
        year: year ? parseInt(year, 10) : null,
        quarter: quarter ? parseInt(quarter, 10) : null,
        month: month ? parseInt(month, 10) : null,
        periodStart: periodStart ?? null,
        periodEnd: periodEnd ?? null,
      },
      settings,
      indicators: formattedIndicators,
      totalIndicators: formattedIndicators.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[GET /api/export]', error);
    return NextResponse.json(
      { error: 'Failed to generate export data' },
      { status: 500 },
    );
  }
}