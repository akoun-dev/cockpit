'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { formatFrenchDate } from '@/lib/formatters'
import {
  Bell,
  BellOff,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Eye,
  RefreshCw,
  ShieldAlert,
  Activity,
  XCircle,
} from 'lucide-react'

interface Alert {
  id: string
  type: string
  severity: string
  title: string
  message: string
  source: string | null
  isRead: boolean
  isResolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

function severityIcon(severity: string) {
  switch (severity) {
    case 'critical':
      return <ShieldAlert className="size-4 text-red-600" />
    case 'warning':
      return <AlertTriangle className="size-4 text-amber-500" />
    default:
      return <Info className="size-4 text-blue-500" />
  }
}

function severityBadge(severity: string) {
  switch (severity) {
    case 'critical':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          Critique
        </Badge>
      )
    case 'warning':
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          Attention
        </Badge>
      )
    default:
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
          Info
        </Badge>
      )
  }
}

function typeBadge(type: string) {
  switch (type) {
    case 'kpi':
      return <Badge variant="secondary">KPI</Badge>
    case 'technique':
      return <Badge variant="outline">Technique</Badge>
    case 'securite':
      return <Badge className="bg-red-50 text-red-600 border-red-200 hover:bg-red-50">Sécurité</Badge>
    default:
      return <Badge variant="secondary">{type}</Badge>
  }
}

function statusBadge(isRead: boolean, isResolved: boolean) {
  if (isResolved) {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
        <CheckCircle2 className="size-3 mr-1" />
        Résolue
      </Badge>
    )
  }
  if (!isRead) {
    return (
      <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">
        <Bell className="size-3 mr-1" />
        Non lue
      </Badge>
    )
  }
  return (
    <Badge variant="outline">
      <Eye className="size-3 mr-1" />
      Lue
    </Badge>
  )
}



