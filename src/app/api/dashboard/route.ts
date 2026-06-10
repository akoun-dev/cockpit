import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Units where lower values are better
const LOWER_IS_BETTER_UNITS = ['jours', 'nb', 'h', 'ratio'];

type Status = 'atteint' | 'partiel' | 'non_atteint';

function computeStatus(value: number | null | undefined, targetValue: number | null | undefined, unit: string): Status {
  if (value == null || targetValue == null || targetValue === 0) {
    return 'non_atteint';
  }

  const isLowerBetter = LOWER_IS_BETTER_UNITS.includes(unit.toLowerCase());

  if (isLowerBetter) {
    if (value <= targetValue) return 'atteint';
    if (value <= targetValue * 1.5) return 'partiel';
    return 'non_atteint';
  } else {
    if (value >= targetValue) return 'atteint';
    if (value >= targetValue * 0.8) return 'partiel';
    return 'non_atteint';
  }
}

function computeAchievementPct(value: number | null | undefined, targetValue: number | null | undefined, unit: string): number {
  if (value == null || targetValue == null || targetValue === 0) return 0;
  const isLowerBetter = LOWER_IS_BETTER_UNITS.includes(unit.toLowerCase());
  // For lower-is-better, invert: target/value * 100
  // For higher-is-better: value/target * 100
  if (isLowerBetter) {
    // If value is 0 and target > 0, that's perfect
    if (value === 0) return 100;
    return Math.round((targetValue / value) * 100);
  } else {
    return Math.round((value / targetValue) * 100);
  }
}

