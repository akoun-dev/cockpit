'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
  BarChart3,
  Activity,
  XCircle,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Hash,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { cn } from '@/lib/utils';
import { useErrorHandler } from '@/hooks/use-error-handler';

// --- Constants ---

const DOMAIN_LABELS: Record<string, string> = {
  governance: 'Gouvernance',
  finance: 'Finance',
  operational: 'Opérationnel',
  rh: 'Ressources Humaines',
  risque: 'Cadre de Risque',
  pta: 'PTA',
};

const DOMAIN_COLORS: Record<string, string> = {
  governance: 'bg-fun-blue',
  finance: 'bg-green-600',
  operational: 'bg-tango',
  rh: 'bg-amber-500',
  risque: 'bg-red-500',
  pta: 'bg-violet-600',
};

const DOMAIN_BADGE_COLORS: Record<string, string> = {
  governance: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  finance: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  operational: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  rh: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  risque: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pta: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
};

const FREQUENCY_LABELS: Record<string, string> = {
  journalier: 'Journalier',
  hebdomadaire: 'Hebdomadaire',
  mensuel: 'Mensuel',
  trimestriel: 'Trimestriel',
  annuel: 'Annuel',
  manuel: 'Manuel',
};

const SOURCE_LABELS: Record<string, string> = {
  manuel: 'Saisie manuelle',
  erp_dynamics: 'ERP Dynamics 365',
  fichier_excel: 'Fichier Excel',
  api: 'API REST',
  base_de_donnees: 'Base de données',
};

// --- Types ---

interface Department {
  id: string;
  name: string;
  code?: string | null;
}

