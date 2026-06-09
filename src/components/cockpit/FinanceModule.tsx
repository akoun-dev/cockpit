'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
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
import { useAppStore } from '@/lib/store';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  BarChart3,
  Percent,
  Building2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

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
  targetValue: number;
  values: PeriodValue[];
  department: { name: string };
}

interface FinanceData {
  indicators: Indicator[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const MONTHS_FR = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) {
    const val = n / 1_000_000_000;
    return `${val.toFixed(1).replace('.', ' ')} Mrd FCFA`;
  }
  if (abs >= 1_000_000) {
    const val = n / 1_000_000;
    return `${val.toFixed(1).replace('.', ' ')} M FCFA`;
  }
  if (abs >= 1_000) {
    const val = n / 1_000;
    return `${val.toFixed(1).replace('.', ' ')} K FCFA`;
  }
  return `${n.toLocaleString('fr-FR')} FCFA`;
}

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} Mrd`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)} K`;
  return String(n);
}

function getTrend(values: PeriodValue[]): 'positive' | 'negative' | 'neutral' {
  if (values.length < 2) return 'neutral';
  const last = values[values.length - 1].value;
  const prev = values[values.length - 2].value;
  if (last > prev * 1.02) return 'positive';
  if (last < prev * 0.98) return 'negative';
  return 'neutral';
}

function getTrendDelta(values: PeriodValue[]): string {
  if (values.length < 2) return '';
  const last = values[values.length - 1].value;
  const prev = values[values.length - 2].value;
  if (prev === 0) return '';
  const pct = ((last - prev) / Math.abs(prev)) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function findIndicator(indicators: Indicator[], code: string): Indicator | undefined {
  return indicators.find((i) => i.code === code);
}

// ── Mock Data ───────────────────────────────────────────────────────────────

function generateMockFinanceData(): FinanceData {
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: 0,
    period: MONTHS_FR[i],
    year: 2025,
    month: i + 1,
  }));

  const makeMonthly = (base: number, variance: number) =>
    months.map((m, i) => ({
      ...m,
      value: Math.round(base + (Math.sin(i * 0.5) + 1) * variance * 0.5 + Math.random() * variance * 0.3),
    }));

  return {
    indicators: [
      {
        id: '1', name: "Taux d'exécution budgétaire", code: 'FIN-001',
        subDomain: 'execution_budgetaire', unit: '%', targetValue: 85,
        values: makeMonthly(55, 30),
        department: { name: 'Finance & Comptabilité' },
      },
      {
        id: '2', name: "Chiffre d'Affaires", code: 'FIN-002',
        subDomain: 'rentabilite', unit: 'FCFA', targetValue: 15_000_000_000,
        values: makeMonthly(1_200_000_000, 300_000_000),
        department: { name: 'Finance & Comptabilité' },
      },
      {
        id: '3', name: 'Excédent Brut d\'Exploitation', code: 'FIN-003',
        subDomain: 'rentabilite', unit: 'FCFA', targetValue: 4_500_000_000,
        values: makeMonthly(350_000_000, 100_000_000),
        department: { name: 'Finance & Comptabilité' },
      },
      {
        id: '4', name: 'Marge brute', code: 'FIN-004',
        subDomain: 'rentabilite', unit: '%', targetValue: 35,
        values: makeMonthly(28, 8),
        department: { name: 'Finance & Comptabilité' },
      },
      {
        id: '5', name: 'Résultat net', code: 'FIN-005',
        subDomain: 'rentabilite', unit: 'FCFA', targetValue: 2_000_000_000,
        values: makeMonthly(150_000_000, 60_000_000),
        department: { name: 'Finance & Comptabilité' },
      },
      {
        id: '6', name: "Taux d'endettement", code: 'FIN-006',
        subDomain: 'dette', unit: '%', targetValue: 50,
        values: makeMonthly(42, 8),
        department: { name: 'Finance & Comptabilité' },
      },
      {
        id: '7', name: 'Capacité de remboursement', code: 'FIN-007',
        subDomain: 'dette', unit: 'ratio', targetValue: 2.5,
        values: makeMonthly(1.8, 0.6),
        department: { name: 'Finance & Comptabilité' },
      },
      {
        id: '8', name: 'Charges totales', code: 'FIN-009',
        subDomain: 'execution_budgetaire', unit: 'FCFA', targetValue: 12_000_000_000,
        values: makeMonthly(900_000_000, 250_000_000),
        department: { name: 'Finance & Comptabilité' },
      },
      {
        id: '9', name: 'ROE', code: 'FIN-010',
        subDomain: 'rentabilite', unit: '%', targetValue: 15,
        values: makeMonthly(10, 4),
        department: { name: 'Finance & Comptabilité' },
      },
      {
        id: '10', name: 'Ressources Backbone', code: 'FIN-011',
        subDomain: 'ressources_specifiques', unit: 'FCFA', targetValue: 5_000_000_000,
        values: makeMonthly(400_000_000, 150_000_000),
        department: { name: 'Technologie' },
      },
      {
        id: '11', name: 'Subventions reçues', code: 'FIN-012',
        subDomain: 'ressources_specifiques', unit: 'FCFA', targetValue: 3_000_000_000,
        values: makeMonthly(200_000_000, 100_000_000),
        department: { name: 'Finance & Comptabilité' },
      },
      {
        id: '12', name: 'Fonds propres', code: 'FIN-013',
        subDomain: 'ressources_specifiques', unit: 'FCFA', targetValue: 10_000_000_000,
        values: makeMonthly(8_500_000_000, 500_000_000),
        department: { name: 'Finance & Comptabilité' },
      },
    ],
  };
}

