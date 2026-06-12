'use client';

import React, { useEffect, useState } from 'react';
import { FileText, ExternalLink, Link as LinkIcon, FolderOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Doc {
  id: string;
  name: string;
  url: string;
  type: string;
  description: string | null;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  lien: { label: 'Lien', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: LinkIcon },
  sharepoint: { label: 'SharePoint', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: FolderOpen },
  onedrive: { label: 'OneDrive', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: FileText },
  teams: { label: 'Teams', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: LinkIcon },
};

export function ModuleDocuments({ domain }: { domain: string }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/documents?module=${domain}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => {
        if (!cancelled) {
          setDocs(json.data ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDocs([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [domain]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-md" />
            <Skeleton className="h-5 w-48" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (docs.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 rounded-md bg-amber-100 p-1.5 dark:bg-amber-900/30">
            <FileText className="size-4 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-sm sm:text-base">Documents & Ressources liées</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {docs.length} document{docs.length > 1 ? 's' : ''} associé{docs.length > 1 ? 's' : ''} à ce module
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {docs.map((doc) => {
            const config = TYPE_CONFIG[doc.type] ?? TYPE_CONFIG.lien;
            const IconComp = config.icon;
            return (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50 group"
              >
                <div className="shrink-0 rounded-md bg-muted p-1.5">
                  <IconComp className="size-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium group-hover:text-fun-blue transition-colors">
                    {doc.name}
                  </p>
                  {doc.description && (
                    <p className="truncate text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                  )}
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px] hidden sm:inline-flex">
                  {config.label}
                </Badge>
                <ExternalLink className="shrink-0 size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}