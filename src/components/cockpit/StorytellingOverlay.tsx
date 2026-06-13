'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useAppStore, type ModuleKey } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KpiData {
  code: string;
  name: string;
  subDomain: string | null;
  unit: string;
  targetValue: number | null;
  alertValue: number | null;
  criticalValue: number | null;
  isPriority: boolean;
  department: string | null;
  latestValue: number | null;
  latestPeriod: string | null;
}

const MODULE_LABELS: Record<string, string> = {
  governance: 'Gouvernance',
  finance: 'Finance',
  operational: 'Opérationnel',
  rh: 'Ressources Humaines',
  risque: 'Cadre de Risque',
  pta: 'Plan de Travail Annuel',
};

const SUB_DOMAIN_LABELS: Record<string, string> = {
  reporting_reglementaire: 'Reporting réglementaire',
  gouvernance_ethique: 'Gouvernance & Éthique',
  marches_publics: 'Passation des Marchés Publics',
  relations_publiques: 'Dons, Honoraires & Relations Publiques',
  execution_budgetaire: 'Exécution budgétaire',
  rentabilite: 'Rentabilité & Performance',
  ressources_specifiques: 'Ressources Spécifiques',
  dette: 'Endettement',
  deploiement_infra: 'Déploiement Infrastructures',
  relations_operateurs: 'Relations Opérateurs',
  service_universel: 'Service Universel',
  projets_programmes: 'Projets & Programmes',
  effectifs: 'Effectifs & Organisation',
  performance: 'Performance & Productivité',
  competences: 'Développement Compétences',
  couts_rh: 'Maîtrise Coûts RH',
  risque_strategique: 'Risque Stratégique',
  risque_financier: 'Risque Financier',
  risque_operationnel: 'Risque Opérationnel',
  risque_technologique: 'Risque Technologique',
  risque_gouvernance: 'Risque Gouvernance',
  pta_gouvernance: 'Gouvernance',
  pta_operationnel: 'Opérationnel',
  pta_finance: 'Finance',
};

function getStatus(
  value: number | null,
  target: number | null,
  alert: number | null,
  critical: number | null,
  unit: string,
): 'atteint' | 'partiel' | 'non_atteint' {
  if (value === null || target === null) return 'non_atteint';
  const isInverse = unit === '%' ? value <= target : value >= target;
  if (!isInverse) {
    if (critical !== null && value >= critical) return 'non_atteint';
    if (alert !== null && value >= alert) return 'partiel';
    return 'partiel';
  }
  if (alert !== null) {
    const isAlertInverse = unit === '%' ? value <= alert : value >= alert;
    return isAlertInverse ? 'atteint' : 'partiel';
  }
  return 'atteint';
}

