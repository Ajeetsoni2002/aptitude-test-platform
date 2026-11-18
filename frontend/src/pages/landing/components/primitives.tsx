import type { ElementType, ReactNode } from 'react';
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

/** A blue-pen underline that draws itself under a word. */
export const PenUnderline = ({ children }: { children: ReactNode }) => {
  const [ref, inView] = useInView<HTMLSpanElement>('0px');
  return (
    <span ref={ref} className="relative inline-block whitespace-nowrap">
      {children}
      <svg
        className={cn('lp-pen absolute left-[-2%] -bottom-[0.18em] w-[104%] h-[0.32em] overflow-visible', inView && 'is-in')}
        viewBox="0 0 300 20"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          pathLength={1}
          d="M3 14c38-6 84-9 132-9 50 0 101 3 162 8M18 17c62-4 130-5 190-3"
          fill="none"
          stroke="rgb(var(--brand))"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
};

/** OMR answer bubble that shades in with a pen scribble when filled. */
export const Bubble = ({ letter, filled, className }: { letter: string; filled: boolean; className?: string }) => (
  <span className={cn('lp-bubble', filled && 'is-filled', className)} aria-hidden="true">
    {letter}
    <svg viewBox="0 0 22 22">
      <path
        pathLength={1}
        d="M5 8c3-3 9-4 12-1M4 11c4-4 11-5 14-1M4 14c5-5 11-6 14-2M5 16c4-3 9-4 12-1M7 18c3-2 6-2 8-1"
        fill="none"
        stroke="rgb(var(--brand))"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </svg>
  </span>
);

/** Examiner's red tick or cross. */
export const ExaminerMark = ({ kind, size = 28, className }: { kind: 'tick' | 'cross'; size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={cn('lp-mark', className)} aria-hidden="true">
    {kind === 'tick' ? (
      <path pathLength={1} d="M6 17c3 2 5 5 7 8 4-8 8-14 14-20" fill="none" stroke="rgb(var(--red))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path pathLength={1} d="M8 8c6 5 11 11 16 17M24 7c-5 6-10 12-17 18" fill="none" stroke="rgb(var(--red))" strokeWidth="3" strokeLinecap="round" />
    )}
  </svg>
);

export const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn('label-caps', className)}>{children}</p>
);
