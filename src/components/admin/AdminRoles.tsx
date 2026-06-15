'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Save,
  Copy,
  Settings2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { MODULE_LABELS, MODULE_KEYS } from '@/lib/constants';

const ACCESS_LABELS: Record<string, string> = {
  none: 'Aucun accès',
  read: 'Lecture',
  write: 'Écriture',
  admin: 'Administration',
};

const ACCESS_VALUES = ['none', 'read', 'write', 'admin'] as const;

const ACCESS_COLORS: Record<string, string> = {
  none: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  read: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  write: 'bg-tango/10 text-tango dark:bg-tango/20',
  admin: 'bg-fun-blue/10 text-fun-blue dark:bg-fun-blue/20',
};

const ACCESS_BAR_COLORS: Record<string, string> = {
  none: 'bg-gray-400',
  read: 'bg-blue-500',
  write: 'bg-tango',
  admin: 'bg-fun-blue',
};

const LEVEL_LABELS: Record<number, string> = {
  0: 'Observateur',
  1: 'Analyste',
  2: 'Gestionnaire',
  3: 'Administrateur',
  4: 'Super Admin',
};

// Granular permissions map: key -> description
const GRANULAR_PERMISSIONS: Record<string, string> = {
  'dashboard.view': 'Vue du tableau de bord',
  'dashboard.export': 'Export des données',
  'users.create': 'Créer des utilisateurs',
  'users.edit': 'Modifier des utilisateurs',
  'users.delete': 'Supprimer des utilisateurs',
  'kpi.create': 'Créer des KPI',
  'kpi.edit': 'Modifier des KPI',
  'kpi.delete': 'Supprimer des KPI',
  'reports.generate': 'Générer des rapports',
  'admin.settings': 'Paramètres système',
};

const GRANULAR_PERMISSION_KEYS = Object.keys(GRANULAR_PERMISSIONS);

// --- Types ---

interface Role {
  id: string;
  name: string;
  label: string;
  description: string;
  level: number;
  color: string;
  isSystem: boolean;
  permissionsJson?: string | null;
  _count?: { users: number };
  userCount?: number;
}

interface PermissionMap {
  [moduleId: string]: string;
}

interface RoleFormData {
  name: string;
  label: string;
  description: string;
  level: number;
  color: string;
}

const EMPTY_ROLE_FORM: RoleFormData = {
  name: '',
  label: '',
  description: '',
  level: 1,
  color: '#1c55a3',
};

