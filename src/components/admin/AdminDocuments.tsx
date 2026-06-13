'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  FileText,
  FolderSync,
  HardDrive,
  Users,
  Link2,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { MODULE_LABELS, MODULE_COLORS } from '@/lib/constants';

const TYPE_LABELS: Record<string, string> = {
  lien: 'Lien',
  sharepoint: 'SharePoint',
  onedrive: 'OneDrive',
  teams: 'Teams',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  lien: Link2,
  sharepoint: FolderSync,
  onedrive: HardDrive,
  teams: Users,
};

const TYPE_COLORS: Record<string, string> = {
  lien: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  sharepoint: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  onedrive: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  teams: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

const VISIBILITY_LABELS: Record<string, string> = {
  all: 'Tous les utilisateurs',
  DG: 'Direction Générale',
  DFC: 'Direction Financière',
  PMO: 'Bureau PMO',
  DRH: 'Direction RH',
  DSI: 'Direction SI',
  DAJ: 'Direction Juridique',
};

// --- Types ---

interface DocumentEntry {
  id: string;
  name: string;
  url: string;
  type: string;
  module: string;
  description?: string | null;
  visibility: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface DocumentFormData {
  name: string;
  url: string;
  type: string;
  module: string;
  description: string;
  visibility: string;
}

const EMPTY_FORM: DocumentFormData = {
  name: '',
  url: '',
  type: 'lien',
  module: 'accueil',
  description: '',
  visibility: 'all',
};

// --- Component ---

export function AdminDocuments() {
  const { toast } = useToast();

  // Data
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentEntry | null>(null);
  const [form, setForm] = useState<DocumentFormData>(EMPTY_FORM);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState<DocumentEntry | null>(null);

  // --- Data fetching ---

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = moduleFilter !== 'all' ? `?module=${moduleFilter}` : '';
      const res = await fetch(`/api/admin/documents${query}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.data || []);
      } else {
        setError('Erreur lors du chargement des documents');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [moduleFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // --- Handlers ---

  function handleCreate() {
    setEditingDoc(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  }

  function handleEdit(doc: DocumentEntry) {
    setEditingDoc(doc);
    setForm({
      name: doc.name,
      url: doc.url,
      type: doc.type,
      module: doc.module,
      description: doc.description || '',
      visibility: doc.visibility,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.url.trim() || !form.module) return;
    setSaving(true);
    setError(null);
    try {
      const url = editingDoc
        ? `/api/admin/documents/${editingDoc.id}`
        : '/api/admin/documents';
      const method = editingDoc ? 'PUT' : 'POST';
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        url: form.url.trim(),
        type: form.type,
        module: form.module,
        description: form.description || null,
        visibility: form.visibility,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setDialogOpen(false);
        toast({
          title: editingDoc ? 'Document mis à jour' : 'Document créé',
          description: editingDoc
            ? `"${form.name}" a été modifié avec succès.`
            : `"${form.name}" a été ajouté avec succès.`,
        });
        await fetchDocuments();
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as Record<string, unknown>).error as string || 'Erreur lors de la sauvegarde');
      }
    } catch {
      setError('Erreur réseau');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(doc: DocumentEntry) {
    setDeletingDoc(doc);
    setDeleteDialogOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deletingDoc) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/documents/${deletingDoc.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteDialogOpen(false);
        setDeletingDoc(null);
        toast({
          title: 'Document supprimé',
          description: `"${deletingDoc.name}" a été supprimé avec succès.`,
        });
        await fetchDocuments();
      }
    } catch {
      setError('Erreur lors de la suppression');
    } finally {
      setSaving(false);
    }
  }

  function handleOpenLink(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // --- Computed ---

  const moduleCounts: Record<string, number> = {};
  documents.forEach((d) => {
    moduleCounts[d.module] = (moduleCounts[d.module] || 0) + 1;
  });

  const filteredDocs = documents.filter((doc) => {
    if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gestion des Documents
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérer les documents et liens partagés par module
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2 bg-fun-blue hover:bg-fun-blue-dark">
          <Plus className="size-4" />
          Ajouter un Document
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Total Documents</p>
            <p className="mt-1 text-2xl font-bold text-fun-blue dark:text-blue-400">{documents.length}</p>
          </CardContent>
        </Card>
        {Object.entries(MODULE_LABELS).slice(0, 3).map(([mod, label]) => (
          <Card key={mod}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className={cn('size-2 rounded-full', MODULE_COLORS[mod])} />
                <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
              </div>
              <p className="mt-1 text-2xl font-bold">{moduleCounts[mod] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filtrer par module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les modules</SelectItem>
            {Object.entries(MODULE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  <span className={cn('inline-block size-2 rounded-full', MODULE_COLORS[key])} />
                  {label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="size-4 text-fun-blue" />
            Liste des Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FileText className="mb-3 size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Aucun document trouvé</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                {documents.length === 0
                  ? 'Commencez par ajouter votre premier document.'
                  : 'Aucun résultat pour cette recherche.'}
              </p>
              {documents.length === 0 && (
                <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={handleCreate}>
                  <Plus className="size-3.5" />
                  Ajouter un document
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Visibilité</TableHead>
                      <TableHead>Date de création</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocs.map((doc) => {
                      const TypeIcon = TYPE_ICONS[doc.type] || Link2;

                      return (
                        <TableRow key={doc.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', TYPE_COLORS[doc.type])}>
                                <TypeIcon className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{doc.name}</p>
                                {doc.description && (
                                  <p className="text-[11px] text-muted-foreground truncate max-w-[250px]">{doc.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={cn('text-[10px]', TYPE_COLORS[doc.type])}>
                              {TYPE_LABELS[doc.type] || doc.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <span className={cn('inline-block size-2 rounded-full', MODULE_COLORS[doc.module])} />
                              {MODULE_LABELS[doc.module] || doc.module}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {VISIBILITY_LABELS[doc.visibility] || doc.visibility}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {new Date(doc.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 hover:bg-muted"
                                onClick={() => handleOpenLink(doc.url)}
                                title="Ouvrir le lien"
                              >
                                <ExternalLink className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 hover:bg-muted"
                                onClick={() => handleEdit(doc)}
                                title="Modifier"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(doc)}
                                title="Supprimer"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card view */}
              <div className="md:hidden space-y-3">
                {filteredDocs.map((doc) => {
                  const TypeIcon = TYPE_ICONS[doc.type] || Link2;

                  return (
                    <Card key={doc.id} className="overflow-hidden">
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', TYPE_COLORS[doc.type])}>
                                <TypeIcon className="size-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{doc.name}</p>
                              </div>
                            </div>
                            {doc.description && (
                              <p className="mt-1.5 text-[11px] text-muted-foreground line-clamp-2">{doc.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Type</p>
                            <Badge variant="secondary" className={cn('text-[10px] mt-0.5', TYPE_COLORS[doc.type])}>
                              {TYPE_LABELS[doc.type] || doc.type}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Module</p>
                            <Badge variant="outline" className="text-[10px] mt-0.5 gap-1">
                              <span className={cn('inline-block size-2 rounded-full', MODULE_COLORS[doc.module])} />
                              {MODULE_LABELS[doc.module] || doc.module}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Visibilité</p>
                            <p className="mt-0.5 font-medium">{VISIBILITY_LABELS[doc.visibility] || doc.visibility}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Créé le</p>
                            <p className="mt-0.5 font-medium">
                              {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-1 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 h-8 text-xs"
                            onClick={() => handleOpenLink(doc.url)}
                          >
                            <ExternalLink className="size-3" />
                            Ouvrir
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 gap-1.5 h-8 text-xs"
                            onClick={() => handleEdit(doc)}
                          >
                            <Pencil className="size-3" />
                            Modifier
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 h-8 text-xs text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(doc)}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Results count */}
              <p className="mt-3 text-xs text-muted-foreground">
                {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''} affiché{filteredDocs.length !== 1 ? 's' : ''}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDoc ? 'Modifier le Document' : 'Nouveau Document'}
            </DialogTitle>
            <DialogDescription>
              {editingDoc
                ? 'Modifiez les informations du document.'
                : 'Ajoutez un nouveau document ou lien pour le cockpit.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="doc-name">Nom du document *</Label>
              <Input
                id="doc-name"
                placeholder="Ex: Budget Annuel 2025"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="doc-url">URL / Lien *</Label>
              <Input
                id="doc-url"
                placeholder="https://sharepoint.ansut.mg/..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>

            {/* Type + Module */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => setForm({ ...form, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className={cn('inline-block size-2 rounded-full', TYPE_COLORS[key].split(' ')[0])} />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Module *</Label>
                <Select
                  value={form.module}
                  onValueChange={(val) => setForm({ ...form, module: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MODULE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <span className={cn('inline-block size-2 rounded-full', MODULE_COLORS[key])} />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <Label>Visibilité</Label>
              <Select
                value={form.visibility}
                onValueChange={(val) => setForm({ ...form, visibility: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(VISIBILITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="doc-description">Description</Label>
              <Textarea
                id="doc-description"
                placeholder="Description du document..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.url.trim()}
              className="gap-2 bg-fun-blue hover:bg-fun-blue-dark"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editingDoc ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le document{' '}
              <span className="font-semibold text-foreground">{deletingDoc?.name}</span> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={saving}
              className="gap-2 bg-destructive hover:bg-destructive/90"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
