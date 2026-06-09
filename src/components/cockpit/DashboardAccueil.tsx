'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { KpiCard } from '@/components/cockpit/KpiCard';
import { StatusBadge } from '@/components/cockpit/StatusBadge';
import { useAppStore, type ModuleKey } from '@/lib/store';
import {
  Wallet,
  Landmark,
  Settings,
  Users,
  ShieldAlert,
  Target,
  TrendingDown,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  Clock,
  CalendarClock,
  Banknote,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface IndicatorSummary {
  name: string;
  code: string;
  subDomain: string;
  unit: string;
  targetValue: number;
  value: number;
  trend: 'positive' | 'negative' | 'neutral';
}

interface DomainSummary {
  count: number;
  indicators: IndicatorSummary[];
}

interface ProjectSummary {
  total: number;
  en_cours: number;
  termine: number;
  planifie: number;
  avgProgress: number;
  totalBudget: number;
  totalSpent: number;
}

interface DashboardData {
  summary: Record<string, DomainSummary>;
  globalPerformance: number;
  totalIndicators: number;
  projectSummary: ProjectSummary;
  lastUpdated: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const DOMAIN_META: Record<
  string,
  { key: ModuleKey; label: string; icon: React.ElementType; color: string }
> = {
  finance: { key: 'finance', label: 'Finance', icon: Wallet, color: '#1c55a3' },
  governance: { key: 'governance', label: 'Gouvernance', icon: Landmark, color: '#205eb3' },
  operational: { key: 'operational', label: 'Opérationnel', icon: Settings, color: '#f18120' },
  rh: { key: 'rh', label: 'Ressources Humaines', icon: Users, color: '#22c55e' },
  risque: { key: 'risque', label: 'Cadre de Risque', icon: ShieldAlert, color: '#ef4444' },
  pta: { key: 'pta', label: 'Plan Triennal', icon: Target, color: '#f59e0b' },
};

const MONTHS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatLargeNumber(n: number, compact = false): string {
  if (compact) {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} Mrd`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)} K`;
  }
  return n.toLocaleString('fr-FR');
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) {
    const val = n / 1_000_000_000;
    return `${val.toFixed(1).replace('.', ' ')} Mrd FCFA`;
  }
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return `${val.toFixed(1).replace('.', ' ')} M FCFA`;
  }
  return `${formatLargeNumber(n)} FCFA`;
}

function countTrends(indicators: IndicatorSummary[]) {
  return {
    positive: indicators.filter((i) => i.trend === 'positive').length,
    negative: indicators.filter((i) => i.trend === 'negative').length,
    neutral: indicators.filter((i) => i.trend === 'neutral').length,
  };
}

function getPerformanceColor(pct: number): string {
  if (pct >= 80) return '#22c55e';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}

// ── Mock Data ───────────────────────────────────────────────────────────────

