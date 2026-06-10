'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import {
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  Fingerprint,
  MonitorSmartphone,
  Globe,
  Timer,
  Ban,
  LogOut,
  Eye,
  Save,
  Info,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────
interface SessionRow {
  id: string;
  user: string;
  device: string;
  ip: string;
  connectedAt: string;
  status: 'active' | 'idle';
}

// ─── Simulated active sessions ──────────────────────────────────────
const INITIAL_SESSIONS: SessionRow[] = [
  { id: 's1', user: 'admin@ansut.ci', device: 'Chrome / Windows 11', ip: '192.168.1.100', connectedAt: '2025-06-14 08:32', status: 'active' },
  { id: 's2', user: 'dg@ansut.ci', device: 'Safari / macOS', ip: '10.0.1.55', connectedAt: '2025-06-14 09:15', status: 'active' },
  { id: 's3', user: 'pmo@ansut.ci', device: 'Edge / Windows 10', ip: '192.168.1.120', connectedAt: '2025-06-14 07:45', status: 'idle' },
  { id: 's4', user: 'dfc@ansut.ci', device: 'Firefox / Ubuntu', ip: '192.168.1.88', connectedAt: '2025-06-13 16:20', status: 'idle' },
  { id: 's5', user: 'drh@ansut.ci', device: 'Chrome / Android', ip: '10.0.2.30', connectedAt: '2025-06-14 10:05', status: 'active' },
  { id: 's6', user: 'dt@ansut.ci', device: 'Chrome / Windows 11', ip: '192.168.1.150', connectedAt: '2025-06-14 08:50', status: 'active' },
  { id: 's7', user: 'agent@ansut.ci', device: 'Chrome / Windows 10', ip: '192.168.1.200', connectedAt: '2025-06-13 14:30', status: 'idle' },
];

