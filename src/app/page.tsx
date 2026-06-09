'use client';

import { SidebarProvider, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar, Header, DashboardAccueil, FinanceModule, GovernanceModule, OperationalModule, RHModule, RisqueModule, PTAModule } from '@/components/cockpit';
import { useAppStore } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';

const MODULE_COMPONENTS = {
  accueil: DashboardAccueil,
  governance: GovernanceModule,
  finance: FinanceModule,
  operational: OperationalModule,
  rh: RHModule,
  risque: RisqueModule,
  pta: PTAModule,
};

export default function CockpitPage() {
  const activeModule = useAppStore((s) => s.activeModule);
  const ActiveComponent = MODULE_COMPONENTS[activeModule];

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <ActiveComponent />
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="mt-auto border-t border-border bg-card px-6 py-3">
          <div className="flex flex-col items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-row">
            <span>© {new Date().getFullYear()} ANSUT — Agence Nationale des Services Universels des Télécommunications</span>
            <span>Cockpit DG v1.0 — Données mises à jour en temps réel</span>
          </div>
        </footer>
      </SidebarInset>
      <SidebarRail />
    </SidebarProvider>
  );
}