function generateMockData(): DashboardData {
  const makeIndicators = (codes: [string, string, string, string][], trendSeed: string) =>
    codes.map(([name, code, sub, unit], idx) => ({
      name,
      code,
      subDomain: sub,
      unit,
      targetValue: 80 + Math.floor(Math.random() * 20),
      value: 50 + Math.floor(Math.random() * 50),
      trend: (['positive', 'negative', 'neutral'] as const)[
        (trendSeed.charCodeAt(0) + idx) % 3
      ],
    }));

  return {
    summary: {
      finance: {
        count: 10,
        indicators: makeIndicators(
          [
            ["Taux d'exécution budgétaire", 'FIN-001', 'budget', '%'],
            ["Chiffre d'affaires", 'FIN-002', 'rentabilité', 'FCFA'],
            ['Excédent Brut Exploitation', 'FIN-003', 'rentabilité', 'FCFA'],
            ['Marge brute', 'FIN-004', 'rentabilité', '%'],
            ['Résultat net', 'FIN-005', 'rentabilité', 'FCFA'],
          ],
          'fin',
        ),
      },
      governance: {
        count: 7,
        indicators: makeIndicators(
          [
            ['Taux de conformité réglementaire', 'GOV-001', 'conformité', '%'],
            ['Indice de gouvernance', 'GOV-002', 'gouvernance', 'idx'],
            ['Taux de réalisation des audits', 'GOV-003', 'audit', '%'],
          ],
          'gov',
        ),
      },
      operational: {
        count: 8,
        indicators: makeIndicators(
          [
            ['Taux de disponibilité réseau', 'OP-001', 'réseau', '%'],
            ['Taux incidents résolus', 'OP-002', 'incidents', '%'],
            ['Délai moyen de réparation', 'OP-003', 'maintenance', 'h'],
          ],
          'op',
        ),
      },
      rh: {
        count: 6,
        indicators: makeIndicators(
          [
            ['Taux de turn-over', 'RH-001', 'talent', '%'],
            ['Taux de formation', 'RH-002', 'formation', '%'],
            ['Indice de satisfaction', 'RH-003', 'satisfaction', 'idx'],
          ],
          'rh',
        ),
      },
      risque: {
        count: 4,
        indicators: makeIndicators(
          [
            ['Score de risque global', 'RIS-001', 'global', 'idx'],
            ['Taux de couverture', 'RIS-002', 'couverture', '%'],
          ],
          'ri',
        ),
      },
      pta: {
        count: 3,
        indicators: makeIndicators(
          [
            ['Taux de réalisation PTA', 'PTA-001', 'réalisation', '%'],
            ['Nombre d\'actions livrées', 'PTA-002', 'livraison', 'nb'],
          ],
          'pt',
        ),
      },
    },
    globalPerformance: 72,
    totalIndicators: 38,
    projectSummary: {
      total: 12,
      en_cours: 10,
      termine: 0,
      planifie: 2,
      avgProgress: 55,
      totalBudget: 12_350_000_000,
      totalSpent: 6_870_000_000,
    },
    lastUpdated: new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

// ── Gauge Component ──────────────────────────────────────────────────────────

const gaugeChartConfig = {
  performance: { label: 'Performance', color: '#1c55a3' },
  remaining: { label: 'Restant', color: '#e2e8f0' },
} satisfies ChartConfig;

function PerformanceGauge({ value }: { value: number }) {
  const [animValue, setAnimValue] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimValue(value), 100);
    return () => clearTimeout(timeout);
  }, [value]);

  const color = getPerformanceColor(animValue);
  const data = [
    { name: 'performance', value: animValue },
    { name: 'remaining', value: 100 - animValue },
  ];

  return (
    <div className="flex flex-col items-center">
      <ChartContainer
        config={gaugeChartConfig}
        className="mx-auto aspect-square h-[200px] w-[200px] lg:h-[240px] lg:w-[240px]"
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="85%"
            startAngle={90}
            endAngle={-270}
            strokeWidth={0}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            <Cell fill={color} />
            <Cell fill="var(--color-remaining, #e2e8f0)" />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="-mt-[140px] lg:-mt-[160px] flex flex-col items-center">
        <span
          className="text-4xl font-bold lg:text-5xl"
          style={{ color }}
        >
          {Math.round(animValue)}%
        </span>
        <span className="text-xs text-muted-foreground mt-1 font-medium">
          Score Global
        </span>
      </div>
      <div className="mt-[72px] lg:mt-[88px] flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-success" />
          {'≥'} 80%
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-warning" />
          60-79%
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-danger" />
          {'<'} 60%
        </div>
      </div>
    </div>
  );
}

// ── Domain Card ─────────────────────────────────────────────────────────────

