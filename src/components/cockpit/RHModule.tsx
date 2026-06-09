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
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Users,
  Banknote,
  ArrowLeftRight,
  TrendingUp,
  Zap,
} from 'lucide-react';

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

const lineChartConfig = {
  effectif: { label: 'Effectif total', color: '#1c55a3' },
  cdi: { label: 'CDI', color: '#205eb3' },
  cdd: { label: 'CDD', color: '#f18120' },
} satisfies ChartConfig;

const barChartConfig = {
  masse: { label: 'Masse salariale (M FCFA)', color: '#f18120' },
  prevision: { label: 'Prévision (M FCFA)', color: '#1c55a3' },
} satisfies ChartConfig;

const pieChartConfig = {
  cadre: { label: 'Cadres', color: '#1c55a3' },
  agent: { label: 'Agents de maîtrise', color: '#f18120' },
  execution: { label: 'Agents d\'exécution', color: '#205eb3' },
  interim: { label: 'Intérimaires', color: '#22c55e' },
} satisfies ChartConfig;

const PIE_STATIC_DATA = [
  { name: 'cadre', value: 42, fill: '#1c55a3' },
  { name: 'agent', value: 28, fill: '#f18120' },
  { name: 'execution', value: 22, fill: '#205eb3' },
  { name: 'interim', value: 8, fill: '#22c55e' },
];

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
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
export function RHModule() {
  const { filters } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/indicators/domain?domain=rh&year=${filters.year}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filters.year]);

  const indicators = useMemo(() => data?.indicators || [], [data]);

  // ── Line chart: Effectif evolution ──
  const lineChartData = useMemo(() => {
    const rows: Record<string, number | string>[] = [];
    for (let m = 1; m <= 12; m++) {
      const row: Record<string, number | string> = { month: MONTH_LABELS[m - 1], effectif: 0, cdi: 0, cdd: 0 };
      indicators.forEach((ind: any) => {
        if (ind.subDomain === 'effectifs' || ind.name?.toLowerCase().includes('effectif')) {
          const val = ind.values?.find((v: any) => v.month === m);
          if (val) row.effectif = val.value;
          if (ind.name?.toLowerCase().includes('cdi')) row.cdi = val.value;
          if (ind.name?.toLowerCase().includes('cdd')) row.cdd = val.value;
        }
      });
      rows.push(row);
    }
    return rows;
  }, [indicators]);

  // ── Bar chart: Masse salariale trend ──
  const barChartData = useMemo(() => {
    const rows: Record<string, number | string>[] = [];
    for (let m = 1; m <= 12; m++) {
      const row: Record<string, number | string> = { month: MONTH_LABELS[m - 1], masse: 0, prevision: 0 };
      indicators.forEach((ind: any) => {
        if (ind.subDomain === 'masse_salariale' || ind.name?.toLowerCase().includes('masse')) {
          const val = ind.values?.find((v: any) => v.month === m);
          if (val) {
            if (ind.name?.toLowerCase().includes('réalisé') || ind.name?.toLowerCase().includes('realise')) {
              row.masse = val.value;
            } else {
              row.prevision = val.value;
            }
          }
        }
      });
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

    const effectifInd = find('effectif total') || find('effectif');
    const masseInd = find('masse salariale') || find('masse');
    const rotationInd = find('rotation') || find('turnover');
    const ratioInd = find('ratio') || find('ca');
    const prodInd = find('productivité') || find('productivite');

    return [
      {
        title: 'Effectif total',
        value: getLatestValue(effectifInd),
        unit: '',
        target: effectifInd?.targetValue,
        trend: computeTrend(
          getLatestValue(effectifInd),
          getPreviousValue(effectifInd)
        ),
        trendValue: effectifInd?.values?.length
          ? `${getLatestValue(effectifInd) - (getPreviousValue(effectifInd) ?? 0)}`
          : undefined,
        icon: <Users className="size-5" />,
      },
      {
        title: 'Masse salariale',
        value: getLatestValue(masseInd) > 1000
          ? `${(getLatestValue(masseInd) / 1000).toFixed(1)} M`
          : getLatestValue(masseInd),
        unit: 'FCFA',
        target: undefined,
        trend: computeTrend(
          getLatestValue(masseInd),
          getPreviousValue(masseInd)
        ),
        trendValue: masseInd?.values?.length
          ? `${(
              ((getLatestValue(masseInd) / (getPreviousValue(masseInd) ?? getLatestValue(masseInd))) - 1) * 100
            ).toFixed(1)}%`
          : undefined,
        icon: <Banknote className="size-5" />,
      },
      {
        title: 'Rotation personnel',
        value: getLatestValue(rotationInd),
        unit: '%',
        target: rotationInd?.targetValue,
        trend: computeTrend(
          getLatestValue(rotationInd),
          getPreviousValue(rotationInd)
        ) === 'negative'
          ? 'positive'
          : computeTrend(
              getLatestValue(rotationInd),
              getPreviousValue(rotationInd)
            ) === 'positive'
            ? 'negative'
            : 'neutral',
        trendValue: rotationInd?.values?.length
          ? `${(
              getLatestValue(rotationInd) -
              (getPreviousValue(rotationInd) ?? getLatestValue(rotationInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <ArrowLeftRight className="size-5" />,
      },
      {
        title: 'Ratio masse salariale/CA',
        value: getLatestValue(ratioInd),
        unit: '%',
        target: ratioInd?.targetValue,
        trend: computeTrend(
          getLatestValue(ratioInd),
          getPreviousValue(ratioInd)
        ) === 'negative'
          ? 'positive'
          : computeTrend(
              getLatestValue(ratioInd),
              getPreviousValue(ratioInd)
            ) === 'positive'
            ? 'negative'
            : 'neutral',
        trendValue: ratioInd?.values?.length
          ? `${(
              getLatestValue(ratioInd) -
              (getPreviousValue(ratioInd) ?? getLatestValue(ratioInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <TrendingUp className="size-5" />,
      },
      {
        title: 'Productivité/employé',
        value: getLatestValue(prodInd),
        unit: 'FCFA',
        target: prodInd?.targetValue,
        trend: computeTrend(
          getLatestValue(prodInd),
          getPreviousValue(prodInd)
        ),
        trendValue: prodInd?.values?.length
          ? `${(
              ((getLatestValue(prodInd) / (getPreviousValue(prodInd) ?? getLatestValue(prodInd))) - 1) * 100
            ).toFixed(1)}%`
          : undefined,
        icon: <Zap className="size-5" />,
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiData.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      {/* ── Charts Row 1 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart – Effectif evolution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Évolution de l'effectif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="effectif"
                  stroke="var(--color-effectif)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="cdi"
                  stroke="var(--color-cdi)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="cdd"
                  stroke="var(--color-cdd)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar Chart – Masse salariale trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Évolution de la masse salariale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <BarChart data={barChartData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="masse"
                  fill="var(--color-masse)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="prevision"
                  fill="var(--color-prevision)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Pie Chart – Répartition par type ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Répartition des effectifs par type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieChartConfig} className="mx-auto h-[280px] w-full max-w-[400px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              {PIE_STATIC_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <Pie
                data={PIE_STATIC_DATA}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                strokeWidth={2}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* ── Data Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Indicateurs RH
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
                    if (ind.name?.toLowerCase().includes('rotation')) {
                      // Lower is better
                      status = val <= target ? 'atteint' : val <= target * 1.2 ? 'partiel' : 'non_atteint';
                    } else if (ind.name?.toLowerCase().includes('ratio')) {
                      // Lower is better
                      status = val <= target ? 'atteint' : val <= target * 1.2 ? 'partiel' : 'non_atteint';
                    } else if (ind.unit === '%') {
                      status = val >= target ? 'atteint' : val >= target * 0.8 ? 'partiel' : 'non_atteint';
                    } else {
                      status = val >= target ? 'atteint' : val >= target * 0.8 ? 'partiel' : 'non_atteint';
                    }
                  }

                  const statusLabels: Record<string, string> = {
                    atteint: 'Atteint',
                    partiel: 'Partiel',
                    non_atteint: 'Non atteint',
                    neutre: 'Neutre',
                  };
                  statusLabel = statusLabels[status] || statusLabel;

                  const displayValue =
                    ind.unit === 'FCFA' && val > 1000
                      ? `${formatNumber(val)} ${ind.unit}`
                      : `${formatNumber(val)}${ind.unit !== 'FCFA' ? ` ${ind.unit}` : ''}`;

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
                        {displayValue}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {target > 0 ? `${formatNumber(target)} ${ind.unit}` : '—'}
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
