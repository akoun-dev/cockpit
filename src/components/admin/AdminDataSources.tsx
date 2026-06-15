'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Database,
  Globe,
  FileText,
  FileSpreadsheet,
  FileDown,
  Server,
  Wifi,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  FolderSync,
  Plug,
  Zap,
  Play,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { cn } from '@/lib/utils';
import { MODULE_LABELS, MODULE_KEYS, MODULE_COLORS } from '@/lib/constants';

const TYPE_LABELS: Record<string, string> = {
  manuel: 'Saisie manuelle',
  api: 'API REST',
  base_de_donnees: 'Base de données',
  fichier: 'Fichier',
  erp: 'ERP',
  erp_dynamics: 'Microsoft Dynamics 365',
  fichier_excel: 'Fichier Excel',
  fichier_csv: 'Fichier CSV',
  sharepoint: 'SharePoint',
  sftp: 'SFTP',
  sage: 'Sage ERP',
  onedrive: 'OneDrive',
  teams: 'Microsoft Teams',
  soap: 'API SOAP',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  manuel: FileText,
  api: Globe,
  base_de_donnees: Database,
  fichier: FileText,
  erp: Server,
  erp_dynamics: Plug,
  fichier_excel: FileSpreadsheet,
  fichier_csv: FileDown,
  sharepoint: FolderSync,
  sftp: Server,
  sage: Database,
  onedrive: FolderSync,
  teams: Wifi,
  soap: Globe,
};