// ── Chart Configs ───────────────────────────────────────────────────────────

const caChargesChartConfig = {
  ca: { label: "Chiffre d'affaires", color: '#1c55a3' },
  charges: { label: 'Charges', color: '#f18120' },
} satisfies ChartConfig;

const rentabiliteChartConfig = {
  ebe: { label: 'EBE', color: '#1c55a3' },
  resultatNet: { label: 'Résultat net', color: '#f18120' },
} satisfies ChartConfig;

const detteChartConfig = {
  endettement: { label: "Taux d'endettement", color: '#ef4444' },
  objectif: { label: 'Objectif (50%)', color: '#e2e8f0' },
} satisfies ChartConfig;

const resourcesChartConfig = {
  backbone: { label: 'Ressources Backbone', color: '#1c55a3' },
  subventions: { label: 'Subventions', color: '#205eb3' },
  fondsPropres: { label: 'Fonds propres', color: '#22c55e' },
} satisfies ChartConfig;

// ── Sub-domain helpers ──────────────────────────────────────────────────────

function buildMonthlyData(
  ind1: Indicator | undefined,
  ind2: Indicator | undefined,
  key1: string,
  key2: string,
  divisor = 1_000_000_000,
) {
  if (!ind1 && !ind2) return [];
  const len = Math.max(ind1?.values.length || 0, ind2?.values.length || 0);
  return Array.from({ length: len }, (_, i) => ({
    name: MONTHS_FR[i] || `M${i + 1}`,
    [key1]: ind1?.values[i] ? +(ind1.values[i].value / divisor).toFixed(2) : undefined,
    [key2]: ind2?.values[i] ? +(ind2.values[i].value / divisor).toFixed(2) : undefined,
  }));
}

// ── Execution Budgetaire Tab ────────────────────────────────────────────────