function DomainCard({
  domainKey,
  data,
  onClick,
}: {
  domainKey: string;
  data: DomainSummary;
  onClick: () => void;
}) {
  const meta = DOMAIN_META[domainKey];
  if (!meta) return null;

  const Icon = meta.icon;
  const trends = countTrends(data.indicators);
  const domainPerf =
    data.indicators.length > 0
      ? Math.round(
          data.indicators.reduce((acc, i) => {
            const ratio = i.targetValue > 0 ? i.value / i.targetValue : 0;
            return acc + Math.min(ratio, 1) * 100;
          }, 0) / data.indicators.length,
        )
      : 0;

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-l-4"
      style={{ borderLeftColor: meta.color }}
      onClick={onClick}
    >
      <CardContent className="p-4 lg:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
            >
              <Icon className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">
                {meta.label}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {data.count} indicateur{data.count > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div
            className="text-lg font-bold"
            style={{ color: getPerformanceColor(domainPerf) }}
          >
            {domainPerf}%
          </div>
        </div>

        {/* Trend dots */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="size-2 rounded-full bg-success" />
            <span className="text-muted-foreground">{trends.positive}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="size-2 rounded-full bg-danger" />
            <span className="text-muted-foreground">{trends.negative}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="size-2 rounded-full bg-warning" />
            <span className="text-muted-foreground">{trends.neutral}</span>
          </div>
        </div>

        {/* Mini progress */}
        <Progress value={domainPerf} className="h-1.5 mt-3" />
      </CardContent>
    </Card>
  );
}

// ── Projects Section ────────────────────────────────────────────────────────

const budgetChartConfig = {
  budget: { label: 'Budget total', color: '#1c55a3' },
  spent: { label: 'Dépensé', color: '#f18120' },
} satisfies ChartConfig;

function ProjectsOverview({ projects }: { projects: ProjectSummary }) {
  const budgetData = [
    { name: 'Budget', budget: projects.totalBudget / 1_000_000_000, spent: projects.totalSpent / 1_000_000_000 },
  ];

  const budgetPct = projects.totalBudget > 0
    ? Math.round((projects.totalSpent / projects.totalBudget) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Left: stats */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            title="Total Projets"
            value={projects.total}
            icon={<FolderKanban className="size-5" />}
          />
          <KpiCard
            title="En Cours"
            value={projects.en_cours}
            icon={<Clock className="size-5" />}
            trend={projects.en_cours > 0 ? 'positive' : 'neutral'}
            trendValue="actif"
          />
          <KpiCard
            title="Terminés"
            value={projects.termine}
            icon={<CheckCircle2 className="size-5" />}
          />
          <KpiCard
            title="Planifiés"
            value={projects.planifie}
            icon={<CalendarClock className="size-5" />}
          />
        </div>

        {/* Average progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Progression Moyenne
              </span>
              <span className="text-sm font-bold text-foreground">
                {projects.avgProgress}%
              </span>
            </div>
            <Progress
              value={projects.avgProgress}
              className="h-2.5"
            />
            <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground">
              <span>0%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Budget summary */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Banknote className="size-4 text-tango" />
              <span className="text-xs font-medium text-muted-foreground">
                Consommation Budgétaire
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Budget Total</p>
                <p className="text-sm font-bold text-fun-blue">
                  {formatCurrency(projects.totalBudget)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Dépensé</p>
                <p className="text-sm font-bold text-tango">
                  {formatCurrency(projects.totalSpent)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Taux de consommation</span>
              <span
                className={`font-medium ${
                  budgetPct > 90 ? 'text-danger' : budgetPct > 70 ? 'text-warning' : 'text-success'
                }`}
              >
                {budgetPct}%
              </span>
            </div>
            <Progress value={budgetPct} className="h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Right: bar chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Budget vs Dépenses (Mrd FCFA)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer config={budgetChartConfig} className="h-[200px] w-full">
            <BarChart data={budgetData} layout="vertical" barSize={28}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical />
              <XAxis type="number" tickFormatter={(v: number) => `${v.toFixed(1)}`} />
              <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="budget" fill="var(--color-budget)" radius={[0, 4, 4, 0]} />
              <Bar dataKey="spent" fill="var(--color-spent)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
          <ChartLegend className="mt-2">
            <ChartLegendContent />
          </ChartLegend>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Alerts Section ──────────────────────────────────────────────────────────

function AlertsSection({ summary }: { summary: Record<string, DomainSummary> }) {
  const allAlerts = useMemo(() => {
    const alerts: Array<{
      domain: string;
      domainLabel: string;
      color: string;
      indicator: IndicatorSummary;
      achievement: number;
    }> = [];

    Object.entries(summary).forEach(([domainKey, domain]) => {
      const meta = DOMAIN_META[domainKey];
      if (!meta) return;
      domain.indicators.forEach((ind) => {
        const achievement =
          ind.targetValue > 0 ? (ind.value / ind.targetValue) * 100 : 100;
        if (achievement < 80) {
          alerts.push({
            domain: domainKey,
            domainLabel: meta.label,
            color: meta.color,
            indicator: ind,
            achievement,
          });
        }
      });
    });

    return alerts.sort((a, b) => a.achievement - b.achievement);
  }, [summary]);

  if (allAlerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2 className="size-10 text-success mb-3" />
          <p className="text-sm font-medium text-foreground">
            Aucune alerte
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Tous les indicateurs sont au-dessus de 80% de leur objectif.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-danger" />
        <h3 className="text-sm font-semibold text-foreground">
          Alertes ({allAlerts.length})
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allAlerts.slice(0, 9).map((alert, idx) => (
          <Card
            key={`${alert.domain}-${alert.indicator.code}-${idx}`}
            className="border-l-2"
            style={{ borderLeftColor: '#ef4444' }}
          >
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {alert.indicator.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: alert.color }}
                    />
                    <span className="text-[11px] text-muted-foreground">
                      {alert.domainLabel}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      &middot; {alert.indicator.code}
                    </span>
                  </div>
                </div>
                <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">
                  {Math.round(alert.achievement)}%
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-muted-foreground">
                  Réalisé: <strong className="text-foreground">{alert.indicator.value}</strong>
                  {' '}{alert.indicator.unit}
                </span>
                <span className="text-muted-foreground">
                  / Cible: <strong className="text-foreground">{alert.indicator.targetValue}</strong>
                </span>
              </div>
              <Progress value={alert.achievement} className="h-1 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Loading Skeleton ────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Gauge skeleton */}
      <div className="flex flex-col items-center py-8">
        <Skeleton className="h-[200px] w-[200px] rounded-full" />
        <Skeleton className="h-8 w-24 mt-6" />
      </div>
      {/* Domain cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-lg" />
        ))}
      </div>
      {/* Projects skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px] rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[80px] rounded-lg" />
        </div>
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function DashboardAccueil() {
  const { setActiveModule, filters } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/dashboard?year=${filters.year}${filters.quarter ? `&quarter=${filters.quarter}` : ''}`,
        );
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setData(json);
        } else {
          if (!cancelled) setData(generateMockData());
        }
      } catch {
        // Fallback to mock data when API is unavailable
        if (!cancelled) setData(generateMockData());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => {
      cancelled = true;
    };
  }, [filters.year, filters.quarter]);

  if (loading) return <DashboardSkeleton />;

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="size-8 text-warning mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Impossible de charger les données du tableau de bord.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* ── Performance Score Ring ────────────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-col items-center pt-6 pb-4">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">
            Performance Globale — {data.totalIndicators} indicateurs
          </h2>
          <PerformanceGauge value={data.globalPerformance} />
          <p className="text-[11px] text-muted-foreground mt-3">
            Dernière mise à jour : {new Date(data.lastUpdated).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </CardContent>
      </Card>

      {/* ── Domain Summary Cards ────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Synthèse par Domaine
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(DOMAIN_META).map(([key, meta]) => {
            const domainData = data.summary[key];
            return (
              <DomainCard
                key={key}
                domainKey={key}
                data={domainData || { count: 0, indicators: [] }}
                onClick={() => setActiveModule(meta.key)}
              />
            );
          })}
        </div>
      </div>

      {/* ── Projects Overview ────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Aperçu des Projets
        </h2>
        <ProjectsOverview projects={data.projectSummary} />
      </div>

      {/* ── Alerts ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Alertes &amp; Points d&apos;Attention
        </h2>
        <AlertsSection summary={data.summary} />
      </div>
    </div>
  );
}
