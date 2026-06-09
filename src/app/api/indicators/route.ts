import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const year = parseInt(searchParams.get('year') || '2025');
    const quarter = searchParams.get('quarter');
    const departmentId = searchParams.get('departmentId');

    const indicators = await db.indicator.findMany({
      where: {
        isActive: true,
        ...(domain && domain !== 'accueil' ? { domain } : {}),
      },
      include: {
        department: true,
        values: {
          where: {
            year,
            ...(quarter ? { quarter: parseInt(quarter) } : {}),
          },
          orderBy: { period: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ indicators, lastUpdated: new Date().toISOString() });
  } catch (error) {
    console.error('Error fetching indicators:', error);
    return NextResponse.json({ error: 'Failed to fetch indicators' }, { status: 500 });
  }
}
