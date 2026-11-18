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
  danger:  'bg-bad text-on-brand border border-transparent hover:bg-bad/90',
};

const sizeStyles: Record<HoloSize, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-lg',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-11 px-5 text-[15px] rounded-[10px]',
  xl: 'h-12 px-6 text-base rounded-xl',
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
      'relative inline-flex items-center justify-center gap-2 font-sans font-semibold whitespace-nowrap select-none',
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
