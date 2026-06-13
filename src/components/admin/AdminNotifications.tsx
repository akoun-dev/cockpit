'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useErrorHandler } from '@/hooks/use-error-handler'
import {
  Bell,
  Mail,
  Smartphone,
  Send,
  Settings,
  BarChart3,
  FileText,
  RefreshCcw,
  UserPlus,
  ShieldAlert,
  Save,
  Loader2,
} from 'lucide-react'

interface NotificationConfig {
  id: string
  type: string
  label: string
  enabled: boolean
  channel: string
  recipients: string
  smtpHost: string | null
  smtpPort: number | null
  smtpEncryption: string | null
  smtpUser: string | null
  smtpPassword: string | null
  createdAt: string
  updatedAt: string
}

const ALERT_TYPES: { type: string; label: string; icon: React.ElementType; description: string }[] = [
  {
    type: 'kpi_critique',
    label: 'KPI critique dépassé',
    icon: BarChart3,
    description: 'Notification lorsqu\'un indicateur clé dépasse le seuil critique défini.',
  },
  {
    type: 'rapport_genere',
    label: 'Rapport généré',
    icon: FileText,
    description: 'Notification à la génération automatique d\'un rapport périodique.',
  },
  {
    type: 'sync_echouee',
    label: 'Échec de synchronisation',
    icon: RefreshCcw,
    description: 'Alerte en cas d\'échec de synchronisation avec une source de données.',
  },
  {
    type: 'utilisateur_cree',
    label: 'Nouvel utilisateur créé',
    icon: UserPlus,
    description: 'Notification lors de la création d\'un nouveau compte utilisateur.',
  },
  {
    type: 'connexion_suspecte',
    label: 'Tentative de connexion suspecte',
    icon: ShieldAlert,
    description: 'Alerte de sécurité lors d\'une tentative de connexion inhabituelle.',
  },
]

function channelIcon(channel: string) {
  switch (channel) {
    case 'email':
      return <Mail className="size-4" />
    case 'in_app':
      return <Smartphone className="size-4" />
    case 'both':
      return (
        <span className="flex items-center gap-0.5">
          <Mail className="size-3.5" />
          <Smartphone className="size-3.5" />
        </span>
      )
    default:
      return <Bell className="size-4" />
  }
}

