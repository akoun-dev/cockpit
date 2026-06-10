'use client';

import { useAppStore } from '@/lib/store';
import { KpiModuleView } from './KpiModuleView';

export function FinanceModule() {
  const { filters } = useAppStore();
  return <KpiModuleView domain="finance" year={filters.year} />;
}