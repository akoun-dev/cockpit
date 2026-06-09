import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || 'finance';
    const year = parseInt(searchParams.get('year') || '2025');

    const indicators = await db.indicator.findMany({
      where: { domain, isActive: true },
      include: {
        values: {
          where: { year },
          orderBy: { period: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ indicators });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
