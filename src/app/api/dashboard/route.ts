import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2025');

    // Get latest values for all domains
    const indicators = await db.indicator.findMany({
      where: { isActive: true },
      include: {
        values: {
          where: { year },
          orderBy: { period: 'desc' },
          take: 1,
        },
        department: true,
      },
      orderBy: { order: 'asc' },
    });

    // Group by domain
    const domains = ['finance', 'governance', 'operational', 'rh', 'risque', 'pta'];
    const summary = {};
    
    for (const domain of domains) {
      const domainIndicators = indicators.filter(i => i.domain === domain);
      summary[domain] = {
        count: domainIndicators.length,
        indicators: domainIndicators.map(i => ({
          id: i.id,
          name: i.name,
          code: i.code,
          subDomain: i.subDomain,
          unit: i.unit,
          targetValue: i.targetValue,
          value: i.values[0]?.value || 0,
          trend: i.values[0]?.value && i.targetValue 
            ? i.values[0].value >= i.targetValue ? 'positive' : i.values[0].value >= i.targetValue * 0.8 ? 'neutral' : 'negative'
            : 'neutral',
        })),
      };
    }

    // Global KPIs
    const totalIndicators = indicators.length;
    const positiveCount = indicators.filter(i => {
      const v = i.values[0]?.value;
      return v && i.targetValue && v >= i.targetValue;
    }).length;
    
    const globalPerformance = totalIndicators > 0 ? Math.round((positiveCount / totalIndicators) * 100) : 0;

    // Project summary
    const projects = await db.project.findMany();
    const projectSummary = {
      total: projects.length,
      en_cours: projects.filter(p => p.status === 'en_cours').length,
      termine: projects.filter(p => p.status === 'termine').length,
      planifie: projects.filter(p => p.status === 'planifie').length,
      avgProgress: Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length),
      totalBudget: projects.reduce((s, p) => s + (p.budgetPlan || 0), 0),
      totalSpent: projects.reduce((s, p) => s + (p.budgetReal || 0), 0),
    };

    return NextResponse.json({
      summary,
      globalPerformance,
      totalIndicators,
      projectSummary,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