export function AdminNotifications() {
  const { handleError, handleSuccess } = useErrorHandler()
  const [configs, setConfigs] = useState<NotificationConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [testingEmail, setTestingEmail] = useState(false)

  // SMTP form state
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('587')
  const [smtpEncryption, setSmtpEncryption] = useState('TLS')
  const [smtpUser, setSmtpUser] = useState('')
  const [smtpPassword, setSmtpPassword] = useState('')
  const [savingSmtp, setSavingSmtp] = useState(false)

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      const json = await res.json()
      if (json.data) {
        setConfigs(json.data)
        // Load SMTP config from the first config that has smtpHost
        const withSmtp = json.data.find((c: NotificationConfig) => c.smtpHost)
        if (withSmtp) {
          setSmtpHost(withSmtp.smtpHost || '')
          setSmtpPort(withSmtp.smtpPort?.toString() || '587')
          setSmtpEncryption(withSmtp.smtpEncryption || 'TLS')
          setSmtpUser(withSmtp.smtpUser || '')
          setSmtpPassword(withSmtp.smtpPassword || '')
        }
      }
    } catch {
      handleError('le chargement des configurations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const updateConfig = async (id: string, data: Partial<NotificationConfig>) => {
    setSaving(id)
    try {
      const res = await fetch(`/api/admin/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.data) {
        setConfigs((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...json.data } : c)),
        )
        handleSuccess('Configuration mise à jour')
      }
    } catch {
      handleError('la mise à jour de la configuration')
    } finally {
      setSaving(null)
    }
  }

  const toggleEnabled = (config: NotificationConfig) => {
    updateConfig(config.id, { enabled: !config.enabled })
  }

  const changeChannel = (config: NotificationConfig, channel: string) => {
    updateConfig(config.id, { channel })
  }

  const updateRecipients = (config: NotificationConfig, recipients: string) => {
    // Parse the input as comma-separated emails into a JSON array
    const emails = recipients
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean)
    updateConfig(config.id, { recipients: JSON.stringify(emails) })
  }

  const saveSmtpConfig = async () => {
    setSavingSmtp(true)
    try {
      // Save SMTP config to all existing configs (shared SMTP settings)
      const port = parseInt(smtpPort, 10)
      if (configs.length > 0) {
        await Promise.all(
          configs.map((c) =>
            fetch(`/api/admin/notifications/${c.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                smtpHost,
                smtpPort: isNaN(port) ? 587 : port,
                smtpEncryption,
                smtpUser,
                smtpPassword,
              }),
            }),
          ),
        )
      }
      handleSuccess('Configuration SMTP enregistrée')
    } catch {
      handleError('l\'enregistrement SMTP')
    } finally {
      setSavingSmtp(false)
    }
  }

  const testEmail = async () => {
    setTestingEmail(true)
    // Simulated test
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setTestingEmail(false)
    handleSuccess('Email de test envoyé (simulé)', 'Un email de test a été envoyé à l\'adresse configurée.')
  }

  const parseRecipients = (recipientsStr: string): string => {
    try {
      const arr = JSON.parse(recipientsStr)
      if (Array.isArray(arr)) return arr.join(', ')
    } catch {
      // fallback
    }
    return recipientsStr
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
          <Mail className="size-5 text-green-700 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuration des notifications</h2>
          <p className="text-muted-foreground text-sm">
            Gérez les canaux de notification et la configuration SMTP
          </p>
        </div>
      </div>

      {/* Section: Configuration des alertes */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-amber-100 p-1.5 dark:bg-amber-900/30">
              <Bell className="size-4 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Configuration des alertes</CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Définir les canaux et destinataires par type d&apos;alerte
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {ALERT_TYPES.map((at) => {
              const config = configs.find((c) => c.type === at.type)
              const Icon = at.icon
              return (
                <Card key={at.type} className={!config?.enabled ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="bg-primary/10 p-2 rounded-lg shrink-0">
                          <Icon className="size-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base">{at.label}</CardTitle>
                          <CardDescription className="text-xs mt-0.5 line-clamp-2">
                            {at.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        className="shrink-0"
                        checked={config?.enabled ?? false}
                        onCheckedChange={() => config && toggleEnabled(config)}
                        disabled={saving === config?.id}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Channel */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground shrink-0 w-20 sm:w-16">Canal</Label>
                      <Select
                        value={config?.channel ?? 'email'}
                        onValueChange={(v) => config && changeChannel(config, v)}
                        disabled={saving === config?.id}
                      >
                        <SelectTrigger className="h-8 text-xs flex-1 min-w-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">
                            <span className="flex items-center gap-1.5">
                              <Mail className="size-3" /> Email
                            </span>
                          </SelectItem>
                          <SelectItem value="in_app">
                            <span className="flex items-center gap-1.5">
                              <Smartphone className="size-3" /> In-App
                            </span>
                          </SelectItem>
                          <SelectItem value="both">
                            <span className="flex items-center gap-1.5">
                              <Mail className="size-3" />+<Smartphone className="size-3" /> Les deux
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Recipients */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground shrink-0 w-20 sm:w-16">
                        Destinataires
                      </Label>
                      <div className="flex-1 flex gap-1.5 min-w-0">
                        <Input
                          className="h-8 text-xs min-w-0 flex-1"
                          placeholder="email@ansut.tg, email2@..."
                          defaultValue={config ? parseRecipients(config.recipients) : ''}
                          onBlur={(e) => config && updateRecipients(config, e.target.value)}
                          disabled={saving === config?.id}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 shrink-0"
                          onClick={(e) => {
                            const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement)
                            if (input && config) updateRecipients(config, input.value)
                          }}
                          disabled={saving === config?.id}
                        >
                          {saving === config?.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Save className="size-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Status indicator */}
                    {config && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {channelIcon(config.channel)}
                        <span>
                          {config.enabled
                            ? `Activé — ${config.channel === 'email' ? 'Email' : config.channel === 'in_app' ? 'In-App' : 'Email + In-App'}`
                            : 'Désactivé'}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        </CardContent>
      </Card>

      <Separator />

      {/* Section: Configuration SMTP */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md bg-slate-100 p-1.5 dark:bg-slate-900/30">
              <Settings className="size-4 text-slate-700 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Configuration SMTP</CardTitle>
              <CardDescription className="mt-0.5 text-xs">
                Paramètres du serveur d&apos;envoi d&apos;emails
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Configurez le serveur SMTP pour l&apos;envoi des notifications par email. Ces paramètres sont appliqués à toutes les notifications par email.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="smtp-host">Hôte SMTP</Label>
                <Input
                  id="smtp-host"
                  placeholder="smtp.exemple.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-encryption">Chiffrement</Label>
                <Select value={smtpEncryption} onValueChange={setSmtpEncryption}>
                  <SelectTrigger id="smtp-encryption" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TLS">TLS</SelectItem>
                    <SelectItem value="SSL">SSL</SelectItem>
                    <SelectItem value="none">Aucun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp-user">Utilisateur</Label>
                <Input
                  id="smtp-user"
                  placeholder="user@ansut.tg"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="smtp-password">Mot de passe</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  placeholder="••••••••"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                onClick={saveSmtpConfig}
                disabled={savingSmtp}
              >
                {savingSmtp ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Save className="size-4 mr-2" />
                )}
                Enregistrer la configuration
              </Button>
              <Button
                variant="outline"
                onClick={testEmail}
                disabled={testingEmail}
              >
                {testingEmail ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Send className="size-4 mr-2" />
                )}
                Envoyer un email de test
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  )
}