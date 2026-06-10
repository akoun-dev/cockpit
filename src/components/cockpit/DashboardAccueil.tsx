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
import { StatusBadge } from '@/components/cockpit/StatusBadge';
import { useAppStore, type ModuleKey } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Wallet,
  Landmark,
  Settings,
  Users,
  ShieldAlert,
  Target,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  Clock,
  CalendarClock,
  Banknote,
  Activity,
  Star,
  TrendingUp,
  ArrowRight,
  CircleDot,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface IndicatorSummary {
  id: string;
  name: string;
  code: string;
  subDomain: string | null;
  unit: string;
  targetValue: number | null;
  value: number;
  trend: string;
}

interface TopPriorityIndicator {
  id: string;
  name: string;
  code: string;
  unit: string;
  targetValue: number | null;
  value: number;
  domain: string;
  status: string;
  achievementPct: number;
}

interface DomainSummary {
  count: number;
  atteint: number;
  partiel: number;
  non_atteint: number;
  performance: number;
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
  statusCounts: { atteint: number; partiel: number; non_atteint: number };
  priorityStats: { total: number; atteint: number; partiel: number; non_atteint: number };
  topPriorityIndicators: TopPriorityIndicator[];
  projectSummary: ProjectSummary;
  lastUpdated: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const DOMAIN_META: Record<
  string,
  { key: ModuleKey; label: string; icon: React.ElementType; color: string; bgLight: string }
> = {
  finance: { key: 'finance', label: 'Finance', icon: Wallet, color: '#1c55a3', bgLight: '#1c55a310' },
  governance: { key: 'governance', label: 'Gouvernance', icon: Landmark, color: '#205eb3', bgLight: '#205eb310' },
  operational: { key: 'operational', label: 'Opérationnel', icon: Settings, color: '#f18120', bgLight: '#f1812010' },
  rh: { key: 'rh', label: 'Ressources Humaines', icon: Users, color: '#22c55e', bgLight: '#22c55e10' },
  risque: { key: 'risque', label: 'Cadre de Risque', icon: ShieldAlert, color: '#ef4444', bgLight: '#ef444410' },
  pta: { key: 'pta', label: 'Plan Triennal', icon: Target, color: '#f59e0b', bgLight: '#f59e0b10' },
};

const STATUS_LABELS: Record<string, string> = {
  atteint: 'Atteint',
  partiel: 'Partiel',
  non_atteint: 'Non atteint',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function getPerformanceColor(pct: number): string {
  if (pct >= 80) return '#22c55e';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
}

function getPerformanceBg(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (pct >= 60) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  return 'bg-red-500/10 text-red-600 dark:text-red-400';
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) {
    const val = n / 1_000_000_000;
    return `${val.toFixed(1).replace('.', ' ')} Mrd`;
  }
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return `${val.toFixed(1).replace('.', ' ')} M`;
  }
  return n.toLocaleString('fr-FR');
}

// ── Chart configs ─────────────────────────────────────────────────────────

const domainChartConfig = {
  performance: { label: 'Performance', color: '#205eb3' },
} satisfies ChartConfig;

const statusChartConfig = {
  atteint: { label: 'Atteint', color: '#22c55e' },
  partiel: { label: 'Partiel', color: '#f59e0b' },
  non_atteint: { label: 'Non atteint', color: '#ef4444' },
} satisfies ChartConfig;

