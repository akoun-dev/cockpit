'use client';

import { useAppStore } from '@/lib/store';
import { KpiModuleView } from './KpiModuleView';

export function OperationalModule() {
  const { filters } = useAppStore();
  return <KpiModuleView domain="operational" year={filters.year} />;
}