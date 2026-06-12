'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Landmark,
  Wallet,
  Settings,
  Users,
  ShieldAlert,
  Target,
  RefreshCw,
  Shield,
  LogOut,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAppStore, type ModuleKey, type AppViewKey } from '@/lib/store';
import { useSidebar } from '@/components/ui/sidebar';
import { getAccessibleModules, hasAdminAccess } from '@/lib/permissions';

const ALL_NAV_ITEMS: { key: ModuleKey; label: string; icon: React.ElementType }[] = [
  { key: 'accueil', label: 'Accueil', icon: LayoutDashboard },
  { key: 'governance', label: 'Gouvernance', icon: Landmark },
  { key: 'finance', label: 'Finance', icon: Wallet },
  { key: 'operational', label: 'Opérationnel', icon: Settings },
  { key: 'rh', label: 'Ressources Humaines', icon: Users },
  { key: 'risque', label: 'Cadre de Risque', icon: ShieldAlert },
  { key: 'pta', label: 'PTA', icon: Target },
];

export function AppSidebar() {
  const { data: session } = useSession();
  const { activeView, setActiveView, lastUpdated } = useAppStore();
  const { state } = useSidebar();

  const sessionUser = session?.user as unknown as {
    permissions: Record<string, string>;
    role: { level: number; label?: string } | null;
    department: { name?: string } | null;
  } | undefined;
  const permissions = sessionUser?.permissions;
  const roleLevel = sessionUser?.role?.level;

  // Filter nav items based on user permissions
  const accessibleModules = getAccessibleModules(permissions);
  const navItems = ALL_NAV_ITEMS.filter((item) => accessibleModules.includes(item.key));
  const showAdmin = hasAdminAccess(permissions, roleLevel);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const displayLastUpdated = mounted
    ? new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleNavClick = (key: ModuleKey) => {
    setActiveView(key);
  };

  const handleAdminClick = () => {
    setActiveView('admin');
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Get user initials for avatar
  const userInitials = session?.user?.name
    ? session.user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  const roleLabel = sessionUser?.role?.label || 'Utilisateur';
  const departmentName = sessionUser?.department?.name || '';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header with ANSUT branding */}
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white dark:bg-gray-900 shadow-sm">
            <img src="/logo-ansut.png" alt="ANSUT" className="size-9 object-cover" />
          </div>
          <div
            className={`flex flex-col overflow-hidden transition-all duration-200 ${
              state === 'collapsed' ? 'w-0 opacity-0' : 'w-auto opacity-100'
            }`}
          >
            <span className="text-lg font-bold text-fun-blue whitespace-nowrap">
              ANSUT
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Cockpit DG
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation menu */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    isActive={activeView === item.key}
                    tooltip={item.label}
                    onClick={() => handleNavClick(item.key)}
                    className={
                      activeView === item.key
                        ? 'sidebar-active-indicator bg-tango/10 text-tango hover:bg-tango/15 hover:text-tango font-medium'
                        : ''
                    }
                  >
                    <item.icon className="size-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section — only for admin users */}
        {showAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeView === 'admin'}
                      tooltip="Administration"
                      onClick={() => handleAdminClick()}
                      className={
                        activeView === 'admin'
                          ? 'sidebar-active-indicator bg-fun-blue/10 text-fun-blue hover:bg-fun-blue/15 hover:text-fun-blue font-medium'
                          : ''
                      }
                    >
                      <Shield className="size-5" />
                      <span>Administration</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarSeparator />

      {/* Footer with user badge and refresh */}
      <SidebarFooter className="px-3 py-3">
        <div className="flex flex-col gap-3">
          {/* Last updated with refresh */}
          <div
            className={`flex items-center gap-2 overflow-hidden transition-all duration-200 ${
              state === 'collapsed' ? 'justify-center' : ''
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 hover:bg-fun-blue/10 hover:text-fun-blue"
              onClick={handleRefresh}
            >
              <RefreshCw className="size-4" />
              <span className="sr-only">Actualiser</span>
            </Button>
            <div
              className={`flex flex-col overflow-hidden transition-all duration-200 ${
                state === 'collapsed' ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}
            >
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                Dernière màj
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap truncate">
                {displayLastUpdated}
              </span>
            </div>
          </div>

          <SidebarSeparator />

          {/* User badge with logout */}
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-2">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-fun-blue text-white text-xs font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div
              className={`flex flex-col overflow-hidden transition-all duration-200 flex-1 min-w-0 ${
                state === 'collapsed' ? 'w-0 opacity-0' : 'w-auto opacity-100'
              }`}
            >
              <span className="text-xs font-semibold text-foreground whitespace-nowrap truncate">
                {session?.user?.name || 'Utilisateur'}
              </span>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap truncate">
                {roleLabel}{departmentName ? ` — ${departmentName}` : ''}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
              tooltip="Déconnexion"
            >
              <LogOut className="size-3.5" />
              <span className="sr-only">Déconnexion</span>
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}