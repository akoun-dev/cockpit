'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import {
  Settings,
  Globe,
  Bell,
  Shield,
  Server,
  Save,
  CheckCircle2,
  Info,
  Palette,
  Clock,
  Mail,
  Lock,
  HardDrive,
  Loader2,
  FileText,
  FileSpreadsheet,
  Presentation,
  ImageIcon as ImageLucide,
  CalendarDays,
  Hash,
  Languages,
  Building2,
  RefreshCw,
  CalendarRange,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useErrorHandler } from '@/hooks/use-error-handler';

// ---------- Types ----------

interface SystemInfo {
  totalUsers: number;
  totalRoles: number;
  totalIndicators: number;
  diskUsage: string;
}

interface SettingsState {
  // Configuration Générale
  appName: string;
  logoUrl: string;
  version: string;
  defaultLanguage: string;
  timezone: string;
  dateFormat: string;
  // Affichage
  theme: string;
  referenceDate: string;
  currencyFormat: string;
  decimalSeparator: string;
  decimalPlaces: string;
  numberFormat: string;
  // Notifications
  emailAlerts: boolean;
  reportFrequency: string;
  recipientEmail: string;
  // Tableau de bord
  dashboardRefreshFrequency: string;
  dashboardDefaultPeriod: string;
  // Sécurité
  passwordPolicy: string;
  sessionExpiration: string;
  ipLogging: boolean;
  // Export & Rapports
  pdfTemplate: string;
  pptTemplate: string;
  excelTemplate: string;
  defaultExportFormat: string;
  includeLogo: boolean;
  includeGenerationDate: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  appName: 'ANSUT Cockpit DG',
  logoUrl: '/logo-ansut-square.png',
  version: '1.0.0',
  defaultLanguage: 'fr',
  timezone: 'Africa/Abidjan',
  dateFormat: 'DD/MM/YYYY',
  theme: 'system',
  referenceDate: new Date().toISOString().split('T')[0],
  currencyFormat: 'FCFA',
  decimalSeparator: 'comma',
  decimalPlaces: '2',
  numberFormat: '1 234,56',
  emailAlerts: true,
  reportFrequency: 'weekly',
  recipientEmail: 'admin@ansut.sn',
  passwordPolicy: 'standard',
  sessionExpiration: '4h',
  ipLogging: true,
  dashboardRefreshFrequency: '30s',
  dashboardDefaultPeriod: 'mois-en-cours',
  pdfTemplate: 'standard',
  pptTemplate: 'standard',
  excelTemplate: 'standard',
  defaultExportFormat: 'pdf',
  includeLogo: true,
  includeGenerationDate: true,
};

// ---------- Component ----------

