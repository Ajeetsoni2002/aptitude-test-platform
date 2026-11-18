// Public landing page.
// Monochrome, dot-matrix theme: black with white ink (light mode is the
// exact inverse), Doto headlines that switch on like an LED display,
// menu-style rows, and the fixed dot grid behind everything.
// Every claim on this page describes something the product does today
// (see ./data.ts).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, Moon, Sun, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Wordmark } from '@/components/brand/BrandMark';
import { cn } from '@/lib/utils';
import SampleQuestion from './components/SampleQuestion';
import StrikeDemo from './components/StrikeDemo';
import Marksheet from './components/Marksheet';
import DotHero from './components/DotHero';
import { Eyebrow, Reveal } from './components/primitives';
import { FAQ, INSTRUCTIONS, SECTIONS } from './data';
import './landing.css';

const NAV = [
  { id: 'paper', label: 'Sections' },
  { id: 'how', label: 'How it works' },
  { id: 'proctoring', label: 'Proctoring' },
  { id: 'colleges', label: 'Colleges' },
  { id: 'faq', label: 'FAQ' },
];

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: 'smooth' });
};

/* ── Floating navigation bar (inverted against the page) ─────────── */
const Nav = ({ authed }: { authed: boolean }) => {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-2 pt-2 sm:px-3">
      <div className="mx-auto max-w-[1400px] rounded-lg bg-zinc-200 text-paper shadow-lift">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:h-[60px] sm:px-5">
          <Link to="/" aria-label="Nexus home" className="font-display text-[24px] font-black uppercase leading-none">
            Nexus
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Sections">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => scrollTo(n.id)}
                className="rounded px-3 py-1.5 font-mono text-[13.5px] uppercase tracking-[0.02em] opacity-80 transition-opacity hover:opacity-100"
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded opacity-80 hover:opacity-100"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {authed ? (
              <Link to="/dashboard" className="hidden rounded px-3 py-1.5 font-mono text-[13.5px] uppercase sm:inline-block">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden rounded px-3 py-1.5 font-mono text-[13.5px] uppercase opacity-80 hover:opacity-100 sm:inline-block">
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="hidden h-9 items-center rounded-full bg-paper px-4 font-mono text-[12.5px] font-bold uppercase tracking-[0.04em] text-ink sm:inline-flex"
                >
                  Sign up
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="grid h-9 w-9 place-items-center rounded lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-paper/15 px-4 pb-4 pt-2 lg:hidden">
            {NAV.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  scrollTo(n.id);
                }}
                className="block w-full py-2.5 text-left font-mono text-[14px] uppercase"
              >
                {n.label}
              </button>
            ))}
            <div className="mt-2 flex gap-2">
              {authed ? (
                <Link to="/dashboard" className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-paper font-mono text-[13px] font-bold uppercase text-ink">Dashboard</Link>
              ) : (
                <>
                  <Link to="/login" className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-paper/30 font-mono text-[13px] uppercase">Log in</Link>
                  <Link to="/register" className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-paper font-mono text-[13px] font-bold uppercase text-ink">Sign up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

/* ── Section heading: big dotted title, centred ─────────────────── */
const SectionHead = ({ eyebrow, title, intro, align = 'center' }: { eyebrow: string; title: string; intro?: string; align?: 'center' | 'left' }) => (
  <Reveal className={cn('max-w-3xl', align === 'center' ? 'mx-auto text-center' : '')}>
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="mt-4 font-display text-[40px] leading-[1.02] text-ink sm:text-[56px] lg:text-[64px]">{title}</h2>
    {intro && <p className={cn('mt-5 text-[17px] leading-relaxed text-ink/60', align === 'center' && 'mx-auto max-w-xl')}>{intro}</p>}
  </Reveal>
);

/* ── Page ───────────────────────────────────────────────────────── */
const LandingPage = () => {
  const authed = useAuthStore((s) => s.isAuthenticated);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    document.title = 'Nexus · Aptitude practice that feels like the real paper';
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-20 focus:z-[60] focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Nav authed={authed} />

      <main id="main">
        {/* ── Hero: live dot-matrix display ── */}
        <section>
          <DotHero eyebrow={<Eyebrow className="animate-fade-in">Quant · Logical reasoning · Verbal</Eyebrow>}>
            <div className="relative mx-auto max-w-[1200px] text-center">
              <p className="mx-auto mt-5 max-w-[680px] text-[16px] leading-relaxed text-ink/65 sm:text-[17px] animate-fade-up-delay">
                Timed aptitude tests for placements and competitive exams. Proctored like an exam hall, and reviewed
                question by question, so you know exactly where your marks went.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 animate-fade-up-delay">
                <Link to="/demo" className="btn-ink inline-flex h-12 items-center gap-2 rounded-full px-6 text-[13px]">
                  Take the free demo <ArrowRight size={16} />
                </Link>
                <Link
                  to={authed ? '/test-setup' : '/register'}
                  className="btn-ghost-neon inline-flex h-12 items-center rounded-full px-6 text-[13px]"
                >
                  {authed ? 'Start a test' : 'Create free account'}
                </Link>
              </div>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink/45">
                No sign-up for the demo · 10 questions · 10 minutes
              </p>
            </div>
          </DotHero>

          <Reveal className="mx-auto mt-16 max-w-[640px] px-5 sm:px-0">
            <p className="label-caps mb-3 text-center">Try one now</p>
            <SampleQuestion />
          </Reveal>
        </section>

        {/* ── Sections ── */}
        <section id="paper" className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1200px]">
            <SectionHead
              eyebrow="What's on the paper"
              title="Three sections"
              intro="The same ones your aptitude round uses. Practise a whole section or only the topics that keep costing you, at easy, medium, hard or mixed, with 5 to 30 questions."
            />
            <div className="mt-16 grid gap-2 md:grid-cols-3">
              {SECTIONS.map((s, i) => (
                <Reveal key={s.name} delay={i * 80} className="rounded-xl bg-surface p-7 sm:p-8">
                  <p className="font-display text-[56px] leading-none text-ink/25">0{i + 1}</p>
                  <h3 className="mt-6 font-mono text-[15px] font-bold uppercase tracking-[0.04em] text-ink">{s.name}</h3>
                  <p className="mt-2 text-[15px] text-ink/60">{s.blurb}</p>
                  <ul className="mt-6 flex flex-wrap gap-1.5">
                    {s.topics.map((t) => (
                      <li key={t} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.04em] text-ink/70">
                        {t}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1200px]">
            <SectionHead
              eyebrow="How a session goes"
              title="Five steps"
              intro="Every test runs the same way, so the format stops being a surprise long before the real exam."
            />
            <Reveal className="mx-auto mt-16 max-w-[760px]">
              {INSTRUCTIONS.map((step, i) => (
                <div key={step.title} className="lp-row !h-auto !min-h-0 flex-col !items-start gap-1 !py-5 sm:flex-row sm:!items-center sm:gap-6">
                  <span className="font-display text-[34px] leading-none text-ink/30 sm:w-14">0{i + 1}</span>
                  <span className="flex-1">
                    <span className="block">{step.title}</span>
                    <span className="mt-1 block font-sans text-[15px] font-normal normal-case tracking-normal text-ink/60">{step.body}</span>
                  </span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── Proctoring ── */}
        <section id="proctoring" className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1200px]">
            <SectionHead
              eyebrow="Proctoring"
              title="Exam-hall strict"
              intro="Practice only helps if it is honest. Proctored tests watch for what an invigilator would, and the rules are the same for everyone."
            />
            <div className="mt-16 grid items-start gap-2 lg:grid-cols-2">
              <Reveal>
                {[
                  { t: 'Camera on', d: 'Face detection checks that you stay at the desk for the whole test.' },
                  { t: 'Full screen', d: 'Leaving full screen counts as a strike.' },
                  { t: 'Tab switches', d: 'Every switch is a strike. Three strikes and the paper submits itself.' },
                  { t: 'Watermarked', d: 'Your email and the time are tiled across the test screen, so screenshots are traceable.' },
                ].map((r) => (
                  <div key={r.t} className="lp-row !h-auto !min-h-0 flex-col !items-start gap-1 !py-5">
                    <span>{r.t}</span>
                    <span className="font-sans text-[15px] font-normal normal-case tracking-normal text-ink/60">{r.d}</span>
                  </div>
                ))}
              </Reveal>
              <Reveal delay={120}>
                <StrikeDemo />
                <p className="mt-3 px-1 text-[13px] text-ink/45">
                  This counter is live on this page. It uses the same browser signal as the real test; nothing is sent anywhere.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── After you submit ── */}
        <section className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHead
                align="left"
                eyebrow="After you submit"
                title="Results you can use"
                intro="Your score is the least useful number on the sheet. Nexus breaks every attempt down by topic and keeps your history, so practice goes where the marks are."
              />
              <Reveal className="mt-8">
                <ul className="space-y-3 text-[15px] text-ink/70">
                  {[
                    'Every question back with your answer, the right one and the working',
                    'Accuracy by topic across all your attempts',
                    'A full history of tests, scores and time taken',
                    'One new question every day, and a leaderboard',
                    'A study assistant to ask when a solution doesn’t click',
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-[9px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-ink" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
            <Reveal delay={100}>
              <Marksheet />
            </Reveal>
          </div>
        </section>

        {/* ── Colleges ── */}
        <section id="colleges" className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1200px]">
            <SectionHead
              eyebrow="For colleges and trainers"
              title="Whole batches"
              intro="Run placement prep for a class, with your own questions and your own schedule."
            />
            <Reveal className="mt-16 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { t: 'Question bank', d: 'Write questions with images, or upload hundreds at once from an Excel sheet.' },
                { t: 'Scheduled tests', d: 'Set a window, pick the sections or students who can take it, and it opens on time.' },
                { t: 'Live proctoring', d: 'Watch camera feeds and see strikes as they happen during a test.' },
                { t: 'Per-student results', d: 'Each student’s attempts, topic accuracy and progress over time.' },
              ].map((f) => (
                <div key={f.t} className="rounded-xl bg-surface p-6">
                  <p className="font-mono text-[13px] font-bold uppercase tracking-[0.04em] text-ink">{f.t}</p>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink/60">{f.d}</p>
                </div>
              ))}
            </Reveal>
            <p className="mt-8 text-center">
              <a
                href="mailto:support@aptitudetest.site?subject=Nexus%20for%20our%20college"
                className="inline-flex items-center gap-1.5 font-mono text-[13px] uppercase tracking-[0.04em] text-ink underline-offset-4 hover:underline"
              >
                Write to us about your batch <ArrowUpRight size={15} />
              </a>
            </p>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1200px]">
            <SectionHead eyebrow="Questions" title="FAQ" />
            <Reveal className="mx-auto mt-14 max-w-[760px]">
              {FAQ.map((f) => (
                <details key={f.q} className="group rounded-lg bg-surface [&+&]:mt-1">
                  <summary className="lp-row cursor-pointer list-none !bg-transparent [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown size={16} className="flex-shrink-0 opacity-60 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 text-[15px] leading-relaxed text-ink/65">{f.a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── Closing ── */}
        <section className="px-5 py-24 sm:px-8 sm:py-32">
          <div className="mx-auto max-w-[1200px] text-center">
            <Reveal>
              <h2 className="font-display text-[48px] leading-[1] text-ink sm:text-[80px] lg:text-[104px]">
                Ten minutes
                <br />
                to your next paper
              </h2>
              <div className="mt-10 flex flex-wrap justify-center gap-3">
                <Link to="/demo" className="btn-ink inline-flex h-12 items-center gap-2 rounded-full px-6 text-[13px]">
                  Take the free demo <ArrowRight size={16} />
                </Link>
                {!authed && (
                  <Link to="/register" className="btn-ghost-neon inline-flex h-12 items-center rounded-full px-6 text-[13px]">
                    Create an account
                  </Link>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── Footer: menu rows, like the reference ── */}
      <footer className="px-5 pb-10 pt-8 sm:px-8">
        <div className="mx-auto max-w-[400px]">
          <Link to="/demo" className="lp-row">
            Free demo test <ArrowRight size={16} className="opacity-70" />
          </Link>
          {authed ? (
            <Link to="/dashboard" className="lp-row">
              Dashboard <ArrowRight size={16} className="opacity-70" />
            </Link>
          ) : (
            <>
              <Link to="/register" className="lp-row">
                Create account <ArrowRight size={16} className="opacity-70" />
              </Link>
              <Link to="/login" className="lp-row">
                Log in <ArrowRight size={16} className="opacity-70" />
              </Link>
            </>
          )}
          <a href="mailto:support@aptitudetest.site" className="lp-row">
            Support <span className="font-normal normal-case tracking-normal opacity-60">support@aptitudetest.site</span>
          </a>
          <button type="button" onClick={toggleTheme} className="lp-row">
            Theme: {theme === 'light' ? 'Light' : 'Dark'}
            {theme === 'light' ? <Sun size={16} className="opacity-70" /> : <Moon size={16} className="opacity-70" />}
          </button>
        </div>

        <div className="mx-auto mt-16 max-w-[1400px]">
          <Wordmark size="lg" tagline className="justify-center w-full" />
          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-ink/40">
            © {new Date().getFullYear()} Nexus · Made for the night before the exam
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
