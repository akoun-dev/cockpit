import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || 'finance';
    const rawYear = searchParams.get('year');
    const year = rawYear && !isNaN(parseInt(rawYear)) ? parseInt(rawYear) : 2025;

    // Optional period filters
    const rawQuarter = searchParams.get('quarter');
    const quarter = rawQuarter && rawQuarter !== 'all' && !isNaN(parseInt(rawQuarter))
      ? parseInt(rawQuarter) : null;
    const rawMonth = searchParams.get('month');
    const month = rawMonth && rawMonth !== 'all' && !isNaN(parseInt(rawMonth))
      ? parseInt(rawMonth) : null;
    const rawDay = searchParams.get('day');
    const day = rawDay && rawDay !== 'all' && !isNaN(parseInt(rawDay))
      ? parseInt(rawDay) : null;

    // Build the values where clause
    const valuesWhere: Record<string, unknown> = { year };
    if (quarter !== null) valuesWhere.quarter = quarter;
    if (month !== null) valuesWhere.month = month;
    // day is stored as part of the period string; we filter client-side if needed

    const indicators = await db.indicator.findMany({
      where: { domain, isActive: true },
      include: {
        values: {
          where: valuesWhere,
          orderBy: { period: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    // If day filter is set, further filter values by checking the period string (format: "YYYY-MM" or "YYYY-MM-DD")
    let filteredIndicators = indicators;
    if (day !== null) {
      filteredIndicators = indicators.map((ind) => ({
        ...ind,
        values: ind.values.filter((v) => {
          // Period format can be "2025-06" or "2025-06-15"
          const parts = v.period.split('-');
          if (parts.length >= 3) {
            const dayOfMonth = parseInt(parts[2]);
            return dayOfMonth === day;
          }
          // If period is monthly (no day), include it only if no day filter intent
          return false;
        }),
      }));
    }

    return NextResponse.json({ indicators: filteredIndicators });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}