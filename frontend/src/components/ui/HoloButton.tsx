// src/components/ui/HoloButton.tsx
// Main button. Variant names are historical:
//   cyan    → primary (pen blue)      violet → ink (solid black/white)
//   magenta → clay accent             ghost  → outlined
//   danger  → examiner red
import { cn } from '@/lib/utils';
import type { ReactNode, ButtonHTMLAttributes } from 'react';

type HoloVariant = 'cyan' | 'magenta' | 'violet' | 'ghost' | 'danger';
type HoloSize    = 'sm' | 'md' | 'lg' | 'xl';

interface HoloButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: HoloVariant;
  size?: HoloSize;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<HoloVariant, string> = {
  cyan:    'btn-holo-cyan',
  magenta: 'btn-holo-magenta',
  violet:  'btn-holo-violet',
  ghost:   'btn-ghost-neon',
  danger:  'bg-bad text-snow border border-transparent hover:bg-bad/90 font-mono font-bold uppercase tracking-[0.04em]',
};

const sizeStyles: Record<HoloSize, string> = {
  sm: 'h-8 px-3.5 text-[11.5px] rounded-full',
  md: 'h-10 px-4 text-[12.5px] rounded-full',
  lg: 'h-11 px-5 text-[13px] rounded-full',
  xl: 'h-12 px-6 text-[14px] rounded-full',
};

const HoloButton = ({
  children,
  variant = 'cyan',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className,
  disabled,
  ...props
}: HoloButtonProps) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={cn(
      'relative inline-flex items-center justify-center gap-2 whitespace-nowrap select-none',
      'transition-colors duration-150',
      'disabled:opacity-45 disabled:cursor-not-allowed disabled:transform-none',
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && 'w-full',
      className
    )}
  >
    {loading ? (
      <>
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <span>Please wait…</span>
      </>
    ) : (
      <>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </>
    )}
  </button>
);

export default HoloButton;
