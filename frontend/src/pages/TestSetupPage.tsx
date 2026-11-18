// src/pages/TestSetupPage.tsx
// Step-by-step practice test setup: topic, subtopics, difficulty and length.

import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { startTestApi, getSubtopicsApi } from '@/api/testApi';
import AppLayout from '@/components/layout/AppLayout';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProgressRing from '@/components/ui/ProgressRing';
import StartTestModal, { type StartTestConfig } from '@/components/ui/StartTestModal';
import { ChevronRight, ChevronLeft, Clock, AlertTriangle, Check, Calculator, BookOpenText, Puzzle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Data ─────────────────────────────────────────────────────────
const TOPICS = [
  { value: 'Quantitative Aptitude', label: 'Quantitative Aptitude', icon: Calculator,   desc: 'Numbers, arithmetic, algebra' },
  { value: 'Verbal Ability',        label: 'Verbal Ability',        icon: BookOpenText, desc: 'Grammar, vocabulary, comprehension' },
  { value: 'Logical Reasoning',     label: 'Logical Reasoning',     icon: Puzzle,       desc: 'Patterns, puzzles, deductions' },
];

const DIFFICULTIES = [
  { value: 'easy',   label: 'Easy',   desc: 'Foundation level', level: 1, color: 'bg-ok' },
  { value: 'medium', label: 'Medium', desc: 'Intermediate',     level: 2, color: 'bg-warn' },
  { value: 'hard',   label: 'Hard',   desc: 'Competitive exam', level: 3, color: 'bg-bad' },
  { value: 'all',    label: 'Mixed',  desc: 'All difficulties', level: 0, color: 'bg-brand' },
];

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30];

// ── Small pieces ──────────────────────────────────────────────────
// Answer-sheet bubble used as the selection mark on every card.
const Bubble = ({ on, square = false }: { on: boolean; square?: boolean }) => (
  <span className={cn(
    'w-5 h-5 border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors',
    square ? 'rounded-[5px]' : 'rounded-full',
    on ? 'bg-brand border-brand text-on-brand' : 'border-ink/30 bg-surface'
  )}>
    {on && <Check size={12} strokeWidth={3} />}
  </span>
);

// Bars: one, two or three filled for easy / medium / hard; all three for mixed.
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

// ── Step indicator ────────────────────────────────────────────────
const StepDot = ({ step, current, label }: { step: number; current: number; label: string }) => {
  const done   = step < current;
  const active = step === current;
  return (
    <div className="flex items-center gap-2.5 flex-shrink-0">
      <div className={cn(
        'w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center font-mono text-[12px] font-medium transition-colors duration-200',
        done   && 'bg-ink border-ink text-paper',
        active && 'border-brand text-brand bg-brand/10',
        !done && !active && 'border-ink/20 text-ink/45'
      )}>
        {done ? <Check size={13} strokeWidth={3} /> : step}
      </div>
      <span className={cn('text-[13px] hidden sm:inline', active ? 'text-ink font-medium' : done ? 'text-ink/70' : 'text-ink/45')}>
        {label}
      </span>
    </div>
  );
};

const cardClass = (selected: boolean) => cn(
  'border rounded-[12px] text-left transition-colors duration-150',
  selected
    ? 'border-brand bg-brand/[0.05]'
    : 'border-line bg-surface hover:border-ink/30'
);

const ErrorNote = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('flex items-start gap-2 px-3.5 py-3 rounded-[10px] bg-bad/[0.06] border border-bad/30 animate-fade-in', className)}>
    <AlertTriangle size={15} className="text-bad flex-shrink-0 mt-0.5" />
    <p className="text-bad text-[14px]">{children}</p>
  </div>
);