const STATUS_CONFIG = {
  atteint: { label: 'Atteint', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  partiel: { label: 'Partiel', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  non_atteint: { label: 'Non atteint', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
} as const;

// ─── Slide types ──────────────────────────────────────────────────────────────

interface Slide {
  type: 'title' | 'synthesis' | 'subdomain' | 'closing';
  title: string;
  module?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface StorytellingOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function StorytellingOverlay({ open, onClose }: StorytellingOverlayProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { activeView, filters } = useAppStore();
  const [indicators, setIndicators] = useState<KpiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const modName = activeView === 'accueil' ? 'governance' : activeView;
  const moduleLabel = MODULE_LABELS[modName] || modName;

  // Fetch indicators
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const params = new URLSearchParams({ domain: modName });
    if (filters.year) params.set('year', String(filters.year));
    if (filters.quarter) params.set('quarter', String(filters.quarter));
    if (filters.month) params.set('month', String(filters.month));
    fetch(`/api/indicators/domain?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const raw = (data.indicators || data) as Record<string, unknown>[];
          const mapped = raw.map((ind) => {
            const vals = (ind.values as Array<{value: number; period: string}>) || [];
            const latest = vals.length > 0 ? vals[vals.length - 1] : null;
            return {
              code: ind.code as string,
              name: ind.name as string,
              subDomain: (ind.subDomain as string) || null,
              unit: (ind.unit as string) || '',
              targetValue: ind.targetValue as number | null,
              alertValue: ind.alertValue as number | null,
              criticalValue: ind.criticalValue as number | null,
              isPriority: !!(ind.isPriority),
              department: null,
              latestValue: latest?.value ?? null,
              latestPeriod: latest?.period ?? null,
            };
          });
          setIndicators(mapped);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, modName, filters.year, filters.quarter, filters.month]);

  // Build slides
  const slides = useCallback((): Slide[] => {
    if (indicators.length === 0) return [{ type: 'title', title: moduleLabel }];
    const grouped = new Map<string, KpiData[]>();
    for (const ind of indicators) {
      const sd = ind.subDomain || 'autre';
      if (!grouped.has(sd)) grouped.set(sd, []);
      grouped.get(sd)!.push(ind);
    }
    const result: Slide[] = [
      { type: 'title', title: moduleLabel, module: 'Cockpit Direction Générale' },
      { type: 'synthesis', title: `Synthèse — ${moduleLabel}` },
    ];
    for (const [key] of grouped) {
      result.push({
        type: 'subdomain',
        title: SUB_DOMAIN_LABELS[key] || key.replace(/_/g, ' '),
        module: key,
      });
    }
    result.push({ type: 'closing', title: 'Merci' });
    return result;
  }, [indicators, moduleLabel]);

  const slideList = slides();
  const totalSlides = slideList.length;

  // Auto-play timer
  useEffect(() => {
    if (!open || !playing || loading) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [open, playing, loading, totalSlides]);

  // Reset slide on open via key-based reset in parent, default state handles it

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  // Escape key
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'p' || e.key === 'P') { setPlaying((p) => !p); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, totalSlides, goNext, goPrev, onClose]);

  const current = slideList[currentSlide] as Slide | undefined;

  // ─── Grouped data for subdomain slides ───
  const grouped = new Map<string, KpiData[]>();
  for (const ind of indicators) {
    const sd = ind.subDomain || 'autre';
    if (!grouped.has(sd)) grouped.set(sd, []);
    grouped.get(sd)!.push(ind);
  }

  // Stats for synthesis
  let totalAtteint = 0, totalPartiel = 0, totalNonAtteint = 0, totalNoValue = 0;
  for (const ind of indicators) {
    if (ind.latestValue === null) { totalNoValue++; continue; }
    const s = getStatus(ind.latestValue, ind.targetValue, ind.alertValue, ind.criticalValue, ind.unit);
    if (s === 'atteint') totalAtteint++;
    else if (s === 'partiel') totalPartiel++;
    else totalNonAtteint++;
  }

  const filterLabel = [String(filters.year), filters.quarter ? `T${filters.quarter}` : null, filters.month ? `M${filters.month}` : null].filter(Boolean).join(' — ');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-white dark:bg-[#0f172a] text-slate-900 dark:text-white flex flex-col"
        >
          {/* ── Top bar ── */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-slate-200 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-sm font-bold text-tango tracking-wide">STORYTELLING</span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-white/40">{currentSlide + 1} / {totalSlides}</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={goPrev}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Précédent"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                aria-label={playing ? 'Pause' : 'Lecture'}
              >
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>
              <button
                onClick={goNext}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                aria-label="Suivant"
              >
                <ChevronRight className="size-4" />
              </button>
              <div className="w-px h-4 bg-slate-300 dark:bg-white/20 mx-1" />
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400 hover:text-slate-700 dark:text-white/60 dark:hover:text-white"
                aria-label="Fermer (Échap)"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div className="h-0.5 bg-slate-200 dark:bg-white/10 shrink-0">
            <motion.div
              className="h-full bg-tango"
              animate={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* ── Slide content ── */}
          <div className="flex-1 relative overflow-hidden">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-tango" />
              </div>
            ) : (
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentSlide}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -direction * 60 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-16"
                >
                  {/* ─ TITLE SLIDE ─ */}
                  {current?.type === 'title' && (
                    <div className="text-center max-w-3xl">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                      >
                        <div className="flex justify-center mb-6">
                          <img src="/favicon.svg" alt="ANSUT" className="size-14 sm:size-16" />
                        </div>
                        <p className="text-[10px] sm:text-sm text-slate-500 dark:text-white/40 tracking-[0.3em] uppercase mb-2">Agence Nationale des Services Universels des Télécommunications</p>
                        <h1 className="text-3xl sm:text-6xl lg:text-7xl font-bold mb-4">
                          <span className="text-tango">Cockpit</span>{' '}
                          <span className="text-white dark:text-slate-900">DG</span>
                        </h1>
                        <div className="w-16 h-1 bg-tango mx-auto mb-6" />
                        <h2 className="text-xl sm:text-3xl lg:text-4xl font-semibold text-slate-800 dark:text-white/90 mb-8">{current.title}</h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-white/40">{filterLabel}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-white/25 mt-2">{indicators.length} indicateurs · {grouped.size} sous-domaines</p>
                      </motion.div>
                    </div>
                  )}

                  {/* ─ SYNTHESIS SLIDE ─ */}
                  {current?.type === 'synthesis' && (
                    <div className="w-full max-w-5xl">
                      <motion.h2
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl sm:text-3xl font-bold mb-8 text-center"
                      >
                        {current.title}
                      </motion.h2>

                      {/* KPI cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-10">
                        {[
                          { label: 'Atteint', value: totalAtteint, color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
                          { label: 'Partiel', value: totalPartiel, color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10' },
                          { label: 'Non atteint', value: totalNonAtteint, color: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/10' },
                          { label: 'Sans valeur', value: totalNoValue, color: 'text-slate-400 dark:text-white/40', border: 'border-slate-200 dark:border-white/10', bg: 'bg-slate-100 dark:bg-white/5' },
                        ].map((card, i) => (
                          <motion.div
                            key={card.label}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.15 + i * 0.08 }}
                            className={cn('rounded-xl border p-3 sm:p-5 text-center', card.border, card.bg)}
                          >
                            <p className={cn('text-2xl sm:text-4xl lg:text-5xl font-bold', card.color)}>{card.value}</p>
                            <p className="text-xs text-slate-500 dark:text-white/50 mt-1">{card.label}</p>
                          </motion.div>
                        ))}
                      </div>

                      {/* Sub-domain table */}
                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto"
                      >
                        <div className="min-w-[450px]">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-white/5">
                              <th className="text-left py-2.5 px-4 font-semibold text-slate-500 dark:text-white/70">Sous-domaine</th>
                              <th className="text-center py-2.5 px-3 font-semibold text-slate-500 dark:text-white/70">Total</th>
                              <th className="text-center py-2.5 px-3 font-semibold text-emerald-400/70">Atteint</th>
                              <th className="text-center py-2.5 px-3 font-semibold text-amber-400/70">Partiel</th>
                              <th className="text-center py-2.5 px-3 font-semibold text-red-400/70">Non atteint</th>
                              <th className="text-center py-2.5 px-4 font-semibold text-slate-500 dark:text-white/70">Taux</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from(grouped.entries()).map(([key, inds]) => {
                              let a = 0, p = 0, n = 0;
                              for (const ind of inds) {
                                if (ind.latestValue === null) { n++; continue; }
                                const s = getStatus(ind.latestValue, ind.targetValue, ind.alertValue, ind.criticalValue, ind.unit);
                                if (s === 'atteint') a++;
                                else if (s === 'partiel') p++;
                                else n++;
                              }
                              const rate = inds.length > 0 ? Math.round((a / inds.length) * 100) : 0;
                              const rateColor = rate >= 75 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-red-400';
                              return (
                                <tr key={key} className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                  <td className="py-2 px-4 font-medium">{SUB_DOMAIN_LABELS[key] || key.replace(/_/g, ' ')}</td>
                                  <td className="py-2 px-3 text-center text-slate-400 dark:text-white/60">{inds.length}</td>
                                  <td className="py-2 px-3 text-center text-emerald-400 font-semibold">{a}</td>
                                  <td className="py-2 px-2 text-center text-amber-400 font-semibold">{p}</td>
                                  <td className="py-2 px-3 text-center text-red-400 font-semibold">{n}</td>
                                  <td className={cn('py-2 px-4 text-center font-bold', rateColor)}>{rate}%</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* ─ SUBDOMAIN SLIDE ─ */}
                  {current?.type === 'subdomain' && current.module && (() => {
                    const sdIndicators = grouped.get(current.module) || [];
                    return (
                      <div className="w-full max-w-6xl">
                        <motion.h2
                          initial={{ y: -20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-xl sm:text-2xl font-bold mb-1"
                        >
                          {current.title}
                        </motion.h2>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-xs text-slate-500 dark:text-white/40 mb-6"
                        >
                          {moduleLabel} · {sdIndicators.length} indicateurs
                        </motion.p>

                        <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto">
                          <div className="min-w-[500px] max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <table className="w-full text-sm">
                              <thead className="sticky top-0 bg-slate-100 dark:bg-[#1e293b] z-10">
                                <tr>
                                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 dark:text-white/60 text-xs">Code</th>
                                  <th className="text-left py-2.5 px-3 font-semibold text-slate-500 dark:text-white/60 text-xs">Indicateur</th>
                                  <th className="text-center py-2.5 px-2 font-semibold text-slate-500 dark:text-white/60 text-xs">Unité</th>
                                  <th className="text-right py-2.5 px-2 font-semibold text-slate-500 dark:text-white/60 text-xs">Cible</th>
                                  <th className="text-right py-2.5 px-2 font-semibold text-slate-500 dark:text-white/60 text-xs">Valeur</th>
                                  <th className="text-right py-2.5 px-2 font-semibold text-slate-500 dark:text-white/60 text-xs">Écart</th>
                                  <th className="text-center py-2.5 px-3 font-semibold text-slate-500 dark:text-white/60 text-xs">Statut</th>
                                </tr>
                              </thead>
                              <tbody>
                                {sdIndicators.map((ind, i) => {
                                  const val = ind.latestValue;
                                  const target = ind.targetValue;
                                  const ecart = val !== null && target !== null ? val - target : null;
                                  const st = getStatus(val, target, ind.alertValue, ind.criticalValue, ind.unit);
                                  const stCfg = STATUS_CONFIG[st];
                                  const ecartStr = ecart !== null ? `${ecart > 0 ? '+' : ''}${ecart.toFixed(1)}` : '—';
                                  const ecartColor = ecart !== null
                                    ? (ind.unit === '%' ? (ecart <= 0 ? 'text-emerald-400' : 'text-red-400') : (ecart >= 0 ? 'text-emerald-400' : 'text-red-400'))
                                    : 'text-slate-400 dark:text-white/30';
                                  return (
                                    <motion.tr
                                      key={ind.code}
                                      initial={{ x: -10, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      transition={{ delay: 0.1 + i * 0.03 }}
                                      className="border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                      <td className="py-2.5 px-3 font-mono text-xs font-semibold">
                                        <span className={cn(ind.isPriority ? 'text-tango' : 'text-slate-700 dark:text-white/70')}>{ind.code}</span>
                                        {ind.isPriority && <span className="text-tango ml-1">★</span>}
                                      </td>
                                      <td className="py-2.5 px-3 text-xs max-w-[300px] truncate" title={ind.name}>{ind.name}</td>
                                      <td className="py-2.5 px-2 text-center text-xs text-slate-400 dark:text-white/50">{ind.unit}</td>
                                      <td className="py-2.5 px-2 text-right text-xs text-slate-400 dark:text-white/60">{target ?? '—'}</td>
                                      <td className="py-2.5 px-2 text-right text-xs font-bold">{val ?? '—'}</td>
                                      <td className={cn('py-2.5 px-2 text-right text-xs font-bold', ecartColor)}>{ecartStr}</td>
                                      <td className="py-2.5 px-3 text-center">
                                        <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border', stCfg.bg, stCfg.color, stCfg.border)}>
                                          {stCfg.label}
                                        </span>
                                      </td>
                                    </motion.tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ─ CLOSING SLIDE ─ */}
                  {current?.type === 'closing' && (
                    <div className="text-center max-w-2xl">
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                      >
                        <div className="flex justify-center mb-6">
                          <img src="/favicon.svg" alt="ANSUT" className="size-14 sm:size-16" />
                        </div>
                        <div className="w-16 h-1 bg-tango mx-auto mb-6" />
                        <h1 className="text-3xl sm:text-5xl font-bold mb-4">
                          <span className="text-tango">Merci</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-white/40 mb-8">{moduleLabel} · {filterLabel}</p>
                        <p className="text-[10px] sm:text-xs text-slate-400 dark:text-white/25">
                          Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50 font-mono mx-0.5">Échap</kbd> pour quitter
                        </p>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* ── Bottom bar ── */}
          <div className="hidden sm:flex items-center justify-between px-6 py-2.5 border-t border-slate-200 dark:border-white/10 text-[10px] text-slate-400 dark:text-white/30 shrink-0">
            <span>ANSUT Cockpit DG v1.0</span>
            <span>
              {playing ? 'Lecture auto · 6s' : 'En pause'} · Flèches pour naviguer · P pour pause · Échap pour quitter
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}