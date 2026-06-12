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
  verticalListSortingStrategy,
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Star,
  GripVertical,
  RotateCcw,
  TableProperties,
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

interface KpiModuleViewProps {
  domain: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SUB_DOMAIN_LABELS: Record<string, string> = {
  reporting_reglementaire: 'Reporting réglementaire',
  gouvernance_ethique: 'Gouvernance & Éthique',
  marches_publics: 'Passation des Marchés Publics',
  relations_publiques: 'Dons, Honoraires & Relations Publiques',
  execution_budgetaire: 'Exécution budgétaire',
  rentabilite: 'Rentabilité & Performance',
  ressources_specifiques: 'Ressources Spécifiques',
  dette: 'Endettement',
  deploiement_infra: 'Déploiement Infrastructures',
  relations_operateurs: 'Relations Opérateurs',
  service_universel: 'Service Universel',
  projets_programmes: 'Projets & Programmes',
  effectifs: 'Effectifs & Organisation',
  performance: 'Performance & Productivité',
  competences: 'Développement Compétences',
  couts_rh: 'Maîtrise Coûts RH',
  risque_strategique: 'Risque Stratégique',
  risque_financier: 'Risque Financier',
  risque_operationnel: 'Risque Opérationnel',
  risque_technologique: 'Risque Technologique',
  risque_gouvernance: 'Risque Gouvernance',
  pta_gouvernance: 'Gouvernance',
  pta_operationnel: 'Opérationnel',
  pta_finance: 'Finance',
};

const STATUS_CONFIG: Record<StatusType, { label: string; className: string }> = {
  atteint: {
    label: 'Atteint',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  },
  partiel: {
    label: 'Partiel',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  },
  non_atteint: {
    label: 'Non atteint',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  },
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

function isLowerBetter(unit: string): boolean {
  return unit === 'jours' || unit === 'nb' || unit === 'h' || unit === 'ratio';
}

function getLatestValue(indicator: Indicator): number | null {
  if (!indicator.values?.length) return null;
  return indicator.values[indicator.values.length - 1].value;
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

function computeEcart(
  value: number | null,
  target: number | null,
  unit: string
): { text: string; positive: boolean } | null {
  if (value == null || target == null) return null;
  const ecart = value - target;
  const lower = isLowerBetter(unit);
  const positive = lower ? ecart <= 0 : ecart >= 0;
  const sign = ecart >= 0 ? '+' : '';
  let suffix = '';
  if (unit === '%') suffix = ' pts';
  else if (unit === 'Mds FCFA') suffix = ' Mds';
  else if (unit === 'jours') suffix = ' j';
  else if (unit === 'h') suffix = ' h';
  else if (unit === 'km') suffix = ' km';
  else if (unit === 'ratio') suffix = '';
  else if (unit === 'nb') suffix = '';
  else suffix = unit ? ` ${unit}` : '';
  return {
    text: `${sign}${ecart.toFixed(unit === 'ratio' || unit === 'Mds FCFA' ? 2 : 1)}${suffix}`,
    positive,
  };
}

// ─── Status Badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusType }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="secondary"
      className={`text-xs font-medium px-2 py-0.5 ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}

// ─── Priority Badge ─────────────────────────────────────────────────────────

function PriorityBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-tango/15 text-tango px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider">
      <Star className="size-2.5 fill-tango text-tango" />
      Lot 1
    </span>
  );
}

// ─── Sortable Desktop Table Row ────────────────────────────────────────────

function SortableTableRow({ ind }: { ind: Indicator }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ind.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  const value = getLatestValue(ind);
  const status = computeStatus(value, ind.targetValue, ind.unit);
  const ecart = computeEcart(value, ind.targetValue, ind.unit);

  return (
    <TableRow
      id={`ind-${ind.id}`}
      ref={setNodeRef}
      style={style}
      className={cn(
        ind.isPriority && 'bg-tango/[0.03]',
        isDragging && 'opacity-40 shadow-lg',
      )}
    >
      {/* Drag handle */}
      <TableCell className="w-[40px] p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1.5 rounded-md hover:bg-muted touch-none"
              aria-label={`Réordonner ${ind.name}`}
            >
              <GripVertical className="size-3.5 text-muted-foreground/60" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Glisser pour réordonner
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">
        {ind.code}
      </TableCell>
      <TableCell className="font-medium text-sm">{ind.name}</TableCell>
      <TableCell className="text-center">
        {ind.isPriority ? <PriorityBadge /> : <span className="text-muted-foreground/30">—</span>}
      </TableCell>
      <TableCell className="text-center text-xs text-muted-foreground">
        {ind.unit}
      </TableCell>
      <TableCell className="text-right text-sm">
        {formatValue(ind.targetValue, ind.unit)}
      </TableCell>
      <TableCell className="text-right text-sm font-semibold">
        {formatValue(value, ind.unit)}
      </TableCell>
      <TableCell className="text-right text-sm font-medium">
        {ecart ? (
          <span
            className={
              ecart.positive
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }
          >
            {ecart.text}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <StatusBadge status={status} />
      </TableCell>
    </TableRow>
  );
}

// ─── Sortable Mobile Card ──────────────────────────────────────────────────

function SortableMobileCard({ ind }: { ind: Indicator }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ind.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  const value = getLatestValue(ind);
  const status = computeStatus(value, ind.targetValue, ind.unit);
  const ecart = computeEcart(value, ind.targetValue, ind.unit);

  return (
    <div id={`ind-${ind.id}`} ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-40')}>
      <Card className={cn(
        'p-4',
        ind.isPriority && 'border-l-4 border-l-tango',
      )}>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2 min-w-0 flex-1">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-muted mt-0.5 shrink-0 touch-none"
              aria-label={`Réordonner ${ind.name}`}
            >
              <GripVertical className="size-4 text-muted-foreground/50" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[10px] font-mono text-muted-foreground">{ind.code}</p>
                {ind.isPriority && <PriorityBadge />}
              </div>
              <p className="text-sm font-medium leading-tight mt-0.5">{ind.name}</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Valeur</p>
            <p className="text-sm font-semibold mt-0.5">
              {formatValue(value, ind.unit)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cible</p>
            <p className="text-sm font-semibold mt-0.5">
              {formatValue(ind.targetValue, ind.unit)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Écart</p>
            <p
              className={`text-sm font-semibold mt-0.5 ${
                ecart
                  ? ecart.positive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
              }`}
            >
              {ecart?.text ?? '—'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── Drag Overlay Content ──────────────────────────────────────────────────

function DragOverlayRow({ ind }: { ind: Indicator }) {
  const value = getLatestValue(ind);
  return (
    <div className="rounded-lg border-2 border-fun-blue/40 bg-card p-3 shadow-xl opacity-90">
      <div className="flex items-center gap-2">
        <GripVertical className="size-4 text-muted-foreground" />
        <span className="font-mono text-xs text-muted-foreground">{ind.code}</span>
        <span className="text-sm font-medium flex-1 truncate">{ind.name}</span>
        <span className="text-sm font-bold">{formatValue(value, ind.unit)}</span>
      </div>
    </div>
  );
}



// ─── Loading Skeleton ───────────────────────────────────────────────────────

function ModuleSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TableProperties className="size-4 text-fun-blue" />
        <Skeleton className="h-5 w-48" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Custom scrollbar style ─────────────────────────────────────────────────

const SCROLLBAR_STYLE = `
  .kpi-module-scroll::-webkit-scrollbar { width: 6px; }
  .kpi-module-scroll::-webkit-scrollbar-track { background: transparent; }
  .kpi-module-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
  .kpi-module-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
`;

// ─── SubDomain Content with DnD ────────────────────────────────────────────

function SubDomainContent({
  indicators,
  domain,
  subDomain,
}: {
  indicators: Indicator[];
  domain: string;
  subDomain: string;
}) {
  const isMobile = useIsMobile();
  const { cardOrder, setCardOrder, resetCardOrder } = useAppStore();
  const orderKey = `${getUserId()}__${domain}__${subDomain}`;
  const savedOrder = cardOrder[orderKey];
  const [activeId, setActiveId] = useState<string | null>(null);

  // Apply custom order
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

  if (indicators.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun indicateur dans ce sous-domaine
        </p>
      </Card>
    );
  }

  return (
    <div className="relative">
      {/* Reset order button */}
      {hasCustomOrder && (
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => resetCardOrder(orderKey)}
          >
            <RotateCcw className="size-3" />
            Réinitialiser l&apos;ordre
          </Button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {isMobile ? (
            /* ── Mobile: Card-based layout ── */
            <div className="space-y-3">
              {orderedIndicators.map((ind) => (
                <SortableMobileCard key={ind.id} ind={ind} />
              ))}
            </div>
          ) : (
            /* ── Desktop: Table layout ── */
            <div className="max-h-[600px] overflow-y-auto overflow-x-auto kpi-module-scroll">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] p-1" />
                    <TableHead className="w-[100px]">Code</TableHead>
                    <TableHead>Indicateur</TableHead>
                    <TableHead className="w-[60px] text-center">Priorité</TableHead>
                    <TableHead className="w-[80px] text-center">Unité</TableHead>
                    <TableHead className="w-[100px] text-right">Cible</TableHead>
                    <TableHead className="w-[100px] text-right">Valeur</TableHead>
                    <TableHead className="w-[120px] text-right">Écart</TableHead>
                    <TableHead className="w-[120px] text-center">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderedIndicators.map((ind) => (
                    <SortableTableRow key={ind.id} ind={ind} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay dropAnimation={null}>
          {activeIndicator ? <DragOverlayRow ind={activeIndicator} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function KpiModuleView({ domain }: KpiModuleViewProps) {
  const { filters, highlightIndicatorId, highlightSubDomain } = useAppStore();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Active tab state (controlled Tabs for highlight navigation) ──
  const subDomains = useMemo(() => {
    const map = new Map<string, Indicator[]>();
    indicators.forEach((ind) => {
      const key = ind.subDomain || 'autre';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ind);
    });
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
        return a.order - b.order;
      });
    }
    return map;
  }, [indicators]);

  const subDomainKeys = useMemo(() => Array.from(subDomains.keys()), [subDomains]);
  const defaultTab = subDomainKeys[0] || '';

  // Track user's manual tab selection; highlight overrides it temporarily
  // highlightSubDomain persists until user manually clicks a tab (cleared in onValueChange)
  const [manualTab, setManualTab] = useState<string | null>(null);

  const activeTab = useMemo(() => {
    if (highlightSubDomain && subDomainKeys.includes(highlightSubDomain)) {
      return highlightSubDomain;
    }
    if (manualTab && subDomainKeys.includes(manualTab)) {
      return manualTab;
    }
    return defaultTab;
  }, [highlightSubDomain, manualTab, subDomainKeys, defaultTab]);

  // Scroll to highlighted indicator + apply highlight class via DOM
  useEffect(() => {
    if (!highlightIndicatorId || loading) return;
    // Small delay to let the DOM render after module/tab switch
    const timer = setTimeout(() => {
      const el = document.getElementById(`ind-${highlightIndicatorId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Apply highlight class directly to the element or its closest card/row
        const target = el.closest('tr') || el;
        target.classList.add('kpi-highlight-row');
        // Also try card highlight
        const card = el.querySelector(':scope > .p-4') || el.closest('[class*="Card"]') || el;
        if (card !== target) card.classList.add('kpi-highlight');
        // Remove after 2 seconds (animation duration)
        setTimeout(() => {
          target.classList.remove('kpi-highlight-row');
          card.classList.remove('kpi-highlight');
        }, 2000);
      }
    }, 400);
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

    return () => {
      cancelled = true;
    };
  }, [domain, filters.year, filters.quarter, filters.month, filters.periodStart, filters.periodEnd]);

  // ── Loading / Empty state ──
  if (loading) return <ModuleSkeleton />;
  if (indicators.length === 0) return null;

  const priorityCount = indicators.filter((i) => i.isPriority).length;

  return (
    <div className="space-y-4">
      <style>{SCROLLBAR_STYLE}</style>

      {/* ── Section header ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <TableProperties className="size-4 text-fun-blue shrink-0" />
          <h3 className="text-sm font-semibold text-fun-blue truncate">
            Détail des Indicateurs
          </h3>
          <span className="text-xs text-muted-foreground shrink-0">
            ({priorityCount} Lot 1 / {indicators.length} total) &middot; Glisser pour réordonner
          </span>
        </div>
      </div>

      {/* ── Sub-domain Tabs (controlled for highlight navigation) ── */}
      {subDomainKeys.length > 0 && (
        <Tabs value={activeTab} onValueChange={(v) => { setManualTab(v); setHighlightSubDomain(null); }} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {subDomainKeys.map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="text-xs sm:text-sm data-[state=active]:bg-fun-blue data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                {SUB_DOMAIN_LABELS[key] || key.replace(/_/g, ' ')}
                <span className="ml-1.5 text-[10px] opacity-70">
                  ({subDomains.get(key)!.filter((i) => i.isPriority).length}/
                  {subDomains.get(key)!.length})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {subDomainKeys.map((key) => (
            <TabsContent key={key} value={key} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-fun-blue">
                      {SUB_DOMAIN_LABELS[key] || key.replace(/_/g, ' ')}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <SubDomainContent
                    indicators={subDomains.get(key)!}
                    domain={domain}
                    subDomain={key}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}