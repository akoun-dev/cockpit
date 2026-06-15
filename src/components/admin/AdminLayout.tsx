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
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, type AdminViewKey } from '@/lib/store';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';

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
    title: '',
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
  children: React.ReactNode;
}

export function AdminLayout({ activeView, children }: AdminLayoutProps) {
  const { adminSubView, setAdminSubView } = useAppStore();

  // Use store's adminSubView if provided, otherwise use prop
  const currentView = activeView || adminSubView;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Desktop horizontal nav */}
      <div className="sticky top-10 sm:top-12 z-20 shrink-0 bg-background hidden sm:block">
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-muted/30 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-muted/30 to-transparent" />
        <div className="flex snap-x snap-mandatory gap-1 overflow-x-auto border-b border-border px-2 py-2 scroll-smooth scrollbar-none">
          {ALL_NAV_ITEMS.map(({ key, label, icon: Icon }) => {
            const isActive = currentView === key;
            return (
              <button
                key={key}
                onClick={() => setAdminSubView(key)}
                className={cn(
                  'flex snap-start shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-fun-blue text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="whitespace-nowrap">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile hamburger menu */}
      <div className="sticky top-10 sm:top-12 z-20 shrink-0 bg-background sm:hidden border-b border-border">
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-foreground">
              <Menu className="size-5 shrink-0" />
              <span>{ALL_NAV_ITEMS.find((i) => i.key === currentView)?.label ?? ''}</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="flex flex-col gap-1 py-4">
              {NAV_GROUPS.map((group) => (
                <div key={group.title || 'main'}>
                  {group.title && (
                    <div className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.title}
                    </div>
                  )}
                  {group.items.map(({ key, label, icon: Icon }) => {
                    const isActive = currentView === key;
                    return (
                      <SheetClose key={key} asChild>
                        <button
                          onClick={() => setAdminSubView(key)}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-fun-blue/10 text-fun-blue border-r-2 border-fun-blue'
                              : 'text-foreground hover:bg-muted'
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span>{label}</span>
                        </button>
                      </SheetClose>
                    );
                  })}
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Single content area */}
      <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="p-3 sm:p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export type { AdminViewKey };
