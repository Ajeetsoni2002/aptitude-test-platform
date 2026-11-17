// Small building blocks shared across landing sections.

import { useEffect, useRef, useState, type ReactNode, type PointerEvent, type CSSProperties } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const GLYPHS = '!<>-_\\/[]{}—=+*^?#ΣΔπ01ABCDEF';
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

// ── Scroll reveal ────────────────────────────────────────────────
export const Reveal = ({
  children,
  delay = 0,
  y = 36,
  className,
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.9, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
};

// ── Card whose border + glow follow the pointer ──────────────────
export const SpotlightCard = ({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div ref={ref} onPointerMove={onMove} className={`nx-spot ${className}`} style={style}>
      {children}
    </div>
  );
};

// ── Cycling words with a decode/scramble transition ──────────────
export const ScrambleWords = ({
  words,
  interval = 2600,
  className,
}: {
  words: readonly string[];
  interval?: number;
  className?: string;
}) => {
  const [text, setText] = useState(words[0]);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || words.length < 2) return;
    let idx = 0;
    let raf = 0;
    let timer = 0;

    const run = () => {
      const from = words[idx];
      idx = (idx + 1) % words.length;
      const to = words[idx];
      const len = Math.max(from.length, to.length);
      const queue = Array.from({ length: len }, (_, i) => {
        const start = Math.floor(Math.random() * 10);
        return { from: from[i] ?? '', to: to[i] ?? '', start, end: start + 8 + Math.floor(Math.random() * 14) };
      });
      let frame = 0;
      const tick = () => {
        let out = '';
        let done = 0;
        for (const q of queue) {
          if (frame >= q.end) {
            done++;
            out += q.to;
          } else if (frame >= q.start) {
            out += q.to === ' ' ? ' ' : randomGlyph();
          } else {
            out += q.from;
          }
        }
        setText(out);
        if (done === queue.length) {
          timer = window.setTimeout(run, interval);
          return;
        }
        frame++;
        raf = requestAnimationFrame(tick);
      };
      tick();
    };

    timer = window.setTimeout(run, interval);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [words, interval, reduce]);

  return <span className={className}>{text}</span>;
};

// ── One-shot decode when scrolled into view ──────────────────────
export const DecodeText = ({ text, className }: { text: string; className?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  const [out, setOut] = useState(text);

  useEffect(() => {
    if (!inView || reduce) return;
    let frame = 0;
    let raf = 0;
    const total = 26;
    const tick = () => {
      const revealed = Math.floor((frame / total) * text.length);
      let s = '';
      for (let i = 0; i < text.length; i++) {
        s += i < revealed || text[i] === ' ' ? text[i] : randomGlyph();
      }
      setOut(s);
      if (frame < total) {
        frame++;
        raf = requestAnimationFrame(tick);
      } else {
        setOut(text);
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, text]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">{out}</span>
    </span>
  );
};

// ── Section heading ──────────────────────────────────────────────
export const SectionHead = ({
  eyebrow,
  title,
  sub,
  center = false,
  compact = false,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  center?: boolean;
  compact?: boolean;
}) => (
  <div className={`nx-head ${center ? 'is-center' : ''} ${compact ? 'is-compact' : ''}`}>
    <Reveal>
      <DecodeText text={eyebrow} className="nx-eyebrow" />
    </Reveal>
    <Reveal delay={0.08}>
      <h2 className="nx-h2">{title}</h2>
    </Reveal>
    {sub && (
      <Reveal delay={0.16}>
        <p className="nx-lead" style={{ margin: 0, maxWidth: 640 }}>{sub}</p>
      </Reveal>
    )}
  </div>
);

// ── Count-up number triggered by visibility ──────────────────────
export const CountUp = ({ to, duration = 1600, suffix = '' }: { to: number; duration?: number; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, to, duration]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
};
