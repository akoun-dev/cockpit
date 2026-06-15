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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border overflow-hidden">
      {/* Header with ANSUT branding */}
      <SidebarHeader className="px-0 py-0">
        <div className="relative overflow-hidden">
          {/* Gradient brand accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-fun-blue via-tango to-fun-blue" />
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fun-blue to-fun-blue-dark shadow-md shadow-fun-blue/20">
              <img src="/favicon.svg" alt="ANSUT" className="size-6 brightness-0 invert" />
            </div>
            <div
              className={`min-w-0 flex-1 transition-all duration-200 ${
                state === 'collapsed' ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
              }`}
            >
              <p className="text-sm font-bold tracking-tight text-foreground truncate">
                ANSUT
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                Cockpit
              </p>
            </div>
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
                    className={cn(
                      'h-10 text-[15px]',
                      activeView === item.key &&
                        'sidebar-active-indicator bg-tango/10 text-tango hover:bg-tango/15 hover:text-tango font-medium'
                    )}
                  >
                    <item.icon className="size-[22px]" />
                    <span className="text-[15px]">{item.label}</span>
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
                      className={cn(
                        'h-10 text-[15px]',
                        activeView === 'admin' &&
                          'sidebar-active-indicator bg-fun-blue/10 text-fun-blue hover:bg-fun-blue/15 hover:text-fun-blue font-medium'
                      )}
                    >
                      <Shield className="size-[22px]" />
                      <span className="text-[15px]">Administration</span>
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
                {roleLabel}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="size-3.5" />
                  <span className="sr-only">Déconnexion</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Déconnexion
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}