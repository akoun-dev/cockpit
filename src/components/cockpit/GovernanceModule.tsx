'use client';

import { useAppStore } from '@/lib/store';
import { ModuleHeroSection } from './ModuleHeroSection';
import { KpiModuleView } from './KpiModuleView';

export function GovernanceModule() {
  const { filters } = useAppStore();
  const key = `${filters.year}-${filters.quarter}-${filters.month}-${filters.day}`;
  return (
    <div key={key} className="space-y-6">
      <ModuleHeroSection domain="governance" />
      <KpiModuleView domain="governance" />
    </div>
  );
}