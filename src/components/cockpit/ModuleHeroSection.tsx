'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getUserId } from '@/lib/user-id';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  GripVertical,
  RotateCcw,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PeriodValue {
  value: number;
  period: string;
  year: number;
  month?: number;
  quarter?: number;
}

interface Indicator {
  id: string;
  name: string;
  code: string;
  subDomain: string;
  unit: string;
  targetValue: number | null;
  alertValue: number | null;
  criticalValue: number | null;
  isPriority: boolean;
  values: PeriodValue[];
  order: number;
}

type StatusType = 'atteint' | 'partiel' | 'non_atteint';

// ─── Domain config ──────────────────────────────────────────────────────────

const DOMAIN_CONFIG: Record<
  string,
  {
    heroCodes: string[];
    color: string;
    colorLight: string;
    icon: string;
  }
> = {
  governance: {
    heroCodes: ['GOV-001', 'GOV-008', 'GOV-009', 'GOV-010'],
    color: '#1c55a3',
    colorLight: '#1c55a315',
    icon: '🏛️',
  },
  finance: {
    heroCodes: ['FIN-001', 'FIN-002', 'FIN-003', 'FIN-005'],
    color: '#205eb3',
    colorLight: '#205eb315',
    icon: '💰',
  },
  operational: {
    heroCodes: ['OP-001', 'OP-003', 'OP-004', 'OP-005'],
    color: '#f18120',
    colorLight: '#f1812015',
    icon: '🔧',
  },
  rh: {
    heroCodes: ['RH-006', 'RH-007', 'RH-008', 'RH-011'],
    color: '#22c55e',
    colorLight: '#22c55e15',
    icon: '👥',
  },
  risque: {
    heroCodes: ['RIS-002', 'RIS-003', 'RIS-004', 'RIS-010'],
    color: '#ef4444',
    colorLight: '#ef444415',
    icon: '⚠️',
  },
  pta: {
    heroCodes: ['PTA-003', 'PTA-005', 'PTA-006', 'PTA-007'],
    color: '#f59e0b',
    colorLight: '#f59e0b15',
    icon: '📋',
  },
};