function computeTrend(value: number | null | undefined, targetValue: number | null | undefined, unit: string): string {
  const status = computeStatus(value, targetValue, unit);
  switch (status) {
    case 'atteint': return 'positive';
    case 'partiel': return 'neutral';
    case 'non_atteint': return 'negative';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2025');
    const quarterParam = searchParams.get('quarter');
    const quarter = quarterParam ? parseInt(quarterParam) : null;

    // Build value filter
    const valueFilter: Record<string, unknown> = { year };
    if (quarter) {
      valueFilter.quarter = quarter;
    }

    // Get latest values for all domains
    const indicators = await db.indicator.findMany({
      where: { isActive: true },
      include: {
        values: {
          where: valueFilter,
          orderBy: { period: 'desc' },
          take: 1,
        },
        department: true,
      },
      orderBy: { order: 'asc' },
    });

    // Compute status for each indicator
    type EnrichedIndicator = {
      id: string;
      name: string;
      code: string;
      subDomain: string | null;
      unit: string;
      targetValue: number | null;
      value: number;
      trend: string;
      status: Status;
      achievementPct: number;
      isPriority: boolean;
      domain: string;
    };

    const enrichedIndicators: EnrichedIndicator[] = indicators.map(i => {
      const rawValue = i.values[0]?.value ?? null;
      const value = rawValue ?? 0;
      const targetValue = i.targetValue;
      const unit = i.unit;

      const status = computeStatus(rawValue, targetValue, unit);
      const achievementPct = computeAchievementPct(rawValue, targetValue, unit);
      const trend = computeTrend(rawValue, targetValue, unit);

      return {
        id: i.id,
        name: i.name,
        code: i.code,
        subDomain: i.subDomain,
        unit,
        targetValue,
        value,
        trend,
        status,
        achievementPct,
        isPriority: i.isPriority,
        domain: i.domain,
      };
    });

    // Group by domain
    const domains = ['finance', 'governance', 'operational', 'rh', 'risque', 'pta'];
    const summary: Record<string, {
      count: number;
      atteint: number;
      partiel: number;
      non_atteint: number;
      performance: number;
      indicators: Array<{
        id: string;
        name: string;
        code: string;
        subDomain: string | null;
        unit: string;
        targetValue: number | null;
        value: number;
        trend: string;
      }>;
    }> = {};

    for (const domain of domains) {
      const domainIndicators = enrichedIndicators.filter(i => i.domain === domain);
      const atteint = domainIndicators.filter(i => i.status === 'atteint').length;
      const partiel = domainIndicators.filter(i => i.status === 'partiel').length;
      const non_atteint = domainIndicators.filter(i => i.status === 'non_atteint').length;

      // Weighted score: atteint=100%, partiel=50%, non_atteint=0%
      const domainScore = domainIndicators.reduce((sum, i) => {
        switch (i.status) {
          case 'atteint': return sum + 100;
          case 'partiel': return sum + 50;
          default: return sum + 0;
        }
      }, 0);
      const performance = domainIndicators.length > 0 ? Math.round(domainScore / domainIndicators.length) : 0;

      summary[domain] = {
        count: domainIndicators.length,
        atteint,
        partiel,
        non_atteint,
        performance,
        indicators: domainIndicators.map(i => ({
          id: i.id,
          name: i.name,
          code: i.code,
          subDomain: i.subDomain,
          unit: i.unit,
          targetValue: i.targetValue,
          value: i.value,
          trend: i.trend,
        })),
      };
    }

    // Global status counts
    const globalAtteint = enrichedIndicators.filter(i => i.status === 'atteint').length;
    const globalPartiel = enrichedIndicators.filter(i => i.status === 'partiel').length;
    const globalNonAtteint = enrichedIndicators.filter(i => i.status === 'non_atteint').length;
    const statusCounts = {
      atteint: globalAtteint,
      partiel: globalPartiel,
      non_atteint: globalNonAtteint,
    };

    // Global performance — weighted: atteint=100%, partiel=50%, non_atteint=0%
    const totalIndicators = enrichedIndicators.length;
    const globalScore = enrichedIndicators.reduce((sum, i) => {
      switch (i.status) {
        case 'atteint': return sum + 100;
        case 'partiel': return sum + 50;
        default: return sum + 0;
      }
    }, 0);
    const globalPerformance = totalIndicators > 0 ? Math.round(globalScore / totalIndicators) : 0;

    // Priority stats
    const priorityIndicators = enrichedIndicators.filter(i => i.isPriority);
    const priorityAtteint = priorityIndicators.filter(i => i.status === 'atteint').length;
    const priorityPartiel = priorityIndicators.filter(i => i.status === 'partiel').length;
    const priorityNonAtteint = priorityIndicators.filter(i => i.status === 'non_atteint').length;
    const priorityStats = {
      total: priorityIndicators.length,
      atteint: priorityAtteint,
      partiel: priorityPartiel,
      non_atteint: priorityNonAtteint,
    };

    // Top priority indicators — first 6 isPriority, sorted by achievement ratio (worst first)
    const topPriorityIndicators = priorityIndicators
      .sort((a, b) => a.achievementPct - b.achievementPct)
      .slice(0, 6)
      .map(i => ({
        id: i.id,
        name: i.name,
        code: i.code,
        unit: i.unit,
        targetValue: i.targetValue,
        value: i.value,
        domain: i.domain,
        status: i.status,
        achievementPct: i.achievementPct,
      }));

    // Project summary
    const projects = await db.project.findMany();
    const projectSummary = {
      total: projects.length,
      en_cours: projects.filter(p => p.status === 'en_cours').length,
      termine: projects.filter(p => p.status === 'termine').length,
      planifie: projects.filter(p => p.status === 'planifie').length,
      avgProgress: projects.length > 0 ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length) : 0,
      totalBudget: projects.reduce((s, p) => s + (p.budgetPlan || 0), 0),
      totalSpent: projects.reduce((s, p) => s + (p.budgetReal || 0), 0),
    };

    return NextResponse.json({
      summary,
      globalPerformance,
      totalIndicators,
      statusCounts,
      priorityStats,
      topPriorityIndicators,
      projectSummary,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}