export function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { handleError, handleSuccess, handleNetworkError } = useErrorHandler({ setError });

  // Selected role & permissions
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionMap>({});
  const [permissionsModified, setPermissionsModified] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Granular permissions state
  const [granularPermissions, setGranularPermissions] = useState<Record<string, boolean>>({});
  const [granularModified, setGranularModified] = useState(false);
  const [savingGranular, setSavingGranular] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<RoleFormData>(EMPTY_ROLE_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof RoleFormData, string>>>({});

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || null;

  // --- Computed stats ---

  const totalRoles = roles.length;
  const systemRolesCount = roles.filter((r) => r.isSystem).length;
  const totalPermissionsCount = MODULE_KEYS.length * totalRoles;
  const granularCount = GRANULAR_PERMISSION_KEYS.filter((k) => granularPermissions[k]).length;

  // --- Data fetching ---

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        const rolesList = data.data || (Array.isArray(data) ? data : data.roles || []);
        setRoles(rolesList);
      } else {
        setError('Erreur lors du chargement des rôles');
        handleError('le chargement des rôles');
      }
    } catch {
      setError('Erreur lors du chargement des rôles');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const fetchPermissions = useCallback(async (roleId: string) => {
    try {
      // Fetch single role with permissions from /api/admin/roles/:id
      const res = await fetch(`/api/admin/roles/${roleId}`);
      if (res.ok) {
        const data = await res.json();
        const roleData = data.data || data;
        const permList = roleData?.permissions || data?.permissions || [];
        // Convert array [{ module, access }] to map { module: access }
        const permMap: PermissionMap = {};
        for (const p of permList) {
          if (p.module && p.access) permMap[p.module] = p.access;
        }
        // Fill any missing modules with 'none'
        for (const key of MODULE_KEYS) {
          if (!permMap[key]) permMap[key] = 'none';
        }
        setPermissions(permMap);
        setPermissionsModified(false);

        // Load granular permissions from role's permissionsJson
        const rawJson = roleData?.permissionsJson || data?.permissionsJson || '{}';
        try {
          const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
          const granMap: Record<string, boolean> = {};
          for (const key of GRANULAR_PERMISSION_KEYS) {
            granMap[key] = !!parsed[key];
          }
          setGranularPermissions(granMap);
        } catch {
          // If JSON parse fails, default all to false
          const granMap: Record<string, boolean> = {};
          for (const key of GRANULAR_PERMISSION_KEYS) {
            granMap[key] = false;
          }
          setGranularPermissions(granMap);
        }
        setGranularModified(false);
      } else {
        // Fallback permissions
        const level = roles.find((r) => r.id === roleId)?.level ?? 0;
        const fallback: PermissionMap = {};
        for (const key of MODULE_KEYS) {
          if (level >= 100) fallback[key] = 'admin';
          else if (level >= 50) fallback[key] = key === 'admin' ? 'none' : 'write';
          else if (level >= 10) fallback[key] = key === 'accueil' ? 'read' : 'none';
          else fallback[key] = 'none';
        }
        setPermissions(fallback);
        setPermissionsModified(false);

        const granMap: Record<string, boolean> = {};
        for (const key of GRANULAR_PERMISSION_KEYS) {
          granMap[key] = false;
        }
        setGranularPermissions(granMap);
        setGranularModified(false);
      }
    } catch {
      handleNetworkError('le chargement des permissions du rôle');
    }
  }, [roles]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (selectedRoleId) {
      fetchPermissions(selectedRoleId);
    }
  }, [selectedRoleId, fetchPermissions]);

  // --- Handlers ---

  function handleSelectRole(roleId: string) {
    setSelectedRoleId(roleId);
  }

  function handlePermissionChange(moduleId: string, access: string) {
    setPermissions((prev) => ({ ...prev, [moduleId]: access }));
    setPermissionsModified(true);
  }

  function handleGranularToggle(key: string, checked: boolean) {
    setGranularPermissions((prev) => ({ ...prev, [key]: checked }));
    setGranularModified(true);
  }

  async function handleSavePermissions() {
    if (!selectedRoleId) return;
    setSavingPermissions(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRoleId,
          permissions: Object.entries(permissions).map(([module, access]) => ({ module, access })),
        }),
      });
      if (res.ok) {
        setPermissionsModified(false);
        handleSuccess('Permissions sauvegardées avec succès', `Les permissions du rôle "${selectedRole?.label}" ont été mises à jour.`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      handleNetworkError('la sauvegarde des permissions');
    } finally {
      setSavingPermissions(false);
    }
  }

  async function handleSaveGranularPermissions() {
    if (!selectedRoleId) return;
    setSavingGranular(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionsJson: JSON.stringify(granularPermissions),
        }),
      });
      if (res.ok) {
        setGranularModified(false);
        // Refresh to sync
        await fetchRoles();
        handleSuccess('Permissions avancées sauvegardées', `Les permissions granulaires du rôle "${selectedRole?.label}" ont été mises à jour.`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la sauvegarde des permissions avancées');
      }
    } catch {
      handleNetworkError('la sauvegarde des permissions avancées');
    } finally {
      setSavingGranular(false);
    }
  }

  // Role form validation
  function validateRoleForm(data: RoleFormData): boolean {
    const errors: Partial<Record<keyof RoleFormData, string>> = {};
    if (!data.name.trim()) errors.name = 'Le nom technique est requis';
    else if (!/^[a-z0-9-]+$/.test(data.name))
      errors.name = 'Le nom ne doit contenir que des minuscules, chiffres et tirets';
    if (!data.label.trim()) errors.label = 'Le libellé est requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleCreateRole() {
    setEditingRole(null);
    setRoleForm(EMPTY_ROLE_FORM);
    setFormErrors({});
    setDialogOpen(true);
  }

  function handleEditRole(role: Role) {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      label: role.label,
      description: role.description,
      level: role.level,
      color: role.color,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  function handleDuplicateRole(role: Role) {
    setEditingRole(null);
    setRoleForm({
      name: `${role.name}-copie`,
      label: `${role.label} (copie)`,
      description: role.description,
      level: role.level,
      color: role.color,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  async function handleSaveRole() {
    if (!validateRoleForm(roleForm)) return;

    setSaving(true);
    setError(null);
    try {
      const url = editingRole
        ? `/api/admin/roles/${editingRole.id}`
        : '/api/admin/roles';
      const method = editingRole ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm),
      });

      if (res.ok) {
        setDialogOpen(false);
        await fetchRoles();
        if (editingRole) {
          handleSuccess('Rôle mis à jour', `Le rôle "${roleForm.label}" a été mis à jour avec succès.`);
        } else {
          handleSuccess('Rôle créé avec succès', `Le rôle "${roleForm.label}" a été créé.`);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      handleNetworkError('la sauvegarde du rôle');
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteRole(role: Role) {
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deletingRole) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/roles/${deletingRole.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteDialogOpen(false);
        const deletedLabel = deletingRole.label;
        setDeletingRole(null);
        if (selectedRoleId === deletingRole.id) {
          setSelectedRoleId(null);
          setPermissions({});
          setGranularPermissions({});
        }
        await fetchRoles();
        handleSuccess('Rôle supprimé', `Le rôle "${deletedLabel}" a été supprimé.`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      handleNetworkError('la suppression du rôle');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Rôles &amp; Permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérer les rôles et configurer les permissions par module
          </p>
        </div>
        <Button onClick={handleCreateRole} className="gap-2 w-full sm:w-auto bg-fun-blue hover:bg-fun-blue-dark">
          <Plus className="size-4" />
          Créer un Rôle
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fun-blue/10">
              <Shield className="size-5 text-fun-blue" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Total Rôles</p>
              <p className="text-2xl font-bold">{totalRoles}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-tango/10">
              <ShieldAlert className="size-5 text-tango" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Rôles Système</p>
              <p className="text-2xl font-bold">{systemRolesCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
              <ShieldCheck className="size-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Permissions Configurées</p>
              <p className="text-2xl font-bold">{totalPermissionsCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main layout: Roles list + Permissions matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left: Roles list */}
        <div className="flex min-h-0 flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
            Liste des rôles
          </h2>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 min-h-0 overflow-y-auto pr-1 max-h-[65vh]">
              {roles.map((role) => (
                <Card
                  key={role.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    selectedRoleId === role.id
                      ? 'ring-2 ring-fun-blue shadow-md'
                      : 'hover:ring-1 hover:ring-border'
                  )}
                  onClick={() => handleSelectRole(role.id)}
                >
                  <CardContent className="flex items-start gap-3 p-4">
                    {/* Color dot */}
                    <div
                      className="mt-0.5 size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{role.label}</p>
                        {role.isSystem && (
                          <Badge variant="secondary" className="bg-fun-blue/10 text-fun-blue text-[10px] px-1.5 py-0">
                            Système
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {role.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 leading-normal">
                          Niveau {role.level}
                        </Badge>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground whitespace-nowrap">
                          <Users className="size-3" />
                          {role.userCount ?? role._count?.users ?? 0}
                        </span>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 sm:size-7 hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRole(role);
                        }}
                        aria-label={`Modifier le rôle ${role.label}`}
                      >
                        <Pencil className="size-3 sm:size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 sm:size-7 hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateRole(role);
                        }}
                        aria-label={`Dupliquer le rôle ${role.label}`}
                      >
                        <Copy className="size-3 sm:size-3.5" />
                      </Button>
                      {!role.isSystem && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 sm:size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRole(role);
                          }}
                          aria-label={`Supprimer le rôle ${role.label}`}
                        >
                          <Trash2 className="size-3 sm:size-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right: Permissions matrix + Granular permissions */}
        <div className="space-y-3">
          {/* Module access section */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Shield className="mr-1.5 inline-block size-4" />
              Matrice de permissions
            </h2>
            {selectedRole && (permissionsModified || granularModified) && (
              <div className="flex items-center gap-2">
                {permissionsModified && (
                  <Button
                    size="sm"
                    onClick={handleSavePermissions}
                    disabled={savingPermissions}
                    className="gap-2 bg-tango text-white hover:bg-tango/90"
                  >
                    {savingPermissions ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    Sauvegarder modules
                  </Button>
                )}
                {granularModified && (
                  <Button
                    size="sm"
                    onClick={handleSaveGranularPermissions}
                    disabled={savingGranular}
                    className="gap-2 bg-fun-blue text-white hover:bg-fun-blue-dark"
                  >
                    {savingGranular ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    Sauvegarder avancées
                  </Button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-96 w-full rounded-lg" />
          ) : !selectedRole ? (
            <Card>
              <CardContent className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Shield className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez un rôle pour voir et modifier ses permissions
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Permissions : {selectedRole.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Permissions table with horizontal scroll on mobile */}
                <div className="overflow-x-auto -mx-6 px-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Module</TableHead>
                        <TableHead>Niveau d&apos;accès</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MODULE_KEYS.map((moduleId) => (
                        <TableRow key={moduleId}>
                          <TableCell className="font-medium text-sm whitespace-nowrap">
                            {MODULE_LABELS[moduleId]}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={permissions[moduleId] || 'none'}
                              onValueChange={(val) =>
                                handlePermissionChange(moduleId, val)
                              }
                            >
                              <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ACCESS_VALUES.map((access) => (
                                  <SelectItem key={access} value={access}>
                                    <span className="flex items-center gap-2">
                                      <span
                                        className={cn(
                                          'inline-block size-2 rounded-full',
                                          ACCESS_COLORS[access]
                                        )}
                                      />
                                      {ACCESS_LABELS[access]}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Improved Permissions Summary with visual bars */}
                <div className="mt-6 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Résumé des permissions
                  </h3>
                  <div className="space-y-2.5">
                    {ACCESS_VALUES.map((access) => {
                      const count = MODULE_KEYS.filter(
                        (m) => permissions[m] === access
                      ).length;
                      const percentage = (count / MODULE_KEYS.length) * 100;
                      return (
                        <div key={access} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{ACCESS_LABELS[access]}</span>
                            <span className="text-muted-foreground">
                              {count} / {MODULE_KEYS.length} module{count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-500',
                                ACCESS_BAR_COLORS[access]
                              )}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Granular Permissions Section ── */}
                <Separator className="my-6" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 className="size-4 text-fun-blue" />
                      <h3 className="text-sm font-semibold">
                        Permissions Avancées
                      </h3>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {granularCount} / {GRANULAR_PERMISSION_KEYS.length}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configurez les permissions granulaires pour un contrôle plus fin des accès.
                    Ces permissions sont enregistrées dans le rôle et s&apos;appliquent en complément de la matrice de modules.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {GRANULAR_PERMISSION_KEYS.map((key) => (
                      <label
                        key={key}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                          granularPermissions[key]
                            ? 'border-fun-blue/30 bg-fun-blue/5'
                            : 'border-border hover:bg-muted/50'
                        )}
                      >
                        <Checkbox
                          checked={granularPermissions[key] || false}
                          onCheckedChange={(checked) =>
                            handleGranularToggle(key, !!checked)
                          }
                          aria-label={GRANULAR_PERMISSIONS[key]}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {GRANULAR_PERMISSIONS[key]}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            {key}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create / Edit Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
            </DialogTitle>
            <DialogDescription>
              {editingRole
                ? 'Modifiez les informations du rôle.'
                : 'Définissez les informations du nouveau rôle.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="role-name">Nom technique</Label>
              <Input
                id="role-name"
                placeholder="nom-technique"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                disabled={!!editingRole?.isSystem}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>

            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="role-label">Libellé</Label>
              <Input
                id="role-label"
                placeholder="Libellé du rôle"
                value={roleForm.label}
                onChange={(e) => setRoleForm({ ...roleForm, label: e.target.value })}
              />
              {formErrors.label && (
                <p className="text-xs text-destructive">{formErrors.label}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                placeholder="Description du rôle..."
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Level */}
            <div className="space-y-2">
              <Label>Niveau hiérarchique</Label>
              <Select
                value={String(roleForm.level)}
                onValueChange={(val) =>
                  setRoleForm({ ...roleForm, level: Number(val) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEVEL_LABELS).map(([level, label]) => (
                    <SelectItem key={level} value={level}>
                      Niveau {level} — {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="role-color">Couleur</Label>
              <div className="flex items-center gap-3">
                <input
                  id="role-color"
                  type="color"
                  value={roleForm.color}
                  onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                  className="h-10 w-14 cursor-pointer rounded-md border"
                />
                <Input
                  value={roleForm.color}
                  onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                  placeholder="#1c55a3"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={saving}
              className="gap-2 bg-fun-blue hover:bg-fun-blue-dark"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editingRole ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le rôle{' '}
              <span className="font-semibold text-foreground">{deletingRole?.label}</span>
              ? Les utilisateurs assignés à ce rôle devront être réassignés.
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