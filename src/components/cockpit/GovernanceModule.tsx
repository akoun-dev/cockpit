'use client';

import { useAppStore } from '@/lib/store';
import { ModuleHeroSection } from './ModuleHeroSection';
import { KpiModuleView } from './KpiModuleView';
import { ModuleDocuments } from './ModuleDocuments';

export function GovernanceModule() {
  const { filters } = useAppStore();
  const key = `${filters.year}-${filters.quarter}-${filters.month}-${filters.periodStart}-${filters.periodEnd}`;
  return (
    <div key={key} className="space-y-6">
      <ModuleHeroSection domain="governance" />
      <KpiModuleView domain="governance" />
      <ModuleDocuments domain="governance" />
    </div>
  );
}