export function AdminAlerts() {
  const { handleError, handleSuccess } = useErrorHandler()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Stats
  const total = alerts.length
  const nonLues = alerts.filter((a) => !a.isRead && !a.isResolved).length
  const critiques = alerts.filter((a) => a.severity === 'critical' && !a.isResolved).length
  const resolues = alerts.filter((a) => a.isResolved).length

  const fetchAlerts = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterType !== 'all') params.set('type', filterType)
      if (filterSeverity !== 'all') params.set('severity', filterSeverity)
      if (filterStatus !== 'all') params.set('status', filterStatus)

      const res = await fetch(`/api/admin/alerts?${params.toString()}`)
      const json = await res.json()
      if (json.data) setAlerts(json.data)
    } catch {
      handleError('le chargement des alertes')
    } finally {
      setLoading(false)
    }
  }, [filterType, filterSeverity, filterStatus])

  useEffect(() => {
    setLoading(true)
    fetchAlerts()
  }, [fetchAlerts])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => fetchAlerts(), 10000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchAlerts])

  const markAsRead = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`/api/admin/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      })
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
      )
      handleSuccess('Alerte marquée comme lue')
    } catch {
      handleError('l\'action')
    } finally {
      setActionLoading(null)
    }
  }

  const resolveAlert = async (id: string) => {
    setActionLoading(id)
    try {
      await fetch(`/api/admin/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isResolved: true, resolvedBy: 'admin' }),
      })
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, isResolved: true, resolvedAt: new Date().toISOString(), resolvedBy: 'admin' }
            : a,
        ),
      )
      handleSuccess('Alerte résolue')
    } catch {
      handleError('l\'action')
    } finally {
      setActionLoading(null)
    }
  }

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.isRead && !a.isResolved)
    if (unread.length === 0) {
      handleSuccess('Info', 'Aucune alerte non lue')
      return
    }
    try {
      await Promise.all(
        unread.map((a) =>
          fetch(`/api/admin/alerts/${a.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true }),
          }),
        ),
      )
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))
      handleSuccess(`${unread.length} alerte(s) marquée(s) comme lue(s)`)
    } catch {
      handleError('l\'action')
    }
  }

  const resolveAllCritical = async () => {
    const critical = alerts.filter((a) => a.severity === 'critical' && !a.isResolved)
    if (critical.length === 0) {
      handleSuccess('Info', 'Aucune alerte critique à résoudre')
      return
    }
    try {
      await Promise.all(
        critical.map((a) =>
          fetch(`/api/admin/alerts/${a.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isResolved: true, resolvedBy: 'admin' }),
          }),
        ),
      )
      setAlerts((prev) =>
        prev.map((a) =>
          a.severity === 'critical'
            ? { ...a, isResolved: true, resolvedAt: new Date().toISOString(), resolvedBy: 'admin' }
            : a,
        ),
      )
      handleSuccess(`${critical.length} alerte(s) critique(s) résolue(s)`)
    } catch {
      handleError('l\'action')
    }
  }

  const stats = [
    {
      label: 'Total alertes',
      value: total,
      icon: Bell,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
    {
      label: 'Non lues',
      value: nonLues,
      icon: BellOff,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      label: 'Critiques',
      value: critiques,
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
    {
      label: 'Résolues',
      value: resolues,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion des alertes</h2>
          <p className="text-muted-foreground text-sm">
            Surveillance et gestion des alertes système
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Auto-rafraîchissement</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchAlerts() }}>
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`${s.bg} p-2 rounded-lg`}>
                  <s.icon className={`size-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters & Batch Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="size-5" />
              Alertes
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px]" size="sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="kpi">KPI</SelectItem>
                  <SelectItem value="technique">Technique</SelectItem>
                  <SelectItem value="securite">Sécurité</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger className="w-[130px]" size="sm">
                  <SelectValue placeholder="Sévérité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes sévérités</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Attention</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]" size="sm">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="unread">Non lues</SelectItem>
                  <SelectItem value="resolved">Résolues</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Batch actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <Eye className="size-4 mr-1" />
              Tout marquer comme lu
            </Button>
            <Button variant="outline" size="sm" onClick={resolveAllCritical}>
              <ShieldAlert className="size-4 mr-1" />
              Résoudre toutes critiques
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BellOff className="size-10 mx-auto mb-3 opacity-50" />
              <p>Aucune alerte trouvée</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block max-h-[520px] overflow-y-auto overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]" />
                      <TableHead>Type</TableHead>
                      <TableHead>Sévérité</TableHead>
                      <TableHead>Titre</TableHead>
                      <TableHead className="hidden lg:table-cell">Message</TableHead>
                      <TableHead className="hidden lg:table-cell">Source</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow
                        key={alert.id}
                        className={
                          alert.severity === 'critical' && !alert.isResolved
                            ? 'border-l-4 border-l-red-500'
                            : ''
                        }
                      >
                        <TableCell>
                          {severityIcon(alert.severity)}
                        </TableCell>
                        <TableCell>{typeBadge(alert.type)}</TableCell>
                        <TableCell>{severityBadge(alert.severity)}</TableCell>
                        <TableCell className="font-medium">
                          {!alert.isRead && (
                            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2" />
                          )}
                          {alert.title}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[250px] truncate text-muted-foreground">
                          {alert.message}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                          {alert.source || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatFrenchDate(alert.createdAt)}
                        </TableCell>
                        <TableCell>{statusBadge(alert.isRead, alert.isResolved)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {!alert.isRead && !alert.isResolved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(alert.id)}
                                disabled={actionLoading === alert.id}
                              >
                                <Eye className="size-4" />
                              </Button>
                            )}
                            {!alert.isResolved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resolveAlert(alert.id)}
                                disabled={actionLoading === alert.id}
                              >
                                <CheckCircle2 className="size-4 text-green-600" />
                              </Button>
                            )}
                            {alert.isResolved && (
                              <CheckCircle2 className="size-4 text-green-500 mx-auto" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 max-h-[520px] overflow-y-auto">
                {alerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={
                      alert.severity === 'critical' && !alert.isResolved
                        ? 'border-l-4 border-l-red-500'
                        : ''
                    }
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {severityIcon(alert.severity)}
                          <span className="font-medium truncate">
                            {!alert.isRead && (
                              <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1.5 shrink-0" />
                            )}
                            {alert.title}
                          </span>
                        </div>
                        {statusBadge(alert.isRead, alert.isResolved)}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {alert.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        {typeBadge(alert.type)}
                        {severityBadge(alert.severity)}
                        {alert.source && (
                          <span className="text-xs text-muted-foreground">
                            Source : {alert.source}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatFrenchDate(alert.createdAt)}
                        </span>
                        <div className="flex gap-1">
                          {!alert.isRead && !alert.isResolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => markAsRead(alert.id)}
                              disabled={actionLoading === alert.id}
                            >
                              <Eye className="size-3 mr-1" />
                              Marquer comme lue
                            </Button>
                          )}
                          {!alert.isResolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => resolveAlert(alert.id)}
                              disabled={actionLoading === alert.id}
                            >
                              <CheckCircle2 className="size-3 mr-1 text-green-600" />
                              Résoudre
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}