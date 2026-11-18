// src/pages/ProblemOfDayPage.tsx
// Problem of the day: three questions a day, with a calendar, history and stats

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import { cn } from '@/lib/utils';
import {
  Trophy, CheckCircle2, XCircle,
  Star, Target, Award, ChevronRight, Calendar,
  BarChart2, Flame, BookOpen,
} from 'lucide-react';

// ─── Extended Question Pool ───────────────────────────────────
const QUESTION_POOL = [
  { id: 'q1',  question: 'If a train travels 360 km in 4 hours, and another train travels the same distance in 3 hours, what is the ratio of their speeds?', options: ['3:4', '4:3', '2:3', '3:2'], correct: 0, explanation: 'Speed = distance ÷ time. Train 1: 360 ÷ 4 = 90 km/h. Train 2: 360 ÷ 3 = 120 km/h. Ratio = 90 : 120 = 3 : 4.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
  { id: 'q2',  question: 'Find the odd one out: 121, 169, 196, 225, 270', options: ['121', '196', '270', '225'], correct: 2, explanation: 'All are perfect squares except 270.', topic: 'Logical Reasoning', difficulty: 'easy' },
  { id: 'q3',  question: 'A shopkeeper marks his goods 40% above cost price and gives 25% discount. What is his profit/loss percentage?', options: ['5% profit', '5% loss', '10% profit', '15% profit'], correct: 0, explanation: 'CP=100, MP=140, SP=140×0.75=105. Profit=5%.', topic: 'Quantitative Aptitude', difficulty: 'hard' },
  { id: 'q4',  question: 'Choose the word most similar in meaning to "PERSPICACIOUS"', options: ['Confused', 'Astute', 'Verbose', 'Sluggish'], correct: 1, explanation: 'Perspicacious means having a ready insight; shrewd — synonymous with astute.', topic: 'Verbal Ability', difficulty: 'hard' },
  { id: 'q5',  question: 'In a group of 80 people, 47 like classical music, 40 like pop and 22 like both. How many like neither?', options: ['10', '15', '5', '20'], correct: 1, explanation: 'By inclusion-exclusion: 47+40−22=65. Neither = 80−65 = 15.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
  { id: 'q6',  question: 'If FLOWER is coded as UOLDVI, how is GARDEN coded?', options: ['TZIWYP', 'TZIUVM', 'TZIWVM', 'GZIWYP'], correct: 2, explanation: 'Each letter is replaced by its mirror (A↔Z). G=T, A=Z, R=I, D=W, E=V, N=M → TZIWVM.', topic: 'Logical Reasoning', difficulty: 'medium' },
  { id: 'q7',  question: 'A can do a work in 15 days, B in 20 days, C in 30 days. Together, in how many days?', options: ['6', '6⅔', '7', '8'], correct: 1, explanation: 'Combined rate = 1/15 + 1/20 + 1/30 = (4 + 3 + 2)/60 = 9/60 = 3/20 of the work per day. So the work takes 20/3 = 6⅔ days.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
  { id: 'q8',  question: 'The ratio of boys to girls in a class is 3:2. If there are 30 boys, how many students total?', options: ['45', '50', '55', '60'], correct: 1, explanation: '30/3=10 units. Girls=2×10=20. Total=30+20=50.', topic: 'Quantitative Aptitude', difficulty: 'easy' },
  { id: 'q9',  question: 'If the sum of two numbers is 20 and their product is 96, what is the difference of the numbers?', options: ['2', '4', '6', '8'], correct: 1, explanation: 'x+y=20, xy=96. (x-y)²=(x+y)²-4xy=400-384=16. x-y=4.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
  { id: 'q10', question: 'Complete the series: 3, 6, 11, 18, 27, ?', options: ['36', '38', '40', '42'], correct: 2, explanation: 'Differences: 3,5,7,9,11... Next: 27+13=40.', topic: 'Logical Reasoning', difficulty: 'easy' },
  { id: 'q11', question: 'Choose the correct passive voice: "The teacher teaches the students"', options: ['The students are taught by the teacher', 'The students were taught by the teacher', 'The students have been taught', 'The students is taught'], correct: 0, explanation: 'Present active → present passive: "are + past participle + by subject".', topic: 'Verbal Ability', difficulty: 'easy' },
  { id: 'q12', question: 'A cistern is normally filled in 8 hours but a leak empties it in 12 hours. How long to fill?', options: ['20 hours', '24 hours', '18 hours', '16 hours'], correct: 1, explanation: 'Fill rate: 1/8. Leak rate: 1/12. Net: 1/8−1/12=1/24. Time = 24 hours.', topic: 'Quantitative Aptitude', difficulty: 'hard' },
  { id: 'q13', question: 'Which word is the antonym of "LOQUACIOUS"?', options: ['Talkative', 'Reserved', 'Expressive', 'Verbose'], correct: 1, explanation: 'Loquacious means very talkative. Antonym is Reserved.', topic: 'Verbal Ability', difficulty: 'medium' },
  { id: 'q14', question: 'A 20% discount on an article followed by a 10% discount is equivalent to a total discount of?', options: ['28%', '30%', '32%', '26%'], correct: 0, explanation: 'If CP=100, after 20% off: 80. After 10% off: 72. Total discount = 28%.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
  { id: 'q15', question: 'In a certain code, COMPUTER is written as DPNQVUFS. How is LAPTOP written in that code?', options: ['MBQUPQ', 'MBQTPQ', 'KZOSNO', 'MBRUPQ'], correct: 0, explanation: 'Each letter moves one place forward: C→D, O→P, M→N and so on. So L→M, A→B, P→Q, T→U, O→P, P→Q, giving MBQUPQ.', topic: 'Logical Reasoning', difficulty: 'hard' },
  { id: 'q16', question: 'Two trains of length 110m and 90m are moving in the same direction at 48 km/h and 72 km/h. Time to cross?', options: ['24 sec', '30 sec', '36 sec', '40 sec'], correct: 1, explanation: 'Relative speed = 72 − 48 = 24 km/h = 24 × 5/18 = 20/3 m/s. Distance to cover = 110 + 90 = 200 m. Time = 200 ÷ (20/3) = 30 seconds.', topic: 'Quantitative Aptitude', difficulty: 'hard' },
  { id: 'q17', question: 'Choose the pair that best expresses the relationship: Petal : Flower', options: ['Tree : Forest', 'Leaf : Stem', 'Page : Book', 'Chapter : Novel'], correct: 2, explanation: 'Petal is a part of Flower. Page is a part of Book — same part-to-whole relationship.', topic: 'Verbal Ability', difficulty: 'easy' },
  { id: 'q18', question: 'If A ranks 6th from the top and 5th from the bottom, how many students are in the class?', options: ['10', '11', '12', '9'], correct: 0, explanation: 'Total = 6 + 5 − 1 = 10.', topic: 'Logical Reasoning', difficulty: 'easy' },
  { id: 'q19', question: 'Simple interest on a sum for 3 years at 8% p.a. is ₹1440. Find compound interest for 2 years at same rate.', options: ['₹998', '₹ 998.40', '₹1000', '₹996'], correct: 1, explanation: 'SI=PRT/100. P=1440×100/(3×8)=₹6000. CI for 2yr=6000(1.08²−1)=6000×0.1664=₹998.40.', topic: 'Quantitative Aptitude', difficulty: 'hard' },
  { id: 'q20', question: 'Which number should come next? 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '46'], correct: 1, explanation: 'Pattern: n(n+1). 2=1×2, 6=2×3, 12=3×4, 20=4×5, 30=5×6, 42=6×7.', topic: 'Logical Reasoning', difficulty: 'medium' },
  { id: 'q21', question: 'A person walks at 4 km/h for 2 hours and then 6 km/h for 3 hours. What is his average speed?', options: ['5 km/h', '5.2 km/h', '4.8 km/h', '5.5 km/h'], correct: 1, explanation: 'Total distance=4×2+6×3=8+18=26km. Time=5hrs. Avg=26/5=5.2 km/h.', topic: 'Quantitative Aptitude', difficulty: 'medium' },
];

// ─── Types ────────────────────────────────────────────────────
interface DailyRecord {
  date: string;
  questions: { questionId: string; selected: number | null; correct: boolean }[];
  completed: boolean;
  score: number; // 0-3
}

// ─── Utilities ────────────────────────────────────────────────
const getTodayKey = () => new Date().toISOString().split('T')[0];

// ─── User-scoped localStorage keys ───────────────────────────
// Each user gets their own streak/history data
const podKey = (userId: string, suffix: string) => `potd_${suffix}_${userId}`;

const getDailySet = (date: string): typeof QUESTION_POOL => {
  // Seed by date so same 3 questions per day
  const seed = date.split('-').reduce((s, n) => s + parseInt(n), 0);
  const indices: number[] = [];
  const pool = [...QUESTION_POOL];
  let i = seed % pool.length;
  while (indices.length < 3) {
    if (!indices.includes(i)) indices.push(i);
    i = (i + 7) % pool.length;
  }
  // One easy, one medium, one hard from the 3
  return indices.map((idx) => pool[idx]);
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   'bg-ok/10 text-ok',
  medium: 'bg-warn/10 text-warn',
  hard:   'bg-bad/10 text-bad',
};

// ─── Streak badge ─────────────────────────────────────────────
const StreakBadge = ({ streak }: { streak: number }) => (
  <div className="inline-flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full border border-line bg-surface">
    <Flame size={16} className={streak > 0 ? 'text-clay' : 'text-ink/35'} />
    <span className="font-display font-medium text-ink text-xl leading-none tabular">{streak}</span>
    <span className="text-ink/60 text-sm">day streak</span>
  </div>
);

// ─── Small "well done" note shown after a good day ───────────
const RewardNote = ({ active }: { active: boolean }) => {
  if (!active) return null;
  return (
    <div className="absolute top-4 right-4 pointer-events-none animate-fade-in">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ok text-on-brand text-[13px] font-medium shadow-lift">
        <CheckCircle2 size={14} /> Nice work
      </span>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────
const ProblemOfDayPage = () => {
  const navigate  = useNavigate();
  const { user }  = useAuthStore();
  const userId    = user?._id ?? '';
  const todayKey  = getTodayKey();
  const dailySet  = getDailySet(todayKey);
  const migrated  = useRef(false);

  const [tab, setTab] = useState<'today' | 'history' | 'stats'>('today');
  const [activeQ, setActiveQ] = useState(0); // which of the 3 questions

  // ── Persisted state (user-scoped) ──────────────────────────
  const [streak,     setStreak]   = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [history,    setHistory]  = useState<DailyRecord[]>([]);
  const [selected, setSelected]   = useState<(number | null)[]>([null, null, null]);
  const [submitted, setSubmitted] = useState<boolean[]>([false, false, false]);
  const [showReward, setShowReward] = useState(false);
  const [timeLeft,   setTimeLeft] = useState(0);

  // ── Load user-scoped data + migrate old global keys ────────
  useEffect(() => {
    if (!userId || migrated.current) return;
    migrated.current = true;

    // One-time migration: old global keys → user-scoped keys
    const oldStreak  = localStorage.getItem('potd_streak');
    const oldBest    = localStorage.getItem('potd_best');
    const oldHistory = localStorage.getItem('potd_history');

    if (oldStreak !== null && localStorage.getItem(podKey(userId, 'streak')) === null) {
      localStorage.setItem(podKey(userId, 'streak'), oldStreak);
    }
    if (oldBest !== null && localStorage.getItem(podKey(userId, 'best')) === null) {
      localStorage.setItem(podKey(userId, 'best'), oldBest);
    }
    if (oldHistory !== null && localStorage.getItem(podKey(userId, 'history')) === null) {
      localStorage.setItem(podKey(userId, 'history'), oldHistory);
    }

    // Clean up old global keys after migration
    localStorage.removeItem('potd_streak');
    localStorage.removeItem('potd_best');
    localStorage.removeItem('potd_history');

    // Load user-scoped data
    setStreak(parseInt(localStorage.getItem(podKey(userId, 'streak')) ?? '0'));
    setBestStreak(parseInt(localStorage.getItem(podKey(userId, 'best')) ?? '0'));
    try {
      setHistory(JSON.parse(localStorage.getItem(podKey(userId, 'history')) ?? '[]'));
    } catch {
      setHistory([]);
    }
  }, [userId]);

  const todayRecord = history.find((h) => h.date === todayKey);
  const allDone     = submitted.every(Boolean);

  // ── Countdown ─────────────────────────────────────────────
  useEffect(() => {
    const calc = () => {
      const next = new Date(); next.setHours(24, 0, 0, 0);
      setTimeLeft(Math.floor((next.getTime() - Date.now()) / 1000));
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2,'0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2,'0');
    const sec = (s % 60).toString().padStart(2,'0');
    return `${h}:${m}:${sec}`;
  };

  // ── Load today if already done ─────────────────────────────
  useEffect(() => {
    if (todayRecord) {
      setSelected(todayRecord.questions.map((q) => q.selected));
      setSubmitted(todayRecord.questions.map(() => true));
    }
  }, []);

  // ── Submit single question ─────────────────────────────────
  const handleSubmit = useCallback(() => {
    const sel = selected[activeQ];
    if (sel === null || submitted[activeQ]) return;

    const newSubmitted = [...submitted];
    newSubmitted[activeQ] = true;
    setSubmitted(newSubmitted);

    const isCorrect = sel === dailySet[activeQ].correct;

    // If all submitted, update history + streak
    if (newSubmitted.every(Boolean)) {
      const score = dailySet.filter((q, i) => selected[i] === q.correct || (i === activeQ && isCorrect)).length;

      // Streak update
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yKey = yesterday.toISOString().split('T')[0];
      const lastRecord = history[history.length - 1];
      const newStreak = lastRecord?.date === yKey || lastRecord?.date === todayKey ? streak + 1 : 1;

      setStreak(newStreak);
      const newBest = Math.max(newStreak, bestStreak);
      setBestStreak(newBest);
      localStorage.setItem(podKey(userId, 'streak'), String(newStreak));
      localStorage.setItem(podKey(userId, 'best'),   String(newBest));

      // Save to history
      const record: DailyRecord = {
        date:      todayKey,
        questions: dailySet.map((q, i) => ({
          questionId: q.id,
          selected:   i === activeQ ? sel : selected[i],
          correct:    i === activeQ ? isCorrect : selected[i] === q.correct,
        })),
        completed: true,
        score,
      };
      const newHistory = [...history.filter((h) => h.date !== todayKey), record];
      setHistory(newHistory);
      localStorage.setItem(podKey(userId, 'history'), JSON.stringify(newHistory));

      if (score >= 2) {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 1500);
      }
    }
  }, [activeQ, selected, submitted, streak, bestStreak, dailySet, history, todayKey]);

  // ── Stats computed ─────────────────────────────────────────
  const totalAttempted = history.filter((h) => h.completed).length;
  const totalCorrect   = history.reduce((s, h) => s + (h.score || 0), 0);
  const accuracy       = totalAttempted ? Math.round((totalCorrect / (totalAttempted * 3)) * 100) : 0;

  // ── Calendar (last 30 days) ────────────────────────────────
  const calendarDays = Array.from({ length: 30 }, (_, i) => {
    const d  = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split('T')[0];
    const rec = history.find((h) => h.date === key);
    return { key, day: d.getDate(), month: d.toLocaleDateString('en', { month: 'short' }), record: rec };
  });

  const TABS = [
    { id: 'today',   label: 'Today',   icon: <Target size={14} /> },
    { id: 'history', label: 'History', icon: <Calendar size={14} /> },
    { id: 'stats',   label: 'Stats',   icon: <BarChart2 size={14} /> },
  ] as const;

  const resultToken = (score: number) => (score === 3 ? 'green' : score >= 1 ? 'amber' : 'red');

  return (
    <AppLayout>
      {/* ── Header ──────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight text-ink">Problem of the day</h1>
          <p className="text-[15px] text-ink/60 mt-1">
            Three short questions every day. A new set in{' '}
            <span className="font-mono text-ink tabular">{fmt(timeLeft)}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {streak >= 7 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warn/10 text-warn text-[13px] font-medium">
              <Award size={14} /> A full week
            </span>
          )}
          <StreakBadge streak={streak} />
        </div>
      </header>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <div className="inline-flex items-center gap-1 p-1 mb-6 rounded-[10px] bg-raised border border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-active={tab === t.id}
            className="admin-tab"
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          TODAY'S CHALLENGE
      ══════════════════════════════════════════════════════ */}
      {tab === 'today' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* Question navigation pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {dailySet.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setActiveQ(i)}
                  className={cn(
                    'flex items-center gap-2 h-9 px-3.5 rounded-lg border text-sm font-medium transition-colors',
                    activeQ === i
                      ? 'border-ink/60 bg-surface text-ink'
                      : submitted[i]
                        ? selected[i] === q.correct
                          ? 'border-ok/35 bg-ok/[0.06] text-ok'
                          : 'border-bad/35 bg-bad/[0.06] text-bad'
                        : 'border-line bg-surface text-ink/60 hover:text-ink hover:border-ink/30'
                  )}
                >
                  {submitted[i] ? (
                    selected[i] === q.correct ? <CheckCircle2 size={14} /> : <XCircle size={14} />
                  ) : null}
                  <span className="font-mono">Q{i + 1}</span>
                  <span className={cn('text-[11px] px-1.5 py-px rounded-full font-medium capitalize', DIFFICULTY_COLOR[q.difficulty])}>
                    {q.difficulty}
                  </span>
                </button>
              ))}
            </div>

            {/* Question card */}
            <NeonCard padding="p-5 md:p-6" className="animate-fade-up relative" hover={false}>
              <RewardNote active={showReward} />
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <p className="label-caps">Question {activeQ + 1} of 3</p>
                  <p className="text-ink/60 text-[13px] mt-1">{dailySet[activeQ].topic}</p>
                </div>
                <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize', DIFFICULTY_COLOR[dailySet[activeQ].difficulty])}>
                  {dailySet[activeQ].difficulty}
                </span>
              </div>

              <p className="text-ink text-[17px] leading-relaxed mb-5">
                {dailySet[activeQ].question}
              </p>

              {/* Options */}
              <div className="space-y-2.5">
                {dailySet[activeQ].options.map((opt, i) => {
                  const isSelected = selected[activeQ] === i;
                  const isRight    = submitted[activeQ] && i === dailySet[activeQ].correct;
                  const isWrong    = submitted[activeQ] && isSelected && i !== dailySet[activeQ].correct;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (!submitted[activeQ]) {
                          const n = [...selected]; n[activeQ] = i; setSelected(n);
                        }
                      }}
                      disabled={submitted[activeQ]}
                      className={cn(
                        'answer-option w-full flex items-center gap-3.5 text-left !py-3',
                        !submitted[activeQ] && isSelected && 'selected',
                        isRight && 'correct',
                        isWrong && 'wrong',
                        submitted[activeQ] && !isRight && !isWrong && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <span className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-semibold flex-shrink-0',
                        isRight    ? 'bg-ok text-on-brand'
                        : isWrong  ? 'bg-bad text-on-brand'
                        : isSelected ? 'bg-brand text-on-brand'
                        : 'bg-raised text-ink/55 border border-line'
                      )}>
                        {['A','B','C','D'][i]}
                      </span>
                      <span className={cn(
                        'text-[15px] flex-1',
                        isRight    ? 'text-ok font-medium'
                        : isWrong  ? 'text-bad'
                        : 'text-ink'
                      )}>
                        {opt}
                      </span>
                      {isRight && <CheckCircle2 size={18} className="text-ok flex-shrink-0" />}
                      {isWrong && <XCircle size={18} className="text-bad flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Submit */}
              {!submitted[activeQ] && (
                <div className="mt-5">
                  <HoloButton variant="cyan" size="lg" fullWidth onClick={handleSubmit}
                    disabled={selected[activeQ] === null}>
                    Check answer
                  </HoloButton>
                </div>
              )}

              {/* Explanation */}
              {submitted[activeQ] && (
                <div className={cn(
                  'mt-5 p-4 rounded-[10px] border animate-fade-up',
                  selected[activeQ] === dailySet[activeQ].correct
                    ? 'bg-ok/[0.06] border-ok/25'
                    : 'bg-bad/[0.05] border-bad/25'
                )}>
                  <p className={cn('font-semibold text-sm mb-1 flex items-center gap-1.5',
                    selected[activeQ] === dailySet[activeQ].correct ? 'text-ok' : 'text-bad')}>
                    {selected[activeQ] === dailySet[activeQ].correct
                      ? <><CheckCircle2 size={15} /> Correct</>
                      : <><XCircle size={15} /> Not quite</>}
                  </p>
                  <p className="text-ink/75 text-sm leading-relaxed">
                    {dailySet[activeQ].explanation}
                  </p>
                </div>
              )}

              {/* Next question */}
              {submitted[activeQ] && activeQ < 2 && (
                <div className="mt-4 flex justify-end">
                  <HoloButton variant="ghost" size="md" onClick={() => setActiveQ(activeQ + 1)}>
                    Next question <ChevronRight size={15} />
                  </HoloButton>
                </div>
              )}
            </NeonCard>
          </div>

          {/* ── Right: Stats ──────────────────── */}
          <div className="space-y-4">
            <NeonCard padding="p-0" className="animate-fade-up-delay overflow-hidden" hover={false}>
              <h2 className="text-base font-semibold text-ink px-5 pt-4 pb-3">Your record</h2>
              <dl className="divide-y divide-line border-t border-line">
                {[
                  { label: 'Current streak', value: `${streak} ${streak === 1 ? 'day' : 'days'}`, color: 'text-ink' },
                  { label: "Today's score",  value: allDone ? `${todayRecord?.score ?? '-'} of 3` : 'In progress', color: allDone ? 'text-ink' : 'text-ink/55' },
                  { label: 'Best streak',    value: `${bestStreak} ${bestStreak === 1 ? 'day' : 'days'}`, color: 'text-ink' },
                  { label: 'Days completed', value: String(totalAttempted), color: 'text-ink' },
                  { label: 'Accuracy',       value: `${accuracy}%`, color: accuracy >= 70 ? 'text-ok' : accuracy >= 40 ? 'text-warn' : 'text-bad' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between px-5 py-3">
                    <dt className="text-ink/60 text-sm">{s.label}</dt>
                    <dd className={cn('text-sm font-mono font-medium', s.color)}>{s.value}</dd>
                  </div>
                ))}
              </dl>
            </NeonCard>

            <NeonCard padding="p-5" className="animate-fade-up-delay" hover={false}>
              <p className="text-[15px] font-semibold text-ink">Want more practice?</p>
              <p className="text-ink/60 text-[13px] mt-1 mb-4">A full test gives you a score and topic breakdown.</p>
              <HoloButton variant="ghost" size="sm" onClick={() => navigate('/test-setup')} icon={<BookOpen size={14} />}>
                Start a practice test
              </HoloButton>
            </NeonCard>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          HISTORY & CALENDAR
      ══════════════════════════════════════════════════════ */}
      {tab === 'history' && (
        <div className="space-y-6 animate-fade-up">
          <NeonCard padding="p-5 md:p-6" hover={false}>
            <h2 className="text-base font-semibold text-ink">Last 30 days</h2>
            <p className="text-[13px] text-ink/55 mt-0.5 mb-5">Each square is a day. The number shows how many you got right.</p>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 sm:gap-2 mb-4">
              {calendarDays.map(({ key, day, month, record }) => {
                const token = record?.completed ? resultToken(record.score) : null;
                const isToday = key === todayKey;
                return (
                  <div
                    key={key}
                    title={`${month} ${day}: ${record ? `${record.score}/3 correct` : 'No attempt'}`}
                    className={cn(
                      'flex flex-col items-center justify-center h-12 rounded-lg border text-center cursor-default',
                      !token && (isToday ? 'border-ink/50 bg-surface' : 'border-line bg-raised')
                    )}
                    style={token ? {
                      background: `rgb(var(--${token}) / .1)`,
                      borderColor: `rgb(var(--${token}) / .35)`,
                    } : undefined}
                  >
                    <span className={cn('text-xs font-mono', token ? 'text-ink/80' : isToday ? 'text-ink' : 'text-ink/40')}>
                      {day}
                    </span>
                    {record?.completed && (
                      <span className="text-[10px] font-mono font-semibold mt-0.5" style={{ color: `rgb(var(--${token}))` }}>
                        {record.score}/3
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink/55">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] inline-block" style={{ background: 'rgb(var(--green) / .35)' }} /> 3 of 3</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] inline-block" style={{ background: 'rgb(var(--amber) / .35)' }} /> 1–2 of 3</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] inline-block" style={{ background: 'rgb(var(--red) / .35)' }} /> 0 of 3</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-[3px] inline-block bg-raised border border-line" /> Not attempted</span>
            </div>
          </NeonCard>

          {/* History list */}
          {history.length === 0 ? (
            <NeonCard padding="p-8" className="text-center" hover={false}>
              <p className="text-ink/60 text-sm">No days completed yet. Finish today's three questions and they'll be listed here.</p>
            </NeonCard>
          ) : (
            <NeonCard padding="p-0" className="overflow-hidden" hover={false}>
              <ul className="divide-y divide-line">
                {[...history].reverse().slice(0, 30).map((rec) => (
                  <li key={rec.date} className="px-4 md:px-5 py-3.5 flex items-center gap-4">
                    <span
                      className="w-12 text-center font-mono text-[15px] font-bold tabular flex-shrink-0"
                      style={{ color: `rgb(var(--${resultToken(rec.score)}))` }}
                    >
                      {rec.score}/3
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-ink text-sm font-medium font-mono">{rec.date}</p>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {rec.questions.map((q, i) => (
                          <span key={i} className={cn(
                            'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium',
                            q.correct ? 'text-ok bg-ok/10' : 'text-bad bg-bad/10'
                          )}>
                            Q{i + 1} {q.correct ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          </span>
                        ))}
                      </div>
                    </div>
                    {rec.score === 3 && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-xs text-ok font-medium">
                        <Trophy size={13} /> Perfect
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </NeonCard>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════ */}
      {tab === 'stats' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-up">
          {[
            { label: 'Days completed',  value: totalAttempted,              icon: <Calendar size={18} className="text-brand" /> },
            { label: 'Correct answers', value: totalCorrect,                icon: <CheckCircle2 size={18} className="text-ok" /> },
            { label: 'Accuracy',        value: `${accuracy}%`,             icon: <Target size={18} className="text-plum" /> },
            { label: 'Current streak',  value: streak,                      icon: <Flame size={18} className="text-clay" /> },
            { label: 'Best streak',     value: bestStreak,                  icon: <Trophy size={18} className="text-warn" /> },
            { label: 'Perfect days',    value: history.filter((h) => h.score === 3).length, icon: <Star size={18} className="text-ok" /> },
          ].map((s, i) => (
            <NeonCard key={s.label} padding="p-5"
              className="animate-fade-up"
              style={{ animationDelay: `${i * 0.04}s` } as React.CSSProperties}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] text-ink/60">{s.label}</p>
                {s.icon}
              </div>
              <p className="mt-3 font-display text-[34px] leading-none font-medium tracking-tight text-ink tabular">{s.value}</p>
            </NeonCard>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default ProblemOfDayPage;
