// src/pages/TestSetupPage.tsx
// Step-by-step practice test setup: topic, subtopics, settings, review.
// Everything (length, time limit, mode) is chosen on the page itself, and
// the Back / Continue bar is sticky, so nothing ends up below the screen.

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { startTestApi, getSubtopicsApi } from '@/api/testApi';
import AppLayout from '@/components/layout/AppLayout';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProgressRing from '@/components/ui/ProgressRing';
import {
  ChevronRight, ChevronLeft, AlertTriangle, Check, Calculator, BookOpenText, Puzzle, Info,
  Search, X, Minus, Plus, Camera, EyeOff, Shield, Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Data ─────────────────────────────────────────────────────────
const TOPICS = [
  { value: 'Quantitative Aptitude', label: 'Quantitative Aptitude', icon: Calculator,   desc: 'Numbers, arithmetic, algebra' },
  { value: 'Verbal Ability',        label: 'Verbal Ability',        icon: BookOpenText, desc: 'Grammar, vocabulary, comprehension' },
  { value: 'Logical Reasoning',     label: 'Logical Reasoning',     icon: Puzzle,       desc: 'Patterns, puzzles, deductions' },
];

const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   desc: 'Foundation', level: 1, color: 'bg-ok' },
  { value: 'medium', label: 'Medium', desc: 'Intermediate', level: 2, color: 'bg-warn' },
  { value: 'hard',   label: 'Hard',   desc: 'Exam level', level: 3, color: 'bg-bad' },
  { value: 'all',    label: 'Mixed',  desc: 'All levels', level: 0, color: 'bg-ink' },
];

const QUESTION_PRESETS = [5, 10, 15, 20, 25, 30];
const MIN_Q = 5, MAX_Q = 100;
const MIN_T = 5, MAX_T = 180;

type Mode = 'proctored' | 'normal';

const MODES: { value: Mode; icon: typeof Camera; title: string; desc: string }[] = [
  { value: 'proctored', icon: Camera, title: 'Proctored', desc: 'Camera on, fullscreen, tab switches counted. Closest to the real exam.' },
  { value: 'normal',    icon: EyeOff, title: 'Normal',    desc: 'No camera and no monitoring. Good for relaxed practice.' },
];

const RULES: Record<Mode, string[]> = {
  proctored: [
    'You will be asked to allow the camera. Keep your face in the frame.',
    'The test runs in fullscreen. Pressing Esc counts as a warning.',
    'Switch tabs 3 times and the test submits itself.',
    'The test submits itself when the time runs out.',
  ],
  normal: [
    'No camera and no fullscreen requirement.',
    'The test submits itself when the time runs out.',
    'You can\'t retake this attempt, but you can start a new one.',
  ],
};

const STEPS = ['Topic', 'Subtopics', 'Settings', 'Review'];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Small pieces ──────────────────────────────────────────────────
const Bubble = ({ on }: { on: boolean }) => (
  <span className={cn(
    'w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors',
    on ? 'bg-ink border-ink text-paper' : 'border-ink/30'
  )}>
    {on && <Check size={12} strokeWidth={3} />}
  </span>
);

const DifficultyBars = ({ level, color }: { level: number; color: string }) => (
  <span className="flex items-end gap-[3px] h-4" aria-hidden="true">
    {[1, 2, 3].map((n) => (
      <span
        key={n}
        className={cn('w-[5px] rounded-[1px]', level === 0 || n <= level ? color : 'bg-ink/15')}
        style={{ height: `${n * 5 + 1}px` }}
      />
    ))}
  </span>
);

const ErrorNote = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div role="alert" className={cn('flex items-start gap-2 px-3.5 py-3 rounded-[10px] bg-bad/[0.06] border border-bad/30 animate-fade-in', className)}>
    <AlertTriangle size={15} className="text-bad flex-shrink-0 mt-0.5" />
    <p className="text-bad text-[14px]">{children}</p>
  </div>
);

const Hint = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('flex items-start gap-2.5 px-4 py-3 rounded-[10px] bg-raised border border-line', className)}>
    <Info size={15} className="text-ink/50 flex-shrink-0 mt-0.5" />
    <p className="text-ink/70 text-[13px] leading-relaxed">{children}</p>
  </div>
);

