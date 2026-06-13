import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';

const DOMAIN_LABELS: Record<string, string> = {
  finance: 'Finance',
  governance: 'Gouvernance',
  operational: 'Opérationnel',
  rh: 'Ressources Humaines',
  risque: 'Cadre de Risque',
  pta: 'Plan de Travail Annuel',
};

const DOMAIN_COLORS: Record<string, string> = {
  finance: '#1c55a3',
  governance: '#205eb3',
  operational: '#f18120',
  rh: '#22c55e',
  risque: '#ef4444',
  pta: '#f59e0b',
};

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    if (session instanceof Response) return session

    const { searchParams } = new URL(request.url);
    const q = (searchParams.get('q') || '').trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const quarter = searchParams.get('quarter');

    // Search indicators by name, code, or subDomain
    const indicators = await db.indicator.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { code: { contains: q.toUpperCase() } },
          { subDomain: { contains: q } },
        ],
      },
      include: {
        department: true,
        values: {
          where: {
            year,
            ...(quarter ? { quarter: parseInt(quarter) } : {}),
          },
          orderBy: { period: 'desc' },
          take: 1,
        },
      },
      take: 20,
      orderBy: { order: 'asc' },
    });

    // Also search by domain label (module names)
    const moduleMatches = Object.entries(DOMAIN_LABELS)
      .filter(([, label]) => label.toLowerCase().includes(q.toLowerCase()))
      .map(([key, label]) => ({
        type: 'module' as const,
        id: `module-${key}`,
        name: label,
        code: null,
        domain: key,
        domainLabel: label,
        domainColor: DOMAIN_COLORS[key],
        value: null,
        targetValue: null,
        unit: '',
        status: null,
      }));

    const indicatorResults = indicators.map((i) => {
      const latestValue = i.values[0];
      return {
        type: 'indicator' as const,
        id: i.id,
        name: i.name,
        code: i.code,
        domain: i.domain,
        domainLabel: DOMAIN_LABELS[i.domain] || i.domain,
        domainColor: DOMAIN_COLORS[i.domain] || '#666',
        subDomain: i.subDomain || null,
        value: latestValue?.value ?? null,
        targetValue: i.targetValue,
        unit: i.unit,
        status: null,
      };
    });

    return NextResponse.json({
      results: [...moduleMatches, ...indicatorResults],
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}