'use client';

import { useAppStore } from '@/lib/store';
import { KpiModuleView } from './KpiModuleView';

export function RisqueModule() {
  const { filters } = useAppStore();
  return <KpiModuleView domain="risque" year={filters.year} />;
}