// A labelled block inside the settings step.
const Field = ({ label, aside, children }: { label: string; aside?: ReactNode; children: ReactNode }) => (
  <div className="py-5 first:pt-0 last:pb-0 border-b border-line last:border-0">
    <div className="flex items-baseline justify-between gap-3 mb-3">
      <p className="label-caps">{label}</p>
      {aside && <span className="text-[12px] text-ink/50">{aside}</span>}
    </div>
    {children}
  </div>
);

// Number with − / + buttons and a typed value.
const Stepper = ({
  value, onChange, min, max, step = 1, unit, label,
}: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; unit?: string; label: string }) => {
  const [text, setText] = useState(String(value));
  useEffect(() => { setText(String(value)); }, [value]);
  const commit = (raw: string) => {
    const n = parseInt(raw, 10);
    onChange(clamp(isNaN(n) ? value : n, min, max));
  };
  const btn = 'w-10 h-10 flex items-center justify-center text-ink/70 hover:text-ink hover:bg-ink/[0.06] disabled:opacity-30 disabled:hover:bg-transparent transition-colors';
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface overflow-hidden">
      <button type="button" className={btn} onClick={() => onChange(clamp(value - step, min, max))} disabled={value <= min} aria-label={`Decrease ${label}`}>
        <Minus size={15} />
      </button>
      <label className="flex items-baseline gap-1 px-1">
        <span className="sr-only">{label}</span>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit((e.target as HTMLInputElement).value); }}
          className="w-12 bg-transparent text-center font-mono text-[15px] font-bold text-ink tabular outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {unit && <span className="font-mono text-[11px] uppercase text-ink/45">{unit}</span>}
      </label>
      <button type="button" className={btn} onClick={() => onChange(clamp(value + step, min, max))} disabled={value >= max} aria-label={`Increase ${label}`}>
        <Plus size={15} />
      </button>
    </div>
  );
};

// ── Step indicator ────────────────────────────────────────────────
const Stepper4 = ({ step, onJump }: { step: number; onJump: (s: number) => void }) => (
  <ol className="flex items-center gap-2 sm:gap-3 mb-6 animate-fade-up" aria-label="Steps">
    {STEPS.map((label, i) => {
      const n = i + 1;
      const done = n < step;
      const active = n === step;
      return (
        <li key={label} className={cn('flex items-center gap-2 sm:gap-3', i < STEPS.length - 1 && 'flex-1')}>
          <button
            type="button"
            onClick={() => done && onJump(n)}
            disabled={!done}
            aria-current={active ? 'step' : undefined}
            className={cn('flex items-center gap-2 flex-shrink-0 rounded-full', done && 'hover:opacity-80')}
          >
            <span className={cn(
              'w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center font-mono text-[12px] font-bold transition-colors',
              done && 'bg-ink border-ink text-paper',
              active && 'border-ink text-ink',
              !done && !active && 'border-ink/20 text-ink/40'
            )}>
              {done ? <Check size={13} strokeWidth={3} /> : n}
            </span>
            <span className={cn(
              'font-mono text-[11px] uppercase tracking-[0.08em]',
              active ? 'text-ink' : done ? 'text-ink/65 hidden sm:inline' : 'text-ink/40 hidden sm:inline'
            )}>
              {label}
            </span>
          </button>
          {i < STEPS.length - 1 && <span className={cn('flex-1 h-px min-w-3', done ? 'bg-ink/50' : 'bg-line')} />}
        </li>
      );
    })}
  </ol>
);

