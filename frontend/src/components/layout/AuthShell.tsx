// Shared frame for the sign-in, sign-up and account-recovery pages.
// Desktop: a quiet editorial panel on the left, the form card on the right.
// Mobile: just the card, with the wordmark above it.

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Wordmark } from '@/components/brand/BrandMark';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

interface AuthShellProps {
  children: ReactNode;
  /** Text or links shown under the card (e.g. "New to Nexus? Create an account"). */
  footer?: ReactNode;
  /** Wider card for longer forms. */
  wide?: boolean;
}

const sampleOptions = ['40', '42', '44', '48'];

const SampleQuestion = () => (
  <figure
    aria-hidden="true"
    className="mt-12 max-w-[440px] overflow-hidden rounded-[14px] border border-line bg-surface shadow-soft"
  >
    <div className="flex items-center justify-between border-b border-line px-5 py-2.5">
      <span className="font-mono text-[12px] text-ink/55">Q 07 · Logical reasoning</span>
      <span className="font-mono text-[12px] text-ink/55">00:48</span>
    </div>
    <div className="px-5 pb-4 pt-3 text-[15px] leading-relaxed">
      <p className="text-ink">What comes next? 2, 6, 12, 20, 30, …</p>
      <ul className="grid grid-cols-4 gap-2">
        {sampleOptions.map((opt, i) => {
          const picked = i === 1;
          return (
            <li key={opt} className="flex items-center gap-2 font-mono text-[14px] text-ink/75">
              <span
                className={cn(
                  'inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px]',
                  picked ? 'border-brand bg-brand' : 'border-ink/35'
                )}
              />
              {opt}
            </li>
          );
        })}
      </ul>
    </div>
  </figure>
);

export const AuthShell = ({ children, footer, wide = false }: AuthShellProps) => (
  <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[minmax(0,11fr)_minmax(0,10fr)]">
    {/* ── Editorial panel (desktop only) ───────────────────── */}
    <aside className="hidden border-r border-line bg-raised lg:flex lg:min-h-screen lg:flex-col lg:justify-between lg:px-14 lg:py-12 xl:px-20">
      <Wordmark to="/" size="md" />

      <div className="max-w-[520px] py-12">
        <p className="label-caps mb-5">Aptitude practice for placements</p>
        <p className="font-display text-[36px] font-medium leading-[1.1] tracking-tight text-ink xl:text-[44px]">
          Sit the paper <em className="font-normal">before</em> the paper.
        </p>
        <p className="mt-4 max-w-[440px] text-[16px] leading-relaxed text-ink/60">
          Timed quant, reasoning and verbal tests, proctored like an exam hall, with every question reviewed afterwards.
        </p>
        <SampleQuestion />
      </div>

      <p className="text-[13px] text-ink/55">
        Not ready to sign up?{' '}
        <Link to="/demo" className="font-medium text-brand hover:underline">
          Try the 10-question demo
        </Link>
        , no account needed.
      </p>
    </aside>

    {/* ── Form side ─────────────────────────────────────────── */}
    <main className="relative flex min-h-screen flex-col px-5 pb-12 pt-5 sm:px-8 lg:pt-8">
      <div className="flex items-center justify-between lg:justify-end">
        <Wordmark to="/" size="sm" className="lg:hidden" />
        <ThemeToggle size="sm" />
      </div>

      <div className="flex flex-1 items-center justify-center py-10">
        <div className={cn('w-full section-enter', wide ? 'max-w-[480px]' : 'max-w-[420px]')}>
          <div className="rounded-[14px] border border-line bg-surface p-6 shadow-soft sm:p-8">
            {children}
          </div>
          {footer && <div className="mt-6 text-center text-[14px] text-ink/60">{footer}</div>}
        </div>
      </div>
    </main>
  </div>
);

/** Page title + one line of supporting text, used at the top of each auth card. */
export const AuthHeading = ({ title, children }: { title: string; children?: ReactNode }) => (
  <div className="mb-6">
    <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
    {children && <p className="mt-1.5 text-[14px] leading-relaxed text-ink/60">{children}</p>}
  </div>
);

/** Inline notice inside a card. */
export const AuthNotice = ({
  tone,
  icon,
  children,
  className,
}: {
  tone: 'bad' | 'warn' | 'ok' | 'neutral';
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <div
    role={tone === 'bad' ? 'alert' : undefined}
    className={cn(
      'flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-[14px] leading-snug',
      tone === 'bad' && 'border-bad/25 bg-bad/[0.06] text-bad',
      tone === 'warn' && 'border-warn/30 bg-warn/[0.07] text-ink/80',
      tone === 'ok' && 'border-ok/25 bg-ok/[0.07] text-ink/80',
      tone === 'neutral' && 'border-line bg-raised text-ink/70',
      className
    )}
  >
    {icon && <span className="mt-0.5 flex-shrink-0">{icon}</span>}
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

const strengthBar = ['', 'bg-bad', 'bg-warn', 'bg-warn', 'bg-ok', 'bg-ok'];
const strengthText = ['', 'text-bad', 'text-warn', 'text-warn', 'text-ok', 'text-ok'];

/** Strength bar + checklist under a new-password field. Purely visual. */
export const PasswordMeter = ({
  password,
  strength,
  label,
}: {
  password: string;
  strength: number;
  label: string;
}) => {
  const rules = [
    { ok: password.length >= 8, text: '8+ characters' },
    { ok: /[A-Z]/.test(password), text: 'Uppercase' },
    { ok: /[a-z]/.test(password), text: 'Lowercase' },
    { ok: /[0-9]/.test(password), text: 'Number' },
    { ok: /[^A-Za-z0-9]/.test(password), text: 'Symbol' },
  ];
  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn('h-1 flex-1 rounded-full transition-colors', strength >= i ? strengthBar[strength] : 'bg-ink/10')}
            />
          ))}
        </div>
        <span className={cn('w-16 text-right font-mono text-[11px]', strengthText[strength])}>{label}</span>
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[12px]">
        {rules.map((r) => (
          <li key={r.text} className={cn('inline-flex items-center gap-1', r.ok ? 'text-ok' : 'text-ink/45')}>
            {r.ok ? <Check size={12} strokeWidth={2.5} /> : <span className="mx-[3px] h-1.5 w-1.5 rounded-full bg-ink/25" />}
            {r.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AuthShell;
