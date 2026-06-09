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
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ShieldCheck,
  Clock,
  Users,
  FileCheck,
} from 'lucide-react';

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

const barChartConfig = {
  conformite: { label: 'Conformité marchés', color: '#1c55a3' },
  reporting: { label: 'Conformité reporting', color: '#f18120' },
  reglementaire: { label: 'Conformité réglementaire', color: '#205eb3' },
} satisfies ChartConfig;

const lineChartConfig = {
  delai: { label: 'Délai de transmission (jours)', color: '#f18120' },
  target: { label: 'Objectif', color: '#22c55e' },
} satisfies ChartConfig;

const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

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

// ─── KPI Cards Skeleton ───────────────────────────────────────────
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

// ─── Chart Skeleton ───────────────────────────────────────────────
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
export function GovernanceModule() {
  const { filters } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/indicators/domain?domain=governance&year=${filters.year}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filters.year]);

  const indicators = useMemo(() => data?.indicators || [], [data]);

  // ── Build chart data from indicators ──
  const barChartData = useMemo(() => {
    const monthMap: Record<number, Record<string, number>> = {};
    for (let m = 1; m <= 12; m++) monthMap[m] = {};

    indicators.forEach((ind: any) => {
      const sub = ind.subDomain?.toLowerCase() || '';
      if (!['conformite', 'reporting', 'audit'].includes(sub)) return;
      ind.values?.forEach((v: any) => {
        const m = v.month ?? 1;
        if (m >= 1 && m <= 12) {
          const key =
            sub === 'conformite'
              ? 'conformite'
              : sub === 'reporting'
                ? 'reporting'
                : 'reglementaire';
          monthMap[m][key] = v.value;
        }
      });
    });

    return Object.entries(monthMap).map(([m, vals]) => ({
      month: MONTH_LABELS[parseInt(m) - 1],
      conformite: vals.conformite ?? 0,
      reporting: vals.reporting ?? 0,
      reglementaire: vals.reglementaire ?? 0,
    }));
  }, [indicators]);

  const lineChartData = useMemo(() => {
    const rows: { month: string; delai: number; target: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      let delai = 0;
      indicators.forEach((ind: any) => {
        if (
          ind.code?.includes('GOV') &&
          ind.name?.toLowerCase().includes('délai')
        ) {
          const val = ind.values?.find((v: any) => v.month === m);
          if (val) delai = val.value;
        }
      });
      rows.push({ month: MONTH_LABELS[m - 1], delai, target: 15 });
    }
    return rows;
  }, [indicators]);

  // ── KPI computation ──
  const kpiData = useMemo(() => {
    const find = (keyword: string) =>
      indicators.find((i: any) =>
        i.name?.toLowerCase().includes(keyword.toLowerCase())
      );

    const conformiteInd = find('conformité marché') || find('marché');
    const delaiInd = find('délai') || find('rapport');
    const reunionInd = find('réunion') || find('ca');
    const reglInd = find('réglementaire') || find('réglement');

    return [
      {
        title: 'Conformité marchés publics',
        value: getLatestValue(conformiteInd),
        unit: '%',
        target: conformiteInd?.targetValue,
        trend: computeTrend(
          getLatestValue(conformiteInd),
          getPreviousValue(conformiteInd)
        ),
        trendValue: conformiteInd?.values?.length
          ? `${(
              getLatestValue(conformiteInd) -
              (getPreviousValue(conformiteInd) ?? getLatestValue(conformiteInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <ShieldCheck className="size-5" />,
      },
      {
        title: 'Délai rapports',
        value: getLatestValue(delaiInd),
        unit: 'jours',
        target: delaiInd?.targetValue,
        trend: computeTrend(
          getLatestValue(delaiInd),
          getPreviousValue(delaiInd)
        ) === 'negative'
          ? 'positive' // lower is better for delai
          : computeTrend(
              getLatestValue(delaiInd),
              getPreviousValue(delaiInd)
            ) === 'positive'
            ? 'negative'
            : 'neutral',
        trendValue: delaiInd?.values?.length
          ? `${Math.abs(
              getLatestValue(delaiInd) -
                (getPreviousValue(delaiInd) ?? getLatestValue(delaiInd))
            ).toFixed(0)} j`
          : undefined,
        icon: <Clock className="size-5" />,
      },
      {
        title: 'Réunions CA',
        value: getLatestValue(reunionInd),
        unit: '',
        target: reunionInd?.targetValue,
        trend: computeTrend(
          getLatestValue(reunionInd),
          getPreviousValue(reunionInd)
        ),
        trendValue: reunionInd?.values?.length
          ? `${getLatestValue(reunionInd) - (getPreviousValue(reunionInd) ?? 0)}`
          : undefined,
        icon: <Users className="size-5" />,
      },
      {
        title: 'Conformité réglementaire',
        value: getLatestValue(reglInd),
        unit: '%',
        target: reglInd?.targetValue,
        trend: computeTrend(
          getLatestValue(reglInd),
          getPreviousValue(reglInd)
        ),
        trendValue: reglInd?.values?.length
          ? `${(
              getLatestValue(reglInd) -
              (getPreviousValue(reglInd) ?? getLatestValue(reglInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <FileCheck className="size-5" />,
      },
    ];
  }, [indicators]);

  // ── Loading state ──
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
        {/* Bar Chart – Conformité scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Scores de conformité par mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <BarChart data={barChartData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="conformite"
                  fill="var(--color-conformite)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="reporting"
                  fill="var(--color-reporting)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="reglementaire"
                  fill="var(--color-reglementaire)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Line Chart – Délai de transmission */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Délai de transmission des rapports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="var(--color-target)"
                  strokeDasharray="4 4"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="delai"
                  stroke="var(--color-delai)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Data Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Indicateurs de gouvernance
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
                  if (ind.unit === '%') {
                    if (val >= target) {
                      status = 'atteint';
                      statusLabel = 'Atteint';
                    } else if (val >= target * 0.8) {
                      status = 'partiel';
                      statusLabel = 'Partiel';
                    } else {
                      status = 'non_atteint';
                      statusLabel = 'Non atteint';
                    }
                  } else if (ind.unit === 'jours') {
                    if (val <= target) {
                      status = 'atteint';
                      statusLabel = 'Atteint';
                    } else {
                      status = 'non_atteint';
                      statusLabel = 'Dépassé';
                    }
                  } else {
                    if (val >= target && target > 0) {
                      status = 'atteint';
                      statusLabel = 'Atteint';
                    } else {
                      status = 'partiel';
                      statusLabel = 'En cours';
                    }
                  }

                  return (
                    <TableRow key={ind.id}>
                      <TableCell className="font-mono text-xs">
                        {ind.code}
                      </TableCell>
                      <TableCell className="font-medium">{ind.name}</TableCell>
                      <TableCell className="capitalize text-muted-foreground">
                        {ind.subDomain}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(val)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {target > 0 ? formatNumber(target) : '—'}
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
