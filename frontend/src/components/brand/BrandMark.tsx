// Brand mark: an OMR answer bubble, filled in by hand with a blue pen.
// The fill is slightly off-centre and uneven on purpose, like a real
// bubble shaded during an exam.

import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const BrandMark = ({ size = 28, className }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={cn('flex-shrink-0', className)} aria-hidden="true">
    <circle cx="16" cy="16" r="13.25" fill="none" stroke="currentColor" strokeWidth="2.5" />
    <path
      d="M9.6 15.2c.3-3.7 3.1-6.3 6.7-6.1 3.9.2 6.6 3 6.3 6.9-.3 3.6-3.3 6.4-6.9 6.2-3.7-.2-6.4-3.2-6.1-7z"
      fill="rgb(var(--brand))"
    />
  </svg>
);

type WordmarkProps = {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  tagline?: boolean;
};

const sizes = {
  sm: { mark: 22, text: 'text-[17px]' },
  md: { mark: 26, text: 'text-[20px]' },
  lg: { mark: 34, text: 'text-[26px]' },
};

export const Wordmark = ({ to, size = 'md', className, tagline = false }: WordmarkProps) => {
  const s = sizes[size];
  const inner = (
    <span className={cn('inline-flex items-center gap-2 text-ink', className)}>
      <BrandMark size={s.mark} />
      <span className="flex flex-col leading-none">
        <span className={cn('font-display font-semibold tracking-tight', s.text)}>Nexus</span>
        {tagline && <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink/50">aptitude practice</span>}
      </span>
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
