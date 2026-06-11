'use client';

import { useAppStore } from '@/lib/store';
import { ModuleHeroSection } from './ModuleHeroSection';
import { KpiModuleView } from './KpiModuleView';

export function RHModule() {
  const { filters } = useAppStore();
  const key = `${filters.year}-${filters.quarter}-${filters.month}-${filters.period}`;
  return (
    <div key={key} className="space-y-6">
      <ModuleHeroSection domain="rh" />
      <KpiModuleView domain="rh" />
    </div>
  );
}