const SUB_DOMAIN_LABELS: Record<string, string> = {
  reporting_reglementaire: 'Reporting réglementaire',
  gouvernance_ethique: 'Gouvernance & Éthique',
  marches_publics: 'Marchés Publics',
  relations_publiques: 'Dons & Relations Publiques',
  execution_budgetaire: 'Exécution budgétaire',
  rentabilite: 'Rentabilité',
  ressources_specifiques: 'Ressources Spécifiques',
  dette: 'Endettement',
  deploiement_infra: 'Déploiement Infra',
  relations_operateurs: 'Relations Opérateurs',
  service_universel: 'Service Universel',
  projets_programmes: 'Projets & Programmes',
  effectifs: 'Effectifs',
  performance: 'Performance',
  competences: 'Compétences',
  couts_rh: 'Coûts RH',
  risque_strategique: 'Risque Stratégique',
  risque_financier: 'Risque Financier',
  risque_operationnel: 'Risque Opérationnel',
  risque_technologique: 'Risque Technologique',
  risque_gouvernance: 'Risque Gouvernance',
  pta_gouvernance: 'Gouvernance',
  pta_operationnel: 'Opérationnel',
  pta_finance: 'Finance',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatValue(value: number | null | undefined, unit: string): string {
  if (value == null) return '—';
  if (unit === 'nb' || unit === 'km' || unit === 'h' || unit === 'jours')
    return Math.round(value).toLocaleString('fr-FR');
  if (unit === 'Mds FCFA') return `${value.toFixed(2)} Mds`;
  if (unit === 'ratio') return value.toFixed(2);
  return `${value.toFixed(1)}${unit === '%' ? '%' : ''}`;
}

function getLatestValue(indicator: Indicator): number | null {
  if (!indicator.values?.length) return null;
  return indicator.values[indicator.values.length - 1].value;
}

function getPreviousValue(indicator: Indicator): number | null {
  if (!indicator.values || indicator.values.length < 2) return null;
  return indicator.values[indicator.values.length - 2].value;
}

function isLowerBetter(unit: string): boolean {
  return unit === 'jours' || unit === 'nb' || unit === 'h' || unit === 'ratio';
}

function computeStatus(
  value: number | null,
  target: number | null,
  unit: string
): StatusType {
  if (value == null || target == null || target === 0) return 'non_atteint';
  const lower = isLowerBetter(unit);
  if (lower) {
    if (value <= target) return 'atteint';
    if (value <= target * 1.5) return 'partiel';
    return 'non_atteint';
  } else {
    if (value >= target) return 'atteint';
    if (value >= target * 0.8) return 'partiel';
    return 'non_atteint';
  }
}

// ─── Sortable Hero Card ──────────────────────────────────────────────────────

function SortableHeroCard({
  indicator,
  accentColor,
  accentLight,
}: {
  indicator: Indicator;
  accentColor: string;
  accentLight: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: indicator.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  const value = getLatestValue(indicator);
  const prev = getPreviousValue(indicator);
  const status = computeStatus(value, indicator.targetValue, indicator.unit);

  const progressPercent =
    indicator.targetValue && value != null && indicator.targetValue > 0
      ? Math.min((value / indicator.targetValue) * 100, 100)
      : null;

  const trend =
    prev != null && value != null
      ? value > prev
        ? ('up' as const)
        : value < prev
          ? ('down' as const)
          : ('neutral' as const)
      : null;

  const trendPct =
    prev != null && value != null && prev !== 0
      ? (((value - prev) / Math.abs(prev)) * 100).toFixed(1)
      : null;

  return (
    <div id={`ind-${indicator.id}`} ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-40')}>
      <Card className="relative overflow-hidden border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: accentColor }}>
        {/* Background accent */}
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06] -translate-y-8 translate-x-8"
          style={{ backgroundColor: accentColor }}
        />

        <CardContent className="p-4 relative">
          {/* Drag handle + Indicator code + name */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-1.5 min-w-0 flex-1">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-0.5 rounded-md hover:bg-muted/50 mt-0.5 shrink-0 touch-none"
                aria-label={`Réordonner ${indicator.name}`}
              >
                <GripVertical className="size-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
              </button>
              <div className="min-w-0">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  {indicator.code}
                </p>
                <p className="text-xs font-medium text-foreground leading-tight mt-0.5 truncate">
                  {indicator.name}
                </p>
              </div>
            </div>
            {/* Trend */}
            {trend && trendPct && (
              <div
                className={cn(
                  'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold shrink-0',
                  trend === 'up' && !isLowerBetter(indicator.unit)
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : trend === 'down' && isLowerBetter(indicator.unit)
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : trend === 'up'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        : trend === 'down'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-600',
                )}
              >
                {trend === 'up' ? (
                  <TrendingUp className="size-3" />
                ) : trend === 'down' ? (
                  <TrendingDown className="size-3" />
                ) : (
                  <Minus className="size-3" />
                )}
                {trendPct}%
              </div>
            )}
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-2xl font-bold tracking-tight" style={{ color: accentColor }}>
              {formatValue(value, indicator.unit)}
            </span>
            <span className="text-xs text-muted-foreground">{indicator.unit}</span>
          </div>

          {/* Progress toward target */}
          {progressPercent !== null && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground flex items-center gap-0.5">
                  <Target className="size-2.5" />
                  Cible: {formatValue(indicator.targetValue, indicator.unit)}
                </span>
                <span
                  className={cn(
                    'font-semibold',
                    status === 'atteint' && 'text-emerald-600',
                    status === 'partiel' && 'text-amber-600',
                    status === 'non_atteint' && 'text-red-600',
                  )}
                >
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${progressPercent}%`,
                    backgroundColor:
                      status === 'atteint' ? '#22c55e' : status === 'partiel' ? '#f59e0b' : '#ef4444',
                  }}
                />
              </div>
            </div>
          )}

          {/* No target case */}
          {progressPercent === null && value != null && (
            <p className="text-[10px] text-muted-foreground italic">Pas de cible définie</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Drag Overlay for Hero Card ──────────────────────────────────────────────

function HeroCardOverlay({
  indicator,
  accentColor,
}: {
  indicator: Indicator;
  accentColor: string;
}) {
  const value = getLatestValue(indicator);
  return (
    <div className="rounded-lg border-2 bg-card p-4 shadow-xl opacity-90 w-[250px]" style={{ borderColor: accentColor }}>
      <div className="flex items-center gap-2">
        <GripVertical className="size-4 text-muted-foreground" />
        <span className="font-mono text-[10px] text-muted-foreground">{indicator.code}</span>
        <span className="text-sm font-medium flex-1 truncate">{indicator.name}</span>
        <span className="text-lg font-bold" style={{ color: accentColor }}>
          {formatValue(value, indicator.unit)}
        </span>
      </div>
    </div>
  );
}

// ─── Draggable Hero Cards Grid ───────────────────────────────────────────────

function DraggableHeroCards({
  indicators,
  accentColor,
  accentLight,
  domain,
}: {
  indicators: Indicator[];
  accentColor: string;
  accentLight: string;
  domain: string;
}) {
  const { cardOrder, setCardOrder, resetCardOrder } = useAppStore();
  const orderKey = `${getUserId()}__${domain}__hero`;
  const savedOrder = cardOrder[orderKey];
  const [activeId, setActiveId] = useState<string | null>(null);

  const orderedIndicators = useMemo(() => {
    if (!savedOrder || savedOrder.length === 0) return indicators;
    const orderMap = new Map(savedOrder.map((id, idx) => [id, idx]));
    return [...indicators].sort((a, b) => {
      const aIdx = orderMap.get(a.id) ?? Infinity;
      const bIdx = orderMap.get(b.id) ?? Infinity;
      return aIdx - bIdx;
    });
  }, [indicators, savedOrder]);

  const itemIds = useMemo(
    () => orderedIndicators.map((i) => i.id),
    [orderedIndicators],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeIndicator = useMemo(
    () => (activeId ? indicators.find((i) => i.id === activeId) : null),
    [activeId, indicators],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = orderedIndicators.findIndex((i) => i.id === active.id);
        const newIndex = orderedIndicators.findIndex((i) => i.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(orderedIndicators, oldIndex, newIndex).map(
            (i) => i.id,
          );
          setCardOrder(orderKey, newOrder);
        }
      }
    },
    [orderedIndicators, orderKey, setCardOrder],
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  const hasCustomOrder = savedOrder && savedOrder.length > 0;

  return (
    <div>
      {/* Header with reset button */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">
          Indicateurs clés &middot; <span className="opacity-60">Glisser pour réordonner</span>
        </p>
        {hasCustomOrder && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-[10px] text-muted-foreground hover:text-foreground px-2"
            onClick={() => resetCardOrder(orderKey)}
          >
            <RotateCcw className="size-2.5" />
            Réinitialiser
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={itemIds}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {orderedIndicators.map((ind) => (
              <SortableHeroCard
                key={ind.id}
                indicator={ind}
                accentColor={accentColor}
                accentLight={accentLight}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeIndicator ? (
            <HeroCardOverlay indicator={activeIndicator} accentColor={accentColor} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function HeroSectionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-2 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Status Donut Chart ────────────────────────────────────────────────────

const statusChartConfig = {
  atteint: { label: 'Atteint', color: '#22c55e' },
  partiel: { label: 'Partiel', color: '#f59e0b' },
  non_atteint: { label: 'Non atteint', color: '#ef4444' },
} satisfies ChartConfig;

function StatusDonutChart({
  atteint,
  partiel,
  non_atteint,
  total,
}: {
  atteint: number;
  partiel: number;
  non_atteint: number;
  total: number;
}) {
  const data = [
    { name: 'atteint', value: atteint },
    { name: 'partiel', value: partiel },
    { name: 'non_atteint', value: non_atteint },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Aucune donnée</p>
        </CardContent>
      </Card>
    );
  }

  const scorePct = total > 0 ? Math.round(((atteint + partiel * 0.5) / total) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Répartition par Statut</CardTitle>
          <span
            className={cn(
              'text-2xl font-bold',
              scorePct >= 80 ? 'text-emerald-600' : scorePct >= 60 ? 'text-amber-600' : 'text-red-600',
            )}
          >
            {scorePct}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <ChartContainer config={statusChartConfig} className="mx-auto aspect-square h-[160px] w-[160px] shrink-0">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              strokeWidth={2}
              stroke="var(--color-card)"
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
              ))}
            </Pie>
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
        <div className="space-y-2.5 text-sm min-w-0">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-muted-foreground">Atteint</span>
            <span className="font-bold ml-auto">{atteint}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-amber-500 shrink-0" />
            <span className="text-muted-foreground">Partiel</span>
            <span className="font-bold ml-auto">{partiel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-red-500 shrink-0" />
            <span className="text-muted-foreground">Non atteint</span>
            <span className="font-bold ml-auto">{non_atteint}</span>
          </div>
          <div className="pt-1.5 border-t border-border flex items-center gap-2">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold ml-auto">{total}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sub-Domain Performance Bar Chart ─────────────────────────────────────

function SubDomainBarChart({
  domain,
  indicators,
  accentColor,
}: {
  domain: string;
  indicators: Indicator[];
  accentColor: string;
}) {
  const data = useMemo(() => {
    const map = new Map<string, { total: number; achieved: number }>();
    indicators.forEach((ind) => {
      const key = ind.subDomain || 'autre';
      if (!map.has(key)) map.set(key, { total: 0, achieved: 0 });
      const entry = map.get(key)!;
      entry.total++;
      const value = getLatestValue(ind);
      const status = computeStatus(value, ind.targetValue, ind.unit);
      if (status === 'atteint') entry.achieved++;
    });

    return Array.from(map.entries())
      .map(([key, { total, achieved }]) => ({
        name: (SUB_DOMAIN_LABELS[key] || key.replace(/_/g, ' ')).length > 18
          ? (SUB_DOMAIN_LABELS[key] || key).substring(0, 18) + '…'
          : SUB_DOMAIN_LABELS[key] || key,
        fullName: SUB_DOMAIN_LABELS[key] || key,
        performance: total > 0 ? Math.round((achieved / total) * 100) : 0,
        fill: accentColor,
      }))
      .sort((a, b) => b.performance - a.performance);
  }, [indicators, accentColor]);

  if (data.length === 0) return null;

  const barChartConfig = {
    performance: { label: 'Performance', color: accentColor },
  } satisfies ChartConfig;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Performance par Sous-Domaine</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={barChartConfig} className="h-[200px] w-full">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: number) => [`${value}%`, 'Performance']}
                />
              }
            />
            <Bar dataKey="performance" fill="var(--color-performance)" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ChartContainer>
        <ChartLegend className="mt-2">
          <ChartLegendContent />
        </ChartLegend>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

interface ModuleHeroSectionProps {
  domain: string;
}

export function ModuleHeroSection({ domain }: ModuleHeroSectionProps) {
  const { filters, highlightIndicatorId } = useAppStore();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);

  // Highlight indicator from search
  useEffect(() => {
    if (!highlightIndicatorId || loading) return;
    const timer = setTimeout(() => {
      const el = document.getElementById(`ind-${highlightIndicatorId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const card = el.querySelector('[class*="Card"]') || el.closest('[class*="Card"]') || el;
        card.classList.add('kpi-highlight');
        setTimeout(() => card.classList.remove('kpi-highlight'), 2000);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [highlightIndicatorId, loading]);

  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams({ domain, year: String(filters.year || 2025) });
    if (filters.quarter) params.set('quarter', String(filters.quarter));
    if (filters.month) params.set('month', String(filters.month));
    if (filters.periodStart) params.set('periodStart', filters.periodStart);
    if (filters.periodEnd) params.set('periodEnd', filters.periodEnd);

    fetch(`/api/indicators/domain?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setIndicators(data?.indicators ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIndicators([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [domain, filters.year, filters.quarter, filters.month, filters.periodStart, filters.periodEnd]);

  const config = DOMAIN_CONFIG[domain] || {
    heroCodes: [],
    color: '#1c55a3',
    colorLight: '#1c55a315',
    icon: '📊',
  };

  // Get hero indicators — by code, falling back to priority indicators
  const heroIndicators = useMemo(() => {
    // Try predefined codes
    if (config.heroCodes.length > 0) {
      const found = config.heroCodes
        .map((code) => indicators.find((i) => i.code === code))
        .filter((i): i is Indicator => i !== undefined);
      if (found.length >= 2) return found.slice(0, 4);
    }

    // Fallback: use priority indicators
    const priority = indicators.filter((i) => i.isPriority);
    if (priority.length >= 2) return priority.slice(0, 4);

    // Last fallback: first 4 indicators
    return indicators.slice(0, 4);
  }, [indicators, config.heroCodes]);

  // Status distribution
  const statusStats = useMemo(() => {
    let atteint = 0;
    let partiel = 0;
    let non_atteint = 0;
    indicators.forEach((ind) => {
      const value = getLatestValue(ind);
      const status = computeStatus(value, ind.targetValue, ind.unit);
      if (status === 'atteint') atteint++;
      else if (status === 'partiel') partiel++;
      else non_atteint++;
    });
    return { atteint, partiel, non_atteint, total: indicators.length };
  }, [indicators]);

  if (loading) return <HeroSectionSkeleton />;
  if (indicators.length === 0) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Hero KPI Cards (draggable) ── */}
      {heroIndicators.length > 0 && (
        <DraggableHeroCards
          indicators={heroIndicators}
          accentColor={config.color}
          accentLight={config.colorLight}
          domain={domain}
        />
      )}

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusDonutChart
          atteint={statusStats.atteint}
          partiel={statusStats.partiel}
          non_atteint={statusStats.non_atteint}
          total={statusStats.total}
        />
        <SubDomainBarChart
          domain={domain}
          indicators={indicators}
          accentColor={config.color}
        />
      </div>
    </div>
  );
}