// ─── Component ────────────────────────────────────────────────────
export function AdminSecurity() {
  const { toast } = useToast();

  // Authentification
  const [authEmail, setAuthEmail] = useState(true);
  const [authEntra, setAuthEntra] = useState(false);
  const [authSSO, setAuthSSO] = useState(false);

  // Contrôles de sécurité
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [passwordRotation, setPasswordRotation] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState('1h');
  const [lockoutAttempts, setLockoutAttempts] = useState(5);
  const [ipLogging, setIpLogging] = useState(true);

  // Politique de mots de passe
  const [passwordComplexity, setPasswordComplexity] = useState('standard');
  const [passwordValidity, setPasswordValidity] = useState(90);
  const [blockCommonPasswords, setBlockCommonPasswords] = useState(true);

  // Sessions
  const [sessions, setSessions] = useState<SessionRow[]>(INITIAL_SESSIONS);

  const handleSave = () => {
    toast({
      title: 'Paramètres sauvegardés',
      description: 'Les paramètres de sécurité ont été mis à jour avec succès.',
    });
  };

  const handleDisconnect = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast({
      title: 'Session déconnectée',
      description: 'La session utilisateur a été révoquée.',
      variant: 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="size-6 text-primary" />
          Sécurité
        </h1>
        <p className="text-muted-foreground mt-1">
          Gérez les paramètres d'authentification, les contrôles de sécurité et les sessions actives.
        </p>
      </div>

      {/* ─── 1. Authentification ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="size-5 text-primary" />
            Authentification
          </CardTitle>
          <CardDescription>
            Configurez les méthodes d'authentification disponibles pour les utilisateurs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email/Mot de passe */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Label htmlFor="auth-email" className="flex items-center gap-2 text-sm font-medium">
                <Fingerprint className="size-4" />
                Authentification Email / Mot de passe
              </Label>
              <p className="text-xs text-muted-foreground">
                Méthode d'authentification par défaut avec identifiant et mot de passe ANSUT.
              </p>
            </div>
            <Switch
              id="auth-email"
              checked={authEmail}
              onCheckedChange={setAuthEmail}
            />
          </div>

          <div className="border-t border-border" />

          {/* Microsoft Entra ID */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Label htmlFor="auth-entra" className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="size-4" />
                Microsoft Entra ID (Azure AD)
              </Label>
              <p className="text-xs text-muted-foreground">
                Authentification via Azure Active Directory pour les comptes Microsoft de l'organisation.
              </p>
            </div>
            <Switch
              id="auth-entra"
              checked={authEntra}
              onCheckedChange={setAuthEntra}
            />
          </div>

          <div className="border-t border-border" />

          {/* SSO */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Label htmlFor="auth-sso" className="flex items-center gap-2 text-sm font-medium">
                <Globe className="size-4" />
                Single Sign-On (SSO)
              </Label>
              <p className="text-xs text-muted-foreground">
                Authentification unique via protocole SAML 2.0 ou OpenID Connect avec un fournisseur d'identité externe.
              </p>
            </div>
            <Switch
              id="auth-sso"
              checked={authSSO}
              onCheckedChange={setAuthSSO}
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── 2. Contrôles de sécurité ────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="size-5 text-primary" />
            Contrôles de sécurité
          </CardTitle>
          <CardDescription>
            Paramètres de protection avancés pour renforcer la sécurité des comptes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* MFA */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Label htmlFor="mfa" className="flex items-center gap-2 text-sm font-medium">
                <Lock className="size-4" />
                Authentification multi-facteurs (MFA)
              </Label>
              <p className="text-xs text-muted-foreground">
                Exige une seconde vérification (code SMS, app TOTP) lors de la connexion.
              </p>
            </div>
            <Switch
              id="mfa"
              checked={mfaEnabled}
              onCheckedChange={setMfaEnabled}
            />
          </div>

          <div className="border-t border-border" />

          {/* Rotation mots de passe */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Label htmlFor="pw-rotation" className="flex items-center gap-2 text-sm font-medium">
                <Timer className="size-4" />
                Rotation obligatoire des mots de passe
              </Label>
              <p className="text-xs text-muted-foreground">
                Les utilisateurs doivent changer leur mot de passe à intervalle régulier.
              </p>
            </div>
            <Switch
              id="pw-rotation"
              checked={passwordRotation}
              onCheckedChange={setPasswordRotation}
            />
          </div>

          <div className="border-t border-border" />

          {/* Expiration de session */}
          <div className="flex flex-col gap-3 sm:items-start sm:justify-between sm:flex-row">
            <div className="space-y-1">
              <Label htmlFor="session-expiry" className="flex items-center gap-2 text-sm font-medium">
                <Timer className="size-4" />
                Expiration de session
              </Label>
              <p className="text-xs text-muted-foreground">
                Durée d'inactivité avant déconnexion automatique de la session.
              </p>
            </div>
            <Select value={sessionExpiry} onValueChange={setSessionExpiry}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
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

          <div className="border-t border-border" />

          {/* Tentatives avant verrouillage */}
          <div className="flex flex-col gap-3 sm:items-start sm:justify-between sm:flex-row">
            <div className="space-y-1">
              <Label htmlFor="lockout" className="flex items-center gap-2 text-sm font-medium">
                <Ban className="size-4" />
                Tentatives avant verrouillage
              </Label>
              <p className="text-xs text-muted-foreground">
                Nombre de tentatives de connexion échouées avant le verrouillage du compte.
              </p>
            </div>
            <Input
              id="lockout"
              type="number"
              min={1}
              max={20}
              value={lockoutAttempts}
              onChange={(e) => setLockoutAttempts(Number(e.target.value))}
              className="w-full sm:w-[120px]"
            />
          </div>

          <div className="border-t border-border" />

          {/* Journalisation IP */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Label htmlFor="ip-log" className="flex items-center gap-2 text-sm font-medium">
                <Eye className="size-4" />
                Journalisation des adresses IP
              </Label>
              <p className="text-xs text-muted-foreground">
                Enregistre l'adresse IP de chaque connexion dans le journal d'audit.
              </p>
            </div>
            <Switch
              id="ip-log"
              checked={ipLogging}
              onCheckedChange={setIpLogging}
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── 3. Politique de mots de passe ───────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="size-5 text-primary" />
            Politique de mots de passe
          </CardTitle>
          <CardDescription>
            Définissez les règles de complexité et de validité des mots de passe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Complexité */}
          <div className="flex flex-col gap-3 sm:items-start sm:justify-between sm:flex-row">
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <KeyRound className="size-4" />
                Complexité
              </Label>
              <p className="text-xs text-muted-foreground">
                {passwordComplexity === 'standard'
                  ? 'Standard : 8 caractères minimum, minuscules + chiffres.'
                  : 'Renforcé : 12 caractères minimum, majuscules + minuscules + chiffres + symboles.'}
              </p>
            </div>
            <Select value={passwordComplexity} onValueChange={setPasswordComplexity}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="renforce">Renforcé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-border" />

          {/* Durée de validité */}
          <div className="flex flex-col gap-3 sm:items-start sm:justify-between sm:flex-row">
            <div className="space-y-1">
              <Label htmlFor="pw-validity" className="flex items-center gap-2 text-sm font-medium">
                <Timer className="size-4" />
                Durée de validité
              </Label>
              <p className="text-xs text-muted-foreground">
                Nombre de jours avant expiration du mot de passe (si rotation activée).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="pw-validity"
                type="number"
                min={7}
                max={365}
                value={passwordValidity}
                onChange={(e) => setPasswordValidity(Number(e.target.value))}
                className="w-full sm:w-[120px]"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">jours</span>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Interdire mots de passe communs */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <Label htmlFor="block-common" className="flex items-center gap-2 text-sm font-medium">
                <Ban className="size-4" />
                Interdire les mots de passe communs
              </Label>
              <p className="text-xs text-muted-foreground">
                Bloque l'utilisation de mots de passe figurant dans une liste noire (123456, password, admin…).
              </p>
            </div>
            <Switch
              id="block-common"
              checked={blockCommonPasswords}
              onCheckedChange={setBlockCommonPasswords}
            />
          </div>
        </CardContent>
      </Card>

      {/* ─── Save Button ─────────────────────────────────────────── */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="size-4" />
          Sauvegarder les paramètres
        </Button>
      </div>

      {/* ─── 4. Sessions actives ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MonitorSmartphone className="size-5 text-primary" />
            Sessions actives
          </CardTitle>
          <CardDescription>
            Liste des sessions utilisateur connectées au système. Vous pouvez révoquer une session à tout moment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[160px]">Utilisateur</TableHead>
                  <TableHead className="min-w-[160px]">Appareil / Navigateur</TableHead>
                  <TableHead className="min-w-[130px]">Adresse IP</TableHead>
                  <TableHead className="min-w-[130px]">Date de connexion</TableHead>
                  <TableHead className="min-w-[80px]">Statut</TableHead>
                  <TableHead className="min-w-[100px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      <Info className="size-4 mx-auto mb-1" />
                      Aucune session active.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.user}</TableCell>
                      <TableCell className="text-muted-foreground">{session.device}</TableCell>
                      <TableCell className="font-mono text-xs">{session.ip}</TableCell>
                      <TableCell className="text-muted-foreground">{session.connectedAt}</TableCell>
                      <TableCell>
                        <Badge
                          variant={session.status === 'active' ? 'default' : 'secondary'}
                          className={
                            session.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                              : 'bg-amber-100 text-amber-700 border-amber-200'
                          }
                        >
                          {session.status === 'active' ? 'Active' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => handleDisconnect(session.id)}
                        >
                          <LogOut className="size-3" />
                          <span className="hidden sm:inline">Déconnecter</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {sessions.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {sessions.length} session{sessions.length > 1 ? 's' : ''} active{sessions.length > 1 ? 's' : ''} en cours.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
