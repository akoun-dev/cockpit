'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  FileText,
  Presentation,
  Download,
  Upload,
  Moon,
  Sun,
  SlidersHorizontal,
  X,
  Calendar as CalendarIcon,
  Building2,
  Search,
  Loader2,
  Star,
  FileUp,
} from 'lucide-react';
import { useAppStore, type AppViewKey, type ModuleKey } from '@/lib/store';
import { useTheme } from 'next-themes';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';

// ─── Constants ──────────────────────────────────────────────────────────────

const MODULE_LABELS: Record<AppViewKey, string> = {
  accueil: 'Tableau de Bord',
  governance: 'Gouvernance',
  finance: 'Finance',
  operational: 'Opérationnel',
  rh: 'Ressources Humaines',
  risque: 'Cadre de Risque',
  pta: 'Plan de Travail Annuel',
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

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

interface Department {
  id: string;
  name: string;
}

// ─── Inline select styles (for the blue header) ─────────────────────────────

const HEADER_SELECT =
  'h-8 border-white/20 bg-white/10 text-white text-xs backdrop-blur-sm hover:bg-white/20 focus:ring-white/30';

// ─── Theme Toggle ───────────────────────────────────────────────────────────

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // resolvedTheme is undefined during SSR, which prevents hydration mismatch
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 shrink-0 border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Basculer le thème"
    >
      {resolvedTheme
        ? (isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />)
        : <div className="size-3.5" />
      }
    </Button>
  );
}

// ─── Export Dropdown ────────────────────────────────────────────────────────

interface ExportIndicator {
  code: string;
  name: string;
  subDomain: string | null;
  unit: string;
  targetValue: number | null;
  alertValue: number | null;
  criticalValue: number | null;
  isPriority: boolean;
  department: string | null;
  values: { year: number; quarter: number | null; month: number | null; period: string; value: number; comment: string | null }[];
  latestValue: number | null;
  latestPeriod: string | null;
}

interface ExportResponseData {
  format: string;
  module: string;
  moduleLabel: string;
  filters: Record<string, unknown>;
  settings: Record<string, unknown>;
  indicators: ExportIndicator[];
  totalIndicators: number;
  generatedAt: string;
}

