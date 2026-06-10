'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  target?: number;
  trend?: 'positive' | 'negative' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  description?: string;
}

function TrendIcon({ trend }: { trend: 'positive' | 'negative' | 'neutral' }) {
  switch (trend) {
    case 'positive':
      return <TrendingUp className="size-4 text-success" />;
    case 'negative':
      return <TrendingDown className="size-4 text-danger" />;
    case 'neutral':
      return <Minus className="size-4 text-warning" />;
    default:
      return null;
  }
}

const trendStyles: Record<string, string> = {
  positive: 'text-success bg-success/10',
  negative: 'text-danger bg-danger/10',
  neutral: 'text-warning bg-warning/10',
};

export function KpiCard({
  title,
  value,
  unit,
  target,
  trend,
  trendValue,
  icon,
  description,
}: KpiCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
  const progressPercent = target && numericValue ? Math.min((numericValue / target) * 100, 100) : 0;

  return (
    <Card className="kpi-card group cursor-default transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Left: icon + title */}
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fun-blue/10 text-fun-blue">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">
                {title}
              </p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-bold text-foreground tracking-tight">
                  {value}
                </span>
                {unit && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {unit}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: trend indicator */}
          {trend && trendValue && (
            <div
              className={cn(
                'flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                trendStyles[trend]
              )}
            >
              <TrendIcon trend={trend} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {description}
          </p>
        )}

        {/* Progress bar when target exists */}
        {target !== undefined && target > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Objectif : {target}{unit || ''}
              </span>
              <span
                className={cn(
                  'font-medium',
                  progressPercent >= 80
                    ? 'text-success'
                    : progressPercent >= 50
                      ? 'text-warning'
                      : 'text-danger'
                )}
              >
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress
              value={progressPercent}
              className="h-1.5"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