// ═══════════════════════════════════════════════════════════════════════════
// ── SECTION 1: Executive Summary Strip ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function MiniGauge({ value, size = 64 }: { value: number; size?: number }) {
  const [animValue, setAnimValue] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimValue(value), 150);
    return () => clearTimeout(t);
  }, [value]);

  const color = getPerformanceColor(animValue);
  const r = size / 2;
  const strokeWidth = 5;
  const circumference = Math.PI * (r - strokeWidth);
  const filled = (animValue / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size / 2 + 4 }}>
      <svg width={size} height={size / 2 + 4} viewBox={`0 0 ${size} ${size / 2 + 4}`}>
        {/* Background arc */}
        <path
          d={`M ${strokeWidth} ${r} A ${r - strokeWidth} ${r - strokeWidth} 0 0 1 ${size - strokeWidth} ${r}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-muted/30"
        />
        {/* Filled arc */}
        <path
          d={`M ${strokeWidth} ${r} A ${r - strokeWidth} ${r - strokeWidth} 0 0 1 ${size - strokeWidth} ${r}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - filled}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out, stroke 0.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-end justify-center pb-0">
        <span className="text-sm font-bold leading-none" style={{ color }}>
          {Math.round(animValue)}%
        </span>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  subValue,
  color,
  bgLight,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  bgLight: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-md cursor-default',
        onClick && 'hover:-translate-y-0.5 cursor-pointer',
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: bgLight, color }}
          >
            <Icon className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate">
              {label}
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                {value}
              </span>
              {subValue && (
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  {subValue}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ExecutiveStrip({
  data,
  onNavigate,
}: {
  data: DashboardData;
  onNavigate: (module: ModuleKey) => void;
}) {
  const { statusCounts, priorityStats, globalPerformance, totalIndicators } = data;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Global Score */}
      <Card className="lg:col-span-1">
        <CardContent className="p-3 sm:p-4 flex items-center gap-3">
          <MiniGauge value={globalPerformance} size={64} />
          <div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Score Global</p>
            <p className="text-[10px] text-muted-foreground">{totalIndicators} indicateurs</p>
          </div>
        </CardContent>
      </Card>

      {/* Total KPI */}
      <StatPill
        icon={Activity}
        label="Total KPI"
        value={totalIndicators}
        color="#205eb3"
        bgLight="#205eb310"
      />

      {/* Atteint */}
      <StatPill
        icon={CheckCircle2}
        label="KPI Atteint"
        value={statusCounts.atteint}
        subValue={totalIndicators > 0 ? `${Math.round((statusCounts.atteint / totalIndicators) * 100)}%` : ''}
        color="#22c55e"
        bgLight="#22c55e10"
      />

      {/* Partiel */}
      <StatPill
        icon={Clock}
        label="KPI Partiel"
        value={statusCounts.partiel}
        subValue={totalIndicators > 0 ? `${Math.round((statusCounts.partiel / totalIndicators) * 100)}%` : ''}
        color="#f59e0b"
        bgLight="#f59e0b10"
      />

      {/* Non atteint */}
      <StatPill
        icon={AlertTriangle}
        label="KPI Non Atteint"
        value={statusCounts.non_atteint}
        subValue={totalIndicators > 0 ? `${Math.round((statusCounts.non_atteint / totalIndicators) * 100)}%` : ''}
        color="#ef4444"
        bgLight="#ef444410"
      />

      {/* Lot 1 DG */}
      <StatPill
        icon={Star}
        label="KPI Lot 1 (DG)"
        value={priorityStats.total}
        subValue={`${priorityStats.atteint} atteints`}
        color="#f18120"
        bgLight="#f1812010"
        onClick={() => onNavigate('governance')}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── SECTION 2: Domain Performance Bar Chart ───────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function DomainPerformanceChart({
  summary,
  onDomainClick,
}: {
  summary: Record<string, DomainSummary>;
  onDomainClick: (module: ModuleKey) => void;
}) {
  const data = useMemo(() => {
    return Object.entries(DOMAIN_META)
      .map(([key, meta]) => {
        const d = summary[key];
        if (!d) return null;
        return {
          name: meta.label,
          shortName: meta.label.length > 12 ? meta.label.substring(0, 12) + '…' : meta.label,
          performance: d.performance,
          atteint: d.atteint,
          partiel: d.partiel,
          non_atteint: d.non_atteint,
          total: d.count,
          color: meta.color,
          domainKey: key,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b as NonNullable<typeof a>).performance - (a as NonNullable<typeof a>).performance);
  }, [summary]);

  if (data.length === 0) return null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-fun-blue" />
            Performance par Domaine
          </CardTitle>
          <span className="text-[10px] text-muted-foreground">Atteint = 100% · Partiel = 50%</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ChartContainer config={domainChartConfig} className="h-[260px] w-full">
          <BarChart data={data as unknown as Array<Record<string, unknown>>} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical strokeDashoffset={3} className="stroke-border/50" />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} className="text-muted-foreground" />
            <YAxis
              type="category"
              dataKey="shortName"
              width={110}
              tick={{ fontSize: 11 }}
              className="text-muted-foreground"
              tickLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: number, name: string, item: { payload?: Record<string, unknown> }) => {
                    const p = item?.payload as Record<string, unknown> | undefined;
                    if (!p) return [`${value}%`, name];
                    return [
                      `${value}% (${(p.atteint as number)}A / ${(p.partiel as number)}P / ${(p.non_atteint as number)}NA)`,
                      'Performance',
                    ];
                  }}
                />
              }
            />
            <Bar
              dataKey="performance"
              fill="var(--color-performance)"
              radius={[0, 6, 6, 0]}
              barSize={22}
              cursor="pointer"
              onClick={(entry) => {
                const domainKey = (entry as unknown as Record<string, unknown>).domainKey as string;
                if (domainKey) onDomainClick(domainKey as ModuleKey);
              }}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── SECTION 3: Status Distribution Donut ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function StatusDonutSection({ data }: { data: DashboardData }) {
  const { statusCounts, totalIndicators } = data;
  const donutData = [
    { name: 'atteint', value: statusCounts.atteint },
    { name: 'partiel', value: statusCounts.partiel },
    { name: 'non_atteint', value: statusCounts.non_atteint },
  ].filter((d) => d.value > 0);

  const scorePct =
    totalIndicators > 0
      ? Math.round(((statusCounts.atteint + statusCounts.partiel * 0.5) / totalIndicators) * 100)
      : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <CircleDot className="size-4 text-fun-blue" />
            Répartition par Statut
          </CardTitle>
          <span
            className={cn('text-xl font-bold', getPerformanceBg(scorePct).split(' ').pop())}
          >
            {scorePct}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-4 pt-0">
        <ChartContainer config={statusChartConfig} className="mx-auto aspect-square h-[160px] w-[160px] shrink-0">
          <PieChart>
            <Pie
              data={donutData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              strokeWidth={2}
              stroke="var(--color-card)"
            >
              {donutData.map((entry) => (
                <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
        <div className="space-y-3 text-sm min-w-0 flex-1">
          {(['atteint', 'partiel', 'non_atteint'] as const).map((key) => {
            const count = statusCounts[key];
            const pct = totalIndicators > 0 ? Math.round((count / totalIndicators) * 100) : 0;
            const colorMap = { atteint: 'bg-emerald-500', partiel: 'bg-amber-500', non_atteint: 'bg-red-500' };
            return (
              <div key={key} className="flex items-center gap-2.5">
                <span className={cn('size-3 rounded-full shrink-0', colorMap[key])} />
                <span className="text-muted-foreground text-xs sm:text-sm min-w-0 truncate">
                  {STATUS_LABELS[key]}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <Progress value={pct} className="h-1.5 w-12 sm:w-16" />
                  <span className="font-bold text-xs sm:text-sm tabular-nums w-6 text-right">
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="pt-1.5 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="font-bold text-xs sm:text-sm tabular-nums">{totalIndicators}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── SECTION 4: Top Priority KPIs ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function TopPriorityKpis({
  indicators,
  onNavigate,
}: {
  indicators: TopPriorityIndicator[];
  onNavigate: (module: ModuleKey) => void;
}) {
  if (indicators.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Star className="size-4 text-tango fill-tango" />
            KPI Lot 1 (DG) — Points d&apos;Attention
          </CardTitle>
          <Badge variant="outline" className="text-[10px] border-tango/30 text-tango bg-tango/5">
            Pire atteintes
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2.5">
          {indicators.map((ind) => {
            const domainMeta = DOMAIN_META[ind.domain];
            const pct = Math.min(ind.achievementPct, 100);
            const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
            const statusLabel = STATUS_LABELS[ind.status] || ind.status;

            return (
              <div
                key={ind.id}
                className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => domainMeta && onNavigate(domainMeta.key)}
              >
                {/* Code + Name */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">{ind.code}</span>
                    {domainMeta && (
                      <span
                        className="size-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: domainMeta.color }}
                      />
                    )}
                    <p className="text-xs font-medium text-foreground truncate">{ind.name}</p>
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold tabular-nums w-7 text-right" style={{ color: barColor }}>
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Value / Target */}
                <div className="hidden sm:flex flex-col items-end shrink-0">
                  <span className="text-xs font-bold text-foreground tabular-nums">{ind.value}</span>
                  <span className="text-[10px] text-muted-foreground">/ {ind.targetValue}</span>
                </div>

                {/* Status badge */}
                <StatusBadge status={ind.status} label={statusLabel} />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── SECTION 5: Projects Overview ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function ProjectsOverview({ projects }: { projects: ProjectSummary }) {
  const budgetPct = projects.totalBudget > 0 ? Math.round((projects.totalSpent / projects.totalBudget) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <FolderKanban className="size-4 text-fun-blue" />
          Aperçu des Projets
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {/* Project stats row */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: projects.total, icon: FolderKanban, color: '#205eb3' },
            { label: 'En Cours', value: projects.en_cours, icon: Clock, color: '#f59e0b' },
            { label: 'Terminés', value: projects.termine, icon: CheckCircle2, color: '#22c55e' },
            { label: 'Planifiés', value: projects.planifie, icon: CalendarClock, color: '#94a3b8' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex flex-col items-center gap-1 py-2 rounded-lg bg-muted/30">
                <Icon className="size-4" style={{ color: item.color }} />
                <span className="text-base font-bold text-foreground tabular-nums">{item.value}</span>
                <span className="text-[9px] text-muted-foreground text-center leading-tight">{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* Average progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progression Moyenne</span>
            <span className="font-bold text-foreground">{projects.avgProgress}%</span>
          </div>
          <Progress value={projects.avgProgress} className="h-2" />
        </div>

        {/* Budget */}
        <div className="space-y-2.5 rounded-lg bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Banknote className="size-3.5 text-tango" />
            <span className="text-xs font-medium text-muted-foreground">Consommation Budgétaire</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground">Budget</p>
              <p className="text-sm font-bold text-fun-blue">{formatCurrency(projects.totalBudget)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Dépensé</p>
              <p className="text-sm font-bold text-tango">{formatCurrency(projects.totalSpent)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Taux de consommation</span>
            <span
              className={cn(
                'font-semibold',
                budgetPct > 90 ? 'text-danger' : budgetPct > 70 ? 'text-warning' : 'text-success',
              )}
            >
              {budgetPct}%
            </span>
          </div>
          <Progress value={budgetPct} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── SECTION 6: Domain Quick Access Cards ─────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function DomainQuickAccess({
  summary,
  onDomainClick,
}: {
  summary: Record<string, DomainSummary>;
  onDomainClick: (module: ModuleKey) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Accès Rapide par Domaine</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Object.entries(DOMAIN_META).map(([key, meta]) => {
          const d = summary[key];
          const Icon = meta.icon;
          const perf = d?.performance ?? 0;

          return (
            <Card
              key={key}
              className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
              onClick={() => onDomainClick(meta.key)}
            >
              <div className="h-1" style={{ backgroundColor: meta.color }} />
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="flex size-7 items-center justify-center rounded-md shrink-0"
                    style={{ backgroundColor: meta.bgLight, color: meta.color }}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{meta.label}</p>
                    <p className="text-[10px] text-muted-foreground">{d?.count ?? 0} KPI</p>
                  </div>
                </div>

                {/* Status mini-bar (stacked) */}
                {d && d.count > 0 && (
                  <>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-muted mb-2">
                      <div className="bg-emerald-500" style={{ width: `${(d.atteint / d.count) * 100}%` }} />
                      <div className="bg-amber-500" style={{ width: `${(d.partiel / d.count) * 100}%` }} />
                      <div className="bg-red-500" style={{ width: `${(d.non_atteint / d.count) * 100}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-emerald-600 font-medium">{d.atteint}A</span>
                        <span className="text-[9px] text-amber-600 font-medium">{d.partiel}P</span>
                        <span className="text-[9px] text-red-600 font-medium">{d.non_atteint}NA</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: getPerformanceColor(perf) }}>
                        {perf}%
                      </span>
                    </div>
                  </>
                )}

                {/* Hover arrow */}
                <div className="flex justify-end mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── SECTION 7: Alerts ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

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
        const achievement = ind.targetValue && ind.targetValue > 0 ? (ind.value / ind.targetValue) * 100 : ind.value > 0 ? 0 : 100;
        if (achievement < 60) {
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
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle2 className="size-8 text-success mb-2" />
          <p className="text-sm font-medium text-foreground">Aucune alerte critique</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tous les indicateurs sont au-dessus de 60% de leur objectif.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-danger" />
          <h2 className="text-sm font-semibold text-foreground">
            Alertes Critiques
          </h2>
        </div>
        <Badge variant="destructive" className="text-[10px]">
          {allAlerts.length}
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {allAlerts.slice(0, 6).map((alert, idx) => (
          <Card
            key={`${alert.domain}-${alert.indicator.code}-${idx}`}
            className="border-l-2 hover:shadow-sm transition-shadow"
            style={{ borderLeftColor: '#ef4444' }}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{alert.indicator.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: alert.color }} />
                    <span className="text-[10px] text-muted-foreground">{alert.domainLabel}</span>
                    <span className="text-[10px] text-muted-foreground">&middot; {alert.indicator.code}</span>
                  </div>
                </div>
                <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">
                  {Math.round(alert.achievement)}%
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Réalisé: <strong className="text-foreground">{alert.indicator.value}</strong> {alert.indicator.unit}</span>
                <span>/ Cible: <strong className="text-foreground">{alert.indicator.targetValue}</strong></span>
              </div>
              <Progress value={Math.min(alert.achievement, 100)} className="h-1 mt-1.5" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── Loading Skeleton ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Executive strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[80px] rounded-lg" />
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[340px] rounded-lg" />
        <Skeleton className="h-[340px] rounded-lg" />
      </div>
      {/* Domain cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-lg" />
        ))}
      </div>
      {/* Priority + Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[300px] rounded-lg" />
        <Skeleton className="h-[300px] rounded-lg" />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── Main Component ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export function DashboardAccueil() {
  const { setActiveModule, filters } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleNavigate = (module: ModuleKey) => setActiveModule(module);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        setLoading(true);
        const params = new URLSearchParams({ year: String(filters.year || 2025) });
        if (filters.quarter) params.set('quarter', String(filters.quarter));

        const res = await fetch(`/api/dashboard?${params}`);
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setData(json);
        }
      } catch {
        // Silently fail - dashboard will stay in loading state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDashboard();
    return () => { cancelled = true; };
  }, [filters.year, filters.quarter]);

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* ── 1. Executive Summary Strip ─────────────────────────────────── */}
      <ExecutiveStrip data={data} onNavigate={handleNavigate} />

      {/* ── 2. Performance Charts Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DomainPerformanceChart summary={data.summary} onDomainClick={handleNavigate} />
        <StatusDonutSection data={data} />
      </div>

      {/* ── 3. Domain Quick Access ─────────────────────────────────────── */}
      <DomainQuickAccess summary={data.summary} onDomainClick={handleNavigate} />

      {/* ── 4. Priority KPIs + Projects ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopPriorityKpis indicators={data.topPriorityIndicators} onNavigate={handleNavigate} />
        <ProjectsOverview projects={data.projectSummary} />
      </div>

      {/* ── 5. Critical Alerts ─────────────────────────────────────────── */}
      <AlertsSection summary={data.summary} />

      {/* ── Last updated footer ─────────────────────────────────────────── */}
      <p className="text-[10px] text-muted-foreground text-center pb-2">
        Dernière mise à jour : {new Date(data.lastUpdated).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}