interface IndicatorEntry {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  domain: string;
  subDomain?: string | null;
  unit: string;
  targetValue?: number | null;
  alertValue?: number | null;
  criticalValue?: number | null;
  formula?: string | null;
  frequency: string;
  sourceSystem: string;
  departmentId?: string | null;
  department?: Department | null;
  order: number;
  isActive: boolean;
  isPriority: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IndicatorFormData {
  name: string;
  code: string;
  description: string;
  domain: string;
  subDomain: string;
  unit: string;
  targetValue: string;
  alertValue: string;
  criticalValue: string;
  formula: string;
  frequency: string;
  sourceSystem: string;
  departmentId: string;
  isPriority: boolean;
  order: string;
}

const EMPTY_FORM: IndicatorFormData = {
  name: '',
  code: '',
  description: '',
  domain: 'governance',
  subDomain: '',
  unit: '%',
  targetValue: '',
  alertValue: '',
  criticalValue: '',
  formula: '',
  frequency: 'mensuel',
  sourceSystem: 'manuel',
  departmentId: '__none__',
  isPriority: false,
  order: '0',
};

// --- Component ---

export function AdminKPI() {
  const { handleError, handleSuccess, handleNetworkError } = useErrorHandler();

  // Data state
  const [indicators, setIndicators] = useState<IndicatorEntry[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<IndicatorEntry | null>(null);
  const [form, setForm] = useState<IndicatorFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingIndicator, setDeletingIndicator] = useState<IndicatorEntry | null>(null);

  // --- Data fetching ---

  const fetchIndicators = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (domainFilter && domainFilter !== 'all') params.set('domain', domainFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/indicators?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIndicators(data.data || []);
      }
    } catch {
      handleError('le chargement des indicateurs');
    } finally {
      setLoading(false);
    }
  }, [domainFilter, searchQuery, handleError]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        // departments may be nested or flat — handle both
        if (Array.isArray(data.departments)) {
          setDepartments(data.departments);
        } else if (data.data?.departments) {
          setDepartments(data.data.departments);
        }
      }
    } catch {
      // silent — departments are optional
    }
  }, []);

  useEffect(() => {
    fetchIndicators();
  }, [fetchIndicators]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // --- Stats ---

  const stats = useMemo(() => {
    const total = indicators.length;
    const actifs = indicators.filter((i) => i.isActive).length;
    const inactifs = total - actifs;
    const prioritaires = indicators.filter((i) => i.isPriority).length;

    const byDomain: Record<string, number> = {};
    for (const ind of indicators) {
      byDomain[ind.domain] = (byDomain[ind.domain] || 0) + 1;
    }

    return { total, actifs, inactifs, prioritaires, byDomain };
  }, [indicators]);

  function updateField<K extends keyof IndicatorFormData>(field: K, value: IndicatorFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  // --- Handlers ---

  function handleCreate() {
    setEditingIndicator(null);
    setForm({ ...EMPTY_FORM });
    setFormErrors({});
    setDialogOpen(true);
  }

  function handleEdit(indicator: IndicatorEntry) {
    setEditingIndicator(indicator);
    setForm({
      name: indicator.name,
      code: indicator.code,
      description: indicator.description || '',
      domain: indicator.domain,
      subDomain: indicator.subDomain || '',
      unit: indicator.unit,
      targetValue: indicator.targetValue !== null ? String(indicator.targetValue) : '',
      alertValue: indicator.alertValue !== null ? String(indicator.alertValue) : '',
      criticalValue: indicator.criticalValue !== null ? String(indicator.criticalValue) : '',
      formula: indicator.formula || '',
      frequency: indicator.frequency,
      sourceSystem: indicator.sourceSystem,
      departmentId: indicator.departmentId || '__none__',
      isPriority: indicator.isPriority,
      order: String(indicator.order ?? 0),
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  async function handleSave() {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Le nom est requis';
    if (!form.code.trim()) errors.code = 'Le code est requis';
    if (!form.domain) errors.domain = 'Le domaine est requis';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaving(true);

    try {
      const url = editingIndicator
        ? `/api/admin/indicators/${editingIndicator.id}`
        : '/api/admin/indicators';
      const method = editingIndicator ? 'PUT' : 'POST';

      const body: Record<string, unknown> = {
        name: form.name.trim(),
        code: form.code.trim(),
        domain: form.domain,
        subDomain: form.subDomain.trim() || null,
        unit: form.unit.trim() || '%',
        frequency: form.frequency,
        sourceSystem: form.sourceSystem,
      };

      if (form.description.trim()) body.description = form.description.trim();
      if (form.targetValue) body.targetValue = parseFloat(form.targetValue);
      if (form.alertValue) body.alertValue = parseFloat(form.alertValue);
      if (form.criticalValue) body.criticalValue = parseFloat(form.criticalValue);
      if (form.formula.trim()) body.formula = form.formula.trim();
      if (form.departmentId && form.departmentId !== '__none__') body.departmentId = form.departmentId;
      body.isPriority = form.isPriority;
      const orderVal = parseInt(form.order, 10);
      if (!isNaN(orderVal)) body.order = orderVal;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setDialogOpen(false);
        handleSuccess(
          editingIndicator ? 'Indicateur mis à jour' : 'Indicateur créé',
          editingIndicator
            ? `"${form.name}" a été modifié avec succès.`
            : `"${form.name}" a été créé avec succès.`
        );
        await fetchIndicators();
      } else {
        const data = await res.json().catch(() => ({}));
        handleError(`la sauvegarde de l'indicateur — ${(data as { error?: string }).error || 'Erreur lors de la sauvegarde'}`);
      }
    } catch {
      handleError('la sauvegarde de l\'indicateur');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(indicator: IndicatorEntry) {
    setDeletingIndicator(indicator);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deletingIndicator) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/indicators/${deletingIndicator.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteDialogOpen(false);
        setDeletingIndicator(null);
        handleSuccess('Indicateur supprimé', `"${deletingIndicator.name}" a été supprimé.`);
        await fetchIndicators();
      }
    } catch {
      handleError('la suppression de l\'indicateur');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(indicator: IndicatorEntry) {
    setTogglingId(indicator.id);
    try {
      const res = await fetch(`/api/admin/indicators/${indicator.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !indicator.isActive }),
      });
      if (res.ok) {
        handleSuccess(
          !indicator.isActive ? 'Indicateur activé' : 'Indicateur désactivé',
          `"${indicator.name}" est maintenant ${!indicator.isActive ? 'actif' : 'inactif'}.`
        );
        await fetchIndicators();
      }
    } catch {
      handleNetworkError('la modification du statut de l\'indicateur');
    } finally {
      setTogglingId(null);
    }
  }

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Indicateurs KPI
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérer le catalogue d'indicateurs de performance du cockpit
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2 bg-fun-blue hover:bg-fun-blue-dark">
          <Plus className="size-4" />
          Nouvel Indicateur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-fun-blue/10">
                <BarChart3 className="size-4 text-fun-blue" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total KPI</p>
                <p className="text-xl font-bold text-fun-blue">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-tango/10">
                <Star className="size-4 text-tango fill-tango" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Lot 1 (DG)</p>
                <p className="text-xl font-bold text-tango">{stats.prioritaires}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Activity className="size-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Actifs</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.actifs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <XCircle className="size-4 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Inactifs</p>
                <p className="text-xl font-bold text-gray-500 dark:text-gray-400">{stats.inactifs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-tango/10">
                <Hash className="size-4 text-tango" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Par domaine</p>
                <p className="text-xl font-bold text-tango">{Object.keys(stats.byDomain).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain breakdown mini cards */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {Object.entries(DOMAIN_LABELS).map(([key, label]) => {
          const count = stats.byDomain[key] || 0;
          if (count === 0) return null;
          return (
            <div
              key={key}
              className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
            >
              <div className={cn('size-2.5 rounded-full shrink-0', DOMAIN_COLORS[key])} />
              <span className="text-xs font-medium truncate">{label}</span>
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                {count}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="w-full sm:w-48 gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <SelectValue placeholder="Domaine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les domaines</SelectItem>
            {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  <span className={cn('inline-block size-2 rounded-full', DOMAIN_COLORS[key])} />
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : indicators.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <BarChart3 className="mb-3 size-12 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground">Aucun indicateur trouvé</p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              {searchQuery || domainFilter !== 'all'
                ? 'Essayez de modifier vos filtres de recherche.'
                : 'Commencez par créer votre premier indicateur KPI.'}
            </p>
            {!searchQuery && domainFilter === 'all' && (
              <Button className="mt-4 gap-2 bg-fun-blue hover:bg-fun-blue-dark" onClick={handleCreate}>
                <Plus className="size-4" />
                Créer un indicateur
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop table view */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Code</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead className="w-32">Domaine</TableHead>
                        <TableHead className="w-16">Unité</TableHead>
                        <TableHead className="w-16 text-right">Cible</TableHead>
                        <TableHead className="w-16 text-right">Alerte</TableHead>
                        <TableHead className="w-16 text-right">Critique</TableHead>
                        <TableHead className="w-28">Fréquence</TableHead>
                        <TableHead className="w-28">Source</TableHead>
                        <TableHead className="w-20">Statut</TableHead>
                        <TableHead className="w-16 text-center">Lot 1</TableHead>
                        <TableHead className="w-28 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {indicators.map((indicator) => (
                        <TableRow
                          key={indicator.id}
                          className={cn(
                            !indicator.isActive && 'opacity-50',
                            indicator.isPriority && 'bg-tango/[0.03]'
                          )}
                        >
                          <TableCell className="font-mono text-xs font-semibold">
                            {indicator.code}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{indicator.name}</p>
                              {indicator.subDomain && (
                                <p className="text-xs text-muted-foreground">{indicator.subDomain}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn('text-[10px] px-1.5 py-0', DOMAIN_BADGE_COLORS[indicator.domain] || '')}
                            >
                              {DOMAIN_LABELS[indicator.domain] || indicator.domain}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{indicator.unit}</TableCell>
                          <TableCell className="text-right text-xs font-medium">
                            {indicator.targetValue !== null ? indicator.targetValue : '—'}
                          </TableCell>
                          <TableCell className="text-right text-xs font-medium text-amber-600 dark:text-amber-400">
                            {indicator.alertValue !== null ? indicator.alertValue : '—'}
                          </TableCell>
                          <TableCell className="text-right text-xs font-medium text-red-600 dark:text-red-400">
                            {indicator.criticalValue !== null ? indicator.criticalValue : '—'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {FREQUENCY_LABELS[indicator.frequency] || indicator.frequency}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {SOURCE_LABELS[indicator.sourceSystem] || indicator.sourceSystem}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={indicator.isActive}
                              onCheckedChange={() => handleToggleActive(indicator)}
                              disabled={togglingId === indicator.id}
                              aria-label="Activer/Désactiver"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {indicator.isPriority && (
                              <Badge className="bg-tango/15 text-tango border-0 text-[9px] px-1.5 py-0 gap-0.5">
                                <Star className="size-2.5 fill-tango" />
                                Oui
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 hover:bg-muted"
                                onClick={() => handleEdit(indicator)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(indicator)}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile card view */}
          <div className="flex flex-col gap-3 md:hidden">
            {indicators.map((indicator) => (
              <Card key={indicator.id} className={cn(!indicator.isActive ? 'opacity-50' : '', indicator.isPriority && 'border-l-4 border-l-tango')}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-muted-foreground">
                          {indicator.code}
                        </span>
                        {indicator.isPriority && (
                          <Badge className="bg-tango/15 text-tango border-0 text-[9px] px-1.5 py-0 gap-0.5">
                            <Star className="size-2.5 fill-tango" />
                            Lot 1
                          </Badge>
                        )}
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] px-1.5 py-0', DOMAIN_BADGE_COLORS[indicator.domain] || '')}
                        >
                          {DOMAIN_LABELS[indicator.domain] || indicator.domain}
                        </Badge>
                        {indicator.isActive ? (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-[10px] px-1.5 py-0 gap-1">
                            <CheckCircle2 className="size-3" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                            <XCircle className="size-3" />
                            Inactif
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-semibold">{indicator.name}</p>
                      {indicator.subDomain && (
                        <p className="text-xs text-muted-foreground">{indicator.subDomain}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 hover:bg-muted"
                        onClick={() => handleEdit(indicator)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(indicator)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Thresholds */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
                      <p className="text-[10px] text-muted-foreground">Cible</p>
                      <p className="text-sm font-bold">
                        {indicator.targetValue !== null ? `${indicator.targetValue}${indicator.unit}` : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30 p-2 text-center">
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                        <AlertTriangle className="size-3" />
                        Alerte
                      </p>
                      <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {indicator.alertValue !== null ? `${indicator.alertValue}${indicator.unit}` : '—'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30 p-2 text-center">
                      <p className="text-[10px] text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                        <AlertCircle className="size-3" />
                        Critique
                      </p>
                      <p className="text-sm font-bold text-red-600 dark:text-red-400">
                        {indicator.criticalValue !== null ? `${indicator.criticalValue}${indicator.unit}` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Meta info */}
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{FREQUENCY_LABELS[indicator.frequency] || indicator.frequency}</span>
                    <span>·</span>
                    <span>{SOURCE_LABELS[indicator.sourceSystem] || indicator.sourceSystem}</span>
                    {indicator.department && (
                      <>
                        <span>·</span>
                        <span>{indicator.department.name}</span>
                      </>
                    )}
                  </div>

                  {/* Toggle */}
                  <div className="mt-3 flex items-center justify-end">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Actif</Label>
                      <Switch
                        checked={indicator.isActive}
                        onCheckedChange={() => handleToggleActive(indicator)}
                        disabled={togglingId === indicator.id}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndicator ? 'Modifier l\'indicateur' : 'Nouvel Indicateur KPI'}
            </DialogTitle>
            <DialogDescription>
              {editingIndicator
                ? 'Modifiez les informations de l\'indicateur de performance.'
                : 'Définissez un nouvel indicateur de performance pour le cockpit DG.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Row 1: Name + Code */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ind-name">Nom *</Label>
                <Input
                  id="ind-name"
                  placeholder="Ex: Taux de réalisation budgétaire"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ind-code">Code *</Label>
                <Input
                  id="ind-code"
                  placeholder="Ex: TX_REAL_BUDG"
                  value={form.code}
                  onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                  className={cn('font-mono', formErrors.code && 'border-red-500')}
                />
                {formErrors.code && (
                  <p className="text-xs text-red-500">{formErrors.code}</p>
                )}
              </div>
            </div>

            {/* Row 2: Domain + SubDomain */
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Domaine *</Label>
                <Select value={form.domain} onValueChange={(val) => { setForm({ ...form, domain: val }); if (formErrors.domain) setFormErrors((prev) => { const n = { ...prev }; delete n.domain; return n; }); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className={cn('inline-block size-2 rounded-full', DOMAIN_COLORS[key])} />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.domain && (
                  <p className="text-xs text-red-500">{formErrors.domain}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ind-subdomain">Sous-domaine</Label>
                <Input
                  id="ind-subdomain"
                  placeholder="Ex: Budget, RH, IT..."
                  value={form.subDomain}
                  onChange={(e) => updateField('subDomain', e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Unit + Department */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ind-unit">Unité</Label>
                <Select value={form.unit} onValueChange={(val) => setForm({ ...form, unit: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['%', '€', 'FCFA', 'Nb', 'Jours', 'Heures', 'Ratio', 'Score', 'Index', 'Ko', 'Mo'].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Département</Label>
                <Select value={form.departmentId} onValueChange={(val) => setForm({ ...form, departmentId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Aucun —</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row: Lot 1 + Order */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Lot 1 (Priorité DG)</Label>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-2.5">
                  <Switch
                    checked={form.isPriority}
                    onCheckedChange={(val) => setForm({ ...form, isPriority: val })}
                    id="ind-priority"
                  />
                  <Label htmlFor="ind-priority" className="text-sm font-normal cursor-pointer">
                    {form.isPriority ? 'Oui, indicateur prioritaire' : 'Non, indicateur standard'}
                  </Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ind-order">Ordre d'affichage</Label>
                <Input
                  id="ind-order"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: e.target.value })}
                />
              </div>
            </div>

            {/* Row 5: Thresholds */}
            <div className="rounded-lg border border-border bg-muted/20 dark:bg-muted/40 p-4 space-y-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <AlertTriangle className="size-3.5" />
                Seuils de performance
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ind-target" className="text-green-700 dark:text-green-400">Cible</Label>
                  <Input
                    id="ind-target"
                    type="number"
                    step="any"
                    placeholder="100"
                    value={form.targetValue}
                    onChange={(e) => setForm({ ...form, targetValue: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ind-alert" className="text-amber-600 dark:text-amber-400">Alerte</Label>
                  <Input
                    id="ind-alert"
                    type="number"
                    step="any"
                    placeholder="80"
                    value={form.alertValue}
                    onChange={(e) => setForm({ ...form, alertValue: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ind-critical" className="text-red-600 dark:text-red-400">Critique</Label>
                  <Input
                    id="ind-critical"
                    type="number"
                    step="any"
                    placeholder="60"
                    value={form.criticalValue}
                    onChange={(e) => setForm({ ...form, criticalValue: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Frequency + Source */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fréquence</Label>
                <Select value={form.frequency} onValueChange={(val) => setForm({ ...form, frequency: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Système source</Label>
                <Select value={form.sourceSystem} onValueChange={(val) => setForm({ ...form, sourceSystem: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="ind-description">Description</Label>
              <Textarea
                id="ind-description"
                placeholder="Description de l'indicateur et de son mode de calcul..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Formula */}
            <div className="space-y-2">
              <Label htmlFor="ind-formula">Formule de calcul</Label>
              <Textarea
                id="ind-formula"
                placeholder="Ex: (Réalisé / Prévu) * 100"
                value={form.formula}
                onChange={(e) => setForm({ ...form, formula: e.target.value })}
                rows={2}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.code.trim() || !form.domain}
              className="gap-2 bg-fun-blue hover:bg-fun-blue-dark"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editingIndicator ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'indicateur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'indicateur{' '}
              <span className="font-semibold text-foreground">{deletingIndicator?.name}</span>{' '}
              (<span className="font-mono font-semibold text-foreground">{deletingIndicator?.code}</span>) ?
              Toutes les valeurs historiques associées seront également supprimées.
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
    </div>
  );
}
