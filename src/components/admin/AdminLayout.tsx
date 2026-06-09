'use client';

import React from 'react';
import { LayoutDashboard, Users, Shield, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, type AdminViewKey } from '@/lib/store';

const NAV_ITEMS: { key: AdminViewKey; label: string; icon: React.ElementType }[] = [
  { key: 'admin_dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { key: 'admin_users', label: 'Utilisateurs', icon: Users },
  { key: 'admin_roles', label: 'Rôles & Permissions', icon: Shield },
  { key: 'admin_logs', label: "Journal d'audit", icon: ScrollText },
];

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
    <div className="flex min-h-0 flex-1 gap-0">
      {/* Left navigation panel */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border bg-muted/30 lg:flex">
        {/* Admin header */}
        <div className="border-b border-border px-4 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Administration
          </h2>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1 p-2" aria-label="Navigation admin">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = currentView === key;
            return (
              <button
                key={key}
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
            );
          })}
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
      <div className="flex w-full flex-col lg:hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-muted/30 p-2">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = currentView === key;
            return (
              <button
                key={key}
                onClick={() => setAdminSubView(key)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-fun-blue text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="p-4">
            {children}
          </div>
        </main>
      </div>

      {/* Main content area (desktop) */}
      <main className="min-w-0 flex-1 overflow-y-auto hidden lg:block">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export type { AdminViewKey };
