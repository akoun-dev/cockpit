'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Moon,
  Sun,
  SlidersHorizontal,
  X,
  Calendar,
  Hash,
  Building2,
} from 'lucide-react';
import { useAppStore, type AppViewKey } from '@/lib/store';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

// ─── Constants ──────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<AppViewKey, string> = {
  accueil: 'Tableau de Bord',
  governance: 'Gouvernance',
  finance: 'Finance',
  operational: 'Opérationnel',
  rh: 'Ressources Humaines',
  risque: 'Cadre de Risque',
  pta: "Plan Triennal d'Actions",
  admin: 'Administration',
};

const YEARS = [2024, 2025];

const QUARTERS = [
  { value: '1', label: 'T1', full: 'T1 — Premier trimestre' },
  { value: '2', label: 'T2', full: 'T2 — Deuxième trimestre' },
  { value: '3', label: 'T3', full: 'T3 — Troisième trimestre' },
  { value: '4', label: 'T4', full: 'T4 — Quatrième trimestre' },
];

const MONTHS_FR = [
  { value: '1', label: 'Jan', full: 'Janvier' },
  { value: '2', label: 'Fév', full: 'Février' },
  { value: '3', label: 'Mar', full: 'Mars' },
  { value: '4', label: 'Avr', full: 'Avril' },
  { value: '5', label: 'Mai', full: 'Mai' },
  { value: '6', label: 'Juin', full: 'Juin' },
  { value: '7', label: 'Juil', full: 'Juillet' },
  { value: '8', label: 'Août', full: 'Août' },
  { value: '9', label: 'Sep', full: 'Septembre' },
  { value: '10', label: 'Oct', full: 'Octobre' },
  { value: '11', label: 'Nov', full: 'Novembre' },
  { value: '12', label: 'Déc', full: 'Décembre' },
];

const DAYS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

interface Department {
  id: string;
  name: string;
}

// ─── Inline select styles (for the blue header) ─────────────────────────────

const HEADER_SELECT =
  'h-8 border-white/20 bg-white/10 text-white text-xs backdrop-blur-sm hover:bg-white/20 focus:ring-white/30';

// ─── Theme Toggle ───────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Basculer le thème"
    >
      {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </Button>
  );
}

// ─── Export Dropdown ────────────────────────────────────────────────────────

function ExportDropdown({ className }: { className?: string }) {
  const { activeView, filters } = useAppStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 gap-1.5 border border-white/20 bg-white/10 text-white text-xs backdrop-blur-sm hover:bg-white/20 hover:text-white',
            className,
          )}
        >
          <Download className="size-3.5" />
          <span className="hidden lg:inline">Exporter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => console.log('Export Excel:', { module: activeView, filters })}
          className="gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="size-4 text-green-600" />
          Exporter Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => console.log('Export PDF:', { module: activeView, filters })}
          className="gap-2 cursor-pointer"
        >
          <FileText className="size-4 text-red-600" />
          Exporter PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Active filter badges (shown on mobile under title) ─────────────────────

