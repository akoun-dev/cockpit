'use client';

import { useAppStore } from '@/lib/store';
import { KpiModuleView } from './KpiModuleView';

export function GovernanceModule() {
  const { filters } = useAppStore();
  return <KpiModuleView domain="governance" year={filters.year} />;
}