function ExportDropdown({ className }: { className?: string }) {
  const { activeView, filters } = useAppStore();
  const { toast } = useToast();
  const [exporting, setExporting] = useState<string | null>(null);
  const [defaultFormat, setDefaultFormat] = useState<string | null>(null);

  // Fetch default export format on mount
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Record<string, unknown> | null) => {
        if (data?.defaultExportFormat) {
          setDefaultFormat(String(data.defaultExportFormat));
        }
      })
      .catch(() => {});
  }, []);

  const buildExportUrl = (format: string) => {
    const params = new URLSearchParams();
    params.set('module', activeView === 'accueil' ? 'governance' : activeView);
    params.set('format', format);
    if (filters.year) params.set('year', String(filters.year));
    if (filters.quarter) params.set('quarter', String(filters.quarter));
    if (filters.month) params.set('month', String(filters.month));
    if (filters.periodStart) params.set('periodStart', filters.periodStart);
    if (filters.periodEnd) params.set('periodEnd', filters.periodEnd);
    return `/api/export?${params.toString()}`;
  };

  const downloadAsCsv = (data: ExportResponseData) => {
    const moduleLabel = MODULE_LABELS[data.module as AppViewKey] ?? data.module;
    const header = [
      'Code',
      'Indicateur',
      'Sous-domaine',
      'Unité',
      'Cible',
      'Valeur',
      'Période',
      'Département',
      'Priorité',
    ];
    const rows = data.indicators.map((ind) => [
      ind.code,
      `"${ind.name}"`,
      ind.subDomain ?? '',
      ind.unit,
      ind.targetValue?.toString() ?? '',
      ind.latestValue?.toString() ?? '',
      ind.latestPeriod ?? '',
      ind.department ?? '',
      ind.isPriority ? 'Oui' : 'Non',
    ]);

    // BOM for Excel UTF-8
    const bom = '\uFEFF';
    const csv = bom + [header.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${data.module}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsHtml = (data: ExportResponseData) => {
    const moduleLabel = MODULE_LABELS[data.module as AppViewKey] ?? data.module;
    const includeLogo = data.settings?.includeLogo !== false;
    const includeDate = data.settings?.includeGenerationDate !== false;

    const rows = data.indicators
      .map(
        (ind) => `
        <tr>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-weight:500;font-size:12px;">${ind.code}${ind.isPriority ? ' ★' : ''}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">${ind.name}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">${ind.subDomain ?? '—'}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right;">${ind.latestValue ?? '—'}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right;">${ind.targetValue ?? '—'}</td>
          <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;">${ind.unit}</td>
        </tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Export ${moduleLabel}</title></head>
<body style="font-family:system-ui,sans-serif;margin:40px;color:#1a1a2e;">
  <div style="max-width:1000px;margin:0 auto;">
    ${includeLogo ? '<h1 style="font-size:22px;margin-bottom:4px;">ANSUT Cockpit DG</h1>' : ''}
    <h2 style="font-size:18px;color:#1c55a3;margin-bottom:2px;">${moduleLabel}</h2>
    ${includeDate ? `<p style="font-size:12px;color:#6b7280;margin-bottom:20px;">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — ${data.totalIndicators} indicateurs</p>` : '<p style="margin-bottom:20px;"></p>'}
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:8px 10px;text-align:left;font-size:12px;border-bottom:2px solid #1c55a3;">Code</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;border-bottom:2px solid #1c55a3;">Indicateur</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;border-bottom:2px solid #1c55a3;">Sous-domaine</th>
          <th style="padding:8px 10px;text-align:right;font-size:12px;border-bottom:2px solid #1c55a3;">Valeur</th>
          <th style="padding:8px 10px;text-align:right;font-size:12px;border-bottom:2px solid #1c55a3;">Cible</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;border-bottom:2px solid #1c55a3;">Unité</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${data.module}_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPptx = async () => {
    if (exporting) return;
    setExporting('pptx');
    try {
      const params = new URLSearchParams();
      params.set('module', activeView === 'accueil' ? 'governance' : activeView);
      if (filters.year) params.set('year', String(filters.year));
      if (filters.quarter) params.set('quarter', String(filters.quarter));
      if (filters.month) params.set('month', String(filters.month));

      const res = await fetch(`/api/export/pptx?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const mod = activeView === 'accueil' ? 'governance' : activeView;
      a.download = `cockpit_${mod}_${new Date().toISOString().slice(0, 10)}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export PowerPoint réussi',
        description: `Présentation générée pour ${MODULE_LABELS[activeView] ?? activeView}.`,
      });
    } catch {
      toast({
        title: "Erreur d'export",
        description: 'Impossible de générer le PowerPoint. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    if (exporting) return;
    setExporting(format);
    try {
      const res = await fetch(buildExportUrl(format));
      if (!res.ok) throw new Error('Export failed');
      const data: ExportResponseData = await res.json();

      if (format === 'excel') {
        downloadAsCsv(data);
      } else {
        downloadAsHtml(data);
      }

      toast({
        title: 'Export réussi',
        description: `${data.totalIndicators} indicateurs exportés pour ${MODULE_LABELS[data.module as AppViewKey] ?? data.module}.`,
      });
    } catch {
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible de générer l\'export. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

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
          {exporting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          <span className="hidden lg:inline">Exporter</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={!!exporting}
          className="gap-2 cursor-pointer"
        >
          <FileSpreadsheet className={cn('size-4', defaultFormat === 'excel' ? 'text-green-600' : 'text-green-600/70')} />
          <span className="flex-1">Exporter Excel</span>
          {defaultFormat === 'excel' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Star className="size-2 text-tango" /> Par défaut
            </Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={!!exporting}
          className="gap-2 cursor-pointer"
        >
          <FileText className={cn('size-4', defaultFormat === 'pdf' ? 'text-red-600' : 'text-red-600/70')} />
          <span className="flex-1">Exporter PDF</span>
          {defaultFormat === 'pdf' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Star className="size-2 text-tango" /> Par défaut
            </Badge>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExportPptx}
          disabled={!!exporting}
          className="gap-2 cursor-pointer"
        >
          <Presentation className={cn('size-4', defaultFormat === 'pptx' ? 'text-tango' : 'text-tango/70')} />
          <span className="flex-1">Exporter PowerPoint</span>
          {defaultFormat === 'pptx' && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5">
              <Star className="size-2 text-tango" /> Par défaut
            </Badge>
          )}
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
  if (filters.periodStart || filters.periodEnd) {
    const from = formatDateShort(filters.periodStart);
    const to = formatDateShort(filters.periodEnd);
    badges.push({
      label: from && to ? `${from} → ${to}` : from || to,
      onClear: () => setFilters({ periodStart: null, periodEnd: null }),
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

// ─── PowerPoint Import ──────────────────────────────────────────────────────

interface ParsedIndicator {
  code: string;
  name: string | null;
  domain: string | null;
  value: number | null;
  found: boolean;
}

interface ImportPreview {
  fileName: string;
  slidesScanned: number;
  tablesFound: number;
  indicatorsFound: number;
  indicators: ParsedIndicator[];
  year: number;
  quarter: number | null;
  month: number | null;
}

function ImportPptxButton({ className }: { className?: string }) {
  const { filters } = useAppStore();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setPreview(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setPreview(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (filters.year) formData.append('year', String(filters.year));
      if (filters.quarter) formData.append('quarter', String(filters.quarter));
      if (filters.month) formData.append('month', String(filters.month));

      const res = await fetch('/api/import/pptx', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      setPreview(data as ImportPreview);
    } catch (err) {
      toast({
        title: "Erreur d'analyse",
        description: err instanceof Error ? err.message : 'Impossible d\'analyser le fichier.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    setApplying(true);
    try {
      const valuesToApply = preview.indicators
        .filter((i) => i.value !== null)
        .map((i) => ({ code: i.code, value: i.value as number }));

      if (valuesToApply.length === 0) {
        toast({ title: 'Aucune valeur', description: 'Aucune valeur numérique trouvée à appliquer.' });
        return;
      }

      const res = await fetch('/api/import/pptx', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          indicators: valuesToApply,
          year: preview.year,
          quarter: preview.quarter,
          month: preview.month,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');

      toast({
        title: 'Import réussi',
        description: `${data.updated} mis à jour, ${data.created} créés sur ${data.total} indicateurs.`,
      });
      setOpen(false);
      setPreview(null);
      setSelectedFile(null);
    } catch (err) {
      toast({
        title: "Erreur d'import",
        description: err instanceof Error ? err.message : 'Impossible d\'appliquer les données.',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  const withValues = preview?.indicators.filter((i) => i.value !== null).length ?? 0;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 gap-1.5 border border-white/20 bg-white/10 text-white text-xs backdrop-blur-sm hover:bg-white/20 hover:text-white',
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Upload className="size-3.5" />
        <span className="hidden lg:inline">Importer</span>
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPreview(null); setSelectedFile(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="size-5 text-tango" />
              Importer PowerPoint
            </DialogTitle>
            <DialogDescription>
              Importez les valeurs de KPIs depuis un fichier PowerPoint (.pptx) contenant des tableaux avec des codes indicateurs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File picker */}
            <div>
              <Label className="text-xs font-medium">Fichier PowerPoint</Label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pptx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet className="size-4" />
                  {selectedFile ? selectedFile.name : 'Choisir un fichier'}
                </Button>
              </div>
            </div>

            {/* Period info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Période : <strong>{filters.year}</strong></span>
              {filters.quarter && <span>· <strong>T{filters.quarter}</strong></span>}
              {filters.month && <span>· <strong>M{filters.month}</strong></span>}
            </div>

            {/* Analyze button */}
            {!preview && (
              <Button
                onClick={handleAnalyze}
                disabled={!selectedFile || uploading}
                className="w-full gap-2"
              >
                {uploading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                {uploading ? 'Analyse en cours...' : 'Analyser le fichier'}
              </Button>
            )}

            {/* Preview table */}
            {preview && (
              <>
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>📄 {preview.slidesScanned} diapositives</span>
                    <span>📊 {preview.tablesFound} tableaux</span>
                    <span className="font-semibold text-foreground">{preview.indicatorsFound} KPIs trouvés</span>
                  </div>

                  {preview.indicators.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1.5 pr-2 font-semibold">Code</th>
                            <th className="text-left py-1.5 pr-2 font-semibold">Indicateur</th>
                            <th className="text-right py-1.5 font-semibold">Valeur</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.indicators.map((ind) => (
                            <tr key={ind.code} className="border-b border-border/50">
                              <td className="py-1.5 pr-2">
                                <Badge variant="outline" className="text-[10px] font-mono">{ind.code}</Badge>
                              </td>
                              <td className="py-1.5 pr-2 truncate max-w-[200px]">{ind.name || '—'}</td>
                              <td className="py-1.5 text-right font-mono">
                                {ind.value !== null ? <span className="text-green-600 font-semibold">{ind.value}</span> : <span className="text-muted-foreground">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Aucun indicateur reconnu dans ce fichier. Vérifiez que les codes KPI (ex: FIN-001) sont présents dans les tableaux.
                    </p>
                  )}
                </div>

                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => { setPreview(null); setSelectedFile(null); }}>
                    Annuler
                  </Button>
                  <Button
                    onClick={handleApply}
                    disabled={applying || withValues === 0}
                    className="gap-2"
                  >
                    {applying ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {applying ? 'Import en cours...' : `Appliquer (${withValues} valeur${withValues > 1 ? 's' : ''})`}
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Global Search ─────────────────────────────────────────────────────────

interface SearchResult {
  type: 'module' | 'indicator';
  id: string;
  name: string;
  code: string | null;
  domain: string;
  domainLabel: string;
  domainColor: string;
  subDomain: string | null;
  value: number | null;
  targetValue: number | null;
  unit: string;
  status: string | null;
}

function GlobalSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { setActiveView, setActiveModule, setHighlightIndicatorId, setHighlightSubDomain, filters } = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout>>();

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const params = new URLSearchParams({ q, year: String(filters.year) });
      if (filters.quarter) params.set('quarter', String(filters.quarter));
      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [filters.year, filters.quarter]);

  function handleValueChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 250);
  }

  function handleSelect(result: SearchResult) {
    onOpenChange(false);
    setQuery('');
    setResults([]);
    if (result.type === 'module') {
      setHighlightSubDomain(null);
      setActiveView(result.domain as ModuleKey);
    } else {
      // Highlight the indicator for 2 seconds with 3-beat echo
      if (result.id) {
        setHighlightIndicatorId(result.id);
        // Also set sub-domain so the module view auto-switches to the right tab
        if (result.subDomain) {
          setHighlightSubDomain(result.subDomain);
        } else {
          setHighlightSubDomain(null);
        }
        // Only clear the visual highlight (animation) after 2.5s
        // highlightSubDomain persists so the tab stays until user manually clicks another tab
        setTimeout(() => setHighlightIndicatorId(null), 2500);
      }
      setActiveView(result.domain as ModuleKey);
    }
  }

  // Group results by domain
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    for (const r of results) {
      const key = r.domainLabel;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [results]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Rechercher un KPI, un indicateur, un module..."
        value={query}
        onValueChange={handleValueChange}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="size-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
            </div>
          ) : query.length >= 2 ? (
            'Aucun résultat trouvé'
          ) : (
            'Tapez au moins 2 caractères pour rechercher'
          )}
        </CommandEmpty>
        {grouped.map(([domainLabel, items]) => (
          <CommandGroup key={domainLabel} heading={domainLabel}>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                value={`${item.name} ${item.code || ''} ${domainLabel}`}
                onSelect={() => handleSelect(item)}
                className="gap-3 py-2.5"
              >
                <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: item.domainColor }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.name}</span>
                    {item.code && (
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">{item.code}</span>
                    )}
                  </div>
                  {item.type === 'indicator' && item.value !== null && (
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      <span>Valeur: <strong className="text-foreground">{item.value}</strong> {item.unit}</span>
                      {item.targetValue !== null && (
                        <span>/ Cible: {item.targetValue}</span>
                      )}
                    </div>
                  )}
                </div>
                {item.type === 'module' && (
                  <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">
                    Module
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

// ─── Main Header ────────────────────────────────────────────────────────────

export function Header() {
  const { activeView, filters, setFilters } = useAppStore();
  const isAdmin = activeView === 'admin';
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut: Ctrl+K / Cmd+K to open search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    filters.periodStart || filters.periodEnd,
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

        {/* Global search button — after title, desktop only */}
        <button
          onClick={() => setSearchOpen(true)}
          className={cn(
            'hidden sm:flex items-center gap-2 h-8 px-3 rounded-md text-xs text-white/60 border border-white/15 bg-white/5 hover:bg-white/15 hover:text-white/90 transition-colors w-[160px] lg:w-[220px] shrink-0 cursor-pointer',
          )}
        >
          <Search className="size-3.5 shrink-0" />
          <span className="flex-1 text-left truncate">Rechercher un KPI...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] text-white/40 bg-white/10 rounded px-1.5 py-0.5 font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* ── Right: filters + export + theme ── */}
      {!isAdmin && (
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
          {/* Desktop inline filters (md+) */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {/* Year */}
            <Select
              value={String(filters.year)}
              onValueChange={(v) => setFilters({ year: Number(v) })}
            >
              <SelectTrigger size="sm" className={cn(HEADER_SELECT, 'w-[82px]')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Quarter */}
            <Select
              value={filters.quarter ? String(filters.quarter) : 'all'}
              onValueChange={(v) => setFilters({ quarter: v === 'all' ? null : Number(v) })}
            >
              <SelectTrigger size="sm" className={cn(HEADER_SELECT, 'w-[76px]')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {QUARTERS.map((q) => (
                  <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Month */}
            <Select
              value={filters.month ? String(filters.month) : 'all'}
              onValueChange={(v) => setFilters({ month: v === 'all' ? null : Number(v) })}
            >
              <SelectTrigger size="sm" className={cn(HEADER_SELECT, 'w-[82px]')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {MONTHS_FR.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Period — visible on lg+ */}
            <div className="hidden lg:block">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      HEADER_SELECT,
                      'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap cursor-pointer',
                      (filters.periodStart || filters.periodEnd) && 'bg-white/20',
                    )}
                  >
                    <CalendarIcon className="size-3.5 shrink-0" />
                    {filters.periodStart && filters.periodEnd
                      ? <span>{formatDateShort(filters.periodStart)} → {formatDateShort(filters.periodEnd)}</span>
                      : filters.periodStart
                        ? <span>Depuis {formatDateShort(filters.periodStart)}</span>
                        : filters.periodEnd
                          ? <span>Jusqu'au {formatDateShort(filters.periodEnd)}</span>
                          : <span className="opacity-70">Période</span>
                    }
                    {(filters.periodStart || filters.periodEnd) && (
                      <X
                        className="size-3 shrink-0 opacity-60 hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); setFilters({ periodStart: null, periodEnd: null }); }}
                      />
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarIcon className="size-4 text-fun-blue" />
                      Période personnalisée
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Date début</Label>
                        <input
                          type="date"
                          value={filters.periodStart || ''}
                          onChange={(e) => setFilters({ periodStart: e.target.value || null })}
                          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Date fin</Label>
                        <input
                          type="date"
                          value={filters.periodEnd || ''}
                          onChange={(e) => setFilters({ periodEnd: e.target.value || null })}
                          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Department — visible on xl+ */}
            <div className="hidden xl:block">
              <Select
                value={filters.departmentId || 'all'}
                onValueChange={(v) => setFilters({ departmentId: v === 'all' ? null : v })}
              >
                <SelectTrigger size="sm" className={cn(HEADER_SELECT, 'w-[190px]')}>
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

            <ImportPptxButton />
            <ExportDropdown />
          </div>

          {/* ── Mobile search icon ── */}
          <button
            onClick={() => setSearchOpen(true)}
            className="sm:hidden h-8 w-8 flex items-center justify-center border border-white/20 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
            aria-label="Rechercher"
          >
            <Search className="size-3.5" />
          </button>

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
                        <CalendarIcon className="size-3" />
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

                  {/* Period + Department */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <CalendarIcon className="size-3" />
                        Période
                      </Label>
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="date"
                          value={filters.periodStart || ''}
                          onChange={(e) => setFilters({ periodStart: e.target.value || null })}
                          placeholder="Début"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <input
                          type="date"
                          value={filters.periodEnd || ''}
                          onChange={(e) => setFilters({ periodEnd: e.target.value || null })}
                          placeholder="Fin"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
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
                    Période, Département et Export
                  </SheetDescription>
                </SheetHeader>

                <div className="px-4 py-4 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium flex items-center gap-1.5">
                        <CalendarIcon className="size-3" />
                        Période
                      </Label>
                      <div className="flex flex-col gap-1.5">
                        <input
                          type="date"
                          value={filters.periodStart || ''}
                          onChange={(e) => setFilters({ periodStart: e.target.value || null })}
                          placeholder="Début"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                        <input
                          type="date"
                          value={filters.periodEnd || ''}
                          onChange={(e) => setFilters({ periodEnd: e.target.value || null })}
                          placeholder="Fin"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
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

      {/* Admin: search + theme toggle */}
      {isAdmin && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            className="h-8 w-8 flex items-center justify-center border border-white/20 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
            aria-label="Rechercher"
          >
            <Search className="size-3.5" />
          </button>
          <ThemeToggle />
        </div>
      )}

      {/* Global Search Dialog */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}