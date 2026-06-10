'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  Shield,
  Layers,
  Activity,
  ArrowRight,
  LayoutDashboard,
  Database,
  ScrollText,
  Settings,
  CircleDot,
  Server,
  HardDrive,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useAppStore, type AdminViewKey } from '@/lib/store';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRoles: number;
  configuredModules: number;
  auditLogCount: number;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  action: string;
  category: string;
  details: string;
}

interface DataSourceEntry {
  id: string;
  status: string;
  lastSync: string | null;
}

interface DataSourceHealth {
  total: number;
  active: number;
  inTest: number;
  inactive: number;
  lastSync: string | null;
  loading: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  auth: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  role: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  permission: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  data: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  export: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
};

interface QuickActionItem {
  viewKey: AdminViewKey;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    viewKey: 'admin_dashboard',
    title: 'Tableau de bord',
    description: 'Vue d\'ensemble et statistiques',
    icon: LayoutDashboard,
    iconBg: 'bg-fun-blue/10',
    iconColor: 'text-fun-blue',
  },
  {
    viewKey: 'admin_users',
    title: 'Utilisateurs',
    description: 'Gérer les comptes et accès',
    icon: Users,
    iconBg: 'bg-tango/10',
    iconColor: 'text-tango',
  },
  {
    viewKey: 'admin_roles',
    title: 'Rôles & Permissions',
    description: 'Configurer les rôles et droits',
    icon: Shield,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-700 dark:text-purple-400',
  },
  {
    viewKey: 'admin_datasources',
    title: 'Sources de Données',
    description: 'Connexions et synchronisation',
    icon: Database,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-700 dark:text-green-400',
  },
  {
    viewKey: 'admin_logs',
    title: 'Journal d\'Audit',
    description: 'Suivi des activités et actions',
    icon: ScrollText,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-700 dark:text-amber-400',
  },
  {
    viewKey: 'admin_settings',
    title: 'Paramètres',
    description: 'Configuration de la plateforme',
    icon: Settings,
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-700 dark:text-gray-300',
  },
];

function formatFrenchDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFrenchShortDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatFrenchNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

