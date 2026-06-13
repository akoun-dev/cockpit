'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  MonitorSmartphone,
  Timer,
  Info,
  Activity,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Mapping sessionExpiration → label ──────────────────────────────
const SESSION_LABELS: Record<string, string> = {
  '30min': '30 minutes',
  '1h': '1 heure',
  '4h': '4 heures',
  '8h': '8 heures',
  '24h': '24 heures',
};

// ─── Component ────────────────────────────────────────────────────
export function AdminSecurity() {
  const { toast } = useToast();

  const [sessionExpiry, setSessionExpiry] = useState<string | null>(null);
  const [ipLogging, setIpLogging] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json() as Record<string, string>;
          setSessionExpiry(data.sessionExpiration ?? '4h');
          setIpLogging(data.ipLogging === 'true');
        }
      } catch { /* defaults */ }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="size-6 text-primary" />
          Sécurité
        </h1>
        <p className="text-muted-foreground mt-1">
          Politiques d'authentification et de session.
        </p>
      </div>

      {/* ─── Info Banner ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fun-blue/10">
              <Activity className="size-5 text-fun-blue" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs text-muted-foreground">Stratégie de session</p>
              <p className="text-sm font-medium tabular-nums">JWT (stateless)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fun-blue/10">
              <ShieldCheck className="size-5 text-fun-blue" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs text-muted-foreground">Expiration de session</p>
              {loading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <p className="text-sm font-bold tabular-nums">
                  {SESSION_LABELS[sessionExpiry ?? '4h'] ?? '4 heures'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Session timeout info ────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="size-5 text-primary" />
            Gestion des sessions
          </CardTitle>
          <CardDescription>
            Le système utilise une stratégie de session JWT (stateless). Les tokens sont
            vérifiés à chaque requête et expirés automatiquement selon la durée configurée.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Timer className="size-4 shrink-0" />
                <span className="truncate">Expiration de session configurée</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Durée de validité d'un token JWT avant déconnexion automatique.
                Modifiable depuis{' '}
                <strong>Administration → Paramètres → Sécurité → Expiration de session</strong>.
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 text-sm px-3 py-1">
              {loading
                ? '…'
                : SESSION_LABELS[sessionExpiry ?? '4h'] ?? '4 heures'}
            </Badge>
          </div>

          <div className="border-t border-border" />

          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Info className="size-4 text-muted-foreground" />
              Sessions actives
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Avec une stratégie JWT, les tokens sont auto-portants et ne sont pas stockés côté
              serveur. Il n'est donc pas possible de lister les sessions actives ni de les
              révoquer individuellement. Pour invalider toutes les sessions, modifiez la
              valeur secrète <code className="text-xs bg-muted px-1 py-0.5 rounded">NEXTAUTH_SECRET</code> et redémarrez l'application.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ─── Journalisation IP ────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="size-5 text-primary" />
            Journalisation
          </CardTitle>
          <CardDescription>
            Traçabilité des actions et connexions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium flex items-center gap-2">
                <Activity className="size-4 shrink-0" />
                <span className="truncate">Journalisation des adresses IP</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {loading
                  ? '…'
                  : ipLogging
                    ? 'Activée — les adresses IP sont enregistrées dans le journal d\'audit.'
                    : 'Désactivée — les adresses IP ne sont pas journalisées.'}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                loading
                  ? ''
                  : ipLogging
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'border-red-300 bg-red-50 text-red-700 dark:border-red-600 dark:bg-red-950 dark:text-red-400'
              }
            >
              {loading ? '…' : ipLogging ? 'Activée' : 'Désactivée'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ─── Authentification ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="size-5 text-primary" />
            Authentification
          </CardTitle>
          <CardDescription>
            Méthodes d'authentification disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium flex items-center gap-2">
                <MonitorSmartphone className="size-4 shrink-0" />
                <span className="truncate">Email / Mot de passe (bcrypt)</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Méthode d'authentification par défaut. Les mots de passe sont hachés avec bcrypt.
                Verrouillage automatique après 5 tentatives échouées.
              </p>
            </div>
            <Badge className="shrink-0 bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-600">
              Actif
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ─── Save Button ─────────────────────────────────────────── */}
      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-end">
        <p className="text-xs text-muted-foreground">
          Les paramètres de sécurité se configurent dans{' '}
          <strong>Administration → Paramètres → Sécurité</strong>.
        </p>
      </div>
    </div>
  );
}
