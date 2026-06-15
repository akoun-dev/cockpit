'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  Play,
  FileText,
  Activity,
  Database,
  Pause,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MODULE_LABELS } from '@/lib/constants';
import { formatDuration, formatDateTime, timeAgo } from '@/lib/formatters';

// --- Types ---

interface DataSourceEntry {
  id: string;
  name: string;
  module: string;
  type: string;
  status: string;
  lastSync?: string | null;
}

interface SyncLogEntry {
  id: string;
  dataSourceId: string;
  dataSource: {
    id: string;
    name: string;
    module: string;
    type: string;
    status: string;
  };
  status: string;
  recordsSynced: number;
  errorMessage?: string | null;
  duration: number;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
}

// --- Constants ---

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  success: { label: 'OK', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', icon: CheckCircle2 },
  warning: { label: 'Avertissement', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', icon: AlertTriangle },
  error: { label: 'Erreur', color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800', icon: XCircle },
};



// --- Component ---

export function AdminSync() {
  const { toast } = useToast();

  // Data
  const [sources, setSources] = useState<DataSourceEntry[]>([]);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Syncing state per source
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());

  // --- Fetch data ---

  const fetchData = useCallback(async () => {
    try {
      const [sourcesRes, logsRes] = await Promise.all([
        fetch('/api/admin/data-sources'),
        fetch(`/api/admin/sync-logs?status=${statusFilter === 'all' ? '' : statusFilter}`),
      ]);

      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.data || []);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.data || []);
      }

      setLastRefresh(new Date().toLocaleTimeString('fr-FR'));
      setError(null);
    } catch {
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(fetchData, 30000);
    }
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchData]);

  // --- Handlers ---

  async function handleRelaunch(sourceId: string) {
    if (syncingIds.has(sourceId)) return;

    setSyncingIds((prev) => new Set(prev).add(sourceId));
    toast({
      title: 'Synchronisation en cours...',
      description: 'Veuillez patienter pendant la synchronisation.',
    });

    try {
      const res = await fetch('/api/admin/sync-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataSourceId: sourceId }),
      });

      if (res.ok) {
        const data = await res.json();
        const newLog = data.data;

        // Simulate a 3-second syncing state
        await new Promise((resolve) => setTimeout(resolve, 3000));

        setSyncingIds((prev) => {
          const next = new Set(prev);
          next.delete(sourceId);
          return next;
        });

        // Refresh data to show the new log
        await fetchData();

        if (newLog.status === 'success') {
          toast({
            title: 'Synchronisation réussie',
            description: `${newLog.recordsSynced} enregistrements synchronisés en ${formatDuration(newLog.duration)}.`,
          });
        } else if (newLog.status === 'warning') {
          toast({
            title: 'Synchronisation avec avertissements',
            description: newLog.errorMessage || 'Certains enregistrements ont été ignorés.',
          });
        } else {
          toast({
            title: 'Synchronisation échouée',
            description: newLog.errorMessage || 'Erreur lors de la synchronisation.',
          });
        }
      } else {
        setSyncingIds((prev) => {
          const next = new Set(prev);
          next.delete(sourceId);
          return next;
        });
        toast({
          title: 'Erreur',
          description: 'Impossible de lancer la synchronisation.',
        });
      }
    } catch {
      setSyncingIds((prev) => {
        const next = new Set(prev);
        next.delete(sourceId);
        return next;
      });
      toast({
        title: 'Erreur réseau',
        description: 'Impossible de contacter le serveur.',
      });
    }
  }

  function handleViewLogs(sourceId: string) {
    // Scroll to / highlight logs for this source
    const filteredLogs = logs.filter((l) => l.dataSourceId === sourceId);
    if (filteredLogs.length > 0) {
      setStatusFilter('all');
      setSearchQuery(filteredLogs[0].dataSource.name);
    } else {
      toast({
        title: 'Aucun log',
        description: 'Aucune historique de synchronisation trouvé pour cette source.',
      });
    }
  }

  // --- Computed stats ---

  const totalSuccess = logs.filter((l) => l.status === 'success').length;
  const totalWarnings = logs.filter((l) => l.status === 'warning').length;
  const totalErrors = logs.filter((l) => l.status === 'error').length;
  const lastSyncTime = logs.length > 0 ? timeAgo(logs[0].createdAt) : 'Jamais';

  // Filtered logs
  const filteredLogs = logs.filter((log) => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (searchQuery && !log.dataSource.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Centre de Synchronisation
          </h1>
          <p className="text-sm text-muted-foreground">
            Surveiller et gérer la synchronisation des sources de données
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} id="auto-refresh" />
            <label htmlFor="auto-refresh" className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground">
              {autoRefresh ? (
                <RefreshCw className="size-3.5 animate-spin text-fun-blue" />
              ) : (
                <Pause className="size-3.5" />
              )}
              Auto-rafraîchissement (30s)
            </label>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Last refresh timestamp */}
      <p className="text-xs text-muted-foreground">
        Dernière mise à jour : {lastRefresh || 'Chargement...'}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Total Sources', value: sources.length, icon: Database, color: 'text-fun-blue dark:text-blue-400', bgColor: 'bg-fun-blue/10 dark:bg-fun-blue/20' },
          { label: 'Sync OK', value: totalSuccess, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-950/30' },
          { label: 'Avertissements', value: totalWarnings, icon: AlertTriangle, color: 'text-amber-500 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: 'Erreurs', value: totalErrors, icon: XCircle, color: 'text-red-500 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/30' },
          { label: 'Dernière Sync', value: lastSyncTime, icon: Clock, color: 'text-tango dark:text-orange-400', bgColor: 'bg-tango/10 dark:bg-tango/20' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={cn('flex size-8 items-center justify-center rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('size-4', stat.color)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-muted-foreground truncate">{stat.label}</p>
                  <p className={cn('text-lg font-bold leading-tight', stat.color)}>{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-4 text-fun-blue" />
            Historique de Synchronisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filter bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par source..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="success">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-green-500" />
                    Succès
                  </span>
                </SelectItem>
                <SelectItem value="warning">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="size-3.5 text-amber-500" />
                    Avertissements
                  </span>
                </SelectItem>
                <SelectItem value="error">
                  <span className="flex items-center gap-2">
                    <XCircle className="size-3.5 text-red-500" />
                    Erreurs
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <RefreshCw className="mb-3 size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucun log de synchronisation trouvé</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Les logs apparaîtront ici après les premières synchronisations
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block mt-4 overflow-x-auto custom-scrollbar rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Dernière Sync</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Enregistrements</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Erreur</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => {
                      const statusCfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.success;
                      const StatusIcon = statusCfg.icon;
                      const isSyncing = syncingIds.has(log.dataSourceId);

                      return (
                        <TableRow key={log.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Database className="size-4 text-muted-foreground shrink-0" />
                              <span className="font-medium text-sm">{log.dataSource.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">
                              {MODULE_LABELS[log.dataSource.module] || log.dataSource.module}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDateTime(log.completedAt || log.startedAt)}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {isSyncing ? (
                              <span className="flex items-center gap-1.5 text-fun-blue">
                                <Loader2 className="size-3.5 animate-spin" />
                                En cours...
                              </span>
                            ) : (
                              formatDuration(log.duration)
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {log.recordsSynced.toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('gap-1 text-[10px]', statusCfg.color)}>
                              <StatusIcon className="size-3" />
                              {statusCfg.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            {log.errorMessage ? (
                              <span className="truncate text-xs text-red-600 dark:text-red-400" title={log.errorMessage}>
                                {log.errorMessage}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 h-7 text-xs"
                                onClick={() => handleRelaunch(log.dataSourceId)}
                                disabled={isSyncing}
                              >
                                {isSyncing ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Play className="size-3" />
                                )}
                                Relancer
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 h-7 text-xs"
                                onClick={() => handleViewLogs(log.dataSourceId)}
                              >
                                <FileText className="size-3" />
                                Voir logs
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden mt-4 space-y-3">
                {filteredLogs.map((log) => {
                  const statusCfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.success;
                  const StatusIcon = statusCfg.icon;
                  const isSyncing = syncingIds.has(log.dataSourceId);

                  return (
                    <Card key={log.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        {/* Source + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Database className="size-4 text-muted-foreground shrink-0" />
                              <p className="text-sm font-semibold truncate">{log.dataSource.name}</p>
                            </div>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {MODULE_LABELS[log.dataSource.module] || log.dataSource.module}
                            </p>
                          </div>
                          <Badge variant="outline" className={cn('gap-1 shrink-0 text-[10px]', statusCfg.color)}>
                            <StatusIcon className="size-3" />
                            {statusCfg.label}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Dernière sync</p>
                            <p className="font-medium">{formatDateTime(log.completedAt || log.startedAt)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Durée</p>
                            <p className="font-medium">
                              {isSyncing ? (
                                <span className="flex items-center gap-1 text-fun-blue">
                                  <Loader2 className="size-3 animate-spin" />
                                  En cours...
                                </span>
                              ) : (
                                formatDuration(log.duration)
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Enregistrements</p>
                            <p className="font-medium">{log.recordsSynced.toLocaleString('fr-FR')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Erreur</p>
                            <p className="break-words font-medium text-red-600 dark:text-red-400">
                              {log.errorMessage || '—'}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 h-8 text-xs"
                            onClick={() => handleRelaunch(log.dataSourceId)}
                            disabled={isSyncing}
                          >
                            {isSyncing ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Play className="size-3" />
                            )}
                            Relancer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 gap-1.5 h-8 text-xs"
                            onClick={() => handleViewLogs(log.dataSourceId)}
                          >
                            <FileText className="size-3" />
                            Voir logs
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Results count */}
              <p className="mt-3 text-xs text-muted-foreground">
                {filteredLogs.length} résultat{filteredLogs.length !== 1 ? 's' : ''} affiché{filteredLogs.length !== 1 ? 's' : ''}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
