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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ShieldAlert,
  AlertTriangle,
  ClipboardCheck,
  ShieldQuestion,
  CheckCircle2,
} from 'lucide-react';

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

const gaugeChartConfig = {
  score: { label: 'Indice de risque', color: '#1c55a3' },
  remaining: { label: 'Marge restante', color: '#e5e7eb' },
} satisfies ChartConfig;

const lineChartConfig = {
  riskIndex: { label: 'Indice risque', color: '#ef4444' },
  threshold: { label: 'Seuil acceptable', color: '#22c55e' },
} satisfies ChartConfig;

const barChartConfig = {
  conforme: { label: 'Conforme', color: '#22c55e' },
  partiel: { label: 'Partiel', color: '#f59e0b' },
  nonConforme: { label: 'Non conforme', color: '#ef4444' },
} satisfies ChartConfig;

const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

const getLatestValue = (indicator: any) => {
  if (!indicator?.values?.length) return 0;
  return indicator.values[indicator.values.length - 1].value;
};

const getPreviousValue = (indicator: any) => {
  if (!indicator?.values?.length || indicator.values.length < 2) return null;
  return indicator.values[indicator.values.length - 2].value;
};

const computeTrend = (current: number, previous: number | null) => {
  if (previous === null) return 'neutral';
  if (current <= previous) return 'positive'; // lower risk is better
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

// ─── Helper: gauge color based on score ───────────────────────────
function getGaugeColor(score: number): string {
  if (score <= 25) return '#22c55e';
  if (score <= 50) return '#f59e0b';
  if (score <= 75) return '#f18120';
  return '#ef4444';
}

// ─── Main Component ───────────────────────────────────────────────
export function RisqueModule() {
  const { filters } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/indicators/domain?domain=risque&year=${filters.year}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filters.year]);

  const indicators = useMemo(() => data?.indicators || [], [data]);

  // ── Gauge chart data ──
  const globalRiskScore = useMemo(() => {
    const ind = indicators.find(
      (i: any) => i.name?.toLowerCase().includes('indice') || i.name?.toLowerCase().includes('global')
    );
    return getLatestValue(ind);
  }, [indicators]);

  const gaugeData = useMemo(() => {
    const score = Math.min(Math.max(globalRiskScore, 0), 100);
    return [
      { name: 'score', value: score, fill: getGaugeColor(score) },
      { name: 'remaining', value: 100 - score, fill: '#e5e7eb' },
    ];
  }, [globalRiskScore]);

  // ── Line chart: Risk trend ──
  const lineChartData = useMemo(() => {
    const rows: { month: string; riskIndex: number; threshold: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      let riskIndex = 0;
      indicators.forEach((ind: any) => {
        if (ind.name?.toLowerCase().includes('indice') || ind.name?.toLowerCase().includes('global')) {
          const val = ind.values?.find((v: any) => v.month === m);
          if (val) riskIndex = val.value;
        }
      });
      rows.push({ month: MONTH_LABELS[m - 1], riskIndex, threshold: 50 });
    }
    return rows;
  }, [indicators]);

  // ── Bar chart: Control compliance ──
  const controlBarData = useMemo(() => {
    const rows: Record<string, number | string>[] = [];
    for (let m = 1; m <= 12; m++) {
      const row: Record<string, number | string> = { month: MONTH_LABELS[m - 1], conforme: 0, partiel: 0, nonConforme: 0 };
      indicators.forEach((ind: any) => {
        if (ind.subDomain === 'controle' || ind.name?.toLowerCase().includes('contrôle')) {
          const val = ind.values?.find((v: any) => v.month === m);
          if (val) {
            const v = val.value;
            if (v >= 80) row.conforme = v;
            else if (v >= 50) row.partiel = v;
            else row.nonConforme = v;
          }
        }
      });
      // Only include months that have data
      if (row.conforme > 0 || row.partiel > 0 || row.nonConforme > 0) {
        rows.push(row);
      }
    }
    return rows;
  }, [indicators]);

  // ── KPI computation ──
  const kpiData = useMemo(() => {
    const find = (keyword: string) =>
      indicators.find((i: any) =>
        i.name?.toLowerCase().includes(keyword.toLowerCase())
      );

    const globalInd = find('indice') || find('global');
    const incidentInd = find('incident') || find('sécurité') || find('securite');
    const controleInd = find('contrôle') || find('controle') || find('conformité');
    const nonTraiteInd = find('non traité') || find('non traite') || find('en attente');
    const traitementInd = find('traitement') || find('taux');

    return [
      {
        title: 'Indice risque global',
        value: getLatestValue(globalInd),
        unit: '/ 100',
        target: globalInd?.targetValue,
        trend: computeTrend(
          getLatestValue(globalInd),
          getPreviousValue(globalInd)
        ),
        trendValue: globalInd?.values?.length
          ? `${(
              getLatestValue(globalInd) -
              (getPreviousValue(globalInd) ?? getLatestValue(globalInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <ShieldAlert className="size-5" />,
        description: globalRiskScore <= 30
          ? 'Niveau de risque faible'
          : globalRiskScore <= 60
            ? 'Niveau de risque modéré'
            : 'Niveau de risque élevé',
      },
      {
        title: 'Incidents sécurité',
        value: getLatestValue(incidentInd),
        unit: '',
        target: incidentInd?.targetValue,
        trend: computeTrend(
          getLatestValue(incidentInd),
          getPreviousValue(incidentInd)
        ),
        trendValue: incidentInd?.values?.length
          ? `${getLatestValue(incidentInd) - (getPreviousValue(incidentInd) ?? 0)}`
          : undefined,
        icon: <AlertTriangle className="size-5" />,
      },
      {
        title: 'Conformité contrôle interne',
        value: getLatestValue(controleInd),
        unit: '%',
        target: controleInd?.targetValue,
        trend: computeTrend(
          getLatestValue(controleInd),
          getPreviousValue(controleInd)
        ),
        trendValue: controleInd?.values?.length
          ? `${(
              getLatestValue(controleInd) -
              (getPreviousValue(controleInd) ?? getLatestValue(controleInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <ClipboardCheck className="size-5" />,
      },
      {
        title: 'Risques non traités',
        value: getLatestValue(nonTraiteInd),
        unit: '',
        target: nonTraiteInd?.targetValue,
        trend: computeTrend(
          getLatestValue(nonTraiteInd),
          getPreviousValue(nonTraiteInd)
        ) === 'positive'
          ? 'negative'
          : computeTrend(
              getLatestValue(nonTraiteInd),
              getPreviousValue(nonTraiteInd)
            ) === 'negative'
            ? 'positive'
            : 'neutral',
        trendValue: nonTraiteInd?.values?.length
          ? `${getLatestValue(nonTraiteInd) - (getPreviousValue(nonTraiteInd) ?? 0)}`
          : undefined,
        icon: <ShieldQuestion className="size-5" />,
      },
      {
        title: 'Taux de traitement',
        value: getLatestValue(traitementInd),
        unit: '%',
        target: traitementInd?.targetValue,
        trend: computeTrend(
          getLatestValue(traitementInd),
          getPreviousValue(traitementInd)
        ),
        trendValue: traitementInd?.values?.length
          ? `${(
              getLatestValue(traitementInd) -
              (getPreviousValue(traitementInd) ?? getLatestValue(traitementInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <CheckCircle2 className="size-5" />,
      },
    ];
  }, [indicators, globalRiskScore]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6">
        <KpiSkeletons />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartSkeleton />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiData.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Gauge Chart – Risk score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Indice de risque global
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ChartContainer config={gaugeChartConfig} className="mx-auto h-[260px] w-full max-w-[280px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <Pie
                  data={gaugeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={65}
                  outerRadius={95}
                  strokeWidth={2}
                />
              </PieChart>
            </ChartContainer>
            <div className="mt-2 text-center">
              <span className="text-3xl font-bold" style={{ color: getGaugeColor(globalRiskScore) }}>
                {globalRiskScore}
              </span>
              <span className="text-sm text-muted-foreground"> / 100</span>
              <p className="text-xs text-muted-foreground mt-1">
                {globalRiskScore <= 30
                  ? 'Risque faible — Vigilance normale'
                  : globalRiskScore <= 60
                    ? 'Risque modéré — Actions requises'
                    : 'Risque élevé — Intervention urgente'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Line Chart – Risk trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Tendance de l'indice de risque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={lineChartConfig} className="h-[300px] w-full">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="threshold"
                  stroke="var(--color-threshold)"
                  strokeDasharray="4 4"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="riskIndex"
                  stroke="var(--color-riskIndex)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar Chart – Control compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Conformité des contrôles internes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <BarChart data={controlBarData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="conforme"
                  stackId="a"
                  fill="var(--color-conforme)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="partiel"
                  stackId="a"
                  fill="var(--color-partiel)"
                />
                <Bar
                  dataKey="nonConforme"
                  stackId="a"
                  fill="var(--color-nonConforme)"
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
            Indicateurs de risque
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

                  if (ind.name?.toLowerCase().includes('indice') || ind.name?.toLowerCase().includes('global')) {
                    // Risk score: lower is better
                    status = val <= target ? 'atteint' : val <= target * 1.5 ? 'partiel' : 'non_atteint';
                  } else if (ind.name?.toLowerCase().includes('incident')) {
                    // Incidents: lower is better
                    status = val <= target ? 'atteint' : val <= target * 1.5 ? 'partiel' : 'non_atteint';
                  } else if (ind.name?.toLowerCase().includes('non traité') || ind.name?.toLowerCase().includes('non traite')) {
                    // Non-treated risks: lower is better
                    status = val <= target ? 'atteint' : 'partiel';
                  } else if (ind.unit === '%') {
                    status = val >= target ? 'atteint' : val >= target * 0.7 ? 'partiel' : 'non_atteint';
                  } else if (target > 0) {
                    status = val >= target ? 'atteint' : val >= target * 0.7 ? 'partiel' : 'non_atteint';
                  }

                  const statusLabels: Record<string, string> = {
                    atteint: 'Atteint',
                    partiel: 'Partiel',
                    non_atteint: 'Non atteint',
                    neutre: 'Neutre',
                  };
                  statusLabel = statusLabels[status] || statusLabel;

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
                        {formatNumber(val)} {ind.unit}
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
