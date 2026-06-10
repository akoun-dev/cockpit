'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  LayoutDashboard,
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
  values: PeriodValue[];
}

type StatusType = 'atteint' | 'partiel' | 'non_atteint';

interface KpiModuleViewProps {
  domain: string;
  year: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SUB_DOMAIN_LABELS: Record<string, string> = {
  // Gouvernance
  reporting_reglementaire: 'Reporting réglementaire',
  gouvernance_ethique: 'Gouvernance & Éthique',
  marches_publics: 'Passation des Marchés Publics',
  relations_publiques: 'Dons, Honoraires & Relations Publiques',
  // Finance
  execution_budgetaire: 'Exécution budgétaire',
  rentabilite: 'Rentabilité & Performance',
  ressources_specifiques: 'Ressources Spécifiques',
  dette: 'Endettement',
  // Opérationnel
  deploiement_infra: 'Déploiement Infrastructures',
  relations_operateurs: 'Relations Opérateurs',
  service_universel: 'Service Universel',
  projets_programmes: 'Projets & Programmes',
  // RH
  effectifs: 'Effectifs & Organisation',
  performance: 'Performance & Productivité',
  competences: 'Développement Compétences',
  couts_rh: 'Maîtrise Coûts RH',
  // Risques
  risque_strategique: 'Risque Stratégique',
  risque_financier: 'Risque Financier',
  risque_operationnel: 'Risque Opérationnel',
  risque_technologique: 'Risque Technologique',
  risque_gouvernance: 'Risque Gouvernance',
  // PTA
  pta_gouvernance: 'Gouvernance',
  pta_operationnel: 'Opérationnel',
  pta_finance: 'Finance',
};

const DOMAIN_LABELS: Record<string, string> = {
  governance: 'Gouvernance',
  finance: 'Finance',
  operational: 'Opérationnel',
  rh: 'Ressources Humaines',
  risque: 'Gestion des Risques',
  pta: 'Plan Triennal d\'Actions',
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

// ─── Mobile Card for indicator ──────────────────────────────────────────────

function IndicatorMobileCard({ ind }: { ind: Indicator }) {
  const value = getLatestValue(ind);
  const status = computeStatus(value, ind.targetValue, ind.unit);
  const ecart = computeEcart(value, ind.targetValue, ind.unit);

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-mono text-muted-foreground">{ind.code}</p>
          <p className="text-sm font-medium leading-tight mt-0.5">{ind.name}</p>
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
  );
}

// ─── Summary KPI Card ───────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon,
  colorClass,
  bgColorClass,
  borderClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  bgColorClass: string;
  borderClass: string;
}) {
  return (
    <Card className={`border-l-4 ${borderClass}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${bgColorClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className={`text-xl font-bold ${colorClass}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function ModuleSkeleton() {
  return (
    <div className="space-y-6">
      {/* Title skeleton */}
      <Skeleton className="h-7 w-64" />

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-10" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Table skeleton */}
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
  .kpi-module-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .kpi-module-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .kpi-module-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  .kpi-module-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

// ─── SubDomain Table Content ────────────────────────────────────────────────

function SubDomainContent({ indicators }: { indicators: Indicator[] }) {
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
    <>
      {/* Mobile: Card-based layout */}
      <div className="md:hidden space-y-3">
        {indicators.map((ind) => (
          <IndicatorMobileCard key={ind.id} ind={ind} />
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block max-h-[600px] overflow-y-auto overflow-x-auto kpi-module-scroll">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Code</TableHead>
              <TableHead>Indicateur</TableHead>
              <TableHead className="w-[80px] text-center">Unité</TableHead>
              <TableHead className="w-[100px] text-right">Cible</TableHead>
              <TableHead className="w-[100px] text-right">Valeur</TableHead>
              <TableHead className="w-[120px] text-right">Écart</TableHead>
              <TableHead className="w-[120px] text-center">Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {indicators.map((ind) => {
              const value = getLatestValue(ind);
              const status = computeStatus(value, ind.targetValue, ind.unit);
              const ecart = computeEcart(value, ind.targetValue, ind.unit);

              return (
                <TableRow key={ind.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {ind.code}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {ind.name}
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
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function KpiModuleView({ domain, year }: KpiModuleViewProps) {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/indicators/domain?domain=${domain}&year=${year || 2025}`)
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
  }, [domain, year]);

  // ── Group by sub-domain ──
  const subDomains = useMemo(() => {
    const map = new Map<string, Indicator[]>();
    indicators.forEach((ind) => {
      const key = ind.subDomain || 'autre';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ind);
    });
    return map;
  }, [indicators]);

  const subDomainKeys = useMemo(() => Array.from(subDomains.keys()), [subDomains]);

  // ── Compute summary stats ──
  const summaryStats = useMemo(() => {
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

    return {
      total: indicators.length,
      atteint,
      partiel,
      non_atteint,
    };
  }, [indicators]);

  // ── Loading state ──
  if (loading) return <ModuleSkeleton />;

  // ── Empty state ──
  if (indicators.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-fun-blue">
          {DOMAIN_LABELS[domain] || domain}
        </h2>
        <Card className="p-12 text-center">
          <LayoutDashboard className="size-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Aucun indicateur disponible pour ce module en {year}
          </p>
        </Card>
      </div>
    );
  }

  const defaultTab = subDomainKeys[0] || '';

  return (
    <div className="space-y-6">
      {/* ── Custom scrollbar styles ── */}
      <style>{SCROLLBAR_STYLE}</style>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-fun-blue">
            {DOMAIN_LABELS[domain] || domain}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {summaryStats.total} indicateurs &middot; Année {year}
          </p>
        </div>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          label="Total KPI"
          value={summaryStats.total}
          icon={<BarChart3 className="size-5 text-fun-blue" />}
          colorClass="text-fun-blue"
          bgColorClass="bg-fun-blue/10"
          borderClass="border-l-fun-blue"
        />
        <SummaryCard
          label="KPI Atteint"
          value={summaryStats.atteint}
          icon={<CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />}
          colorClass="text-emerald-600 dark:text-emerald-400"
          bgColorClass="bg-emerald-100 dark:bg-emerald-900/40"
          borderClass="border-l-emerald-500"
        />
        <SummaryCard
          label="KPI Partiel"
          value={summaryStats.partiel}
          icon={<AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />}
          colorClass="text-amber-600 dark:text-amber-400"
          bgColorClass="bg-amber-100 dark:bg-amber-900/40"
          borderClass="border-l-amber-500"
        />
        <SummaryCard
          label="KPI Non atteint"
          value={summaryStats.non_atteint}
          icon={<XCircle className="size-5 text-red-600 dark:text-red-400" />}
          colorClass="text-red-600 dark:text-red-400"
          bgColorClass="bg-red-100 dark:bg-red-900/40"
          borderClass="border-l-red-500"
        />
      </div>

      {/* ── Sub-domain Tabs ── */}
      {subDomainKeys.length > 0 && (
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {subDomainKeys.map((key) => (
              <TabsTrigger
                key={key}
                value={key}
                className="text-xs sm:text-sm data-[state=active]:bg-fun-blue data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                {SUB_DOMAIN_LABELS[key] || key.replace(/_/g, ' ')}
                <span className="ml-1.5 text-[10px] opacity-70">
                  ({subDomains.get(key)!.length})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {subDomainKeys.map((key) => (
            <TabsContent key={key} value={key} className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-fun-blue">
                    {SUB_DOMAIN_LABELS[key] || key.replace(/_/g, ' ')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SubDomainContent indicators={subDomains.get(key)!} />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}