// ── Main component ────────────────────────────────────────────────
const TestSetupPage = () => {
  const navigate = useNavigate();
  const [step,       setStep]       = useState(1);
  const [topic,      setTopic]      = useState('');
  const [subtopics,  setSubtopics]  = useState<string[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [subtopicsLoading, setSubtopicsLoading] = useState(false);
  const [subtopicsError, setSubtopicsError] = useState('');
  const [diff,       setDiff]       = useState('all');
  const [count,      setCount]      = useState(10);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [showModal,  setShowModal]  = useState(false);

  const timeMin = count * 2;

  // Fetch subtopics when topic changes
  useEffect(() => {
    if (!topic) {
      setSubtopics([]);
      setSelectedSubtopics([]);
      return;
    }

    const fetchSubtopics = async () => {
      setSubtopicsLoading(true);
      setSubtopicsError('');
      try {
        const res = await getSubtopicsApi(topic);
        console.info('Subtopics API response:', res);

        if (res.success && res.data) {
          const nextSubtopics = Array.isArray(res.data.subtopics) ? res.data.subtopics : [];
          setSubtopics(nextSubtopics);
          setSelectedSubtopics([]); // Reset selection when topic changes
          if (!Array.isArray(res.data.subtopics)) {
            setSubtopicsError('Subtopics response was malformed.');
          }
        } else {
          setSubtopics([]);
          setSubtopicsError(res.message || 'No subtopics found for the selected topic.');
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message 
          || 'Failed to fetch subtopics. Try again.';
        setSubtopicsError(msg);
        setSubtopics([]);
        console.error('Failed to fetch subtopics for topic:', topic, err);
      } finally {
        setSubtopicsLoading(false);
      }
    };

    fetchSubtopics();
  }, [topic]);

  // Toggle subtopic selection
  const toggleSubtopic = (subtopic: string) => {
    setSelectedSubtopics(prev => 
      prev.includes(subtopic)
        ? prev.filter(s => s !== subtopic)
        : [...prev, subtopic]
    );
  };

  // Called when user clicks "Start Now" inside the modal
  const handleLaunch = async (config: StartTestConfig) => {
    if (!topic) { setError('Please select a topic first.'); return; }

    setError('');
    setLoading(true);

    const questionCount = config.questionCount;
    const timeSeconds   = config.timeMinutes * 60;

    try {
      const res = await startTestApi({
        topic,
        difficulty: diff === 'all' ? undefined : diff,
        count: questionCount,
        title: `${topic}${selectedSubtopics.length > 0 ? ' — ' + selectedSubtopics.join(', ') : ''} — ${diff === 'all' ? 'Mixed' : diff.charAt(0).toUpperCase() + diff.slice(1)} (${questionCount}Q)`,
        subtopics: selectedSubtopics.length > 0 ? selectedSubtopics : undefined,
      });
      if (res.success && res.data) {
        setShowModal(false);
        navigate('/test', {
          state: {
            attemptId:      res.data.attemptId,
            questions:      res.data.questions,
            title:          res.data.title,
            totalQuestions: res.data.totalQuestions,
            totalTime:      timeSeconds,
            isProctored:    config.environment === 'proctored',
          },
        });
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to start test. Please try again.';
      // Error page par dikhta hai — modal khula raha to wo uske peeche chhup jata hai
      setShowModal(false);
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-7 animate-fade-up">
        <p className="label-caps mb-1.5">New test</p>
        <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight text-ink">
          Set up a practice test
        </h1>
        <p className="text-[15px] text-ink/60 mt-1">
          Pick a topic, narrow it down if you like, then choose the difficulty and length.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8 animate-fade-up">
        <StepDot step={1} current={step} label="Topic" />
        <div className={cn('flex-1 h-px min-w-4', step > 1 ? 'bg-ink/40' : 'bg-line')} />
        <StepDot step={2} current={step} label="Subtopics" />
        <div className={cn('flex-1 h-px min-w-4', step > 2 ? 'bg-ink/40' : 'bg-line')} />
        <StepDot step={3} current={step} label="Difficulty and length" />
        <div className={cn('flex-1 h-px min-w-4', step > 3 ? 'bg-ink/40' : 'bg-line')} />
        <StepDot step={4} current={step} label="Review" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left: Wizard steps ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* STEP 1: Topic */}
          {step === 1 && (
            <section className="bg-surface border border-line rounded-[14px] shadow-soft p-6 animate-fade-up">
              <h2 className="text-base font-semibold text-ink">Choose a topic</h2>
              <p className="text-[13px] text-ink/60 mt-0.5 mb-5">Pick the section you want to practise.</p>

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
                      className={cn(cardClass(selected), 'w-full flex items-center gap-4 p-4')}
                    >
                      <span className={cn(
                        'w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 transition-colors',
                        selected ? 'bg-brand/10 text-brand' : 'bg-raised text-ink/60 border border-line'
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

              {error && <ErrorNote className="mt-4">{error}</ErrorNote>}

              <div className="flex justify-end mt-6">
                <HoloButton variant="cyan" size="md" onClick={() => { if (!topic) { setError('Select a topic first.'); return; } setStep(2); }} icon={<ChevronRight size={16} />}>
                  Continue
                </HoloButton>
              </div>
            </section>
          )}

          {/* STEP 2: Subtopic Selection */}
          {step === 2 && (
            <section className="bg-surface border border-line rounded-[14px] shadow-soft p-6 animate-fade-up">
              <h2 className="text-base font-semibold text-ink">Narrow it down</h2>
              <p className="text-[13px] text-ink/60 mt-0.5 mb-5">
                Pick one or more subtopics, or skip this step to get questions from the whole topic.
              </p>

              {subtopicsLoading && (
                <div className="py-10 flex justify-center">
                  <LoadingSpinner size="md" label="Loading subtopics…" />
                </div>
              )}

              {!subtopicsLoading && subtopics.length === 0 && !subtopicsError && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] bg-raised border border-line">
                  <Info size={15} className="text-ink/50 flex-shrink-0 mt-0.5" />
                  <p className="text-ink/70 text-[14px]">
                    This topic has no subtopics yet. Questions will come from all of "{topic}".
                  </p>
                </div>
              )}

              {subtopicsError && <ErrorNote className="mb-4">{subtopicsError}</ErrorNote>}

              {!subtopicsLoading && subtopics.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="label-caps">{subtopics.length} subtopics</p>
                    <div className="flex items-center gap-3 text-[13px]">
                      <button
                        onClick={() => setSelectedSubtopics([...subtopics])}
                        className="text-brand font-medium hover:underline"
                      >
                        Select all
                      </button>
                      <span className="text-ink/20" aria-hidden="true">·</span>
                      <button
                        onClick={() => setSelectedSubtopics([])}
                        className="text-ink/55 hover:text-ink"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2.5 mb-4">
                    {subtopics.map((subtopic) => {
                      const selected = selectedSubtopics.includes(subtopic);
                      return (
                        <button
                          key={subtopic}
                          role="checkbox"
                          aria-checked={selected}
                          onClick={() => toggleSubtopic(subtopic)}
                          className={cn(cardClass(selected), 'w-full flex items-center gap-3 px-3.5 py-3')}
                        >
                          <Bubble on={selected} square />
                          <span className={cn('text-[14px]', selected ? 'text-ink font-medium' : 'text-ink/75')}>
                            {subtopic}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedSubtopics.length > 0 ? (
                    <div className="px-4 py-3 rounded-[10px] bg-raised border border-line mb-4">
                      <p className="text-ink/70 text-[13px] mb-2">
                        <span className="font-mono font-medium text-ink">{selectedSubtopics.length}</span> subtopic{selectedSubtopics.length !== 1 ? 's' : ''} selected
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSubtopics.map((s) => (
                          <span key={s} className="admin-chip !py-0.5 !text-[12px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] bg-raised border border-line mb-4">
                      <Info size={15} className="text-ink/50 flex-shrink-0 mt-0.5" />
                      <p className="text-ink/70 text-[13px]">
                        Nothing selected, so questions will come from every subtopic in "{topic}".
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <HoloButton variant="ghost" size="md" onClick={() => { setStep(1); setSubtopicsError(''); }} icon={<ChevronLeft size={16} />}>
                  Back
                </HoloButton>
                <HoloButton
                  variant="cyan"
                  size="md"
                  onClick={() => {
                    setStep(3);
                    setSubtopicsError('');
                  }}
                  icon={<ChevronRight size={16} />}
                >
                  Continue
                </HoloButton>
              </div>
            </section>
          )}

          {/* STEP 3: Config */}
          {step === 3 && (
            <section className="bg-surface border border-line rounded-[14px] shadow-soft p-6 animate-fade-up">
              <h2 className="text-base font-semibold text-ink">Difficulty and length</h2>
              <p className="text-[13px] text-ink/60 mt-0.5 mb-6">You can change the exact length and time limit in the next step.</p>

              {/* Difficulty */}
              <div className="mb-7">
                <p className="label-caps mb-3">Difficulty</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="radiogroup" aria-label="Difficulty">
                  {DIFFICULTIES.map((d) => {
                    const selected = diff === d.value;
                    return (
                      <button
                        key={d.value}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setDiff(d.value)}
                        className={cn(cardClass(selected), 'p-3.5')}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <DifficultyBars level={d.level} color={d.color} />
                          <Bubble on={selected} />
                        </div>
                        <p className="text-[14px] font-medium text-ink">{d.label}</p>
                        <p className="text-[12px] text-ink/55 mt-0.5">{d.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default question count */}
              <div className="mb-6">
                <p className="label-caps mb-3">Number of questions</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5" role="radiogroup" aria-label="Number of questions">
                  {QUESTION_COUNTS.map((n) => {
                    const selected = count === n;
                    return (
                      <button
                        key={n}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setCount(n)}
                        className={cn(cardClass(selected), 'py-3 text-center')}
                      >
                        <span className={cn('block font-display text-[24px] font-medium leading-none tabular', selected ? 'text-brand' : 'text-ink')}>
                          {n}
                        </span>
                        <span className="block font-mono text-[11px] text-ink/50 mt-1.5">{n * 2} min</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-ink/55 text-[13px] mt-3 flex items-center gap-1.5">
                  <Clock size={13} /> About {timeMin} minutes. You can adjust this before you start.
                </p>
              </div>

              <div className="flex justify-between">
                <HoloButton variant="ghost" size="md" onClick={() => setStep(2)} icon={<ChevronLeft size={16} />}>
                  Back
                </HoloButton>
                <HoloButton variant="cyan" size="md" onClick={() => setStep(4)} icon={<ChevronRight size={16} />}>
                  Review
                </HoloButton>
              </div>
            </section>
          )}

          {/* STEP 4: Confirm & Launch Modal */}
          {step === 4 && (
            <section className="bg-surface border border-line rounded-[14px] shadow-soft p-6 animate-fade-up">
              <h2 className="text-base font-semibold text-ink">Review and start</h2>
              <p className="text-[13px] text-ink/60 mt-0.5 mb-5">Check your choices. Next you'll set the time limit and pick a mode.</p>

              {/* Summary */}
              <dl className="border border-line rounded-[12px] divide-y divide-line mb-5">
                <div className="px-4 py-3.5">
                  <dt className="label-caps mb-1">Topic</dt>
                  <dd className="text-[16px] font-semibold text-ink">{topic}</dd>
                </div>
                {selectedSubtopics.length > 0 && (
                  <div className="px-4 py-3.5">
                    <dt className="label-caps mb-2">Subtopics ({selectedSubtopics.length})</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {selectedSubtopics.map((s) => (
                        <span key={s} className="admin-chip !py-0.5 !text-[12px]">
                          {s}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                <div className="grid grid-cols-2 divide-x divide-line">
                  <div className="px-4 py-3.5">
                    <dt className="label-caps mb-1">Difficulty</dt>
                    <dd className="text-[16px] font-medium text-ink capitalize">{diff === 'all' ? 'Mixed' : diff}</dd>
                  </div>
                  <div className="px-4 py-3.5">
                    <dt className="label-caps mb-1">Questions</dt>
                    <dd className="font-mono text-[16px] font-medium text-ink tabular">{count}</dd>
                  </div>
                </div>
              </dl>

              <div className="flex items-start gap-2.5 px-4 py-3 rounded-[10px] bg-brand/[0.05] border border-brand/20 mb-5">
                <Info size={15} className="text-brand flex-shrink-0 mt-0.5" />
                <p className="text-ink/75 text-[13px] leading-relaxed">
                  In the next window you can set the exact number of questions and the time limit, and choose
                  proctored mode (camera and fullscreen) or normal mode.
                </p>
              </div>

              {error && <ErrorNote className="mb-4">{error}</ErrorNote>}

              <div className="flex justify-between">
                <HoloButton variant="ghost" size="md" onClick={() => setStep(3)} icon={<ChevronLeft size={16} />}>
                  Back
                </HoloButton>
                <HoloButton variant="cyan" size="md" onClick={() => setShowModal(true)} icon={<ChevronRight size={16} />}>
                  Set time and mode
                </HoloButton>
              </div>
            </section>
          )}
        </div>

        {/* ── Right: Live Preview ────────────────────────────– */}
        <aside className="bg-surface border border-line rounded-[14px] shadow-soft p-5 h-fit animate-fade-up-delay">
          <p className="label-caps mb-4">Your test</p>

          <div className="flex items-center gap-4 pb-5 mb-1 border-b border-line">
            <ProgressRing value={(count / 30) * 100} size={76} strokeWidth={5} color="cyan">
              <span className="font-display text-[22px] font-medium text-ink leading-none tabular">{count}</span>
            </ProgressRing>
            <div>
              <p className="text-[15px] font-medium text-ink">{count} questions</p>
              <p className="text-[13px] text-ink/55">About {timeMin} minutes</p>
            </div>
          </div>

          <dl className="divide-y divide-line">
            {[
              { label: 'Topic', value: topic || '—' },
              selectedSubtopics.length > 0 ? { label: 'Subtopics', value: `${selectedSubtopics.length} selected` } : null,
              { label: 'Difficulty', value: diff === 'all' ? 'Mixed' : diff.charAt(0).toUpperCase() + diff.slice(1) },
              { label: 'Questions', value: `${count}` },
              { label: 'Est. time', value: `${timeMin} min` },
            ].filter(Boolean).map((item) => (
              <div key={item!.label} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-ink/55 text-[13px]">{item!.label}</dt>
                <dd className="text-[13px] font-medium text-ink text-right">
                  {item!.value}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>

      {/* ── Start Test Modal ───────────────────────────────────── */}
      <StartTestModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onStart={handleLaunch}
        loading={loading}
        defaultCount={count}
        defaultTime={timeMin}
      />
    </AppLayout>
  );
};

export default TestSetupPage;
