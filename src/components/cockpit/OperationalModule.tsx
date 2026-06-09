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
import { Progress } from '@/components/ui/progress';
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  Target,
  FolderKanban,
  CheckCircle2,
  MapPin,
  Wifi,
} from 'lucide-react';

const MONTH_LABELS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

const areaChartConfig = {
  ptaProgress: { label: 'Avancement PTA (%)', color: '#1c55a3' },
  target: { label: 'Objectif (%)', color: '#22c55e' },
} satisfies ChartConfig;

const barChartConfig = {
  en_cours: { label: 'En cours', color: '#1c55a3' },
  planifie: { label: 'Planifié', color: '#f18120' },
  termine: { label: 'Terminé', color: '#22c55e' },
} satisfies ChartConfig;

const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
const formatCurrency = (n: number) =>
  new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

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

// ─── Status label helpers ─────────────────────────────────────────
function projectStatusLabel(status: string) {
  const map: Record<string, string> = {
    en_cours: 'En cours',
    planifie: 'Planifié',
    termine: 'Terminé',
    suspendu: 'Suspendu',
  };
  return map[status] || status;
}

// ─── Main Component ───────────────────────────────────────────────
export function OperationalModule() {
  const { filters } = useAppStore();
  const [data, setData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/indicators/domain?domain=operational&year=${filters.year}`).then((r) => r.json()),
      fetch('/api/projects').then((r) => r.json()),
    ])
      .then(([indData, projData]) => {
        setData(indData);
        setProjects(projData.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filters.year]);

  const indicators = useMemo(() => data?.indicators || [], [data]);

  // ── Area chart: PTA progress trend ──
  const areaChartData = useMemo(() => {
    const rows: { month: string; ptaProgress: number; target: number }[] = [];
    for (let m = 1; m <= 12; m++) {
      let ptaProgress = 0;
      indicators.forEach((ind: any) => {
        if (
          (ind.subDomain === 'pta' || ind.name?.toLowerCase().includes('pta')) &&
          ind.unit === '%'
        ) {
          const val = ind.values?.find((v: any) => v.month === m);
          if (val) ptaProgress = val.value;
        }
      });
      rows.push({ month: MONTH_LABELS[m - 1], ptaProgress, target: 85 });
    }
    return rows;
  }, [indicators]);

  // ── Bar chart: Projects by status ──
  const statusBarData = useMemo(() => {
    const counts = { en_cours: 0, planifie: 0, termine: 0 };
    projects.forEach((p: any) => {
      if (p.status in counts) {
        counts[p.status as keyof typeof counts]++;
      }
    });
    return [counts];
  }, [projects]);

  // ── KPI computation ──
  const kpiData = useMemo(() => {
    const find = (keyword: string) =>
      indicators.find((i: any) =>
        i.name?.toLowerCase().includes(keyword.toLowerCase())
      );

    const ptaInd = find('avancement pta') || find('pta');
    const projetsInd = find('projet') || find('en cours');
    const achevInd = find('achèvement') || find('taux');
    const sitesInd = find('site') || find('déployé');
    const dispoInd = find('disponibilité') || find('réseau');

    const projetsEnCours = projects.filter((p: any) => p.status === 'en_cours').length;

    return [
      {
        title: 'Avancement PTA',
        value: getLatestValue(ptaInd),
        unit: '%',
        target: ptaInd?.targetValue,
        trend: computeTrend(
          getLatestValue(ptaInd),
          getPreviousValue(ptaInd)
        ),
        trendValue: ptaInd?.values?.length
          ? `${(
              getLatestValue(ptaInd) -
              (getPreviousValue(ptaInd) ?? getLatestValue(ptaInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <Target className="size-5" />,
      },
      {
        title: 'Projets en cours',
        value: projetsEnCours,
        unit: '',
        target: projetsInd?.targetValue,
        trend: 'neutral' as const,
        trendValue: projetsEnCours > 0 ? `${projetsEnCours} actifs` : undefined,
        icon: <FolderKanban className="size-5" />,
      },
      {
        title: "Taux d'achèvement",
        value: getLatestValue(achevInd),
        unit: '%',
        target: achevInd?.targetValue,
        trend: computeTrend(
          getLatestValue(achevInd),
          getPreviousValue(achevInd)
        ),
        trendValue: achevInd?.values?.length
          ? `${(
              getLatestValue(achevInd) -
              (getPreviousValue(achevInd) ?? getLatestValue(achevInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <CheckCircle2 className="size-5" />,
      },
      {
        title: 'Sites déployés',
        value: getLatestValue(sitesInd),
        unit: '',
        target: sitesInd?.targetValue,
        trend: computeTrend(
          getLatestValue(sitesInd),
          getPreviousValue(sitesInd)
        ),
        trendValue: sitesInd?.values?.length
          ? `${getLatestValue(sitesInd) - (getPreviousValue(sitesInd) ?? 0)}`
          : undefined,
        icon: <MapPin className="size-5" />,
      },
      {
        title: 'Disponibilité réseau',
        value: getLatestValue(dispoInd),
        unit: '%',
        target: dispoInd?.targetValue,
        trend: computeTrend(
          getLatestValue(dispoInd),
          getPreviousValue(dispoInd)
        ),
        trendValue: dispoInd?.values?.length
          ? `${(
              getLatestValue(dispoInd) -
              (getPreviousValue(dispoInd) ?? getLatestValue(dispoInd))
            ).toFixed(1)} pts`
          : undefined,
        icon: <Wifi className="size-5" />,
      },
    ];
  }, [indicators, projects]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiData.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart – PTA progress trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Tendance avancement PTA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={areaChartConfig} className="h-[300px] w-full">
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="fillPta" x1="0" y1="0" x2="0" y2="1">
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
                  dataKey="ptaProgress"
                  stroke="var(--color-ptaProgress)"
                  fill="url(#fillPta)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar Chart – Projects by status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Répartition des projets par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
              <BarChart data={statusBarData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="en_cours"
                  fill="var(--color-en_cours)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="planifie"
                  fill="var(--color-planifie)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="termine"
                  fill="var(--color-termine)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Projects Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Liste des projets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead className="text-right">Budget planifié</TableHead>
                  <TableHead className="text-right">Budget consommé</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((proj: any) => (
                  <TableRow key={proj.id}>
                    <TableCell className="font-mono text-xs">
                      {proj.code}
                    </TableCell>
                    <TableCell className="font-medium">{proj.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {proj.manager || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <Progress
                          value={proj.progress}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs font-medium w-9 text-right">
                          {Math.round(proj.progress)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {proj.budgetPlan ? formatCurrency(proj.budgetPlan) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {proj.budgetReal ? formatCurrency(proj.budgetReal) : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={proj.status}
                        label={projectStatusLabel(proj.status)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {projects.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      Aucun projet disponible
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
