'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
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
  roleId: string;
  roleName: string;
  roleColor?: string;
  departmentId: string;
  departmentName: string;
  isActive: boolean;
  lastLogin: string | null;
  avatarUrl?: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  roleId: string;
  departmentId: string;
  isActive: boolean;
}

const EMPTY_FORM: UserFormData = {
  name: '',
  email: '',
  password: '',
  roleId: '',
  departmentId: '',
  isActive: true,
};

function formatFrenchDate(date: string | null): string {
  if (!date) return 'Jamais';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : data.users || []);
      } else {
        // Fallback users
        setUsers([
          {
            id: '1',
            name: 'Admin Principal',
            email: 'admin@ansut.cd',
            roleId: 'admin',
            roleName: 'Administrateur',
            roleColor: '#ef4444',
            departmentId: 'direction',
            departmentName: 'Direction Générale',
            isActive: true,
            lastLogin: new Date().toISOString(),
          },
          {
            id: '2',
            name: 'Marie Dupont',
            email: 'marie.dupont@ansut.cd',
            roleId: 'analyst',
            roleName: 'Analyste',
            roleColor: '#3b82f6',
            departmentId: 'finance',
            departmentName: 'Finance & Comptabilité',
            isActive: true,
            lastLogin: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '3',
            name: 'Jean Martin',
            email: 'jean.martin@ansut.cd',
            roleId: 'viewer',
            roleName: 'Observateur',
            roleColor: '#64748b',
            departmentId: 'rh',
            departmentName: 'Ressources Humaines',
            isActive: false,
            lastLogin: new Date(Date.now() - 604800000).toISOString(),
          },
          {
            id: '4',
            name: 'Pierre Leroy',
            email: 'pierre.leroy@ansut.cd',
            roleId: 'manager',
            roleName: 'Gestionnaire',
            roleColor: '#f18120',
            departmentId: 'ops',
            departmentName: 'Opérations',
            isActive: true,
            lastLogin: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: '5',
            name: 'Sophie Bernard',
            email: 'sophie.bernard@ansut.cd',
            roleId: 'analyst',
            roleName: 'Analyste',
            roleColor: '#3b82f6',
            departmentId: 'governance',
            departmentName: 'Gouvernance',
            isActive: true,
            lastLogin: new Date(Date.now() - 259200000).toISOString(),
          },
        ]);
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
        setRoles(Array.isArray(data) ? data : data.roles || []);
      } else {
        setRoles([
          { id: 'admin', name: 'admin', label: 'Administrateur', color: '#ef4444' },
          { id: 'manager', name: 'manager', label: 'Gestionnaire', color: '#f18120' },
          { id: 'analyst', name: 'analyst', label: 'Analyste', color: '#3b82f6' },
          { id: 'viewer', name: 'viewer', label: 'Observateur', color: '#64748b' },
        ]);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(Array.isArray(data) ? data : data.departments || []);
      } else {
        setDepartments([
          { id: 'direction', name: 'Direction Générale' },
          { id: 'finance', name: 'Finance & Comptabilité' },
          { id: 'rh', name: 'Ressources Humaines' },
          { id: 'ops', name: 'Opérations' },
          { id: 'governance', name: 'Gouvernance' },
          { id: 'it', name: 'Technologie' },
          { id: 'juridique', name: 'Juridique' },
          { id: 'communication', name: 'Communication' },
        ]);
      }
    } catch {
      // silent
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
    else if (!isEdit && data.password.length < 6)
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
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
        setDeleteDialogOpen(false);
        setDeletingUser(null);
        await fetchUsers();
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
      }
    } catch {
      // silent
    } finally {
      setTogglingId(null);
    }
  }

  // Open delete confirmation
  function handleDeleteClick(user: User) {
    setDeletingUser(user);
    setDeleteDialogOpen(true);
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button onClick={handleCreate} className="gap-2 bg-fun-blue hover:bg-fun-blue-dark">
            <Plus className="size-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Users table */}
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead className="w-[120px]">Rôle</TableHead>
                  <TableHead className="hidden w-[160px] md:table-cell">Département</TableHead>
                  <TableHead className="w-[90px] text-center">Statut</TableHead>
                  <TableHead className="hidden w-[160px] lg:table-cell">Dernière connexion</TableHead>
                  <TableHead className="w-[60px] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      {search ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
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
                            <p className="truncate text-sm font-medium">{user.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
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
                      <TableCell className="hidden text-sm md:table-cell">
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
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {formatFrenchDate(user.lastLogin)}
                      </TableCell>
                      {/* Actions */}
                      <TableCell>
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 hover:bg-muted"
                            onClick={() => handleEdit(user)}
                            aria-label={`Modifier ${user.name}`}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteClick(user)}
                            aria-label={`Supprimer ${user.name}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
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

            {/* Password (only for create, optional for edit) */}
            <div className="space-y-2">
              <Label htmlFor="user-password">
                Mot de passe {editingUser && '(laisser vide pour ne pas modifier)'}
              </Label>
              <Input
                id="user-password"
                type="password"
                placeholder={editingUser ? '••••••••' : 'Minimum 6 caractères'}
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
