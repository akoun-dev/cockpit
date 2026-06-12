'use client';

import { useSession } from 'next-auth/react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SidebarProvider, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebar, Header, DashboardAccueil, FinanceModule, GovernanceModule, OperationalModule, RHModule, RisqueModule, PTAModule } from '@/components/cockpit';
import { AdminLayout, AdminDashboard, AdminUsers, AdminRoles, AdminDataSources, AdminLogs, AdminSettings, AdminKPI, AdminSync, AdminDocuments, AdminAlerts, AdminNotifications, AdminSecurity } from '@/components/admin';
import { useAppStore, type AdminViewKey } from '@/lib/store';
import { AnimatePresence, motion } from 'framer-motion';

const MODULE_COMPONENTS: Record<string, React.ComponentType> = {
  accueil: DashboardAccueil,
  governance: GovernanceModule,
  finance: FinanceModule,
  operational: OperationalModule,
  rh: RHModule,
  risque: RisqueModule,
  pta: PTAModule,
};

const ADMIN_SUB_VIEWS: Record<string, React.ComponentType> = {
  admin_dashboard: AdminDashboard,
  admin_users: AdminUsers,
  admin_roles: AdminRoles,
  admin_datasources: AdminDataSources,
  admin_logs: AdminLogs,
  admin_settings: AdminSettings,
  admin_indicators: AdminKPI,
  admin_sync: AdminSync,
  admin_documents: AdminDocuments,
  admin_alerts: AdminAlerts,
  admin_notifications: AdminNotifications,
  admin_security: AdminSecurity,
};

function CockpitApp() {
  const { activeView, activeModule, adminSubView } = useAppStore();

  const isAdmin = activeView === 'admin';

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {isAdmin ? (
              <motion.div
                key="admin"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex h-full min-w-0"
              >
                <AdminLayout activeView={adminSubView} onViewChange={() => {}}>
                  {(() => {
                    const SubComponent = ADMIN_SUB_VIEWS[adminSubView] || AdminDashboard;
                    return <SubComponent />;
                  })()}
                </AdminLayout>
              </motion.div>
            ) : (
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full overflow-auto p-4 lg:p-6"
              >
                {(() => {
                  const Component = MODULE_COMPONENTS[activeModule];
                  return Component ? <Component /> : null;
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        <footer className="mt-auto border-t border-border bg-card px-6 py-3">
          <div className="flex flex-col items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-row">
            <div className="flex items-center gap-2">
              <img src="/logo-ansut-square.png" alt="" className="size-4 rounded opacity-60" />
              <span>© {new Date().getFullYear()} ANSUT — Agence Nationale des Services Universels des Télécommunications</span>
            </div>
            <span>Cockpit DG v1.0 — Données mises à jour en temps réel</span>
          </div>
        </footer>
      </SidebarInset>
      <SidebarRail />
    </SidebarProvider>
  );
}

export default function CockpitPage() {
  const { data: session, status } = useSession();

  // Show login form if not authenticated
  if (status === 'unauthenticated') {
    return <LoginForm />;
  }

  // Show loading while session is being fetched (handled by AuthProvider, but just in case)
  if (status === 'loading' || !session) {
    return null;
  }

  // Show cockpit when authenticated
  return <CockpitApp />;
}