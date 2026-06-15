'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Download, Calendar, RefreshCw, Clock, BarChart3, RotateCcw, FileText, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useErrorHandler } from '@/hooks/use-error-handler';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/lib/constants';
import { formatFrenchDate, getInitials } from '@/lib/formatters';

const CATEGORIES = [
  { value: 'all', label: 'Toutes les catégories' },
  { value: 'auth', label: 'Authentification' },
  { value: 'user', label: 'Utilisateur' },
  { value: 'role', label: 'Rôle' },
  { value: 'permission', label: 'Permission' },
  { value: 'data', label: 'Données' },
  { value: 'export', label: 'Export' },
  { value: 'sync', label: 'Synchronisation' },
  { value: 'alerte', label: 'Alerte' },
  { value: 'security', label: 'Sécurité' },
  { value: 'kpi', label: 'KPI' },
  { value: 'document', label: 'Document' },
  { value: 'notification', label: 'Notification' },
  { value: 'setting', label: 'Paramètre' },
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

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function isToday(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isThisWeek(date: string): boolean {
  const d = new Date(date);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return d >= startOfWeek && d < endOfWeek;
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userFilter, setUserFilter] = useState('all');

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);

  const { handleError, handleSuccess, handleNetworkError } = useErrorHandler({ setError });

  const totalPages = Math.ceil(pagination.total / PAGE_SIZE);
  const currentPage = Math.floor(pagination.offset / PAGE_SIZE) + 1;

  // --- Unique users from logs ---
  const uniqueUsers = Array.from(new Set(logs.map((l) => l.userName))).sort();

  // --- Statistics ---
  const todayCount = logs.filter((log) => isToday(log.timestamp)).length;
  const weekCount = logs.filter((log) => isThisWeek(log.timestamp)).length;

  const updateLastUpdated = useCallback(() => {
    setLastUpdated(formatTime(new Date().toISOString()));
  }, []);

  async function fetchLogs(
    cat: string,
    searchTerm: string,
    offset = 0,
    start?: string,
    end?: string,
    user?: string,
  ) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (cat !== 'all') params.set('category', cat);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (start) params.set('startDate', start);
      if (end) params.set('endDate', end);
      if (user && user !== 'all') params.set('userId', user);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const rawLogs = data.data || data.logs || (Array.isArray(data) ? data : []);
        setLogs(
          rawLogs.map((log: Record<string, unknown>) => ({
            id: log.id,
            timestamp: (log as Record<string, unknown>).createdAt ?? log.timestamp,
            userId: log.userId,
            userName:
              (log.user as Record<string, unknown>)?.name as string ??
              log.userName ??
              'Inconnu',
            userAvatar:
              (log.user as Record<string, unknown>)?.avatar as string ?? log.userAvatar,
            action: log.action,
            category: log.category,
            details: log.details,
            ipAddress: log.ipAddress,
          })),
        );
        setPagination({
          total: data.pagination?.total ?? data.total ?? rawLogs.length,
          limit: PAGE_SIZE,
          offset,
          hasMore: (data.pagination?.total ?? 0) > offset + PAGE_SIZE,
        });
      } else {
        handleError('le chargement des logs');
      }
    } catch {
      handleNetworkError("le chargement du journal d'audit");
    } finally {
      setLoading(false);
      updateLastUpdated();
    }
  }

  function handlePageChange(newPage: number) {
    const newOffset = (newPage - 1) * PAGE_SIZE;
    fetchLogs(category, search, newOffset, startDate, endDate, userFilter);
  }

  function handleCategoryChange(val: string) {
    setCategory(val);
  }

  function handleSearchChange(val: string) {
    setSearch(val);
  }

  function handleUserFilterChange(val: string) {
    setUserFilter(val);
  }

  function handleResetFilters() {
    setCategory('all');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setUserFilter('all');
  }

  function exportLogsCSV() {
    const header =
      'Date,Utilisateur,Action,Catégorie,Détails,Adresse IP\n';
    const rows = logs
      .map((log) => {
        const escaped = (val: string) =>
          val.includes(',') || val.includes('"') || val.includes('\n')
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        return [
          escaped(formatFrenchDate(log.timestamp)),
          escaped(log.userName),
          escaped(log.action),
          escaped(CATEGORY_LABELS[log.category] || log.category),
          escaped(log.details),
          escaped(log.ipAddress ?? ''),
        ].join(',');
      })
      .join('\n');
    const csv = header + rows;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    handleSuccess('Export terminé', 'Le fichier CSV a été téléchargé');
    setExportOpen(false);
  }

  function exportLogsPDF() {
    handleSuccess('Export PDF', 'Export PDF en cours de développement');
    setExportOpen(false);
  }

  // Initial fetch + refetch on filter changes
  useEffect(() => {
    fetchLogs(category, search, 0, startDate, endDate, userFilter);
  }, [category, search, startDate, endDate, userFilter]);

  // Auto-refresh polling
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchLogs(category, search, pagination.offset, startDate, endDate, userFilter);
      }, 30000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh]);

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
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto-refresh toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <label
              htmlFor="auto-refresh"
              className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground"
            >
              <RefreshCw className={`size-3.5 ${autoRefresh ? 'animate-spin text-primary' : ''}`} style={{ animationDuration: '3s' }} />
              Rafraîchissement auto
            </label>
          </div>
          {/* Last updated */}
          {lastUpdated && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              Dernière mise à jour : {lastUpdated}
            </span>
          )}
          {/* Export dropdown */}
          <DropdownMenu open={exportOpen} onOpenChange={setExportOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={loading || logs.length === 0}
                className="gap-1.5"
              >
                <Download className="size-4" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={exportLogsCSV}>
                <FileSpreadsheet className="size-4 text-green-600" />
                Exporter CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportLogsPDF}>
                <FileText className="size-4 text-red-600" />
                Exporter PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <BarChart3 className="size-3.5" />
          Total entrées : {pagination.total}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Calendar className="size-3.5" />
          Aujourd&apos;hui : {todayCount}
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Calendar className="size-3.5" />
          Cette semaine : {weekCount}
        </Badge>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:flex-wrap">
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full md:w-[200px]">
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

        {/* User filter */}
        <Select value={userFilter} onValueChange={handleUserFilterChange}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Utilisateur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les utilisateurs</SelectItem>
            {uniqueUsers.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
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
            className="w-full pl-9 md:max-w-sm"
          />
        </div>
        {/* Date range filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              placeholder="Date début"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 sm:w-[160px]"
              aria-label="Date début"
            />
          </div>
          <span className="hidden text-sm text-muted-foreground sm:inline">—</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="date"
              placeholder="Date fin"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 sm:w-[160px]"
              aria-label="Date fin"
            />
          </div>
        </div>
        {/* Reset button */}
        {(category !== 'all' || search.trim() !== '' || startDate || endDate || userFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="gap-1.5 text-muted-foreground"
          >
            <RotateCcw className="size-3.5" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Logs table (desktop) + card view (mobile) */}
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
            <>
              {/* Desktop table view */}
              <div className="hidden max-h-[600px] overflow-y-auto overflow-x-auto md:block custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[170px]">Date</TableHead>
                      <TableHead className="w-[160px]">Utilisateur</TableHead>
                      <TableHead className="w-[140px]">Action</TableHead>
                      <TableHead className="w-[130px]">Catégorie</TableHead>
                      <TableHead>Détails</TableHead>
                      <TableHead className="w-[130px]">Adresse IP</TableHead>
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
                            className={
                              CATEGORY_COLORS[log.category] ||
                              'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }
                          >
                            {CATEGORY_LABELS[log.category] || log.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {log.details}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground font-mono">
                          {log.ipAddress || '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card view */}
              <div className="max-h-[600px] space-y-2 overflow-y-auto p-3 md:hidden">
                {logs.map((log) => (
                  <Card key={log.id} className="p-3">
                    <div className="space-y-2">
                      {/* Top row: timestamp */}
                      <p className="text-xs text-muted-foreground">
                        {formatFrenchDate(log.timestamp)}
                      </p>
                      {/* User row */}
                      <div className="flex items-center gap-2">
                        <Avatar className="size-7">
                          <AvatarFallback className="bg-muted text-[10px]">
                            {getInitials(log.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{log.userName}</span>
                      </div>
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs font-normal">
                          {log.action}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={
                            CATEGORY_COLORS[log.category] ||
                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }
                        >
                          {CATEGORY_LABELS[log.category] || log.category}
                        </Badge>
                      </div>
                      {/* Details */}
                      <p className="text-xs text-muted-foreground">
                        {log.details}
                      </p>
                      {/* IP (mobile) */}
                      {log.ipAddress && (
                        <p className="text-[10px] text-muted-foreground font-mono">
                          IP: {log.ipAddress}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages} — {pagination.total} entrées au
            total
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
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
                  <span
                    key={`dots-${i}`}
                    className="px-1 text-muted-foreground"
                  >
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
                ),
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

// Generate page numbers for pagination
function generatePageNumbers(
  current: number,
  total: number,
): (number | string)[] {
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
