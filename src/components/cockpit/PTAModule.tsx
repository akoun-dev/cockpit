'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import { KpiCard } from '@/components/cockpit/KpiCard';
import { StatusBadge } from '@/components/cockpit/StatusBadge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Target,
  FolderKanban,
  BarChart3,
  Wallet,
} from 'lucide-react';

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

const areaChartConfig = {
  realisation: { label: 'Taux de réalisation (%)', color: '#1c55a3' },
  target: { label: 'Objectif (%)', color: '#22c55e' },
} satisfies ChartConfig;

const barChartConfig = {
  structurants: { label: 'Projets structurants', color: '#1c55a3' },
  planifie: { label: 'Planifiés', color: '#f18120' },
  enCours: { label: 'En cours', color: '#205eb3' },
  termines: { label: 'Terminés', color: '#22c55e' },
} satisfies ChartConfig;

const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const getLatestValue = (indicator: any) => {
  if (!indicator.values?.length) return 0;
  return indicator.values[indicator.values.length - 1].value;
};

const getPreviousValue = (indicator: any) => {
  if (!indicator.values?.length || indicator.values.length < 2) return null;
  return indicator.values[indicator.values.length - 2].value;
};

const computeTrend = (current: number, previous: number | null) => {
  if (previous === null) return 'neutral';
  if (current >= previous) return 'positive';
  return 'negative';
};

