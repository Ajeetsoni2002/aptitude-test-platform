import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useInView } from './useInView';
import { cn } from '@/lib/utils';

export const Reveal = ({
  as: Tag = 'div',
  className,
  delay = 0,
  children,
}: {
  as?: ElementType;
  className?: string;
  delay?: number;
  children: ReactNode;
}) => {
  const [ref, inView] = useInView<HTMLDivElement>();
  return (
    <Tag ref={ref} className={cn('lp-reveal', inView && 'is-in', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
};

/**
 * Text that switches on character by character, like a dot-matrix
 * display. Screen readers get the plain string.
 */
export const LedText = ({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) => {
  // Characters animate one by one, but each word is kept together so a
  // line never breaks in the middle of a word.
  let i = 0;
  const words = text.split(' ');
  return (
    <span className={cn('lp-led', className)} style={{ '--d': `${delay}ms` } as CSSProperties}>
      <span className="sr-only">{text}</span>
      {words.map((word, w) => (
        <span key={w} aria-hidden="true" className="lp-led-word">
          {Array.from(word).map((ch) => (
            <span key={i} style={{ '--i': i++ } as CSSProperties}>
              {ch}
            </span>
          ))}
          {w < words.length - 1 && <span style={{ '--i': i++ } as CSSProperties}>{' '}</span>}
        </span>
      ))}
    </span>
  );
};

/** Drawn tick or cross. */
export const Mark = ({ kind, size = 20, className }: { kind: 'tick' | 'cross'; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={cn('lp-mark', className)} aria-hidden="true">
    {kind === 'tick' ? (
      <path pathLength={1} d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path pathLength={1} d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    )}
  </svg>
);

/** Dot-matrix meter, 0–1. */
export const Meter = ({ value, className, tone }: { value: number; className?: string; tone?: string }) => (
  <span className={cn('lp-meter block', className)} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)}>
    <span className={tone ?? 'text-ink'} style={{ '--w': `${Math.max(0, Math.min(1, value)) * 100}%` } as CSSProperties} />
  </span>
);

export const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn('label-caps', className)}>{children}</p>
);
