'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  MoreHorizontal,
  KeyRound,
  Lock,
  Unlock,
  ShieldCheck,
  Power,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { formatFrenchDate, getInitials } from '@/lib/formatters';

interface Role {
  id: string;
  name: string;
  label: string;
  color: string;
}

interface Department {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  matricule?: string | null;
  fonction?: string | null;
  roleId: string;
  roleName: string;
  roleColor?: string;
  departmentId: string;
  departmentName: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  isLocked?: boolean;
  lastLogin: string | null;
  avatarUrl?: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  matricule: string;
  fonction: string;
  roleId: string;
  departmentId: string;
  isActive: boolean;
}

const EMPTY_FORM: UserFormData = {
  name: '',
  email: '',
  password: '',
  matricule: '',
  fonction: '',
  roleId: '',
  departmentId: '',
  isActive: true,
};

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { handleError, handleSuccess, handleNetworkError } = useErrorHandler({ setError });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);
  // Action loading state for dropdown actions
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // ---------- Statistics ----------
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = users.filter((u) => !u.isActive).length;
  const newThisMonth = users.filter((u) => {
    if (!u.lastLogin) return false;
    const loginDate = new Date(u.lastLogin);
    const now = new Date();
    return (
      loginDate.getMonth() === now.getMonth() &&
      loginDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const rawUsers = Array.isArray(data) ? data : data.data || data.users || [];
        setUsers(rawUsers.map((u: Record<string, unknown>) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          matricule: u.matricule,
          fonction: u.fonction,
          roleId: u.roleId || (u.role as Record<string, string>)?.id || '',
          roleName: (u.role as Record<string, string>)?.label || u.roleName || '',
          roleColor: (u.role as Record<string, string>)?.color || u.roleColor,
          departmentId: u.departmentId || (u.department as Record<string, string>)?.id || '',
          departmentName: (u.department as Record<string, string>)?.name || u.departmentName || '',
          isActive: u.isActive,
          mustChangePassword: u.mustChangePassword,
          isLocked: u.isLocked,
          lastLogin: u.lastLogin,
        })));
      } else {
        handleError('le chargement des utilisateurs');
      }
    } catch {
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        const rawRoles = Array.isArray(data) ? data : data.data || data.roles || [];
        setRoles(rawRoles.map((r: Record<string, unknown>) => ({
          id: r.id,
          name: r.name,
          label: r.label,
          color: r.color,
        })));
      } else {
        setRoles([
          { id: 'admin', name: 'admin', label: 'Administrateur', color: '#ef4444' },
          { id: 'manager', name: 'manager', label: 'Gestionnaire', color: '#f18120' },
          { id: 'analyst', name: 'analyst', label: 'Analyste', color: '#3b82f6' },
          { id: 'viewer', name: 'viewer', label: 'Observateur', color: '#64748b' },
        ]);
      }
    } catch {
      handleError('le chargement des rôles');
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : data.departments || []);
      } else {
        handleError('le chargement des départements');
      }
    } catch {
      handleNetworkError('le chargement des départements');
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchUsers(), fetchRoles(), fetchDepartments()]);
  }, [fetchUsers, fetchRoles, fetchDepartments]);

  // Filter users by search
  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.matricule?.toLowerCase().includes(q) ?? false) ||
      (u.fonction?.toLowerCase().includes(q) ?? false) ||
      u.roleName.toLowerCase().includes(q) ||
      u.departmentName.toLowerCase().includes(q)
    );
  });

  // Form validation
  function validateForm(data: UserFormData, isEdit: boolean): boolean {
    const errors: Partial<Record<keyof UserFormData, string>> = {};
    if (!data.name.trim()) errors.name = 'Le nom est requis';
    if (!data.email.trim()) errors.email = "L'e-mail est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errors.email = "Format d'e-mail invalide";
    if (!isEdit && !data.password.trim())
      errors.password = 'Le mot de passe est requis';
    else if (!isEdit && data.password.length < 8)
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    if (!data.roleId) errors.roleId = 'Le rôle est requis';
    if (!data.departmentId) errors.departmentId = 'Le département est requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Open dialog for create
  function handleCreate() {
    setEditingUser(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setDialogOpen(true);
  }

  // Open dialog for edit
  function handleEdit(user: User) {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      matricule: user.matricule || '',
      fonction: user.fonction || '',
      roleId: user.roleId,
      departmentId: user.departmentId,
      isActive: user.isActive,
    });
    setFormErrors({});
    setDialogOpen(true);
  }

  // Save user (create or update)
  async function handleSave() {
    const isEdit = !!editingUser;
    if (!validateForm(formData, isEdit)) return;

    setSaving(true);
    setError(null);
    try {
      const url = isEdit
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit
        ? {
            name: formData.name,
            email: formData.email,
            matricule: formData.matricule || null,
            fonction: formData.fonction || null,
            roleId: formData.roleId,
            departmentId: formData.departmentId,
            isActive: formData.isActive,
            ...(formData.password ? { password: formData.password } : {}),
          }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setDialogOpen(false);
        await fetchUsers();
        if (isEdit) {
          handleSuccess('Utilisateur mis à jour', `Les informations de ${formData.name} ont été mises à jour avec succès.`);
        } else {
          handleSuccess('Utilisateur créé avec succès', `${formData.name} a été ajouté à la plateforme.`);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch {
      setError('Erreur réseau lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  // Delete user
  async function handleDelete() {
    if (!deletingUser) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const deletedName = deletingUser.name;
        setDeleteDialogOpen(false);
        setDeletingUser(null);
        await fetchUsers();
        handleSuccess('Utilisateur supprimé', `${deletedName} a été supprimé de la plateforme.`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Erreur lors de la suppression');
      }
    } catch {
      setError('Erreur réseau lors de la suppression');
    } finally {
      setSaving(false);
    }
  }

  // Toggle active status
  async function handleToggleActive(user: User) {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        await fetchUsers();
        handleSuccess(`Statut de ${user.name} mis à jour`, user.isActive ? 'Le compte a été désactivé.' : 'Le compte a été activé.');
      }
    } catch {
      // silent
    } finally {
      setTogglingId(null);
    }
  }

  // Reset password (simulated)
  async function handleResetPassword(user: User) {
    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetPassword: true }),
      });
      if (res.ok) {
        const data = await res.json();
        handleSuccess('Mot de passe réinitialisé', data?.temporaryPassword ? `Nouveau mot de passe pour ${user.name} : ${data.temporaryPassword}` : `Mot de passe réinitialisé pour ${user.name}`);
      } else {
        const err = await res.json().catch(() => ({}));
        handleError('la réinitialisation du mot de passe');
      }
    } catch {
      handleNetworkError('la réinitialisation du mot de passe');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Toggle mustChangePassword
  async function handleToggleMustChangePassword(user: User) {
    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mustChangePassword: !user.mustChangePassword }),
      });
      if (res.ok) {
        await fetchUsers();
        handleSuccess(user.mustChangePassword ? 'Changement mdp non forcé' : 'Changement mdp forcé', user.mustChangePassword ? `${user.name} ne sera plus obligé de changer son mot de passe.` : `${user.name} devra changer son mot de passe à la prochaine connexion.`);
      }
    } catch {
      handleError('la modification du paramètre');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Toggle isLocked
  async function handleToggleLock(user: User) {
    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: !user.isLocked }),
      });
      if (res.ok) {
        await fetchUsers();
        handleSuccess(user.isLocked ? 'Compte déverrouillé' : 'Compte verrouillé', user.isLocked ? `Le compte de ${user.name} a été déverrouillé.` : `Le compte de ${user.name} a été verrouillé.`);
      }
    } catch {
      handleError('la modification du statut de verrouillage');
    } finally {
      setActionLoadingId(null);
    }
  }

  // Open delete confirmation
  function handleDeleteClick(user: User) {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  }

  // Dropdown menu renderer
  function UserActionMenu({ user }: { user: User }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 hover:bg-muted"
            aria-label={`Actions pour ${user.name}`}
            disabled={actionLoadingId === user.id}
          >
            {actionLoadingId === user.id ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <MoreHorizontal className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Modifier */}
          <DropdownMenuItem onClick={() => handleEdit(user)}>
            <Pencil className="mr-2 size-4" />
            Modifier
          </DropdownMenuItem>

          {/* Désactiver / Activer */}
          <DropdownMenuItem onClick={() => handleToggleActive(user)}>
            <Power className="mr-2 size-4" />
            {user.isActive ? 'Désactiver' : 'Activer'}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Réinitialiser mot de passe */}
          <DropdownMenuItem onClick={() => handleResetPassword(user)}>
            <KeyRound className="mr-2 size-4" />
            Réinitialiser mot de passe
          </DropdownMenuItem>

          {/* Forcer changement mdp */}
          <DropdownMenuItem onClick={() => handleToggleMustChangePassword(user)}>
            <ShieldCheck className="mr-2 size-4" />
            {user.mustChangePassword ? 'Annuler forçage mdp' : 'Forcer changement mdp'}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Verrouiller / Déverrouiller */}
          {user.isLocked ? (
            <DropdownMenuItem onClick={() => handleToggleLock(user)}>
              <Unlock className="mr-2 size-4" />
              Déverrouiller compte
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => handleToggleLock(user)}>
              <Lock className="mr-2 size-4" />
              Verrouiller compte
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* Supprimer */}
          <DropdownMenuItem
            onClick={() => handleDeleteClick(user)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Status badges for user
  function UserStatusBadges({ user }: { user: User }) {
    return (
      <div className="flex flex-wrap gap-1">
        {user.isLocked && (
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
            <Lock className="size-2.5" />
            Verrouillé
          </Badge>
        )}
        {user.mustChangePassword && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1 border-amber-400 text-amber-600">
            <ShieldCheck className="size-2.5" />
            Changer mdp
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestion des Utilisateurs
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérer les comptes utilisateurs et leurs accès
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2 w-full sm:w-auto bg-fun-blue hover:bg-fun-blue-dark">
          <Plus className="size-4" />
          Ajouter
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fun-blue/10">
              <Users className="size-5 text-fun-blue" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Total Utilisateurs
              </p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <UserCheck className="size-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Utilisateurs Actifs
              </p>
              <p className="text-2xl font-bold text-emerald-600">{activeUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-500/10">
              <UserX className="size-5 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Utilisateurs Inactifs
              </p>
              <p className="text-2xl font-bold text-gray-500">{inactiveUsers}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
              <UserPlus className="size-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Nouveaux ce mois
              </p>
              <p className="text-2xl font-bold text-amber-600">{newThisMonth}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search bar - full width on mobile */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, email, matricule, fonction, rôle, département..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 sm:max-w-sm"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Users table (desktop) + Card view (mobile) */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-5 rounded-full" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              {search ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y">
                {filteredUsers.map((user) => (
                  <div key={user.id} className="p-4 space-y-3">
                    {/* Top row: Avatar + Name + Status + Actions */}
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-fun-blue/10 text-xs text-fun-blue">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <UserActionMenu user={user} />
                    </div>

                    {/* Matricule + Fonction */}
                    <div className="flex flex-wrap items-center gap-2 pl-[52px]">
                      {user.matricule && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">
                          {user.matricule}
                        </Badge>
                      )}
                      {user.fonction && (
                        <span className="text-xs text-muted-foreground">{user.fonction}</span>
                      )}
                    </div>

                    {/* Details row: Role + Department + Status badges */}
                    <div className="flex flex-wrap items-center gap-2 pl-[52px]">
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{
                          backgroundColor: `${user.roleColor || '#64748b'}15`,
                          color: user.roleColor || '#64748b',
                        }}
                      >
                        {user.roleName}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {user.departmentName}
                      </span>
                    </div>

                    {/* Status badges + Active toggle + Last login */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pl-[52px]">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.isActive}
                          disabled={togglingId === user.id}
                          onCheckedChange={() => handleToggleActive(user)}
                          aria-label={`Statut de ${user.name}`}
                        />
                        <UserStatusBadges user={user} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatFrenchDate(user.lastLogin)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead className="w-[110px]">Matricule</TableHead>
                      <TableHead className="w-[170px]">Fonction</TableHead>
                      <TableHead className="w-[120px]">Rôle</TableHead>
                      <TableHead className="hidden w-[160px] lg:table-cell">Département</TableHead>
                      <TableHead className="w-[90px] text-center">Statut</TableHead>
                      <TableHead className="hidden w-[160px] xl:table-cell">Dernière connexion</TableHead>
                      <TableHead className="w-[60px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        {/* Avatar + Name + Email */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-9">
                              <AvatarFallback className="bg-fun-blue/10 text-xs text-fun-blue">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="truncate text-sm font-medium">{user.name}</p>
                                {user.isLocked && (
                                  <Lock className="size-3 text-destructive shrink-0" />
                                )}
                              </div>
                              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                              <UserStatusBadges user={user} />
                            </div>
                          </div>
                        </TableCell>
                        {/* Matricule */}
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {user.matricule || '—'}
                        </TableCell>
                        {/* Fonction */}
                        <TableCell className="text-sm">
                          {user.fonction || '—'}
                        </TableCell>
                        {/* Role badge */}
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: `${user.roleColor || '#64748b'}15`,
                              color: user.roleColor || '#64748b',
                            }}
                          >
                            {user.roleName}
                          </Badge>
                        </TableCell>
                        {/* Department */}
                        <TableCell className="hidden text-sm lg:table-cell">
                          {user.departmentName}
                        </TableCell>
                        {/* Active switch */}
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={user.isActive}
                              disabled={togglingId === user.id}
                              onCheckedChange={() => handleToggleActive(user)}
                            />
                          </div>
                        </TableCell>
                        {/* Last login */}
                        <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                          {formatFrenchDate(user.lastLogin)}
                        </TableCell>
                        {/* Actions */}
                        <TableCell>
                          <div className="flex justify-center">
                            <UserActionMenu user={user} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? 'Modifier les informations de l\'utilisateur.'
                : 'Remplissez les informations pour créer un nouveau compte.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="user-name">Nom complet</Label>
              <Input
                id="user-name"
                placeholder="Nom complet"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && (
                <p className="text-xs text-destructive">{formErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="user-email">E-mail</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="email@ansut.cd"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formErrors.email && (
                <p className="text-xs text-destructive">{formErrors.email}</p>
              )}
            </div>

            {/* Matricule */}
            <div className="space-y-2">
              <Label htmlFor="user-matricule">Matricule</Label>
              <Input
                id="user-matricule"
                placeholder="ANSUT-001"
                value={formData.matricule}
                onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
              />
              {formErrors.matricule && (
                <p className="text-xs text-destructive">{formErrors.matricule}</p>
              )}
            </div>

            {/* Fonction */}
            <div className="space-y-2">
              <Label htmlFor="user-fonction">Fonction</Label>
              <Input
                id="user-fonction"
                placeholder="Directeur Général, Chef de Département..."
                value={formData.fonction}
                onChange={(e) => setFormData({ ...formData, fonction: e.target.value })}
              />
              {formErrors.fonction && (
                <p className="text-xs text-destructive">{formErrors.fonction}</p>
              )}
            </div>

            {/* Password (only for create, optional for edit) */}
            <div className="space-y-2">
              <Label htmlFor="user-password">
                Mot de passe {editingUser && '(laisser vide pour ne pas modifier)'}
              </Label>
              <Input
                id="user-password"
                type="password"
                placeholder={editingUser ? '••••••••' : 'Minimum 8 caractères'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              {formErrors.password && (
                <p className="text-xs text-destructive">{formErrors.password}</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select
                value={formData.roleId}
                onValueChange={(val) => setFormData({ ...formData, roleId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.roleId && (
                <p className="text-xs text-destructive">{formErrors.roleId}</p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label>Département</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(val) => setFormData({ ...formData, departmentId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.departmentId && (
                <p className="text-xs text-destructive">{formErrors.departmentId}</p>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="user-active">Compte actif</Label>
                <p className="text-xs text-muted-foreground">
                  Un compte inactif ne peut pas se connecter
                </p>
              </div>
              <Switch
                id="user-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked })
                }
              />
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
              onClick={handleSave}
              disabled={saving}
              className="gap-2 bg-fun-blue hover:bg-fun-blue-dark"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editingUser ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l&apos;utilisateur{' '}
              <span className="font-semibold text-foreground">{deletingUser?.name}</span>
              ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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