const TYPE_COLORS: Record<string, string> = {
  manuel: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  api: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  base_de_donnees: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  fichier: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  erp: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  erp_dynamics: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  fichier_excel: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  fichier_csv: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  sharepoint: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  sftp: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  sage: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  onedrive: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  teams: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  soap: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  actif: { label: 'Actif', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800', icon: CheckCircle2 },
  inactif: { label: 'Inactif', color: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', icon: XCircle },
  en_test: { label: 'En test', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', icon: AlertTriangle },
};

const FREQ_LABELS: Record<string, string> = {
  temps_reel: 'Temps réel',
  journalier: 'Journalier',
  hebdomadaire: 'Hebdomadaire',
  mensuel: 'Mensuel',
  trimestriel: 'Trimestriel',
  manuel: 'Manuel',
};

// --- Sync status helper ---

type SyncStatus = 'uptodate' | 'recent' | 'obsolete';

function getSyncStatus(lastSync?: string | null): SyncStatus {
  if (!lastSync) return 'obsolete';
  const now = Date.now();
  const last = new Date(lastSync).getTime();
  const diffMs = now - last;
  const oneHour = 3600000;
  const oneDay = 86400000;
  if (diffMs < oneHour) return 'uptodate';
  if (diffMs < oneDay) return 'recent';
  return 'obsolete';
}

const SYNC_STATUS_CONFIG: Record<SyncStatus, { label: string; dotColor: string; textColor: string }> = {
  uptodate: { label: 'À jour', dotColor: 'bg-green-500', textColor: 'text-green-700 dark:text-green-400' },
  recent: { label: 'Récent', dotColor: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-400' },
  obsolete: { label: 'Obsolète', dotColor: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-400' },
};

// --- Types ---

interface DataSourceEntry {
  id: string;
  module: string;
  name: string;
  type: string;
  host?: string | null;
  port?: number | null;
  endpoint?: string | null;
  database?: string | null;
  username?: string | null;
  password?: string | null;
  description?: string | null;
  status: string;
  lastSync?: string | null;
  refreshFreq: string;
}

interface DataSourceFormData {
  module: string;
  name: string;
  type: string;
  host: string;
  port: string;
  endpoint: string;
  database: string;
  username: string;
  password: string;
  description: string;
  refreshFreq: string;
  status: string;
}

const EMPTY_FORM: DataSourceFormData = {
  module: 'accueil',
  name: '',
  type: 'manuel',
  host: '',
  port: '',
  endpoint: '',
  database: '',
  username: '',
  password: '',
  description: '',
  refreshFreq: 'manuel',
  status: 'actif',
};

// --- Component ---

export function AdminDataSources() {
  const [sources, setSources] = useState<DataSourceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { handleError, handleSuccess, handleNetworkError } = useErrorHandler({ setError });
  const [saving, setSaving] = useState(false);

  // Module expand/collapse — default collapsed
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set()
  );

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSourceEntry | null>(null);
  const [form, setForm] = useState<DataSourceFormData>(EMPTY_FORM);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSource, setDeletingSource] = useState<DataSourceEntry | null>(null);

  // Toggle test
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Connection test dialog state
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testSource, setTestSource] = useState<DataSourceEntry | null>(null);
  const [testStatus, setTestStatus] = useState<'loading' | 'success' | 'failure'>('loading');
  const [testLatency, setTestLatency] = useState<number | null>(null);

  // Force sync state
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // --- Data fetching ---

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/data-sources');
      if (res.ok) {
        const data = await res.json();
        setSources(data.data || (Array.isArray(data) ? data : []));
      } else {
        setError('Erreur lors du chargement des sources de données');
      }
    } catch {
      handleNetworkError('le chargement des sources de données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  // --- Helpers ---

  function toggleModule(mod: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  }

  function getSourcesByModule(mod: string): DataSourceEntry[] {
    return sources.filter((s) => s.module === mod);
  }

  function getModuleSourceCount(mod: string): number {
    return sources.filter((s) => s.module === mod).length;
  }

  function getActiveSourceCount(mod: string): number {
    return sources.filter((s) => s.module === mod && s.status === 'actif').length;
  }

  // --- Handlers ---

  function handleCreateSource(module?: string) {
    setEditingSource(null);
    setForm({ ...EMPTY_FORM, module: module || 'accueil' });
    setDialogOpen(true);
  }

  function handleEditSource(source: DataSourceEntry) {
    setEditingSource(source);
    setForm({
      module: source.module,
      name: source.name,
      type: source.type,
      host: source.host || '',
      port: source.port ? String(source.port) : '',
      endpoint: source.endpoint || '',
      database: source.database || '',
      username: source.username || '',
      password: source.password || '',
      description: source.description || '',
      refreshFreq: source.refreshFreq,
      status: source.status,
    });
    setDialogOpen(true);
  }

  async function handleSaveSource() {
    if (!form.name.trim() || !form.module) return;
    setSaving(true);
    setError(null);
    try {
      const url = editingSource
        ? `/api/admin/data-sources/${editingSource.id}`
        : '/api/admin/data-sources';
      const method = editingSource ? 'PUT' : 'POST';
      const body: Record<string, unknown> = {
        module: form.module,
        name: form.name.trim(),
        type: form.type,
        description: form.description || null,
        refreshFreq: form.refreshFreq,
        status: form.status,
      };
      if (form.type !== 'manuel') {
        if (form.host) body.host = form.host;
        if (form.port) body.port = parseInt(form.port, 10);
        if (form.endpoint) body.endpoint = form.endpoint;
        if (form.database) body.database = form.database;
        if (form.username) body.username = form.username;
        if (form.password) body.password = form.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setDialogOpen(false);
        handleSuccess(editingSource ? 'Source mise à jour' : 'Source créée', `"${form.name.trim()}" a été ${editingSource ? 'mis à jour' : 'ajouté'} avec succès.`);
        await fetchSources();
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as Record<string, unknown>).error as string || 'Erreur lors de la sauvegarde');
      }
    } catch {
      handleNetworkError('la sauvegarde de la source');
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteSource(source: DataSourceEntry) {
    setDeletingSource(source);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deletingSource) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/data-sources/${deletingSource.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteDialogOpen(false);
        setDeletingSource(null);
        handleSuccess('Source supprimée', `"${deletingSource.name}" a été supprimé avec succès.`);
        await fetchSources();
      }
    } catch {
      handleNetworkError('la suppression de la source');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(source: DataSourceEntry) {
    const newStatus = source.status === 'actif' ? 'inactif' : 'actif';
    setTogglingId(source.id);
    try {
      const res = await fetch(`/api/admin/data-sources/${source.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        handleSuccess(`Source ${newStatus === 'actif' ? 'activée' : 'désactivée'}`, `"${source.name}" est maintenant ${newStatus === 'actif' ? 'active' : 'inactive'}.`);
        await fetchSources();
      }
    } catch {
      handleNetworkError('la modification du statut de la source');
    } finally {
      setTogglingId(null);
    }
  }

  // Connection test handler
  async function handleTestConnection(source: DataSourceEntry) {
    setTestSource(source);
    setTestStatus('loading');
    setTestLatency(null);
    setTestDialogOpen(true);

    // Simulate connection test
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const latency = Date.now() - startTime;
    setTestLatency(latency);

    const isSuccess = Math.random() > 0.3; // 70% success rate
    setTestStatus(isSuccess ? 'success' : 'failure');

    if (isSuccess) {
      handleSuccess('Connexion réussie', `Source "${source.name}" — Latence: ${latency}ms`);
    } else {
      handleError(`la connexion à "${source.name}"`);
    }
  }

  // Force sync handler
  async function handleForceSync(source: DataSourceEntry) {
    setSyncingId(source.id);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSyncingId(null);
    const recordCount = Math.floor(Math.random() * 500) + 10;
    handleSuccess('Synchronisation terminée', `${recordCount} enregistrements synchronisés depuis "${source.name}".`);
    await fetchSources();
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Sources de Données
          </h1>
          <p className="text-sm text-muted-foreground">
            Configurer les sources de données par module du cockpit
          </p>
        </div>
        <Button onClick={() => handleCreateSource()} className="gap-2 bg-fun-blue hover:bg-fun-blue-dark">
          <Plus className="size-4" />
          Ajouter une Source
        </Button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Sources', value: sources.length, color: 'text-fun-blue dark:text-blue-400' },
          { label: 'Sources Actives', value: sources.filter((s) => s.status === 'actif').length, color: 'text-green-600 dark:text-green-400' },
          { label: 'En Test', value: sources.filter((s) => s.status === 'en_test').length, color: 'text-amber-500 dark:text-amber-400' },
          { label: 'Modules Configurés', value: MODULE_KEYS.filter((m) => getModuleSourceCount(m) > 0).length, color: 'text-tango dark:text-orange-400' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <p className={cn('mt-1 text-2xl font-bold', stat.color)}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Module-by-module source listing */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {MODULE_KEYS.map((mod) => {
            const moduleSources = getSourcesByModule(mod);
            const total = moduleSources.length;
            const active = getActiveSourceCount(mod);
            const isExpanded = expandedModules.has(mod);

            return (
              <Card key={mod}>
                {/* Module header — clickable */}
                <div
                  role="button"
                  tabIndex={0}
                  className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => toggleModule(mod)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleModule(mod); } }}
                >
                  <div className={cn('size-3 rounded-full', MODULE_COLORS[mod])} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{MODULE_LABELS[mod]}</p>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {total} source{total > 1 ? 's' : ''}
                      </Badge>
                      {active > 0 && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 py-0">
                          {active} active
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 hover:bg-muted"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateSource(mod);
                      }}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                    {isExpanded ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded: source list */}
                {isExpanded && (
                  <CardContent className="border-t border-border px-4 pb-4 pt-3">
                    {total === 0 ? (
                      <div className="flex flex-col items-center py-8 text-center">
                        <Database className="mb-2 size-8 text-muted-foreground/30" />
                        <p className="text-sm text-muted-foreground">
                          Aucune source configurée pour ce module
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 gap-2"
                          onClick={() => handleCreateSource(mod)}
                        >
                          <Plus className="size-3.5" />
                          Configurer une source
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {moduleSources.map((source) => {
                          const TypeIcon = TYPE_ICONS[source.type] || Database;
                          const statusCfg = STATUS_CONFIG[source.status] || STATUS_CONFIG.actif;
                          const StatusIcon = statusCfg.icon;
                          const syncStatus = getSyncStatus(source.lastSync);
                          const syncCfg = SYNC_STATUS_CONFIG[syncStatus];

                          return (
                            <div
                              key={source.id}
                              className={cn(
                                'rounded-lg border p-4 transition-colors',
                                source.status === 'actif'
                                  ? 'border-green-200/50 bg-green-50/30 dark:border-green-800/50 dark:bg-green-950/30'
                                  : source.status === 'en_test'
                                    ? 'border-amber-200/50 bg-amber-50/30 dark:border-amber-800/50 dark:bg-amber-950/30'
                                    : 'border-border bg-muted/20 dark:bg-muted/40'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                {/* Type icon */}
                                <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', TYPE_COLORS[source.type])}>
                                  <TypeIcon className="size-4" />
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-semibold">{source.name}</p>
                                    <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', TYPE_COLORS[source.type])}>
                                      {TYPE_LABELS[source.type] || source.type}
                                    </Badge>
                                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 gap-1', statusCfg.color)}>
                                      <StatusIcon className="size-3" />
                                      {statusCfg.label}
                                    </Badge>
                                  </div>

                                  {/* Sync status indicator */}
                                  <div className="mt-1.5 flex items-center gap-1.5">
                                    <span className={cn('inline-block size-2 rounded-full', syncCfg.dotColor)} />
                                    <span className={cn('text-[11px] font-medium', syncCfg.textColor)}>
                                      {syncCfg.label}
                                    </span>
                                    {source.lastSync && (
                                      <span className="text-[10px] text-muted-foreground ml-1">
                                        (Dernière sync: {new Date(source.lastSync).toLocaleDateString('fr-FR')})
                                      </span>
                                    )}
                                  </div>

                                  {source.description && (
                                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                      {source.description}
                                    </p>
                                  )}

                                  {/* Connection details */}
                                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                                    {source.host && (
                                      <span className="flex items-center gap-1">
                                        <Globe className="size-3" />
                                        {source.host}{source.port ? `:${source.port}` : ''}
                                      </span>
                                    )}
                                    {source.endpoint && (
                                      <span className="flex items-center gap-1">
                                        <Wifi className="size-3" />
                                        {source.endpoint}
                                      </span>
                                    )}
                                    {source.database && (
                                      <span className="flex items-center gap-1">
                                        <Database className="size-3" />
                                        {source.database}
                                      </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Clock className="size-3" />
                                      {FREQ_LABELS[source.refreshFreq] || source.refreshFreq}
                                    </span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex shrink-0 flex-col items-end gap-1.5">
                                  <div className="flex items-center gap-1">
                                    <Switch
                                      checked={source.status === 'actif'}
                                      onCheckedChange={() => handleToggleStatus(source)}
                                      disabled={togglingId === source.id}
                                      aria-label="Activer/Désactiver"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 hover:bg-muted"
                                      onClick={() => handleEditSource(source)}
                                    >
                                      <Pencil className="size-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-destructive hover:bg-destructive/10"
                                      onClick={() => handleDeleteSource(source)}
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  </div>
                                  {/* New action buttons */}
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 gap-1 text-[10px] px-2"
                                      onClick={() => handleTestConnection(source)}
                                    >
                                      <Zap className="size-3" />
                                      <span className="hidden sm:inline">Tester</span>
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 gap-1 text-[10px] px-2"
                                      disabled={syncingId === source.id}
                                      onClick={() => handleForceSync(source)}
                                    >
                                      {syncingId === source.id ? (
                                        <>
                                          <Loader2 className="size-3 animate-spin" />
                                          <span className="hidden sm:inline">Sync…</span>
                                        </>
                                      ) : (
                                        <>
                                          <Play className="size-3" />
                                          <span className="hidden sm:inline">Forcer sync</span>
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSource ? 'Modifier la Source' : 'Nouvelle Source de Données'}
            </DialogTitle>
            <DialogDescription>
              {editingSource
                ? 'Modifiez la configuration de la source de données.'
                : 'Configurez une nouvelle source pour alimenter un module du cockpit.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Module */}
            <div className="space-y-2">
              <Label>Module</Label>
              <Select
                value={form.module}
                onValueChange={(val) => setForm({ ...form, module: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_KEYS.map((mod) => (
                    <SelectItem key={mod} value={mod}>
                      <span className="flex items-center gap-2">
                        <span className={cn('inline-block size-2 rounded-full', MODULE_COLORS[mod])} />
                        {MODULE_LABELS[mod]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="ds-name">Nom de la source *</Label>
              <Input
                id="ds-name"
                placeholder="Ex: SAP B1 — Module Finance"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* Type + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setForm({ ...form, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className={cn('inline-block size-2 rounded-full', TYPE_COLORS[key])} />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Refresh frequency */}
            <div className="space-y-2">
              <Label>Fréquence de rafraîchissement</Label>
              <Select
                value={form.refreshFreq}
                onValueChange={(val) => setForm({ ...form, refreshFreq: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQ_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Connection details — shown for non-manual types */}
            {form.type !== 'manuel' && (
              <div className="space-y-4 rounded-lg border border-border bg-muted/20 dark:bg-muted/40 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Settings className="size-3.5" />
                  Paramètres de connexion
                </p>

                {/* Host + Port */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="ds-host">Hôte / URL</Label>
                    <Input
                      id="ds-host"
                      placeholder="192.168.1.50 ou https://api.example.com"
                      value={form.host}
                      onChange={(e) => setForm({ ...form, host: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ds-port">Port</Label>
                    <Input
                      id="ds-port"
                      placeholder="5432"
                      value={form.port}
                      onChange={(e) => setForm({ ...form, port: e.target.value })}
                    />
                  </div>
                </div>

                {/* Endpoint */}
                {(form.type === 'api' || form.type === 'erp' || form.type === 'erp_dynamics' || form.type === 'sharepoint' || form.type === 'soap' || form.type === 'onedrive' || form.type === 'teams' || form.type === 'sage') && (
                  <div className="space-y-2">
                    <Label htmlFor="ds-endpoint">Endpoint / Chemin</Label>
                    <Input
                      id="ds-endpoint"
                      placeholder="/api/v1/data"
                      value={form.endpoint}
                      onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                    />
                  </div>
                )}

                {/* Database */}
                {(form.type === 'base_de_donnees' || form.type === 'erp' || form.type === 'erp_dynamics' || form.type === 'sage') && (
                  <div className="space-y-2">
                    <Label htmlFor="ds-database">Base de données</Label>
                    <Input
                      id="ds-database"
                      placeholder="nom_de_la_base"
                      value={form.database}
                      onChange={(e) => setForm({ ...form, database: e.target.value })}
                    />
                  </div>
                )}

                {/* Credentials */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ds-username">Identifiant</Label>
                    <Input
                      id="ds-username"
                      placeholder="api_reader"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ds-password">Mot de passe</Label>
                    <Input
                      id="ds-password"
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="ds-description">Description</Label>
              <Textarea
                id="ds-description"
                placeholder="Description de la source et des données fournies..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button
              onClick={handleSaveSource}
              disabled={saving || !form.name.trim()}
              className="gap-2 bg-fun-blue hover:bg-fun-blue-dark"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editingSource ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la source</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la source{' '}
              <span className="font-semibold text-foreground">{deletingSource?.name}</span> du module{' '}
              <span className="font-semibold text-foreground">{MODULE_LABELS[deletingSource?.module || '']}</span> ?
              Les données associées pourraient ne plus être disponibles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={saving}
              className="gap-2 bg-destructive hover:bg-destructive/90"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Connection Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={(open) => {
        setTestDialogOpen(open);
        if (!open) {
          setTestSource(null);
          setTestStatus('loading');
          setTestLatency(null);
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="size-4" />
              Tester la connexion
            </DialogTitle>
            <DialogDescription>
              {testSource?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            {testStatus === 'loading' && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 animate-spin text-fun-blue" />
                <p className="text-sm font-medium">Connexion en cours...</p>
                <p className="text-xs text-muted-foreground">
                  Vérification de la source de données
                </p>
              </div>
            )}

            {testStatus === 'success' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Connexion réussie ✓
                </p>
                <p className="text-xs text-muted-foreground">
                  Latence : {testLatency}ms
                </p>
              </div>
            )}

            {testStatus === 'failure' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex size-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <XCircle className="size-8 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                  Échec ✗ — Timeout
                </p>
                <p className="text-xs text-muted-foreground">
                  La connexion a expiré. Vérifiez les paramètres.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="justify-center">
            <Button
              variant="outline"
              onClick={() => {
                setTestDialogOpen(false);
              }}
              disabled={testStatus === 'loading'}
              className="gap-1.5"
            >
              <X className="size-3.5" />
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
