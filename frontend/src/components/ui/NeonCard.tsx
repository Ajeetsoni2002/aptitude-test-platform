// src/components/ui/NeonCard.tsx
// Plain surface card. `variant` is kept for API compatibility; it sets
// --card-accent which a child can use, but the card itself stays neutral.
import { cn } from '@/lib/utils';
import type { ReactNode, CSSProperties } from 'react';

type NeonVariant = 'default' | 'cyan' | 'magenta' | 'violet' | 'green' | 'amber' | 'red';

interface NeonCardProps {
  children: ReactNode;
  className?: string;
  variant?: NeonVariant;
  hover?: boolean;
  onClick?: () => void;
  padding?: string;
  style?: CSSProperties;
}

const NeonCard = ({
  children,
  className,
  variant = 'default',
  hover = true,
  onClick,
  padding = 'p-6',
  style,
}: NeonCardProps) => (
  <div
    onClick={onClick}
    style={style}
    className={cn(
      'neon-card',
      variant !== 'default' && variant,
      padding,
      !hover && 'hover:!border-line',
      onClick && 'cursor-pointer',
      className
    )}
  >
    {children}
  </div>
);

export default NeonCard;
