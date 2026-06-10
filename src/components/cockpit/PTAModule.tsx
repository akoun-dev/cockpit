'use client';

import { useAppStore } from '@/lib/store';
import { KpiModuleView } from './KpiModuleView';

export function PTAModule() {
  const { filters } = useAppStore();
  return <KpiModuleView domain="pta" year={filters.year} />;
}