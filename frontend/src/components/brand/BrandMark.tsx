// Brand: a dot-matrix "N" and the NEXUS wordmark set in the Doto
// dot-matrix face. Both use currentColor, so they invert with the theme.

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

// 5 x 5 grid, 1 = lit dot. Reads as an "N".
const N_GRID = [
  '10001',
  '11001',
  '10101',
  '10011',
  '10001',
];

export const BrandMark = ({ size = 28, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 25 25" className={cn('flex-shrink-0', className)} aria-hidden="true">
    {N_GRID.flatMap((row, r) =>
      row.split('').map((cell, c) => (
        <circle
          key={`${r}-${c}`}
          cx={2.5 + c * 5}
          cy={2.5 + r * 5}
          r={cell === '1' ? 1.9 : 0.7}
          fill="currentColor"
          opacity={cell === '1' ? 1 : 0.22}
        />
      ))
    )}
  </svg>
);

type WordmarkProps = {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Show "(APTITUDE)" after the name, in the reference's bracket style. */
  tagline?: boolean;
};

const sizes = {
  sm: 'text-[20px]',
  md: 'text-[24px]',
  lg: 'text-[32px]',
};

export const Wordmark = ({ to, size = 'md', className, tagline = false }: WordmarkProps) => {
  const inner = (
    <span className={cn('inline-flex items-baseline gap-1.5 text-ink leading-none', className)}>
      <span className={cn('font-display font-black uppercase tracking-[0.02em]', sizes[size])}>Nexus</span>
      {tagline && <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink/55">(aptitude)</span>}
    </span>
  );
  return to ? (
    <Link to={to} aria-label="Nexus home" className="rounded-md">
      {inner}
    </Link>
  ) : (
    inner
  );
};

export default Wordmark;
