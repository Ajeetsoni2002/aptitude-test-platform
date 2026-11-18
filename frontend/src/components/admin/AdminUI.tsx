// Shared building blocks for admin pages. Calm surfaces, clear hierarchy:
// a serif page title, plain cards, numbers set large in the display face.
import { motion } from 'framer-motion';
import type { HTMLMotionProps, Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type AdminTone =
  | 'default'
  | 'cyan'
  | 'violet'
  | 'magenta'
  | 'green'
  | 'amber'
  | 'red';

const toneVar: Record<AdminTone, string> = {
  default: 'ink',
  cyan: 'brand',
  violet: 'plum',
  magenta: 'clay',
  green: 'green',
  amber: 'amber',
  red: 'red',
};

const badgeToneClassMap: Record<AdminTone, string> = {
  default: 'border-line bg-ink/[0.04] text-ink/70',
  cyan: 'border-brand/25 bg-brand/10 text-brand',
  violet: 'border-plum/25 bg-plum/10 text-plum',
  magenta: 'border-clay/25 bg-clay/10 text-clay',
  green: 'border-ok/25 bg-ok/10 text-ok',
  amber: 'border-warn/30 bg-warn/10 text-warn',
  red: 'border-bad/25 bg-bad/10 text-bad',
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.02 } },
};

export const pageTransitionProps = {
  initial: 'hidden',
  animate: 'show',
  variants: staggerContainer,
} as const;

const ease = [0.2, 0.7, 0.2, 1] as const;

export function AdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div {...pageTransitionProps} className={cn('space-y-6', className)}>
      {children}
    </motion.div>
  );
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUpVariants}
      transition={{ duration: 0.3, ease }}
      className={cn('flex flex-col gap-4 border-b border-line pb-5 xl:flex-row xl:items-end xl:justify-between', className)}
    >
      <div className="space-y-1.5">
        {eyebrow ? <p className="label-caps">{eyebrow}</p> : null}
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-ink md:text-[32px]">{title}</h1>
        {description ? <p className="max-w-2xl text-[15px] leading-6 text-ink/60">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </motion.div>
  );
}

interface AdminPanelProps extends Omit<HTMLMotionProps<'section'>, 'title'> {
  children: ReactNode;
  tone?: AdminTone;
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  actions?: ReactNode;
  contentClassName?: string;
}

export function AdminPanel({
  children,
  tone = 'default',
  title,
  description,
  eyebrow,
  actions,
  className,
  contentClassName,
  ...props
}: AdminPanelProps) {
  return (
    <motion.section
      variants={fadeUpVariants}
      transition={{ duration: 0.3, ease }}
      className={cn('admin-panel', tone === 'red' && 'admin-panel-red', className)}
      {...props}
    >
      {(title || eyebrow || description || actions) && (
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="space-y-1">
            {eyebrow ? <p className="label-caps">{eyebrow}</p> : null}
            {title ? <h2 className="text-[16px] font-semibold text-ink">{title}</h2> : null}
            {description ? <p className="max-w-2xl text-sm leading-6 text-ink/55">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      )}
      {/* "p-0" alone would leave sm:p-6 in place, so treat it as "no padding" */}
      <div className={cn('p-5 sm:p-6', /(^|\s)p-0(\s|$)/.test(contentClassName ?? '') && 'sm:p-0', contentClassName)}>{children}</div>
    </motion.section>
  );
}

export function AdminMetricCard({
  label,
  value,
  icon,
  tone = 'cyan',
  caption,
  trend,
  className,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  tone?: AdminTone;
  caption?: ReactNode;
  trend?: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUpVariants}
      transition={{ duration: 0.3, ease }}
      className={cn('admin-panel px-5 py-4', className)}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink/60">{label}</p>
        <span className="[&_svg]:h-[18px] [&_svg]:w-[18px]" style={{ color: `rgb(var(--${toneVar[tone]}))` }}>
          {icon}
        </span>
      </div>
      <div className="mt-3 font-display text-[32px] font-medium leading-none tracking-tight text-ink tabular">{value}</div>
      {caption ? <p className="mt-2 text-[13px] text-ink/55">{caption}</p> : null}
      {trend ? <div className="mt-1 text-xs text-ink/50">{trend}</div> : null}
    </motion.div>
  );
}

export function AdminStatusBadge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: AdminTone;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn('rounded-full border px-2.5 py-0.5 text-[12px] font-medium', badgeToneClassMap[tone], className)}
    >
      {children}
    </Badge>
  );
}

export function AdminEmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUpVariants}
      className="rounded-[14px] border border-dashed border-ink/20 bg-raised px-6 py-12 text-center"
    >
      <div className="mx-auto max-w-md space-y-3">
        {icon ? <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink/5 text-ink/50">{icon}</div> : null}
        <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
        {description ? <p className="text-sm leading-6 text-ink/55">{description}</p> : null}
        {action ? <div className="flex justify-center pt-1">{action}</div> : null}
      </div>
    </motion.div>
  );
}

export function AdminToggle({
  checked,
  onChange,
  label,
  description,
  tone = 'cyan',
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  tone?: AdminTone;
}) {
  const v = toneVar[tone === 'default' ? 'cyan' : tone];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="admin-panel flex w-full items-center justify-between gap-5 px-5 py-4 text-left hover:border-ink/25 transition-colors"
    >
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {description ? <p className="text-[13px] leading-5 text-ink/55">{description}</p> : null}
      </div>
      <span
        className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors"
        style={{ background: checked ? `rgb(var(--${v}))` : 'rgb(var(--ink) / .15)' }}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-snow shadow-soft transition-[left] duration-200',
            checked ? 'left-[22px]' : 'left-0.5'
          )}
        />
      </span>
    </button>
  );
}
