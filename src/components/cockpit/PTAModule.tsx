'use client';

import { useAppStore } from '@/lib/store';
import { ModuleHeroSection } from './ModuleHeroSection';
import { KpiModuleView } from './KpiModuleView';

export function PTAModule() {
  const { filters } = useAppStore();
  const key = `${filters.year}-${filters.quarter}-${filters.month}-${filters.periodStart}-${filters.periodEnd}`;
  return (
    <div key={key} className="space-y-6">
      <ModuleHeroSection domain="pta" />
      <KpiModuleView domain="pta" />
    </div>
  );
}