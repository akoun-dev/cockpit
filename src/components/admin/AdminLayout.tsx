'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Shield,
  BarChart3,
  Database,
  RefreshCw,
  FolderOpen,
  Bell,
  ScrollText,
  Mail,
  Settings,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, type AdminViewKey } from '@/lib/store';

interface NavItem {
  key: AdminViewKey;
  label: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { key: 'admin_dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { key: 'admin_users', label: 'Utilisateurs', icon: Users },
      { key: 'admin_roles', label: 'Rôles & Permissions', icon: Shield },
      { key: 'admin_indicators', label: 'Indicateurs KPI', icon: BarChart3 },
      { key: 'admin_datasources', label: 'Sources de données', icon: Database },
    ],
  },
  {
    title: 'Système',
    items: [
      { key: 'admin_sync', label: 'Synchronisations', icon: RefreshCw },
      { key: 'admin_documents', label: 'Documents', icon: FolderOpen },
      { key: 'admin_alerts', label: 'Alertes', icon: Bell },
      { key: 'admin_logs', label: 'Journal d\'audit', icon: ScrollText },
      { key: 'admin_notifications', label: 'Notifications', icon: Mail },
      { key: 'admin_settings', label: 'Paramètres', icon: Settings },
      { key: 'admin_security', label: 'Sécurité', icon: Lock },
    ],
  },
];

// Flatten for mobile horizontal scroll
const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

interface AdminLayoutProps {
  activeView: AdminViewKey;
  onViewChange: (view: AdminViewKey) => void;
  children: React.ReactNode;
}

export function AdminLayout({ activeView, onViewChange, children }: AdminLayoutProps) {
  const { adminSubView, setAdminSubView } = useAppStore();

  // Use store's adminSubView if provided, otherwise use prop
  const currentView = activeView || adminSubView;

  return (
    <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">
      {/* Left navigation panel — desktop only */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-muted/30 lg:flex">
        {/* Admin header */}
        <div className="border-b border-border px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/logo-ansut.png" alt="ANSUT" className="size-7 rounded object-cover" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Administration
            </h2>
          </div>
        </div>

        {/* Navigation groups */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2" aria-label="Navigation admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              {/* Group label */}
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {group.title}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ key, label, icon: Icon }) => {
                  const isActive = currentView === key;
                  return (
                    <li key={key}>
                      <button
                        onClick={() => setAdminSubView(key)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left',
                          isActive
                            ? 'bg-fun-blue text-white shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon className="size-4.5 shrink-0" />
                        <span className="truncate">{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom branding */}
        <div className="mt-auto border-t border-border p-3">
          <p className="text-xs text-muted-foreground">
            ANSUT Cockpit DG
          </p>
          <p className="text-xs text-muted-foreground/60">
            v1.0 — Panneau admin
          </p>
        </div>
      </aside>

      {/* Mobile tabs for admin sub-navigation */}
      <div className="flex min-w-0 w-full flex-col lg:hidden">
        <div className="relative">
          {/* Left fade gradient */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-muted/30 to-transparent" />
          {/* Right fade gradient */}
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-muted/30 to-transparent" />
          <div className="flex snap-x snap-mandatory gap-1 overflow-x-auto border-b border-border bg-muted/30 px-2 py-2 scroll-smooth scrollbar-none">
            {ALL_NAV_ITEMS.map(({ key, label, icon: Icon }) => {
              const isActive = currentView === key;
              return (
                <button
                  key={key}
                  onClick={() => setAdminSubView(key)}
                  className={cn(
                    'flex snap-start shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-fun-blue text-white shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="whitespace-nowrap hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-3 sm:p-4">
            {children}
          </div>
        </main>
      </div>

      {/* Main content area (desktop) */}
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden hidden lg:block">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export type { AdminViewKey };