// ─── Skeletons ────────────────────────────────────────────────────
function KpiSkeletons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-7 w-16" />
              </div>
            </div>
            <Skeleton className="mt-3 h-2 w-full rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export function PTAModule() {
  const { filters } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/indicators/domain?domain=pta&year=${filters.year}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filters.year]);

  const indicators = useMemo(() => data?.indicators || [], [data]);

  // ── Area chart: PTA realization rate trend ──
  const areaChartData = useMemo(() => {
    const rows: { month: string; realisation: number; target: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      let realisation = 0;
      indicators.forEach((ind: any) => {
        if (
          (ind.subDomain === 'global' || ind.subDomain === 'performance') &&
          ind.unit === '%' &&
          (ind.name?.toLowerCase().includes('réalisation') ||
            ind.name?.toLowerCase().includes('realisation') ||
            ind.name?.toLowerCase().includes('taux'))
        ) {
          const val = ind.values?.find((v: any) => v.month === m);
          if (val) realisation = val.value;
        }
      });
      rows.push({ month: MONTH_LABELS[m - 1], realisation, target: 85 });
    }
    return rows;
  }, [indicators]);

  // ── Bar chart: Structuring projects count ──
  const structBarData = useMemo(() => {
    const rows: Record<string, number | string>[] = [];
    for (let m = 1; m <= 12; m++) {
      const row: Record<string, number | string> = {
        month: MONTH_LABELS[m - 1],
        structurants: 0,
        planifie: 0,
        enCours: 0,
        termines: 0,
      };
      indicators.forEach((ind: any) => {
        if (
          ind.subDomain === 'projets_structurants' ||
          ind.name?.toLowerCase().includes('structurant')
        ) {
          const val = ind.values?.find((v: any) => v.month === m);
          if (val) {
            if (ind.name?.toLowerCase().includes('total') || ind.name?.toLowerCase().includes('structurant'))
              row.structurants = val.value;
            if (ind.name?.toLowerCase().includes('planifié'))
              row.planifie = val.value;
            if (ind.name?.toLowerCase().includes('en cours'))
              row.enCours = val.value;
            if (ind.name?.toLowerCase().includes('terminé') || ind.name?.toLowerCase().includes('termine'))
              row.termines = val.value;
          }
        }
      });
      // Include all months for the bar chart
      rows.push(row);
    }
    return rows;
  }, [indicators]);

  // ── KPI computation ──
  const kpiData = useMemo(() => {
    const find = (keyword: string) =>
      indicators.find((i: any) =>
        i.name?.toLowerCase().includes(keyword.toLowerCase())
      );

    const realisationInd =
      find('réalisation') || find('realisation') || find('taux');
    const structInd =
      find('structurant') || find('projets structurants');
    const perfInd = find('performance') || find('globale');
    const budgetInd =
      find('budget') || find('consommé') || find('consomme');

    const budgetValue = getLatestValue(budgetInd);
    const budgetTarget = budgetInd?.targetValue;

    return [
      {
        title: 'Taux de réalisation PTA',
        value: getLatestValue(realisationInd),
        unit: '%',
        target: realisationInd?.targetValue,
        trend: computeTrend(
          getLatestValue(realisationInd),
          getPreviousValue(realisationInd)
        ),
        trendValue: realisationInd?.values?.length
          ? `${(
              getLatestValue(realisationInd) -
              (getPreviousValue(realisationInd) ?? getLatestValue(realisationInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <Target className="size-5" />,
      },
      {
        title: 'Projets structurants',
        value: getLatestValue(structInd),
        unit: '',
        target: structInd?.targetValue,
        trend: computeTrend(
          getLatestValue(structInd),
          getPreviousValue(structInd)
        ),
        trendValue: structInd?.values?.length
          ? `${getLatestValue(structInd) - (getPreviousValue(structInd) ?? 0)}`
          : undefined,
        icon: <FolderKanban className="size-5" />,
      },
      {
        title: 'Performance globale',
        value: getLatestValue(perfInd),
        unit: '%',
        target: perfInd?.targetValue,
        trend: computeTrend(
          getLatestValue(perfInd),
          getPreviousValue(perfInd)
        ),
        trendValue: perfInd?.values?.length
          ? `${(
              getLatestValue(perfInd) -
              (getPreviousValue(perfInd) ?? getLatestValue(perfInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <BarChart3 className="size-5" />,
      },
      {
        title: 'Budget consommé',
        value:
          budgetValue > 1e9
            ? `${(budgetValue / 1e9).toFixed(1)} Mds`
            : budgetValue > 1e6
              ? `${(budgetValue / 1e6).toFixed(1)} M`
              : budgetValue,
        unit: 'FCFA',
        target: budgetTarget
          ? budgetTarget > 1e9
            ? `${(budgetTarget / 1e9).toFixed(1)} Mds`
            : budgetTarget > 1e6
              ? `${(budgetTarget / 1e6).toFixed(1)} M`
              : budgetTarget
          : undefined,
        trend: 'neutral' as const,
        trendValue:
          budgetInd?.values?.length && budgetTarget
            ? `${((budgetValue / budgetTarget) * 100).toFixed(0)}%`
            : undefined,
        icon: <Wallet className="size-5" />,
      },
    ];
  }, [indicators]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6">
        <KpiSkeletons />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart – PTA realization rate trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Tendance du taux de réalisation PTA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={areaChartConfig} className="h-[300px] w-full">
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="fillRealisation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1c55a3" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1c55a3" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="realisation"
                  stroke="var(--color-realisation)"
                  fill="url(#fillRealisation)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar Chart – Structuring projects count */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Projets structurants — Suivi mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <BarChart data={structBarData} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="structurants"
                  fill="var(--color-structurants)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="planifie"
                  fill="var(--color-planifie)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="enCours"
                  fill="var(--color-enCours)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="termines"
                  fill="var(--color-termines)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Indicateurs du Plan Triennal d'Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Indicateur</TableHead>
                  <TableHead>Sous-domaine</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                  <TableHead className="text-right">Objectif</TableHead>
                  <TableHead className="text-right">Unité</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {indicators.map((ind: any) => {
                  const val = getLatestValue(ind);
                  const target = ind.targetValue ?? 0;
                  let status = 'neutre';
                  let statusLabel = 'Neutre';

                  if (target > 0) {
                    if (ind.unit === '%') {
                      status =
                        val >= target
                          ? 'atteint'
                          : val >= target * 0.8
                            ? 'partiel'
                            : 'non_atteint';
                    } else {
                      status =
                        val >= target
                          ? 'atteint'
                          : val >= target * 0.8
                            ? 'partiel'
                            : 'non_atteint';
                    }
                  }

                  const statusLabels: Record<string, string> = {
                    atteint: 'Atteint',
                    partiel: 'Partiel',
                    non_atteint: 'Non atteint',
                    neutre: 'Neutre',
                  };
                  statusLabel = statusLabels[status] || statusLabel;

                  // Format display value for budget
                  let displayValue = `${formatNumber(val)}`;
                  if (ind.unit === 'FCFA' && val >= 1e6) {
                    displayValue = `${(val / 1e6).toFixed(1)} M`;
                  }

                  return (
                    <TableRow key={ind.id}>
                      <TableCell className="font-mono text-xs">
                        {ind.code}
                      </TableCell>
                      <TableCell className="font-medium">{ind.name}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {ind.subDomain?.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {displayValue} {ind.unit !== 'FCFA' ? ind.unit : ''}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {target > 0
                          ? ind.unit === 'FCFA' && target >= 1e6
                            ? `${(target / 1e6).toFixed(1)} M`
                            : `${formatNumber(target)} ${ind.unit}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {ind.unit}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={status} label={statusLabel} />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {indicators.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun indicateur disponible
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