function ActiveFilterBadges() {
  const { filters, setFilters } = useAppStore();
  const badges: { label: string; onClear: () => void }[] = [];

  if (filters.quarter) {
    const q = QUARTERS.find((q) => q.value === String(filters.quarter));
    badges.push({
      label: q?.label || `T${filters.quarter}`,
      onClear: () => setFilters({ quarter: null }),
    });
  }
  if (filters.month) {
    const m = MONTHS_FR.find((m) => m.value === String(filters.month));
    badges.push({
      label: m?.label || `M${filters.month}`,
      onClear: () => setFilters({ month: null }),
    });
  }
  if (filters.day) {
    badges.push({
      label: `J${filters.day}`,
      onClear: () => setFilters({ day: null }),
    });
  }
  if (filters.departmentId) {
    badges.push({
      label: 'Dept',
      onClear: () => setFilters({ departmentId: null }),
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {badges.map((b, i) => (
        <button
          key={i}
          onClick={b.onClear}
          className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-white/30 transition-colors"
        >
          {b.label}
          <X className="size-2.5" />
        </button>
      ))}
    </div>
  );
}

// ─── Main Header ────────────────────────────────────────────────────────────

export function Header() {
  const { activeView, filters, setFilters } = useAppStore();
  const isAdmin = activeView === 'admin';
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch('/api/departments');
        if (res.ok) setDepartments(await res.json());
      } catch {
        setDepartments([
          { id: 'direction', name: 'Direction Générale' },
          { id: 'finance', name: 'Finance & Comptabilité' },
          { id: 'rh', name: 'Ressources Humaines' },
          { id: 'ops', name: 'Opérations' },
          { id: 'it', name: 'Technologie' },
          { id: 'juridique', name: 'Juridique' },
          { id: 'communication', name: 'Communication' },
        ]);
      }
    }
    fetchDepartments();
  }, []);

  // Count active filters (excluding year which is always set)
  const activeFilterCount = [
    filters.quarter,
    filters.month,
    filters.day,
    filters.departmentId,
  ].filter(Boolean).length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-fun-blue px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 text-white shadow-md">
      {/* ── Left: sidebar trigger + title ── */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <SidebarTrigger className="shrink-0 text-white hover:bg-white/10 hover:text-white" />
        <div className="flex flex-col min-w-0">
          <h1 className="text-sm font-bold leading-tight sm:text-base lg:text-xl truncate">
            {MODULE_LABELS[activeView]}
          </h1>
          <div className="flex items-center gap-2 min-w-0">
            <p className="hidden text-[10px] text-white/60 sm:block truncate">
              {isAdmin
                ? "Panneau d'administration système"
                : 'Cockpit de Direction Générale'}
            </p>
            {/* Mobile: active filter pills */}
            <div className="sm:hidden">
              <ActiveFilterBadges />
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: filters + export + theme ── */}
      {!isAdmin && (
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
          {/* Desktop inline filters (md+) */}
          <div className="hidden md:flex items-end gap-1.5 lg:gap-2">
            {/* Year */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-medium text-white/70 leading-none">Année</span>
              <Select
                value={String(filters.year)}
                onValueChange={(v) => setFilters({ year: Number(v) })}
              >
                <SelectTrigger size="sm" className={cn(HEADER_SELECT, 'w-[68px]')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quarter */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-medium text-white/70 leading-none">Trimestre</span>
              <Select
                value={filters.quarter ? String(filters.quarter) : 'all'}
                onValueChange={(v) => setFilters({ quarter: v === 'all' ? null : Number(v) })}
              >
                <SelectTrigger size="sm" className={cn(HEADER_SELECT, 'w-[56px]')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {QUARTERS.map((q) => (
                    <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-medium text-white/70 leading-none">Mois</span>
              <Select
                value={filters.month ? String(filters.month) : 'all'}
                onValueChange={(v) => setFilters({ month: v === 'all' ? null : Number(v) })}
              >
                <SelectTrigger size="sm" className={cn(HEADER_SELECT, 'w-[60px]')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {MONTHS_FR.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Day — visible on lg+ */}
            <div className="hidden lg:flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-medium text-white/70 leading-none">Jour</span>
              <Select
                value={filters.day ? String(filters.day) : 'all'}
                onValueChange={(v) => setFilters({ day: v === 'all' ? null : Number(v) })}
              >
                <SelectTrigger size="sm" className={cn(HEADER_SELECT, 'w-[52px]')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all">Tous</SelectItem>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department — visible on xl+ */}
            <div className="hidden xl:flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-medium text-white/70 leading-none">Département</span>
              <Select
                value={filters.departmentId || 'all'}
                onValueChange={(v) => setFilters({ departmentId: v === 'all' ? null : v })}
              >
                <SelectTrigger size="sm" className={cn(HEADER_SELECT, 'w-[175px]')}>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les départements</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-medium text-white/70 leading-none">&nbsp;</span>
              <ExportDropdown />
            </div>
          </div>

          {/* ── Mobile filter sheet button ── */}
          <div className="md:hidden">
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-8 w-8 p-0 border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                >
                  <SlidersHorizontal className="size-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-tango text-[9px] font-bold flex items-center justify-center shadow-sm">
                      {activeFilterCount}
                    </span>
                  )}
                  <span className="sr-only">Filtres</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
                <SheetHeader className="pb-2 border-b border-border">
                  <div className="flex items-center justify-between pr-6">
                    <div>
                      <SheetTitle className="text-base">Filtres</SheetTitle>
                      <SheetDescription className="text-xs mt-0.5">
                        Affinez la période et le département
                      </SheetDescription>
                    </div>
                    {activeFilterCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] bg-tango/15 text-tango border-tango/20"
                      >
                        {activeFilterCount} actif{activeFilterCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                </SheetHeader>

                <div className="px-4 py-4 space-y-5">
                  {/* Year */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Calendar className="size-3" />
                        Année
                      </Label>
                      <Select
                        value={String(filters.year)}
                        onValueChange={(v) => setFilters({ year: Number(v) })}
                      >
                        <SelectTrigger size="sm" className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {YEARS.map((y) => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quarter */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Trimestre</Label>
                      <Select
                        value={filters.quarter ? String(filters.quarter) : 'all'}
                        onValueChange={(v) =>
                          setFilters({ quarter: v === 'all' ? null : Number(v) })
                        }
                      >
                        <SelectTrigger size="sm" className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          {QUARTERS.map((q) => (
                            <SelectItem key={q.value} value={q.value}>
                              {q.full}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Month */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Mois</Label>
                      <Select
                        value={filters.month ? String(filters.month) : 'all'}
                        onValueChange={(v) =>
                          setFilters({ month: v === 'all' ? null : Number(v) })
                        }
                      >
                        <SelectTrigger size="sm" className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          {MONTHS_FR.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.full}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Day + Department */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Hash className="size-3" />
                        Jour
                      </Label>
                      <Select
                        value={filters.day ? String(filters.day) : 'all'}
                        onValueChange={(v) =>
                          setFilters({ day: v === 'all' ? null : Number(v) })
                        }
                      >
                        <SelectTrigger size="sm" className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          <SelectItem value="all">Tous</SelectItem>
                          {DAYS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Building2 className="size-3" />
                        Département
                      </Label>
                      <Select
                        value={filters.departmentId || 'all'}
                        onValueChange={(v) =>
                          setFilters({ departmentId: v === 'all' ? null : v })
                        }
                      >
                        <SelectTrigger size="sm" className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Export buttons */}
                  <div className="pt-3 border-t border-border">
                    <Label className="text-xs font-medium text-muted-foreground mb-2.5 block">
                      Exporter les données
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-xs"
                        onClick={() => {
                          console.log('Export Excel');
                          setFilterSheetOpen(false);
                        }}
                      >
                        <FileSpreadsheet className="size-4 text-green-600" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-xs"
                        onClick={() => {
                          console.log('Export PDF');
                          setFilterSheetOpen(false);
                        }}
                      >
                        <FileText className="size-4 text-red-600" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Filter button for md-lg screens to access Day/Dept/Export */}
          <div className="hidden md:flex xl:hidden">
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'relative h-8 gap-1.5 border border-white/20 bg-white/10 text-white text-xs backdrop-blur-sm hover:bg-white/20 hover:text-white',
                    activeFilterCount > 0 && 'border-tango/50',
                  )}
                >
                  <SlidersHorizontal className="size-3.5" />
                  {activeFilterCount > 0 && (
                    <span className="size-4 rounded-full bg-tango text-[9px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
                <SheetHeader className="pb-2 border-b border-border">
                  <SheetTitle className="text-base">Filtres avancés</SheetTitle>
                  <SheetDescription>
                    Jour, Département et Export
                  </SheetDescription>
                </SheetHeader>

                <div className="px-4 py-4 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Hash className="size-3" />
                        Jour
                      </Label>
                      <Select
                        value={filters.day ? String(filters.day) : 'all'}
                        onValueChange={(v) =>
                          setFilters({ day: v === 'all' ? null : Number(v) })
                        }
                      >
                        <SelectTrigger size="sm" className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          <SelectItem value="all">Tous</SelectItem>
                          {DAYS.map((d) => (
                            <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <Building2 className="size-3" />
                        Département
                      </Label>
                      <Select
                        value={filters.departmentId || 'all'}
                        onValueChange={(v) =>
                          setFilters({ departmentId: v === 'all' ? null : v })
                        }
                      >
                        <SelectTrigger size="sm" className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <Label className="text-xs font-medium text-muted-foreground mb-2.5 block">
                      Exporter
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-xs"
                        onClick={() => {
                          console.log('Export Excel');
                          setFilterSheetOpen(false);
                        }}
                      >
                        <FileSpreadsheet className="size-4 text-green-600" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-2 text-xs"
                        onClick={() => {
                          console.log('Export PDF');
                          setFilterSheetOpen(false);
                        }}
                      >
                        <FileText className="size-4 text-red-600" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <ThemeToggle />
        </div>
      )}

      {/* Admin: only theme toggle */}
      {isAdmin && <ThemeToggle />}
    </header>
  );
}