function ExecutionBudgetaireTab({ indicators }: { indicators: Indicator[] }) {
  const ca = findIndicator(indicators, 'FIN-002');
  const charges = findIndicator(indicators, 'FIN-009');
  const execBudg = findIndicator(indicators, 'FIN-001');

  const monthlyData = buildMonthlyData(ca, charges, 'ca', 'charges');

  // Budget execution detail table (from all execution_budgetaire indicators)
  const budgetIndicators = indicators.filter(
    (i) => i.subDomain === 'execution_budgetaire',
  );

  return (
    <div className="space-y-6">
      {/* Line Chart: CA vs Charges */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {"Évolution CA vs Charges (Mrd FCFA)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer config={caChargesChartConfig} className="h-[300px] w-full">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="ca"
                stroke="var(--color-ca)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="charges"
                stroke="var(--color-charges)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
          <ChartLegend className="mt-2">
            <ChartLegendContent />
          </ChartLegend>
        </CardContent>
      </Card>

      {/* Table: Budget Execution Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Détail de l&apos;Exécution Budgétaire
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Code</TableHead>
                  <TableHead className="text-xs">Indicateur</TableHead>
                  <TableHead className="text-xs text-right">Cible</TableHead>
                  <TableHead className="text-xs text-right">Dernière Valeur</TableHead>
                  <TableHead className="text-xs text-right">Atteinte</TableHead>
                  <TableHead className="text-xs">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetIndicators.map((ind) => {
                  const lastVal = ind.values.length > 0 ? ind.values[ind.values.length - 1].value : 0;
                  const achievement = ind.targetValue > 0 ? Math.min((lastVal / ind.targetValue) * 100, 150) : 0;
                  const status =
                    achievement >= 80 ? 'atteint' : achievement >= 50 ? 'partiel' : 'non_atteint';
                  const statusLabel =
                    status === 'atteint' ? 'Atteint' : status === 'partiel' ? 'Partiel' : 'Non atteint';

                  return (
                    <TableRow key={ind.id}>
                      <TableCell className="text-xs font-mono">{ind.code}</TableCell>
                      <TableCell className="text-xs font-medium">{ind.name}</TableCell>
                      <TableCell className="text-xs text-right">
                        {ind.unit === '%' ? `${ind.targetValue}%` : formatCompact(ind.targetValue)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono font-medium">
                        {ind.unit === '%' ? `${lastVal}%` : formatCompact(lastVal)}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <span
                          className={`font-medium ${
                            achievement >= 80 ? 'text-success' : achievement >= 50 ? 'text-warning' : 'text-danger'
                          }`}
                        >
                          {Math.round(achievement)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={status} label={statusLabel} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Rentabilite Tab ─────────────────────────────────────────────────────────

function RentabiliteTab({ indicators }: { indicators: Indicator[] }) {
  const ebe = findIndicator(indicators, 'FIN-003');
  const resultatNet = findIndicator(indicators, 'FIN-005');
  const marge = findIndicator(indicators, 'FIN-004');
  const roe = findIndicator(indicators, 'FIN-010');

  const monthlyData = buildMonthlyData(ebe, resultatNet, 'ebe', 'resultatNet');

  const margeLast = marge?.values.length ? marge.values[marge.values.length - 1].value : 0;
  const roeLast = roe?.values.length ? roe.values[roe.values.length - 1].value : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Excédent Brut d'Exploitation"
          value={ebe?.values.length ? formatCompact(ebe.values[ebe.values.length - 1].value) : '-'}
          unit="FCFA"
          target={ebe?.targetValue}
          trend={ebe ? getTrend(ebe.values) : undefined}
          trendValue={ebe ? getTrendDelta(ebe.values) : undefined}
          icon={<DollarSign className="size-5" />}
        />
        <KpiCard
          title="Résultat Net"
          value={resultatNet?.values.length ? formatCompact(resultatNet.values[resultatNet.values.length - 1].value) : '-'}
          unit="FCFA"
          target={resultatNet?.targetValue}
          trend={resultatNet ? getTrend(resultatNet.values) : undefined}
          trendValue={resultatNet ? getTrendDelta(resultatNet.values) : undefined}
          icon={<TrendingUp className="size-5" />}
        />
        <KpiCard
          title="Marge Brute"
          value={margeLast}
          unit="%"
          target={marge?.targetValue}
          trend={marge ? getTrend(marge.values) : undefined}
          trendValue={marge ? getTrendDelta(marge.values) : undefined}
          icon={<Percent className="size-5" />}
        />
        <KpiCard
          title="ROE (Rentabilité des Capitaux)"
          value={roeLast}
          unit="%"
          target={roe?.targetValue}
          trend={roe ? getTrend(roe.values) : undefined}
          trendValue={roe ? getTrendDelta(roe.values) : undefined}
          icon={<BarChart3 className="size-5" />}
        />
      </div>

      {/* Area Chart: EBE & Résultat Net */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Évolution EBE &amp; Résultat Net (Mrd FCFA)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer config={rentabiliteChartConfig} className="h-[300px] w-full">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="fillEbe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-ebe)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-ebe)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillResultatNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-resultatNet)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--color-resultatNet)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="ebe"
                stroke="var(--color-ebe)"
                fill="url(#fillEbe)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="resultatNet"
                stroke="var(--color-resultatNet)"
                fill="url(#fillResultatNet)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ChartContainer>
          <ChartLegend className="mt-2">
            <ChartLegendContent />
          </ChartLegend>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Dette Tab ───────────────────────────────────────────────────────────────

function DetteTab({ indicators }: { indicators: Indicator[] }) {
  const endettement = findIndicator(indicators, 'FIN-006');
  const capacite = findIndicator(indicators, 'FIN-007');

  const monthlyData = endettement?.values.map((v, i) => ({
    name: MONTHS_FR[i] || `M${i + 1}`,
    endettement: v.value,
    objectif: 50,
  })) || [];

  const lastEndettement = endettement?.values.length ? endettement.values[endettement.values.length - 1].value : 0;
  const lastCapacite = capacite?.values.length ? capacite.values[capacite.values.length - 1].value : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          title="Taux d'Endettement"
          value={lastEndettement}
          unit="%"
          target={endettement?.targetValue}
          trend={endettement ? getTrend(endettement.values) : undefined}
          trendValue={endettement ? getTrendDelta(endettement.values) : undefined}
          icon={<Building2 className="size-5" />}
          description="Ratio dettes / capitaux propres"
        />
        <KpiCard
          title="Capacité de Remboursement"
          value={lastCapacite}
          unit="ratio"
          target={capacite?.targetValue}
          trend={capacite ? getTrend(capacite.values) : undefined}
          trendValue={capacite ? getTrendDelta(capacite.values) : undefined}
          icon={<PiggyBank className="size-5" />}
          description="EBE / Charges d'intérêts"
        />
      </div>

      {/* Line Chart: Endettement Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {"Évolution du Taux d'Endettement (%)"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer config={detteChartConfig} className="h-[300px] w-full">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 80]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="objectif"
                stroke="var(--color-objectif)"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="endettement"
                stroke="var(--color-endettement)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: 'var(--color-endettement)' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartContainer>
          <ChartLegend className="mt-2">
            <ChartLegendContent />
          </ChartLegend>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Ressources Specifiques Tab ──────────────────────────────────────────────

function RessourcesSpecifiquesTab({ indicators }: { indicators: Indicator[] }) {
  const backbone = findIndicator(indicators, 'FIN-011');
  const subventions = findIndicator(indicators, 'FIN-012');
  const fondsPropres = findIndicator(indicators, 'FIN-013');

  const len = Math.max(
    backbone?.values.length || 0,
    subventions?.values.length || 0,
    fondsPropres?.values.length || 0,
  );

  const monthlyData = Array.from({ length: len }, (_, i) => ({
    name: MONTHS_FR[i] || `M${i + 1}`,
    backbone: backbone?.values[i] ? +(backbone.values[i].value / 1_000_000_000).toFixed(2) : 0,
    subventions: subventions?.values[i] ? +(subventions.values[i].value / 1_000_000_000).toFixed(2) : 0,
    fondsPropres: fondsPropres?.values[i] ? +(fondsPropres.values[i].value / 1_000_000_000).toFixed(2) : 0,
  }));

  const resourceIndicators = indicators.filter(
    (i) => i.subDomain === 'ressources_specifiques',
  );

  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Évolution des Ressources Spécifiques (Mrd FCFA)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ChartContainer config={resourcesChartConfig} className="h-[300px] w-full">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="backbone"
                fill="var(--color-backbone)"
                radius={[2, 2, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="subventions"
                fill="var(--color-subventions)"
                radius={[0, 0, 0, 0]}
                stackId="a"
              />
              <Bar
                dataKey="fondsPropres"
                fill="var(--color-fondsPropres)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
          <ChartLegend className="mt-2">
            <ChartLegendContent />
          </ChartLegend>
        </CardContent>
      </Card>

      {/* Summary Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Synthèse des Ressources Spécifiques
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Code</TableHead>
                  <TableHead className="text-xs">Indicateur</TableHead>
                  <TableHead className="text-xs">Département</TableHead>
                  <TableHead className="text-xs text-right">Cible</TableHead>
                  <TableHead className="text-xs text-right">Dernière Valeur</TableHead>
                  <TableHead className="text-xs text-right">Atteinte</TableHead>
                  <TableHead className="text-xs">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resourceIndicators.map((ind) => {
                  const lastVal = ind.values.length > 0 ? ind.values[ind.values.length - 1].value : 0;
                  const achievement = ind.targetValue > 0 ? Math.min((lastVal / ind.targetValue) * 100, 150) : 0;
                  const status =
                    achievement >= 80 ? 'atteint' : achievement >= 50 ? 'partiel' : 'non_atteint';
                  const statusLabel =
                    status === 'atteint' ? 'Atteint' : status === 'partiel' ? 'Partiel' : 'Non atteint';

                  return (
                    <TableRow key={ind.id}>
                      <TableCell className="text-xs font-mono">{ind.code}</TableCell>
                      <TableCell className="text-xs font-medium">{ind.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{ind.department?.name}</TableCell>
                      <TableCell className="text-xs text-right">
                        {ind.unit === '%' ? `${ind.targetValue}%` : formatCompact(ind.targetValue)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono font-medium">
                        {ind.unit === '%' ? `${lastVal}%` : formatCompact(lastVal)}
                      </TableCell>
                      <TableCell className="text-xs text-right">
                        <span
                          className={`font-medium ${
                            achievement >= 80 ? 'text-success' : achievement >= 50 ? 'text-warning' : 'text-danger'
                          }`}
                        >
                          {Math.round(achievement)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <StatusBadge status={status} label={statusLabel} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Loading Skeleton ────────────────────────────────────────────────────────

function FinanceModuleSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-[400px] rounded-lg" />
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function FinanceModule() {
  const { filters } = useAppStore();
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchFinance() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/indicators/domain?domain=finance&year=${filters.year}${filters.quarter ? `&quarter=${filters.quarter}` : ''}`,
        );
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) setData(json);
        } else {
          if (!cancelled) setData(generateMockFinanceData());
        }
      } catch {
        if (!cancelled) setData(generateMockFinanceData());
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFinance();
    return () => {
      cancelled = true;
    };
  }, [filters.year, filters.quarter]);

  if (loading) return <FinanceModuleSkeleton />;

  if (!data) return null;

  const indicators = data.indicators;

  // Top KPI Indicators
  const execBudg = findIndicator(indicators, 'FIN-001');
  const ca = findIndicator(indicators, 'FIN-002');
  const ebe = findIndicator(indicators, 'FIN-003');
  const marge = findIndicator(indicators, 'FIN-004');
  const endettement = findIndicator(indicators, 'FIN-006');

  const topKpis = [
    {
      ind: execBudg,
      key: 'FIN-001',
      label: "Taux d'exécution budgétaire",
      icon: <Wallet className="size-5" />,
    },
    {
      ind: ca,
      key: 'FIN-002',
      label: "Chiffre d'Affaires",
      icon: <DollarSign className="size-5" />,
    },
    {
      ind: ebe,
      key: 'FIN-003',
      label: 'EBE',
      icon: <TrendingUp className="size-5" />,
    },
    {
      ind: marge,
      key: 'FIN-004',
      label: 'Marge brute',
      icon: <Percent className="size-5" />,
    },
    {
      ind: endettement,
      key: 'FIN-006',
      label: "Taux d'endettement",
      icon: <Building2 className="size-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Top KPI Row ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {topKpis.map(({ ind, label, icon }) => {
          if (!ind) return null;
          const lastVal = ind.values.length > 0 ? ind.values[ind.values.length - 1].value : 0;
          const displayVal =
            ind.unit === 'FCFA' ? formatCompact(lastVal) : String(lastVal);

          return (
            <KpiCard
              key={ind.code}
              title={label}
              value={displayVal}
              unit={ind.unit === 'FCFA' ? 'FCFA' : ind.unit}
              target={ind.targetValue}
              trend={getTrend(ind.values)}
              trendValue={getTrendDelta(ind.values)}
              icon={icon}
            />
          );
        })}
      </div>

      {/* ── Sub-domain Tabs ────────────────────────────────────────────────── */}
      <Tabs defaultValue="execution_budgetaire" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="execution_budgetaire" className="text-xs sm:text-sm">
            Exécution Budgétaire
          </TabsTrigger>
          <TabsTrigger value="rentabilite" className="text-xs sm:text-sm">
            Rentabilité
          </TabsTrigger>
          <TabsTrigger value="dette" className="text-xs sm:text-sm">
            Dette
          </TabsTrigger>
          <TabsTrigger value="ressources_specifiques" className="text-xs sm:text-sm">
            Ressources Spécifiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="execution_budgetaire">
          <ExecutionBudgetaireTab indicators={indicators} />
        </TabsContent>

        <TabsContent value="rentabilite">
          <RentabiliteTab indicators={indicators} />
        </TabsContent>

        <TabsContent value="dette">
          <DetteTab indicators={indicators} />
        </TabsContent>

        <TabsContent value="ressources_specifiques">
          <RessourcesSpecifiquesTab indicators={indicators} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