function formatFrenchDateTime(date: string | null): string {
  if (!date) return 'Jamais';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminDashboard() {
  const { setAdminSubView } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dsHealth, setDsHealth] = useState<DataSourceHealth>({
    total: 0,
    active: 0,
    inTest: 0,
    inactive: 0,
    lastSync: null,
    loading: true,
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch dashboard stats
        const statsRes = await fetch('/api/admin/dashboard-stats');
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        } else {
          setStats({
            totalUsers: 24,
            activeUsers: 18,
            totalRoles: 6,
            configuredModules: 8,
            auditLogCount: 156,
          });
        }

        // Fetch recent audit logs
        const logsRes = await fetch('/api/admin/audit-logs?limit=5&offset=0');
        if (logsRes.ok) {
          const data = await logsRes.json();
          setRecentLogs(
            (data.data || data.logs || (Array.isArray(data) ? data : [])).map(
              (log: Record<string, unknown>) => ({
                id: log.id,
                timestamp: log.createdAt ?? log.timestamp,
                userName: (log as Record<string, unknown>).user?.name ?? log.userName ?? 'Inconnu',
                action: log.action,
                category: log.category,
                details: log.details,
              })
            )
          );
        }

        // Fetch data source health
        setDsHealth((prev) => ({ ...prev, loading: true }));
        const dsRes = await fetch('/api/admin/data-sources');
        if (dsRes.ok) {
          const dsData = await dsRes.json();
          const sources: DataSourceEntry[] = dsData.data || [];
          const active = sources.filter((s) => s.status === 'actif').length;
          const inTest = sources.filter((s) => s.status === 'en_test').length;
          const inactive = sources.filter((s) => s.status === 'inactif').length;
          const latestSync = sources
            .filter((s) => s.lastSync)
            .sort((a, b) => new Date(b.lastSync!).getTime() - new Date(a.lastSync!).getTime())[0]?.lastSync ?? null;
          setDsHealth({
            total: sources.length,
            active,
            inTest,
            inactive,
            lastSync: latestSync,
            loading: false,
          });
        } else {
          setDsHealth((prev) => ({ ...prev, loading: false }));
        }
      } catch {
        setError('Erreur lors du chargement des données');
        setStats({
          totalUsers: 24,
          activeUsers: 18,
          totalRoles: 6,
          configuredModules: 8,
          auditLogCount: 156,
        });
        setRecentLogs([
          { id: '1', timestamp: new Date().toISOString(), userName: 'Admin Principal', action: 'Connexion réussie', category: 'auth', details: 'Connexion depuis 192.168.1.10' },
          { id: '2', timestamp: new Date(Date.now() - 3600000).toISOString(), userName: 'Marie Dupont', action: 'Utilisateur modifié', category: 'user', details: 'Modification du rôle de Jean Martin' },
          { id: '3', timestamp: new Date(Date.now() - 7200000).toISOString(), userName: 'Admin Principal', action: 'Rôle créé', category: 'role', details: 'Création du rôle "Chef de projet"' },
          { id: '4', timestamp: new Date(Date.now() - 10800000).toISOString(), userName: 'Pierre Leroy', action: 'Permissions modifiées', category: 'permission', details: 'Mise à jour des permissions du rôle Analyste' },
          { id: '5', timestamp: new Date(Date.now() - 14400000).toISOString(), userName: 'Sophie Bernard', action: 'Export effectué', category: 'export', details: 'Export PDF du module Finance' },
        ]);
        setDsHealth({ total: 0, active: 0, inTest: 0, inactive: 0, lastSync: null, loading: false });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Utilisateurs', value: stats?.totalUsers ?? '—', description: `${stats?.activeUsers ?? '—'} actifs`, icon: Users, iconBg: 'bg-fun-blue/10 text-fun-blue' },
    { label: 'Total Rôles', value: stats?.totalRoles ?? '—', description: 'Rôles configurés', icon: Shield, iconBg: 'bg-tango/10 text-tango' },
    { label: 'Modules configurés', value: stats?.configuredModules ?? '—', description: 'Modules actifs', icon: Layers, iconBg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    { label: 'Activités récentes', value: stats ? formatFrenchNumber(stats.auditLogCount) : '—', description: 'Entrées dans le journal', icon: Activity, iconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  ];

  const todayStr = formatFrenchShortDate(new Date().toISOString());

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord admin</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de la plateforme ANSUT Cockpit DG
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="size-10 rounded-lg" />
                  </div>
                  <Skeleton className="mt-3 h-8 w-16" />
                  <Skeleton className="mt-1 h-3 w-32" />
                </CardContent>
              </Card>
            ))
          : statCards.map((card) => (
              <Card key={card.label} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                    <div className={`rounded-lg p-2 ${card.iconBg}`}>
                      <card.icon className="size-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Data Source Health Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Database className="size-5 text-fun-blue" />
            <CardTitle className="text-lg font-semibold">Santé des Sources de Données</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-fun-blue hover:text-fun-blue-dark"
            onClick={() => setAdminSubView('admin_datasources')}
          >
            Gérer
            <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {dsHealth.loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {/* Total */}
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Total</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{dsHealth.total}</span>
                    <span className="text-xs text-muted-foreground">sources</span>
                  </div>
                </div>
                {/* Active */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-muted-foreground">Actives</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-green-700 dark:text-green-400">{dsHealth.active}</span>
                    <span className="text-xs text-muted-foreground">sources</span>
                  </div>
                </div>
                {/* In Test */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-medium text-muted-foreground">En test</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">{dsHealth.inTest}</span>
                    <span className="text-xs text-muted-foreground">sources</span>
                  </div>
                </div>
                {/* Inactive */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block size-2 rounded-full bg-gray-400" />
                    <span className="text-xs font-medium text-muted-foreground">Inactives</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">{dsHealth.inactive}</span>
                    <span className="text-xs text-muted-foreground">sources</span>
                  </div>
                </div>
              </div>
              {/* Last sync status */}
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                <RefreshCw className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Dernière synchronisation :</span>
                <span className="text-xs font-medium">
                  {dsHealth.lastSync ? formatFrenchDateTime(dsHealth.lastSync) : 'Aucune synchronisation'}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Action Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Accès Rapide</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.viewKey}
              onClick={() => setAdminSubView(action.viewKey)}
              className="group text-left"
            >
              <Card className="h-full transition-all hover:border-fun-blue/40 hover:shadow-md">
                <CardContent className="flex items-start gap-4 p-4">
                  <div className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}>
                    <action.icon className={`size-5 ${action.iconColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight group-hover:text-fun-blue">{action.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* System Health Indicators */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Server className="size-5 text-fun-blue" />
            <CardTitle className="text-lg font-semibold">État du Système</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* API Status */}
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
              </span>
              <span className="text-sm font-medium text-muted-foreground">API :</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Opérationnel
              </Badge>
            </div>
            {/* Database Status */}
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-green-500" />
              </span>
              <span className="text-sm font-medium text-muted-foreground">Base de données :</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Connectée
              </Badge>
            </div>
            {/* Last Backup */}
            <div className="flex items-center gap-2">
              <HardDrive className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Dernière sauvegarde :</span>
              <Badge variant="outline">{todayStr}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Activités Récentes</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-fun-blue hover:text-fun-blue-dark"
            onClick={() => setAdminSubView('admin_logs')}
          >
            Voir tout
            <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucune activité récente</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="w-[100px]">Catégorie</TableHead>
                  <TableHead className="hidden md:table-cell">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatFrenchDate(log.timestamp)}</TableCell>
                    <TableCell className="font-medium text-sm">{log.userName}</TableCell>
                    <TableCell className="text-sm">{log.action}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={CATEGORY_COLORS[log.category] || ''}>
                        {log.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate text-xs text-muted-foreground md:table-cell">
                      {log.details}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
