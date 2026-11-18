// Public landing page.
// Built around the exam-desk theme: answer-sheet paper, a blue pen, the
// examiner's red marks. Every claim on this page describes something the
// product does today (see ./data.ts).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Camera, Maximize, MonitorX, Stamp, Menu, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Wordmark } from '@/components/brand/BrandMark';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';
import SampleQuestion from './components/SampleQuestion';
import StrikeDemo from './components/StrikeDemo';
import Marksheet from './components/Marksheet';
import { Eyebrow, PenUnderline, Reveal } from './components/primitives';
import { FAQ, INSTRUCTIONS, SECTIONS } from './data';
import './landing.css';

const NAV = [
  { id: 'paper', label: 'The paper' },
  { id: 'how', label: 'How it works' },
  { id: 'proctoring', label: 'Proctoring' },
  { id: 'colleges', label: 'For colleges' },
  { id: 'faq', label: 'FAQ' },
];

const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
};

/* ── Navigation ─────────────────────────────────────────────────── */
const Nav = ({ authed }: { authed: boolean }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors',
        scrolled || open ? 'border-b border-line bg-canvas/90 backdrop-blur' : 'border-b border-transparent'
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-5 sm:px-8">
        <Wordmark to="/" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Sections">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => scrollTo(n.id)}
              className="rounded-md px-3 py-1.5 text-[14px] text-ink/65 transition-colors hover:text-ink"
            >
              {n.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle size="sm" className="border-transparent bg-transparent" />
          {authed ? (
            <Link to="/dashboard" className="btn-ink hidden h-9 items-center gap-1.5 rounded-lg px-3.5 text-[14px] sm:inline-flex">
              Dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-md px-3 py-1.5 text-[14px] text-ink/75 hover:text-ink sm:inline-block">
                Log in
              </Link>
              <Link to="/register" className="btn-ink hidden h-9 items-center rounded-lg px-3.5 text-[14px] sm:inline-flex">
                Create account
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-lg text-ink/70 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line px-5 pb-5 pt-2 lg:hidden">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                setOpen(false);
                scrollTo(n.id);
              }}
              className="block w-full py-2.5 text-left text-[15px] text-ink/80"
            >
              {n.label}
            </button>
          ))}
          <div className="mt-3 flex gap-2">
            {authed ? (
              <Link to="/dashboard" className="btn-ink inline-flex h-10 flex-1 items-center justify-center rounded-lg text-sm">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost-neon inline-flex h-10 flex-1 items-center justify-center rounded-lg text-sm">Log in</Link>
                <Link to="/register" className="btn-ink inline-flex h-10 flex-1 items-center justify-center rounded-lg text-sm">Create account</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

/* ── Section heading ────────────────────────────────────────────── */
const SectionHead = ({ eyebrow, title, intro, className }: { eyebrow: string; title: React.ReactNode; intro?: string; className?: string }) => (
  <Reveal className={cn('max-w-2xl', className)}>
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2 className="mt-3 font-display text-[34px] font-medium leading-[1.08] tracking-tight text-ink sm:text-[44px]">{title}</h2>
    {intro && <p className="mt-4 text-[17px] leading-relaxed text-ink/65">{intro}</p>}
  </Reveal>
);

/* ── Page ───────────────────────────────────────────────────────── */
const LandingPage = () => {
  const authed = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    document.title = 'Nexus · Aptitude practice that feels like the real paper';
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Nav authed={authed} />

      <main id="main">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
          <div className="graph-paper pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
            <div>
              <Eyebrow className="animate-fade-up">Quant · Logical reasoning · Verbal</Eyebrow>
              <h1 className="mt-5 font-display text-[46px] font-medium leading-[1.02] tracking-[-0.025em] text-ink sm:text-[64px] lg:text-[72px] animate-fade-up">
                Sit the paper <br className="hidden sm:block" />
                <PenUnderline>
                  <em className="font-normal">before</em>
                </PenUnderline>{' '}
                the paper.
              </h1>
              <p className="mt-6 max-w-[520px] text-[18px] leading-relaxed text-ink/65 animate-fade-up-delay">
                Timed aptitude tests for placements and competitive exams. Proctored like an exam hall, and reviewed
                question by question, so you know exactly where your marks went.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 animate-fade-up-delay">
                <Link to="/demo" className="btn-holo-cyan inline-flex h-12 items-center gap-2 rounded-[10px] px-5 text-[15px]">
                  Take the free demo <ArrowRight size={17} />
                </Link>
                <Link
                  to={authed ? '/test-setup' : '/register'}
                  className="btn-ghost-neon inline-flex h-12 items-center rounded-[10px] px-5 text-[15px]"
                >
                  {authed ? 'Start a test' : 'Create a free account'}
                </Link>
              </div>
              <p className="mt-4 font-mono text-[12px] text-ink/50">No sign-up for the demo · 10 questions · 10 minutes</p>
            </div>

            <div className="relative animate-fade-up-delay">
              <p className="mb-3 font-display italic text-[15px] text-ink/55 lg:absolute lg:-top-9 lg:left-2 lg:mb-0">
                Try one now
                <svg width="38" height="22" viewBox="0 0 38 22" className="ml-1 inline-block -translate-y-0.5 text-ink/40" aria-hidden="true">
                  <path d="M2 4c10 1 22 5 30 14M32 18l-1-8M32 18l-8-2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </p>
              <SampleQuestion />
            </div>
          </div>
        </section>

        {/* ── The paper ── */}
        <section id="paper" className="border-t border-line py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <SectionHead
              eyebrow="What's on the paper"
              title="Three sections, the same ones your aptitude round uses."
              intro="Practise a whole section or narrow it to the topics that keep costing you. Choose easy, medium, hard or mixed, and anything from 5 to 30 questions."
            />
            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
              {SECTIONS.map((s, i) => (
                <Reveal key={s.name} delay={i * 80} className="bg-surface p-7 sm:p-8">
                  <p className="lp-num text-[15px] italic text-ink/40">Section {s.no}</p>
                  <h3 className="mt-2 font-display text-[24px] font-medium leading-tight text-ink">{s.name}</h3>
                  <p className="mt-2 text-[15px] text-ink/60">{s.blurb}</p>
                  <ul className="mt-6 flex flex-wrap gap-1.5">
                    {s.topics.map((t) => (
                      <li key={t} className="rounded-full border border-line px-2.5 py-1 text-[13px] text-ink/70">
                        {t}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works: instructions to candidates ── */}
        <section id="how" className="border-t border-line bg-raised py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1200px] gap-14 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionHead
              eyebrow="How a session goes"
              title={<>Read the instructions <em className="font-normal">carefully.</em></>}
              intro="Every test runs the same way, so the format stops being a surprise long before the real exam."
            />
            <Reveal className="lp-sheet overflow-hidden rounded-2xl border border-line shadow-lift">
              {/* Heights below are multiples of 32px so the text sits on the ruled lines */}
              <div className="flex h-16 items-center border-b border-line bg-surface px-6 font-mono text-[12px] uppercase tracking-[0.08em] text-ink/55">
                Instructions to candidates
              </div>
              <ol className="pb-8 pr-6">
                {INSTRUCTIONS.map((step, i) => (
                  <li key={step.title} className="grid grid-cols-[48px_1fr] leading-8 [&:not(:last-child)]:mb-8">
                    <span className="text-center font-mono text-[13px] text-bad/80">{i + 1}.</span>
                    <div className="pl-4">
                      <p className="text-[16px] font-semibold text-ink">{step.title}</p>
                      <p className="text-[15px] text-ink/65">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </section>

        {/* ── Proctoring ── */}
        <section id="proctoring" className="border-t border-line py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="grid items-start gap-14 lg:grid-cols-2">
              <div>
                <SectionHead
                  eyebrow="Proctoring"
                  title="Strict in the way an exam hall is strict."
                  intro="Practice only helps if it is honest. Proctored tests watch for the same things an invigilator would, and the rules are the same for everyone."
                />
                <Reveal className="mt-10">
                  <dl className="divide-y divide-line border-y border-line">
                    {[
                      { icon: Camera, t: 'Camera on', d: 'Face detection checks that you stay at the desk for the whole test.' },
                      { icon: Maximize, t: 'Full screen', d: 'Leaving full screen counts as a strike.' },
                      { icon: MonitorX, t: 'Tab switches', d: 'Every switch is a strike. Three strikes and the paper submits itself.' },
                      { icon: Stamp, t: 'Watermarked', d: 'Your email and the time are tiled across the test screen, so screenshots are traceable.' },
                    ].map(({ icon: Icon, t, d }) => (
                      <div key={t} className="grid grid-cols-[28px_120px_1fr] items-baseline gap-3 py-4 sm:grid-cols-[28px_140px_1fr]">
                        <Icon size={17} className="translate-y-0.5 text-ink/50" />
                        <dt className="text-[15px] font-semibold text-ink">{t}</dt>
                        <dd className="text-[15px] text-ink/65">{d}</dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              </div>
              <Reveal delay={120} className="lg:pt-24">
                <StrikeDemo />
                <p className="mt-3 px-1 text-[13px] text-ink/50">
                  This counter is live on this page. It uses the same browser signal as the real test, but nothing is sent anywhere.
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── After you submit ── */}
        <section className="border-t border-line bg-raised py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
            <Reveal className="order-2 lg:order-1">
              <Marksheet />
            </Reveal>
            <div className="order-1 lg:order-2">
              <SectionHead
                eyebrow="After you submit"
                title="A result you can actually act on."
                intro="Your score is the least useful number on the sheet. Nexus breaks every attempt down by topic and keeps your history, so practice goes where the marks are."
              />
              <Reveal className="mt-8">
                <ul className="space-y-3 text-[15px] text-ink/75">
                  {[
                    'Every question back with your answer, the right one and the working',
                    'Accuracy by topic across all your attempts',
                    'A full history of tests, scores and time taken',
                    'One new question every day, and a leaderboard if you like that sort of thing',
                    'A study assistant you can ask when a solution doesn’t click',
                  ].map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-[9px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── For colleges ── */}
        <section id="colleges" className="border-t border-line py-20 sm:py-28">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="grid gap-12 rounded-2xl border border-line bg-surface p-8 sm:p-12 lg:grid-cols-[1fr_1.2fr]">
              <SectionHead
                eyebrow="For colleges and trainers"
                title="Run placement prep for a whole batch."
                className="max-w-none"
              />
              <Reveal className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
                {[
                  { t: 'Your own question bank', d: 'Write questions with images, or upload hundreds at once from an Excel sheet.' },
                  { t: 'Scheduled tests', d: 'Set a window, pick the sections or students who can take it, and it opens on time.' },
                  { t: 'Live proctoring', d: 'Watch camera feeds and see strikes as they happen during a test.' },
                  { t: 'Results per student', d: 'See each student’s attempts, topic accuracy and progress over time.' },
                ].map((f) => (
                  <div key={f.t}>
                    <p className="text-[16px] font-semibold text-ink">{f.t}</p>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-ink/65">{f.d}</p>
                  </div>
                ))}
                <a
                  href="mailto:support@aptitudetest.site?subject=Nexus%20for%20our%20college"
                  className="inline-flex items-center gap-1.5 text-[15px] font-medium text-brand hover:underline sm:col-span-2"
                >
                  Write to us about your batch <ArrowUpRight size={16} />
                </a>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="border-t border-line py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1200px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <SectionHead eyebrow="Questions" title="Before you start." />
            <Reveal className="divide-y divide-line border-y border-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border border-line font-mono text-[14px] text-ink/60 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink/65">{f.a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ── Closing CTA ── */}
        <section className="border-t border-line bg-ink text-paper">
          <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-8 px-5 py-20 sm:px-8 sm:py-24 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-[16ch] font-display text-[40px] font-medium leading-[1.05] tracking-tight sm:text-[56px]">
              Your next paper is ten minutes away.
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/demo"
                className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-paper px-5 text-[15px] font-semibold text-ink transition-opacity hover:opacity-90"
              >
                Take the free demo <ArrowRight size={17} />
              </Link>
              {!authed && (
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center rounded-[10px] border border-paper/30 px-5 text-[15px] font-semibold text-paper transition-colors hover:border-paper/60"
                >
                  Create an account
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-line">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Wordmark to="/" />
            <p className="mt-3 max-w-xs text-[14px] text-ink/55">
              Timed aptitude practice for placements and competitive exams.
            </p>
          </div>
          <div>
            <p className="label-caps">Practice</p>
            <ul className="mt-3 space-y-2 text-[14px] text-ink/70">
              <li><Link to="/demo" className="hover:text-ink">Free demo test</Link></li>
              <li><button type="button" onClick={() => scrollTo('paper')} className="hover:text-ink">Sections</button></li>
              <li><button type="button" onClick={() => scrollTo('proctoring')} className="hover:text-ink">Proctoring</button></li>
            </ul>
          </div>
          <div>
            <p className="label-caps">Account</p>
            <ul className="mt-3 space-y-2 text-[14px] text-ink/70">
              {authed ? (
                <>
                  <li><Link to="/dashboard" className="hover:text-ink">Dashboard</Link></li>
                  <li><Link to="/test-setup" className="hover:text-ink">Start a test</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/register" className="hover:text-ink">Create account</Link></li>
                  <li><Link to="/login" className="hover:text-ink">Log in</Link></li>
                </>
              )}
            </ul>
          </div>
          <div>
            <p className="label-caps">Contact</p>
            <ul className="mt-3 space-y-2 text-[14px] text-ink/70">
              <li><a href="mailto:support@aptitudetest.site" className="hover:text-ink">support@aptitudetest.site</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-5 text-[13px] text-ink/45 sm:px-8">
          <span>© {new Date().getFullYear()} Nexus</span>
          <span className="font-mono text-[12px]">Made for the night before the exam.</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