// ── Main component ────────────────────────────────────────────────
const TestSetupPage = () => {
  const navigate = useNavigate();
  const [step,  setStep]  = useState(1);
  const [topic, setTopic] = useState('');

  const [subtopics,         setSubtopics]         = useState<string[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [subtopicsLoading,  setSubtopicsLoading]  = useState(false);
  const [subtopicsError,    setSubtopicsError]    = useState('');
  const [query,             setQuery]             = useState('');

  const [diff,        setDiff]        = useState('all');
  const [count,       setCount]       = useState(10);
  const [time,        setTime]        = useState(20);
  const [timeTouched, setTimeTouched] = useState(false);
  const [mode,        setMode]        = useState<Mode>('proctored');

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Time follows the question count (2 min each) until the user sets it.
  const setCountAndTime = (n: number) => {
    const v = clamp(n, MIN_Q, MAX_Q);
    setCount(v);
    if (!timeTouched) setTime(clamp(v * 2, MIN_T, MAX_T));
  };

  // Fetch subtopics when the topic changes
  useEffect(() => {
    if (!topic) {
      setSubtopics([]);
      setSelectedSubtopics([]);
      return;
    }
    let cancelled = false;
    const fetchSubtopics = async () => {
      setSubtopicsLoading(true);
      setSubtopicsError('');
      setQuery('');
      try {
        const res = await getSubtopicsApi(topic);
        if (cancelled) return;
        if (res.success && res.data) {
          setSubtopics(Array.isArray(res.data.subtopics) ? res.data.subtopics : []);
          setSelectedSubtopics([]);
          if (!Array.isArray(res.data.subtopics)) setSubtopicsError('Subtopics response was malformed.');
        } else {
          setSubtopics([]);
          setSubtopicsError(res.message || 'No subtopics found for the selected topic.');
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
          || 'Could not load subtopics. Check your connection and try again.';
        setSubtopicsError(msg);
        setSubtopics([]);
      } finally {
        if (!cancelled) setSubtopicsLoading(false);
      }
    };
    fetchSubtopics();
    return () => { cancelled = true; };
  }, [topic]);

  const visibleSubtopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? subtopics.filter((s) => s.toLowerCase().includes(q)) : subtopics;
  }, [subtopics, query]);

  const toggleSubtopic = (s: string) =>
    setSelectedSubtopics((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const diffLabel = diff === 'all' ? 'Mixed' : cap(diff);

  const handleLaunch = async () => {
    if (!topic) { setError('Pick a topic first.'); setStep(1); return; }
    setError('');
    setLoading(true);
    try {
      const res = await startTestApi({
        topic,
        difficulty: diff === 'all' ? undefined : diff,
        count,
        title: `${topic}${selectedSubtopics.length > 0 ? ' — ' + selectedSubtopics.join(', ') : ''} — ${diffLabel} (${count}Q)`,
        subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : undefined,
      });
      if (res.success && res.data) {
        navigate('/test', {
          state: {
            attemptId:      res.data.attemptId,
            questions:      res.data.questions,
            title:          res.data.title,
            totalQuestions: res.data.totalQuestions,
            totalTime:      time * 60,
            isProctored:    mode === 'proctored',
          },
        });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Could not start the test. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (step === 1 && !topic) { setError('Pick a topic to continue.'); return; }
    setError('');
    if (step < 4) setStep(step + 1);
    else handleLaunch();
  };
  const goBack = () => { setError(''); setStep(Math.max(1, step - 1)); };

  const nextLabel = step === 3 ? 'Review' : step === 4 ? (mode === 'proctored' ? 'Start proctored test' : 'Start test') : 'Continue';

  const summary = [
    { label: 'Topic',      value: topic || '—' },
    { label: 'Subtopics',  value: selectedSubtopics.length ? `${selectedSubtopics.length} selected` : topic ? 'All' : '—' },
    { label: 'Difficulty', value: diffLabel },
    { label: 'Time limit', value: `${time} min` },
    { label: 'Mode',       value: mode === 'proctored' ? 'Proctored' : 'Normal' },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <p className="label-caps mb-1.5">New test</p>
        <h1 className="font-display text-[28px] md:text-[32px] tracking-tight text-ink">
          Set up a practice test
        </h1>
        <p className="text-[15px] text-ink/60 mt-1">
          Pick a topic, narrow it down if you like, then set the length, time and mode.
        </p>
      </div>

      <Stepper4 step={step} onJump={(s) => { setError(''); setStep(s); }} />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        {/* ── Left: current step ───────────────────────────────── */}
        <div className="min-w-0">
          <section key={step} className="bg-surface border border-line rounded-[14px] animate-fade-up">
            <header className="px-5 sm:px-6 pt-5 pb-4 border-b border-line">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink/45">Step {step} of 4</p>
              <h2 className="text-[17px] font-semibold text-ink mt-1">
                {step === 1 && 'Choose a topic'}
                {step === 2 && 'Narrow it down'}
                {step === 3 && 'Length, time and mode'}
                {step === 4 && 'Review and start'}
              </h2>
              <p className="text-[13px] text-ink/60 mt-0.5">
                {step === 1 && 'Pick the section you want to practise.'}
                {step === 2 && 'Pick subtopics, or skip to get questions from the whole topic.'}
                {step === 3 && 'Time follows the number of questions (2 minutes each) unless you change it.'}
                {step === 4 && 'Check your choices. The test starts on the next screen.'}
              </p>
            </header>

            <div className="p-5 sm:p-6">
              {/* STEP 1: Topic */}
              {step === 1 && (
                <div className="space-y-3" role="radiogroup" aria-label="Topic">
                  {TOPICS.map((t) => {
                    const Icon = t.icon;
                    const selected = topic === t.value;
                    return (
                      <button
                        key={t.value}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => { setTopic(t.value); setError(''); }}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-[12px] border text-left transition-colors duration-150',
                          selected ? 'border-ink bg-ink/[0.05]' : 'border-line hover:border-ink/30'
                        )}
                      >
                        <span className={cn(
                          'w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-colors',
                          selected ? 'bg-ink text-paper' : 'bg-raised text-ink/60 border border-line'
                        )}>
                          <Icon size={19} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[15px] font-medium text-ink">{t.label}</p>
                          <p className="text-[13px] text-ink/55 mt-0.5">{t.desc}</p>
                        </div>
                        <Bubble on={selected} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* STEP 2: Subtopics */}
              {step === 2 && (
                <div>
                  {subtopicsLoading && (
                    <div className="py-10 flex justify-center">
                      <LoadingSpinner size="md" label="Loading subtopics…" />
                    </div>
                  )}

                  {subtopicsError && <ErrorNote className="mb-4">{subtopicsError}</ErrorNote>}

                  {!subtopicsLoading && subtopics.length === 0 && !subtopicsError && (
                    <Hint>This topic has no subtopics yet. Questions will come from all of {topic}.</Hint>
                  )}

                  {!subtopicsLoading && subtopics.length > 0 && (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                        <label className="relative flex-1">
                          <span className="sr-only">Search subtopics</span>
                          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none" />
                          <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search ${subtopics.length} subtopics`}
                            className="cyber-input w-full h-10 pl-10 pr-9 text-[14px]"
                          />
                          {query && (
                            <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-ink/45 hover:text-ink">
                              <X size={14} />
                            </button>
                          )}
                        </label>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => setSelectedSubtopics((prev) => [...new Set([...prev, ...visibleSubtopics])])}
                            className="h-9 px-3 rounded-full font-mono text-[11px] uppercase tracking-[0.08em] text-ink hover:bg-ink/[0.06]"
                          >
                            {query ? 'Select shown' : 'Select all'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSubtopics([])}
                            disabled={!selectedSubtopics.length}
                            className="h-9 px-3 rounded-full font-mono text-[11px] uppercase tracking-[0.08em] text-ink/55 hover:text-ink hover:bg-ink/[0.06] disabled:opacity-35 disabled:hover:bg-transparent"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {visibleSubtopics.length > 0 ? (
                        <div className="flex flex-wrap gap-2" role="group" aria-label="Subtopics">
                          {visibleSubtopics.map((s) => {
                            const on = selectedSubtopics.includes(s);
                            return (
                              <button
                                key={s}
                                type="button"
                                role="checkbox"
                                aria-checked={on}
                                onClick={() => toggleSubtopic(s)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 min-h-9 px-3.5 py-1.5 rounded-full border text-[13px] leading-tight text-left transition-colors duration-150',
                                  on ? 'bg-ink border-ink text-paper' : 'border-line text-ink/75 hover:border-ink/35 hover:text-ink'
                                )}
                              >
                                {on ? <Check size={13} strokeWidth={3} className="flex-shrink-0" /> : <Plus size={13} className="flex-shrink-0 text-ink/40" />}
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[14px] text-ink/55 py-4">No subtopic matches “{query}”.</p>
                      )}

                      <p className="mt-5 text-[13px] text-ink/60">
                        {selectedSubtopics.length > 0
                          ? <><span className="font-mono font-bold text-ink">{selectedSubtopics.length}</span> of {subtopics.length} selected.</>
                          : <>Nothing selected, so questions will come from every subtopic in {topic}.</>}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* STEP 3: Settings */}
              {step === 3 && (
                <div>
                  <Field label="Difficulty">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Difficulty">
                      {DIFFICULTIES.map((d) => {
                        const on = diff === d.value;
                        return (
                          <button
                            key={d.value}
                            role="radio"
                            aria-checked={on}
                            onClick={() => setDiff(d.value)}
                            className={cn(
                              'flex items-center gap-3 px-3.5 py-3 rounded-[10px] border text-left transition-colors duration-150',
                              on ? 'border-ink bg-ink/[0.05]' : 'border-line hover:border-ink/30'
                            )}
                          >
                            <DifficultyBars level={d.level} color={d.color} />
                            <span className="min-w-0">
                              <span className="block text-[14px] font-medium text-ink">{d.label}</span>
                              <span className="block text-[12px] text-ink/50">{d.desc}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <Field label="Questions" aside={`${MIN_Q} to ${MAX_Q}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      {QUESTION_PRESETS.map((n) => {
                        const on = count === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            aria-pressed={on}
                            onClick={() => setCountAndTime(n)}
                            className={cn(
                              'w-12 h-10 rounded-full border font-mono text-[14px] font-bold tabular transition-colors duration-150',
                              on ? 'bg-ink border-ink text-paper' : 'border-line text-ink/75 hover:border-ink/35'
                            )}
                          >
                            {n}
                          </button>
                        );
                      })}
                      <span className="hidden sm:block w-px h-6 bg-line mx-1" aria-hidden="true" />
                      <Stepper label="number of questions" value={count} onChange={setCountAndTime} min={MIN_Q} max={MAX_Q} />
                    </div>
                  </Field>

                  <Field
                    label="Time limit"
                    aside={timeTouched
                      ? <button type="button" onClick={() => { setTimeTouched(false); setTime(clamp(count * 2, MIN_T, MAX_T)); }} className="underline underline-offset-2 hover:text-ink">Reset to {clamp(count * 2, MIN_T, MAX_T)} min</button>
                      : '2 min per question'}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <Stepper label="time limit in minutes" value={time} onChange={(v) => { setTime(v); setTimeTouched(true); }} min={MIN_T} max={MAX_T} step={5} unit="min" />
                      <span className="text-[13px] text-ink/55">
                        About {Math.round((time * 60) / count)} seconds per question
                      </span>
                    </div>
                  </Field>

                  <Field label="Mode">
                    <div className="grid sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Mode">
                      {MODES.map((m) => {
                        const on = mode === m.value;
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.value}
                            role="radio"
                            aria-checked={on}
                            onClick={() => setMode(m.value)}
                            className={cn(
                              'flex items-start gap-3 p-3.5 rounded-[10px] border text-left transition-colors duration-150',
                              on ? 'border-ink bg-ink/[0.05]' : 'border-line hover:border-ink/30'
                            )}
                          >
                            <span className={cn(
                              'w-9 h-9 rounded-[9px] flex items-center justify-center flex-shrink-0',
                              on ? 'bg-ink text-paper' : 'bg-raised border border-line text-ink/55'
                            )}>
                              <Icon size={16} />
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[14px] font-medium text-ink">{m.title}</span>
                              <span className="block text-[12px] text-ink/55 leading-snug mt-0.5">{m.desc}</span>
                            </span>
                            <Bubble on={on} />
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </div>
              )}

              {/* STEP 4: Review */}
              {step === 4 && (
                <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
                  <dl className="divide-y divide-line border border-line rounded-[12px]">
                    {[
                      { label: 'Topic', value: topic },
                      { label: 'Difficulty', value: diffLabel },
                      { label: 'Questions', value: String(count) },
                      { label: 'Time limit', value: `${time} minutes` },
                      { label: 'Mode', value: mode === 'proctored' ? 'Proctored' : 'Normal' },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                        <dt className="text-[13px] text-ink/55">{r.label}</dt>
                        <dd className="text-[14px] font-medium text-ink text-right">{r.value}</dd>
                      </div>
                    ))}
                    <div className="px-4 py-3">
                      <dt className="text-[13px] text-ink/55 mb-2">Subtopics</dt>
                      <dd className="flex flex-wrap gap-1.5">
                        {selectedSubtopics.length === 0 && <span className="text-[14px] font-medium text-ink">All subtopics</span>}
                        {selectedSubtopics.slice(0, 8).map((s) => (
                          <span key={s} className="px-2.5 py-1 rounded-full border border-line text-[12px] text-ink/75">{s}</span>
                        ))}
                        {selectedSubtopics.length > 8 && (
                          <span className="px-2.5 py-1 rounded-full bg-ink/[0.06] text-[12px] text-ink/65">+{selectedSubtopics.length - 8} more</span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div>
                    <p className="label-caps mb-3 flex items-center gap-2">
                      {mode === 'proctored' ? <Shield size={13} /> : <EyeOff size={13} />}
                      {mode === 'proctored' ? 'Proctored rules' : 'Normal mode'}
                    </p>
                    <ol className="space-y-2.5">
                      {RULES[mode].map((r, i) => (
                        <li key={r} className="flex gap-3 text-[14px] text-ink/75 leading-snug">
                          <span className="font-mono text-[12px] text-ink/40 pt-0.5 tabular">{String(i + 1).padStart(2, '0')}</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ol>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink/55 underline underline-offset-4 hover:text-ink"
                    >
                      Change settings
                    </button>
                  </div>
                </div>
              )}

              {error && <ErrorNote className="mt-5">{error}</ErrorNote>}
            </div>
          </section>

          {/* Sticky action bar: always on screen */}
          <div className="sticky bottom-4 z-20 mt-4 pr-[68px] lg:pr-0">
            <div className="flex items-center justify-between gap-3 rounded-full border border-line bg-surface/95 backdrop-blur-sm shadow-float pl-2 pr-2 py-2">
              {step > 1 ? (
                <HoloButton variant="ghost" size="md" onClick={goBack} icon={<ChevronLeft size={16} />}>
                  Back
                </HoloButton>
              ) : <span />}
              <p className="hidden md:block flex-1 min-w-0 truncate text-center text-[13px] text-ink/55">
                {topic ? `${topic} · ${count} questions · ${time} min · ${mode === 'proctored' ? 'Proctored' : 'Normal'}` : 'Pick a topic to begin'}
              </p>
              <HoloButton
                variant="cyan"
                size="md"
                onClick={goNext}
                loading={loading}
                disabled={step === 2 && subtopicsLoading}
                icon={step === 4 ? <Play size={15} /> : <ChevronRight size={16} />}
              >
                {nextLabel}
              </HoloButton>
            </div>
          </div>
        </div>

        {/* ── Right: live summary ──────────────────────────────── */}
        <aside className="hidden lg:block sticky top-6 bg-surface border border-line rounded-[14px] p-5 animate-fade-up-delay">
          <p className="label-caps mb-4">Your test</p>
          <div className="flex items-center gap-4 pb-5 mb-1 border-b border-line">
            <ProgressRing value={(count / MAX_Q) * 100} size={72} strokeWidth={5} color="cyan">
              <span className="font-display text-[24px] text-ink leading-none tabular">{count}</span>
            </ProgressRing>
            <div>
              <p className="text-[15px] font-medium text-ink">{count} questions</p>
              <p className="text-[13px] text-ink/55">{time} minutes</p>
            </div>
          </div>
          <dl className="divide-y divide-line">
            {summary.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-ink/55 text-[13px]">{item.label}</dt>
                <dd className="text-[13px] font-medium text-ink text-right truncate">{item.value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </AppLayout>
  );
};

export default TestSetupPage;
