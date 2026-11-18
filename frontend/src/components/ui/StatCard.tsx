// src/components/ui/StatCard.tsx
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import NeonCard from './NeonCard';

type StatVariant = 'cyan' | 'magenta' | 'violet' | 'green' | 'amber';

interface StatCardProps {
  label:    string;
  value:    string | number;
  subtext?: string;
  icon:     ReactNode;
  variant?: StatVariant;
  trend?:   { value: number; label: string };
  className?: string;
}

const iconTone: Record<StatVariant, string> = {
  cyan:    'text-brand',
  magenta: 'text-clay',
  violet:  'text-plum',
  green:   'text-ok',
  amber:   'text-warn',
};

const StatCard = ({ label, value, subtext, icon, variant = 'cyan', trend, className }: StatCardProps) => (
  <NeonCard padding="p-5" className={cn('animate-fade-up', className)}>
    <div className="flex items-center justify-between gap-3">
      <p className="text-[13px] text-ink/60">{label}</p>
      <span className={cn('flex-shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px]', iconTone[variant])}>{icon}</span>
    </div>

    <p className="mt-3 font-display text-[34px] leading-none font-medium tracking-tight text-ink tabular">
      {value}
    </p>

    <div className="mt-2 flex items-center gap-2 text-[13px] text-ink/50">
      {trend && (
        <span className={cn('font-mono text-xs font-medium', trend.value >= 0 ? 'text-ok' : 'text-bad')}>
          {trend.value >= 0 ? '+' : '−'}{Math.abs(trend.value)}%
        </span>
      )}
      {trend ? <span>{trend.label}</span> : subtext && <span>{subtext}</span>}
    </div>
  </NeonCard>
);

export default StatCard;