export function AdminSettings() {
  const { theme, setTheme } = useTheme();
  const { handleError, handleSuccess, handleApiError } = useErrorHandler();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loadingSystem, setLoadingSystem] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure client-side hydration before rendering theme-dependent UI
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync next-themes value into local state
  useEffect(() => {
    if (mounted && theme) {
      setSettings((prev) => ({ ...prev, theme }));
    }
  }, [theme, mounted]);

  // Keys to persist to backend
  const PERSIST_KEYS: (keyof SettingsState)[] = [
    'pdfTemplate',
    'pptTemplate',
    'excelTemplate',
    'defaultExportFormat',
    'includeLogo',
    'includeGenerationDate',
    'sessionExpiration',
    'reportFrequency',
    'recipientEmail',
    'emailAlerts',
  ];

  // Fetch persisted settings from API
  const fetchPersistedSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json() as Record<string, unknown>;
        setSettings((prev) => {
          const merged = { ...prev };
          for (const key of PERSIST_KEYS) {
            if (key in data && data[key] !== undefined) {
              (merged as Record<string, unknown>)[key] = data[key];
            }
          }
          return merged;
        });
      }
    } catch {
      handleError('le chargement des paramètres sauvegardés');
    }
  }, []);

  // Fetch system info from API
  const fetchSystemInfo = useCallback(async () => {
    setLoadingSystem(true);
    try {
      const res = await fetch('/api/admin/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        setSystemInfo({
          totalUsers: data.totalUsers ?? 0,
          totalRoles: data.totalRoles ?? 0,
          totalIndicators: data.configuredModules ?? 0,
          diskUsage: '142 Mo',
        });
      } else {
        setSystemInfo(null);
        handleApiError('le chargement des informations système', res);
      }
    } catch (e) {
      setSystemInfo(null);
      handleError('le chargement des informations système', e);
    } finally {
      setLoadingSystem(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemInfo();
    fetchPersistedSettings();
  }, [fetchSystemInfo, fetchPersistedSettings]);

  // ---------- Handlers ----------

  const handleChange = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleThemeChange = (value: string) => {
    handleChange('theme', value);
    setTheme(value);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build a single payload with all persisted settings
      const payload: Record<string, unknown> = {};
      for (const key of PERSIST_KEYS) {
        payload[key] = settings[key];
      }
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
      handleSuccess('Paramètres sauvegardés', 'Les paramètres ont été mis à jour avec succès.');
      } else {
        await handleApiError('la sauvegarde des paramètres', res);
      }
    } catch {
      handleError('la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  // ---------- Render helpers ----------

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-48 sm:w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-fun-blue/10 p-2">
            <Settings className="size-5 text-fun-blue" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              Configuration générale de la plateforme ANSUT Cockpit DG
            </p>
          </div>
        </div>
      </div>


      <div className="grid gap-6 lg:grid-cols-2">
        {/* ====== 1. Configuration Générale ====== */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="shrink-0 rounded-md bg-fun-blue/10 p-1.5">
                <Globe className="size-4 text-fun-blue" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base">Configuration Générale</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  Informations de base de l&apos;application
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            {/* Nom de l'application */}
            <div className="space-y-1.5">
              <Label htmlFor="appName" className="text-sm font-medium">
                Nom de l&apos;application
              </Label>
              <Input
                id="appName"
                value={settings.appName}
                onChange={(e) => handleChange('appName', e.target.value)}
                placeholder="Nom de l'application"
                className="h-9"
              />
            </div>

            {/* Logo URL */}
            <div className="space-y-1.5">
              <Label htmlFor="logoUrl" className="text-sm font-medium">
                URL du logo
              </Label>
              <Input
                id="logoUrl"
                value={settings.logoUrl}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
                placeholder="/logo-ansut-square.png"
                className="h-9"
              />
            </div>

            {/* Version (readonly) */}
            <div className="space-y-1.5">
              <Label htmlFor="version" className="text-sm font-medium">
                Version
              </Label>
              <div className="relative">
                <Input
                  id="version"
                  value={settings.version}
                  readOnly
                  className="h-9 cursor-not-allowed bg-muted/50"
                />
                <Badge
                  variant="secondary"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]"
                >
                  Lecture seule
                </Badge>
              </div>
            </div>

            {/* Langue par défaut */}
            <div className="space-y-1.5">
              <Label htmlFor="defaultLanguage" className="text-sm font-medium flex items-center gap-1.5">
                <Languages className="shrink-0 size-3.5 text-muted-foreground" />
                Langue par défaut
              </Label>
              <Select
                value={settings.defaultLanguage}
                onValueChange={(v) => handleChange('defaultLanguage', v)}
              >
                <SelectTrigger id="defaultLanguage" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner une langue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="en">🇬🇧 Anglais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fuseau horaire */}
            <div className="space-y-1.5">
              <Label htmlFor="timezone" className="text-sm font-medium flex items-center gap-1.5">
                <Clock className="shrink-0 size-3.5 text-muted-foreground" />
                Fuseau horaire
              </Label>
              <Select
                value={settings.timezone}
                onValueChange={(v) => handleChange('timezone', v)}
              >
                <SelectTrigger id="timezone" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner un fuseau horaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Kinshasa">Africa/Kinshasa (UTC+1)</SelectItem>
                  <SelectItem value="Africa/Abidjan">Africa/Abidjan (UTC+0)</SelectItem>
                  <SelectItem value="UTC">UTC (UTC+0)</SelectItem>
                  <SelectItem value="Europe/Paris">Europe/Paris (UTC+1/+2)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format de date */}
            <div className="space-y-1.5">
              <Label htmlFor="dateFormat" className="text-sm font-medium flex items-center gap-1.5">
                <CalendarDays className="shrink-0 size-3.5 text-muted-foreground" />
                Format de date
              </Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(v) => handleChange('dateFormat', v)}
              >
                <SelectTrigger id="dateFormat" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner un format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (31/12/2025)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2025)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2025-12-31)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fréquence de rafraîchissement du tableau de bord */}
            <div className="space-y-1.5">
              <Label htmlFor="dashboardRefreshFrequency" className="text-sm font-medium flex items-center gap-1.5">
                <RefreshCw className="shrink-0 size-3.5 text-muted-foreground" />
                Fréquence de rafraîchissement du tableau de bord
              </Label>
              <Select
                value={settings.dashboardRefreshFrequency}
                onValueChange={(v) => handleChange('dashboardRefreshFrequency', v)}
              >
                <SelectTrigger id="dashboardRefreshFrequency" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner une fréquence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5s">Temps réel (5s)</SelectItem>
                  <SelectItem value="30s">30 secondes</SelectItem>
                  <SelectItem value="1m">1 minute</SelectItem>
                  <SelectItem value="5m">5 minutes</SelectItem>
                  <SelectItem value="15m">15 minutes</SelectItem>
                  <SelectItem value="30m">30 minutes</SelectItem>
                  <SelectItem value="manual">Manuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Période par défaut du tableau de bord */}
            <div className="space-y-1.5">
              <Label htmlFor="dashboardDefaultPeriod" className="text-sm font-medium flex items-center gap-1.5">
                <CalendarRange className="shrink-0 size-3.5 text-muted-foreground" />
                Période par défaut du tableau de bord
              </Label>
              <Select
                value={settings.dashboardDefaultPeriod}
                onValueChange={(v) => handleChange('dashboardDefaultPeriod', v)}
              >
                <SelectTrigger id="dashboardDefaultPeriod" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner une période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mois-en-cours">Mois en cours</SelectItem>
                  <SelectItem value="trimestre-en-cours">Trimestre en cours</SelectItem>
                  <SelectItem value="semestre-en-cours">Semestre en cours</SelectItem>
                  <SelectItem value="annee-en-cours">Année en cours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ====== 2. Affichage ====== */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="shrink-0 rounded-md bg-tango/10 p-1.5">
                <Palette className="size-4 text-tango" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base">Affichage</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  Personnaliser le rendu visuel
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            {/* Thème */}
            <div className="space-y-1.5">
              <Label htmlFor="theme" className="text-sm font-medium">
                Thème
              </Label>
              <Select value={settings.theme} onValueChange={handleThemeChange}>
                <SelectTrigger id="theme" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner un thème" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">☀️ Clair</SelectItem>
                  <SelectItem value="dark">🌙 Sombre</SelectItem>
                  <SelectItem value="system">💻 Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date de référence */}
            <div className="space-y-1.5">
              <Label htmlFor="referenceDate" className="text-sm font-medium">
                Date de référence
              </Label>
              <Input
                id="referenceDate"
                type="date"
                value={settings.referenceDate}
                onChange={(e) => handleChange('referenceDate', e.target.value)}
                className="h-9"
              />
            </div>

            {/* Format monétaire */}
            <div className="space-y-1.5">
              <Label htmlFor="currencyFormat" className="text-sm font-medium">
                Format monétaire
              </Label>
              <Select
                value={settings.currencyFormat}
                onValueChange={(v) => handleChange('currencyFormat', v)}
              >
                <SelectTrigger id="currencyFormat" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner une devise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FCFA">FCFA</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Séparateur décimal */}
            <div className="space-y-1.5">
              <Label htmlFor="decimalSeparator" className="text-sm font-medium">
                Séparateur décimal
              </Label>
              <Select
                value={settings.decimalSeparator}
                onValueChange={(v) => handleChange('decimalSeparator', v)}
              >
                <SelectTrigger id="decimalSeparator" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner un séparateur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comma">Virgule (,)</SelectItem>
                  <SelectItem value="point">Point (.)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nombre de décimales */}
            <div className="space-y-1.5">
              <Label htmlFor="decimalPlaces" className="text-sm font-medium flex items-center gap-1.5">
                <Hash className="shrink-0 size-3.5 text-muted-foreground" />
                Nombre de décimales
              </Label>
              <Select
                value={settings.decimalPlaces}
                onValueChange={(v) => handleChange('decimalPlaces', v)}
              >
                <SelectTrigger id="decimalPlaces" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 (entier)</SelectItem>
                  <SelectItem value="1">1 décimale</SelectItem>
                  <SelectItem value="2">2 décimales</SelectItem>
                  <SelectItem value="3">3 décimales</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format des nombres */}
            <div className="space-y-1.5">
              <Label htmlFor="numberFormat" className="text-sm font-medium flex items-center gap-1.5">
                <Hash className="shrink-0 size-3.5 text-muted-foreground" />
                Format des nombres
              </Label>
              <Select
                value={settings.numberFormat}
                onValueChange={(v) => handleChange('numberFormat', v)}
              >
                <SelectTrigger id="numberFormat" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner un format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1 234,56">1 234,56 (espace + virgule)</SelectItem>
                  <SelectItem value="1234.56">1234.56 (pas de séparateur)</SelectItem>
                  <SelectItem value="1.234,56">1.234,56 (point + virgule)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ====== 3. Export & Rapports ====== */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="shrink-0 rounded-md bg-emerald-100 p-1.5 dark:bg-emerald-900/30">
                <FileText className="size-4 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base">Export & Rapports</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  Configurer les templates et options d&apos;export
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            {/* Template PDF */}
            <div className="space-y-1.5">
              <Label htmlFor="pdfTemplate" className="text-sm font-medium flex items-center gap-1.5">
                <FileText className="shrink-0 size-3.5 text-muted-foreground" />
                Template PDF
              </Label>
              <Select
                value={settings.pdfTemplate}
                onValueChange={(v) => handleChange('pdfTemplate', v)}
              >
                <SelectTrigger id="pdfTemplate" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template PPT */}
            <div className="space-y-1.5">
              <Label htmlFor="pptTemplate" className="text-sm font-medium flex items-center gap-1.5">
                <Presentation className="shrink-0 size-3.5 text-muted-foreground" />
                Template PPT
              </Label>
              <Select
                value={settings.pptTemplate}
                onValueChange={(v) => handleChange('pptTemplate', v)}
              >
                <SelectTrigger id="pptTemplate" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Template Excel */}
            <div className="space-y-1.5">
              <Label htmlFor="excelTemplate" className="text-sm font-medium flex items-center gap-1.5">
                <FileSpreadsheet className="shrink-0 size-3.5 text-muted-foreground" />
                Template Excel
              </Label>
              <Select
                value={settings.excelTemplate}
                onValueChange={(v) => handleChange('excelTemplate', v)}
              >
                <SelectTrigger id="excelTemplate" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner un template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Format par défaut */}
            <div className="space-y-1.5">
              <Label htmlFor="defaultExportFormat" className="text-sm font-medium">
                Format par défaut
              </Label>
              <Select
                value={settings.defaultExportFormat}
                onValueChange={(v) => handleChange('defaultExportFormat', v)}
              >
                <SelectTrigger id="defaultExportFormat" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner un format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pptx">PowerPoint</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Include Logo ANSUT */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <Label htmlFor="includeLogo" className="text-sm font-medium flex items-center gap-1.5">
                  <ImageLucide className="shrink-0 size-3.5 text-muted-foreground" />
                  <span className="truncate">Inclure le logo ANSUT</span>
                </Label>
                <p className="truncate text-xs text-muted-foreground">
                  Afficher le logo sur les exports et rapports
                </p>
              </div>
              <Switch
                className="shrink-0"
                id="includeLogo"
                checked={settings.includeLogo}
                onCheckedChange={(v) => handleChange('includeLogo', v)}
              />
            </div>

            <Separator />

            {/* Include generation date */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <Label htmlFor="includeGenerationDate" className="text-sm font-medium flex items-center gap-1.5">
                  <CalendarDays className="shrink-0 size-3.5 text-muted-foreground" />
                  <span className="truncate">Inclure la date de génération</span>
                </Label>
                <p className="truncate text-xs text-muted-foreground">
                  Ajouter la date et l&apos;heure sur les documents exportés
                </p>
              </div>
              <Switch
                className="shrink-0"
                id="includeGenerationDate"
                checked={settings.includeGenerationDate}
                onCheckedChange={(v) => handleChange('includeGenerationDate', v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* ====== 4. Notifications ====== */}
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="shrink-0 rounded-md bg-green-100 p-1.5 dark:bg-green-900/30">
                <Bell className="size-4 text-green-700 dark:text-green-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  Gérer les alertes et rapports
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-4 sm:p-6">
            {/* Alertes par email */}
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-0.5">
                <Label htmlFor="emailAlerts" className="text-sm font-medium">
                  Alertes par email
                </Label>
                <p className="truncate text-xs text-muted-foreground">
                  Recevoir les notifications par courriel
                </p>
              </div>
              <Switch
                className="shrink-0"
                id="emailAlerts"
                checked={settings.emailAlerts}
                onCheckedChange={(v) => handleChange('emailAlerts', v)}
              />
            </div>

            <Separator />

            {/* Fréquence rapport */}
            <div className="space-y-1.5">
              <Label htmlFor="reportFrequency" className="text-sm font-medium">
                Fréquence du rapport
              </Label>
              <Select
                value={settings.reportFrequency}
                onValueChange={(v) => handleChange('reportFrequency', v)}
              >
                <SelectTrigger id="reportFrequency" className="h-9 w-full">
                  <SelectValue placeholder="Sélectionner une fréquence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Journalier</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email destinataire */}
            <div className="space-y-1.5">
              <Label htmlFor="recipientEmail" className="text-sm font-medium flex items-center gap-1.5">
                <Mail className="shrink-0 size-3.5 text-muted-foreground" />
                Email destinataire
              </Label>
              <Input
                id="recipientEmail"
                type="email"
                value={settings.recipientEmail}
                onChange={(e) => handleChange('recipientEmail', e.target.value)}
                placeholder="admin@ansut.sn"
                className="h-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* ====== 5. Sécurité ====== */}
        <Card className="transition-shadow hover:shadow-md lg:col-span-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2.5">
              <div className="shrink-0 rounded-md bg-purple-100 p-1.5 dark:bg-purple-900/30">
                <Shield className="size-4 text-purple-700 dark:text-purple-400" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base">Sécurité</CardTitle>
                <CardDescription className="mt-0.5 text-xs">
                  Politiques d&apos;authentification et de session
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Politique de mot de passe */}
              <div className="space-y-1.5">
                <Label htmlFor="passwordPolicy" className="text-sm font-medium flex items-center gap-1.5">
                  <Lock className="shrink-0 size-3.5 text-muted-foreground" />
                  Politique de mot de passe
                </Label>
                <Select
                  value={settings.passwordPolicy}
                  onValueChange={(v) => handleChange('passwordPolicy', v)}
                >
                  <SelectTrigger id="passwordPolicy" className="h-9 w-full">
                    <SelectValue placeholder="Sélectionner une politique" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="enhanced">Renforcé</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  {settings.passwordPolicy === 'standard'
                    ? 'Minimum 8 caractères, lettres et chiffres.'
                    : 'Minimum 12 caractères, majuscules, minuscules, chiffres et symboles.'}
                </p>
              </div>

              {/* Expiration session */}
              <div className="space-y-1.5">
                <Label htmlFor="sessionExpiration" className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="shrink-0 size-3.5 text-muted-foreground" />
                  Expiration de session
                </Label>
                <Select
                  value={settings.sessionExpiration}
                  onValueChange={(v) => handleChange('sessionExpiration', v)}
                >
                  <SelectTrigger id="sessionExpiration" className="h-9 w-full">
                    <SelectValue placeholder="Sélectionner une durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30min">30 minutes</SelectItem>
                    <SelectItem value="1h">1 heure</SelectItem>
                    <SelectItem value="4h">4 heures</SelectItem>
                    <SelectItem value="8h">8 heures</SelectItem>
                    <SelectItem value="24h">24 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Journalisation IP */}
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 p-3 dark:bg-muted/40">
                <div className="min-w-0 space-y-0.5">
                  <Label htmlFor="ipLogging" className="text-sm font-medium">
                    Journalisation IP
                  </Label>
                  <p className="truncate text-xs text-muted-foreground">
                    Enregistrer les adresses IP dans le journal d&apos;audit
                  </p>
                </div>
                <Switch
                  className="shrink-0"
                  id="ipLogging"
                  checked={settings.ipLogging}
                  onCheckedChange={(v) => handleChange('ipLogging', v)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ====== 6. Informations Système (full-width) ====== */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="shrink-0 rounded-md bg-sky-100 p-1.5 dark:bg-sky-900/30">
              <Server className="size-4 text-sky-700 dark:text-sky-400" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Informations Système</CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Détails techniques sur l&apos;environnement
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loadingSystem ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Framework */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <Info className="size-4 shrink-0 text-fun-blue" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Framework</p>
                  <p className="truncate text-sm font-medium">Next.js 16</p>
                </div>
              </div>

              {/* Base de données */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <HardDrive className="size-4 shrink-0 text-fun-blue" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Base de données</p>
                  <p className="truncate text-sm font-medium">SQLite / Prisma ORM</p>
                </div>
              </div>

              {/* Nombre d'utilisateurs */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <Info className="size-4 shrink-0 text-tango" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Utilisateurs</p>
                  <p className="truncate text-sm font-medium">
                    {systemInfo?.totalUsers ?? '—'}{' '}
                    <span className="text-xs font-normal text-muted-foreground">enregistrés</span>
                  </p>
                </div>
              </div>

              {/* Nombre de rôles */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <Info className="size-4 shrink-0 text-tango" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Rôles</p>
                  <p className="truncate text-sm font-medium">
                    {systemInfo?.totalRoles ?? '—'}{' '}
                    <span className="text-xs font-normal text-muted-foreground">configurés</span>
                  </p>
                </div>
              </div>

              {/* Indicateurs */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <Info className="size-4 shrink-0 text-green-600 dark:text-green-400" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Indicateurs</p>
                  <p className="truncate text-sm font-medium">
                    {systemInfo?.totalIndicators ?? '—'}{' '}
                    <span className="text-xs font-normal text-muted-foreground">actifs</span>
                  </p>
                </div>
              </div>

              {/* Espace disque */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <HardDrive className="size-4 shrink-0 text-green-600 dark:text-green-400" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Espace disque</p>
                  <p className="truncate text-sm font-medium">{systemInfo?.diskUsage ?? '—'}</p>
                </div>
              </div>

              {/* Environnement */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <Server className="size-4 shrink-0 text-purple-600 dark:text-purple-400" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Environnement</p>
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium">Production</p>
                    <Badge variant="secondary" className="text-[10px]">
                      <CheckCircle2 className="size-2.5 text-success" />
                      Actif
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Dernière mise à jour */}
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <Clock className="size-4 shrink-0 text-purple-600 dark:text-purple-400" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Dernière sauvegarde</p>
                  <p className="truncate text-sm font-medium">
                    {new Date().toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== Save Button ====== */}
      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
        <p className="text-xs text-muted-foreground">
          Les modifications seront appliquées après sauvegarde.
        </p>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full gap-2 bg-fun-blue hover:bg-fun-blue-dark text-white sm:w-auto sm:min-w-[200px]"
        >
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            <>
              <Save className="size-4" />
              Sauvegarder les paramètres
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
