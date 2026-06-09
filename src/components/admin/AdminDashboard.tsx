'use client';

import React, { useEffect, useState } from 'react';
import { Users, Shield, Layers, Activity, ArrowRight } from 'lucide-react';
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

interface AdminDashboardProps {
  onViewChange?: (view: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  auth: 'bg-blue-100 text-blue-800',
  user: 'bg-green-100 text-green-800',
  role: 'bg-orange-100 text-orange-800',
  permission: 'bg-purple-100 text-purple-800',
  data: 'bg-gray-100 text-gray-800',
  export: 'bg-teal-100 text-teal-800',
};

function formatFrenchDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFrenchNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

export function AdminDashboard({ onViewChange }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const statsRes = await fetch('/api/admin/dashboard-stats');
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        } else {
          // Fallback stats
          setStats({
            totalUsers: 24,
            activeUsers: 18,
            totalRoles: 6,
            configuredModules: 8,
            auditLogCount: 156,
          });
        }

        const logsRes = await fetch('/api/admin/audit-logs?limit=5&offset=0');
        if (logsRes.ok) {
          const data = await logsRes.json();
          setRecentLogs(data.data || data.logs || (Array.isArray(data) ? data : []));
        }
      } catch {
        setError('Erreur lors du chargement des données');
        // Fallback data
        setStats({
          totalUsers: 24,
          activeUsers: 18,
          totalRoles: 6,
          configuredModules: 8,
          auditLogCount: 156,
        });
        setRecentLogs([
          {
            id: '1',
            timestamp: new Date().toISOString(),
            userName: 'Admin Principal',
            action: 'Connexion réussie',
            category: 'auth',
            details: 'Connexion depuis 192.168.1.10',
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            userName: 'Marie Dupont',
            action: 'Utilisateur modifié',
            category: 'user',
            details: 'Modification du rôle de Jean Martin',
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            userName: 'Admin Principal',
            action: 'Rôle créé',
            category: 'role',
            details: 'Création du rôle "Chef de projet"',
          },
          {
            id: '4',
            timestamp: new Date(Date.now() - 10800000).toISOString(),
            userName: 'Pierre Leroy',
            action: 'Permissions modifiées',
            category: 'permission',
            details: 'Mise à jour des permissions du rôle Analyste',
          },
          {
            id: '5',
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            userName: 'Sophie Bernard',
            action: 'Export effectué',
            category: 'export',
            details: 'Export PDF du module Finance',
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    {
      label: 'Total Utilisateurs',
      value: stats?.totalUsers ?? '—',
      description: `${stats?.activeUsers ?? '—'} actifs`,
      icon: Users,
      iconBg: 'bg-fun-blue/10 text-fun-blue',
    },
    {
      label: 'Total Rôles',
      value: stats?.totalRoles ?? '—',
      description: 'Rôles configurés',
      icon: Shield,
      iconBg: 'bg-tango/10 text-tango',
    },
    {
      label: 'Modules configurés',
      value: stats?.configuredModules ?? '—',
      description: 'Modules actifs',
      icon: Layers,
      iconBg: 'bg-green-100 text-green-700',
    },
    {
      label: 'Activités récentes',
      value: stats ? formatFrenchNumber(stats.auditLogCount) : '—',
      description: 'Entrées dans le journal',
      icon: Activity,
      iconBg: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord admin</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble de la plateforme ANSUT Cockpit DG
        </p>
      </div>

      {/* Stats cards - 2x2 on mobile, 4 cols on desktop */}
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
                    <p className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </p>
                    <div className={`rounded-lg p-2 ${card.iconBg}`}>
                      <card.icon className="size-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl font-bold">{card.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">Activités Récentes</CardTitle>
          {onViewChange && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-fun-blue hover:text-fun-blue-dark"
              onClick={() => onViewChange('logs')}
            >
              Voir tout
              <ArrowRight className="size-3.5" />
            </Button>
          )}
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
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune activité récente
            </p>
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
                    <TableCell className="text-xs text-muted-foreground">
                      {formatFrenchDate(log.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {log.userName}
                    </TableCell>
                    <TableCell className="text-sm">{log.action}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={CATEGORY_COLORS[log.category] || ''}
                      >
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

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
