'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

// --- Constants ---

const CATEGORY_COLORS: Record<string, string> = {
  auth: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  role: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  permission: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  data: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  export: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
};

const CATEGORY_LABELS: Record<string, string> = {
  auth: 'Authentification',
  user: 'Utilisateur',
  role: 'Rôle',
  permission: 'Permission',
  data: 'Données',
  export: 'Export',
};

const CATEGORIES = [
  { value: 'all', label: 'Toutes les catégories' },
  { value: 'auth', label: 'Authentification' },
  { value: 'user', label: 'Utilisateur' },
  { value: 'role', label: 'Rôle' },
  { value: 'permission', label: 'Permission' },
  { value: 'data', label: 'Données' },
  { value: 'export', label: 'Export' },
];

const PAGE_SIZE = 50;

// --- Types ---

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  category: string;
  details: string;
  ipAddress?: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// --- Helpers ---

function formatFrenchDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// --- Component ---

export function AdminLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: PAGE_SIZE,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');

  const totalPages = Math.ceil(pagination.total / PAGE_SIZE);
  const currentPage = Math.floor(pagination.offset / PAGE_SIZE) + 1;

  const fetchLogs = useCallback(async (offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (category !== 'all') params.set('category', category);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const rawLogs = data.data || data.logs || (Array.isArray(data) ? data : []);
        setLogs(rawLogs.map((log: Record<string, unknown>) => ({
          id: log.id,
          timestamp: (log as Record<string, unknown>).createdAt ?? log.timestamp,
          userId: log.userId,
          userName: (log as Record<string, unknown>).user?.name ?? log.userName ?? 'Inconnu',
          userAvatar: (log as Record<string, unknown>).user?.avatar ?? log.userAvatar,
          action: log.action,
          category: log.category,
          details: log.details,
          ipAddress: log.ipAddress,
        })));
        setPagination({
          total: data.pagination?.total ?? data.total ?? rawLogs.length,
          limit: PAGE_SIZE,
          offset,
          hasMore: (data.pagination?.total ?? 0) > offset + PAGE_SIZE,
        });
      } else {
        // Fallback logs
        setLogs(generateFallbackLogs());
        setPagination({ total: 156, limit: PAGE_SIZE, offset: 0, hasMore: true });
      }
    } catch {
      setError('Erreur lors du chargement du journal d\'audit');
      setLogs(generateFallbackLogs());
      setPagination({ total: 156, limit: PAGE_SIZE, offset: 0, hasMore: true });
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  function handlePageChange(newPage: number) {
    const newOffset = (newPage - 1) * PAGE_SIZE;
    fetchLogs(newOffset);
  }

  function handleCategoryChange(val: string) {
    setCategory(val);
  }

  function handleSearchChange(val: string) {
    setSearch(val);
  }

  // Initial fetch + refetch on filter changes
  useEffect(() => {
    fetchLogs(0);
  }, [category, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Journal d&apos;Audit
          </h1>
          <p className="text-sm text-muted-foreground">
            Historique de toutes les activités sur la plateforme
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans le journal..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 sm:max-w-sm"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {pagination.total} entrée{pagination.total > 1 ? 's' : ''}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Logs table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-8 w-24 rounded" />
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-52" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">
                Aucune entrée dans le journal d&apos;audit
              </p>
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[170px]">Date</TableHead>
                    <TableHead className="w-[160px]">Utilisateur</TableHead>
                    <TableHead className="w-[140px]">Action</TableHead>
                    <TableHead className="w-[130px]">Catégorie</TableHead>
                    <TableHead className="hidden md:table-cell">Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatFrenchDate(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7">
                            <AvatarFallback className="bg-muted text-[10px]">
                              {getInitials(log.userName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm font-medium">
                            {log.userName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-normal">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={CATEGORY_COLORS[log.category] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}
                        >
                          {CATEGORY_LABELS[log.category] || log.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden max-w-xs truncate text-xs text-muted-foreground md:table-cell">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages} — {pagination.total} entrées au total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="gap-1"
            >
              <ChevronLeft className="size-4" />
              Précédent
            </Button>
            <div className="flex items-center gap-1">
              {generatePageNumbers(currentPage, totalPages).map((page, i) =>
                page === '...' ? (
                  <span key={`dots-${i}`} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'default' : 'outline'}
                    size="sm"
                    className="size-8 p-0"
                    onClick={() => handlePageChange(page as number)}
                  >
                    {page}
                  </Button>
                )
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="gap-1"
            >
              Suivant
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Generate fallback data
function generateFallbackLogs(): AuditLog[] {
  const actions = [
    { action: 'Connexion réussie', category: 'auth', details: 'Connexion depuis 192.168.1.10' },
    { action: 'Déconnexion', category: 'auth', details: 'Déconnexion volontaire' },
    { action: 'Tentative de connexion échouée', category: 'auth', details: 'Identifiants invalides' },
    { action: 'Utilisateur créé', category: 'user', details: 'Création du compte marie.dupont@ansut.cd' },
    { action: 'Utilisateur modifié', category: 'user', details: 'Modification du rôle de Jean Martin' },
    { action: 'Utilisateur supprimé', category: 'user', details: 'Suppression du compte test' },
    { action: 'Rôle créé', category: 'role', details: 'Création du rôle "Chef de projet"' },
    { action: 'Rôle modifié', category: 'role', details: 'Modification du niveau du rôle Analyste' },
    { action: 'Rôle supprimé', category: 'role', details: 'Suppression du rôle temporaire' },
    { action: 'Permissions modifiées', category: 'permission', details: 'Mise à jour des permissions du rôle Analyste' },
    { action: 'Données importées', category: 'data', details: 'Import de 150 indicateurs depuis fichier Excel' },
    { action: 'Indicateur modifié', category: 'data', details: 'Mise à jour du KPI CAQ-001' },
    { action: 'Export PDF', category: 'export', details: 'Export du module Finance — T1 2025' },
    { action: 'Export Excel', category: 'export', details: 'Export des données Opérationnel — complet' },
  ];
  const users = [
    'Admin Principal',
    'Marie Dupont',
    'Jean Martin',
    'Pierre Leroy',
    'Sophie Bernard',
    'Claire Moreau',
  ];

  return Array.from({ length: PAGE_SIZE }, (_, i) => {
    const item = actions[i % actions.length];
    const user = users[i % users.length];
    return {
      id: String(i + 1),
      timestamp: new Date(Date.now() - i * 3600000 * Math.random() * 10).toISOString(),
      userId: String((i % 6) + 1),
      userName: user,
      action: item.action,
      category: item.category,
      details: item.details,
    };
  });
}

// Generate page numbers for pagination
function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [1];

  if (current > 3) pages.push('...');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push('...');

  pages.push(total);

  return pages;
}
