// Credit line shown across the site: "Made by Ajeet Soni", linking to the portfolio.
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PORTFOLIO_URL = 'https://ajeetsoni.vercel.app/';

interface MadeByProps {
  className?: string;
  /** Centre the line (footers) or keep it inline. */
  align?: 'left' | 'center';
}

const MadeBy = ({ className, align = 'left' }: MadeByProps) => (
  <p className={cn('font-mono text-[11px] uppercase tracking-[0.08em] text-ink/45', align === 'center' && 'text-center', className)}>
    Made by{' '}
    <a
      href={PORTFOLIO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-0.5 text-ink/80 underline decoration-ink/25 underline-offset-[3px] hover:text-ink hover:decoration-ink"
    >
      Ajeet Soni
      <ArrowUpRight size={11} className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden="true" />
      <span className="sr-only"> (portfolio, opens in a new tab)</span>
    </a>
  </p>
);

export default MadeBy;
