'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  status: string;
  label: string;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  // Positive statuses → green
  conforme: 'bg-success/15 text-success border-success/25',
  positif: 'bg-success/15 text-success border-success/25',
  en_cours: 'bg-success/15 text-success border-success/25',
  realise: 'bg-success/15 text-success border-success/25',
  atteint: 'bg-success/15 text-success border-success/25',
  complet: 'bg-success/15 text-success border-success/25',

  // Negative statuses → red
  non_conforme: 'bg-danger/15 text-danger border-danger/25',
  negatif: 'bg-danger/15 text-danger border-danger/25',
  critique: 'bg-danger/15 text-danger border-danger/25',
  en_retard: 'bg-danger/15 text-danger border-danger/25',
  echoue: 'bg-danger/15 text-danger border-danger/25',
  non_atteint: 'bg-danger/15 text-danger border-danger/25',

  // Neutral/warning statuses → orange/yellow
  en_attente: 'bg-warning/15 text-warning border-warning/25',
  neutre: 'bg-warning/15 text-warning border-warning/25',
  moyenne: 'bg-warning/15 text-warning border-warning/25',
  planifie: 'bg-warning/15 text-warning border-warning/25',
  partiel: 'bg-warning/15 text-warning border-warning/25',
};

function getStatusClass(status: string): string {
  return STATUS_COLOR_MAP[status] || 'bg-muted text-muted-foreground border-border';
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        getStatusClass(status)
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full shrink-0',
          status === 'conforme' ||
            status === 'positif' ||
            status === 'en_cours' ||
            status === 'realise' ||
            status === 'atteint' ||
            status === 'complet'
            ? 'bg-success'
            : status === 'non_conforme' ||
                status === 'negatif' ||
                status === 'critique' ||
                status === 'en_retard' ||
                status === 'echoue' ||
                status === 'non_atteint'
              ? 'bg-danger'
              : 'bg-warning'
        )}
      />
      {label}
    </Badge>
  );
}
