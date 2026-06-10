'use client';

import { useAppStore } from '@/lib/store';
import { KpiModuleView } from './KpiModuleView';

export function RHModule() {
  const { filters } = useAppStore();
  return <KpiModuleView domain="rh" year={filters.year} />;
}