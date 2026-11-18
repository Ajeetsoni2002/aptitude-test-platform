// src/pages/DashboardPage.tsx
// Student home: greeting, key numbers, score trend, assigned tests and recent attempts.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { getMyResultsApi, startScheduledTestApi } from '@/api/testApi';
import { getMyScheduledTestsApi } from '@/api/scheduledApi';
import type { TestAttempt } from '@/types';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import StatCard from '@/components/ui/StatCard';
import HoloButton from '@/components/ui/HoloButton';
import NeuralAvatar from '@/components/ui/NeuralAvatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProgressRing from '@/components/ui/ProgressRing';
import { useChartColors } from '@/hooks/useChartColors';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid
} from 'recharts';
import {
  BookOpen, Trophy, Clock, TrendingUp, Plus, ArrowRight,
  ChevronRight, BarChart3, Medal, Lock, Calendar, AlertCircle, X, Lightbulb, Play
} from 'lucide-react';

// ── Custom chart tooltip ──────────────────────────────────────────
const ChartTooltip = ({
  active, payload, label, colors,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  colors?: { tooltipLabelColor: string; tooltipTextColor: string };
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-line rounded-[10px] px-3 py-2 shadow-lift">
      <p className="text-xs" style={{ color: colors?.tooltipLabelColor }}>{label}</p>
      <p className="font-mono text-[14px] font-bold text-ink tabular">{payload[0].value}%</p>
    </div>
  );
};

// ── Score badge ───────────────────────────────────────────────────
const ScoreBadge = ({ score }: { score: number }) => {
  const base = 'text-xs px-2 py-0.5 rounded-full font-medium';
  if (score >= 80) return <span className={cn(base, 'bg-ok/10 text-ok')}>Excellent</span>;
  if (score >= 60) return <span className={cn(base, 'bg-brand/10 text-brand')}>Good</span>;
  if (score >= 40) return <span className={cn(base, 'bg-warn/10 text-warn')}>Average</span>;
  return <span className={cn(base, 'bg-bad/10 text-bad')}>Needs work</span>;
};

// ── Quick action row ──────────────────────────────────────────────
const QuickAction = ({
  icon, label, desc, onClick,
}: { icon: React.ReactNode; label: string; desc: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-[12px] border border-line bg-surface hover:border-ink/25 transition-colors"
  >
    <span className="w-9 h-9 rounded-lg bg-raised border border-line flex items-center justify-center text-ink/70 flex-shrink-0">
      {icon}
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-sm font-semibold text-ink">{label}</span>
      <span className="block text-[13px] text-ink/55 truncate">{desc}</span>
    </span>
    <ChevronRight size={16} className="text-ink/35 group-hover:text-ink/70 group-hover:translate-x-0.5 transition" />
  </button>
);

// ── Problem of the Day mini-card for dashboard ────────────────────
const PotdCard = ({ navigate, userId }: { navigate: (to: string) => void; userId: string }) => {
  const streak     = parseInt(localStorage.getItem(`potd_streak_${userId}`) ?? '0');
  const solvedToday = localStorage.getItem('potd_solved_date') === new Date().toISOString().split('T')[0];
  return (
    <NeonCard className="animate-fade-up" padding="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="label-caps">Problem of the day</p>
          <p className="mt-2 text-[15px] font-semibold text-ink">
            {solvedToday ? 'Solved for today' : "Today's question is ready"}
          </p>
          <p className="mt-1 text-[13px] text-ink/60">
            {solvedToday ? 'A new one unlocks tomorrow.' : 'One question, a couple of minutes.'}
          </p>
        </div>
        <span className="w-9 h-9 rounded-lg bg-warn/10 text-warn flex items-center justify-center flex-shrink-0">
          <Lightbulb size={18} />
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink/60">
          {streak > 0 ? (
            <>Streak <span className="font-mono text-[15px] font-bold text-ink tabular ml-1">{streak}</span> {streak === 1 ? 'day' : 'days'}</>
          ) : (
            'No streak yet'
          )}
        </p>
        <HoloButton variant="ghost" size="sm" onClick={() => navigate('/problem-of-day')} icon={<ChevronRight size={14} />}>
          {solvedToday ? 'Review' : 'Solve now'}
        </HoloButton>
      </div>
    </NeonCard>
  );
};

// ── Small helpers for the greeting line ───────────────────────────
const daysAgo = (iso: string) => {
  const then = new Date(iso);
  const now = new Date();
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
};

const whenText = (iso: string) => {
  const d = daysAgo(iso);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 14) return `${d} days ago`;
  return `on ${new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
};

// ── Main Dashboard ────────────────────────────────────────────────
const DashboardPage = () => {
  const navigate          = useNavigate();
  const { user }          = useAuthStore();
  const [attempts,  setAttempts]  = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalTests, setTotalTests] = useState(0);

  // Scheduled tests and starting logic
  const [scheduledTests, setScheduledTests] = useState<any[]>([]);
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const chartColors = useChartColors();

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        const [resAttempts, resScheduled] = await Promise.all([
          getMyResultsApi(1, 5),
          getMyScheduledTestsApi()
        ]);

        if (resAttempts.success && resAttempts.data) {
          setAttempts(resAttempts.data.attempts);
          setTotalTests(resAttempts.data.pagination.totalAttempts);
        }

        if (resScheduled.success && resScheduled.data) {
          setScheduledTests(resScheduled.data);
        }
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const handleStartScheduled = async (test: any) => {
    if (test.status === 'locked' || startingTestId) return;

    setError(null);
    setStartingTestId(test._id);
    try {
      const res = await startScheduledTestApi(test._id);

      if (res.success && res.data) {
        navigate('/test', {
          state: {
            attemptId: res.data.attemptId,
            questions: res.data.questions,
            title: res.data.title,
            totalQuestions: res.data.totalQuestions,
            totalTime: res.data.durationSeconds ?? test.timeLimit * 60,
            isProctored: true, // Force proctoring for admin scheduled tests
          },
        });
      } else {
        // Handle API errors (including "already attempted")
        const errorMessage = res.message || 'Failed to start test. Please try again.';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start test. Please try again.';
      setError(errorMessage);
      console.error("Failed to start scheduled test", err);
    } finally {
      setStartingTestId(null);
    }
  };

  const avgScore  = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const bestScore = attempts.length ? Math.max(...attempts.map((a) => a.score)) : 0;
  const totalMin  = attempts.length ? Math.round(attempts.reduce((s, a) => s + (a.totalTime || 0), 0) / 60) : 0;

  // Chart data — recent 5 scores reversed
  const chartData = [...attempts].reverse().map((a, i) => ({
    name:  `Test ${i + 1}`,
    score: a.score,
  }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0];

  // One useful line under the greeting
  const liveTest = scheduledTests.find((t) => t.status === 'live');
  const lastAttempt = attempts[0];
  let summary: React.ReactNode = 'Loading your recent activity…';
  if (!isLoading) {
    if (liveTest) {
      summary = <>“{liveTest.title}” is open now. You can start it below.</>;
    } else if (lastAttempt) {
      summary = <>Your last test was {whenText(lastAttempt.createdAt)}: {lastAttempt.title}, {lastAttempt.score}%.</>;
    } else {
      summary = 'You haven’t taken a test yet. A short practice test is a good place to start.';
    }
  }

  return (
    <AppLayout>
      {/* ── Header ────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-up">
        <div className="flex items-center gap-4 min-w-0">
          <NeuralAvatar
            name={user?.name ?? 'User'}
            role={user?.role}
            size="md"
            imageUrl={user?.profilePicture}
            className="hidden sm:flex flex-shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight text-ink leading-tight">
              {greeting}{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-[15px] text-ink/60 mt-1">{summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <HoloButton variant="ghost" size="md" onClick={() => navigate('/history')}>
            History
          </HoloButton>
          <HoloButton variant="cyan" size="md" onClick={() => navigate('/test-setup')} icon={<Plus size={16} />}>
            New test
          </HoloButton>
        </div>
      </header>

      {/* ── KPI Stats ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Tests taken" value={totalTests} icon={<BookOpen size={20} />} variant="cyan" subtext="All time" />
        <StatCard label="Average score" value={`${avgScore}%`} icon={<TrendingUp size={20} />} variant="violet" subtext="Last 5 tests" />
        <StatCard label="Best score" value={`${bestScore}%`} icon={<Trophy size={20} />} variant="green" subtext="Last 5 tests" />
        <StatCard label="Time practised" value={`${totalMin}m`} icon={<Clock size={20} />} variant="amber" subtext="Last 5 tests" />
      </div>

      {/* ── Scheduled / Upcoming Tests ─────────────────────── */}
      {scheduledTests.length > 0 && (
        <NeonCard className="animate-fade-up mb-6" padding="p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-ink/50" />
              <h2 className="text-base font-semibold text-ink">Assigned tests</h2>
            </div>
            <span className="text-[13px] text-ink/50">{scheduledTests.length} total</span>
          </div>

          {/* Error alert for test start failures */}
          {error && (
            <div className="mb-4 flex items-start gap-3 p-3.5 rounded-[10px] bg-bad/10 border border-bad/25 animate-fade-in">
              <AlertCircle size={16} className="text-bad flex-shrink-0 mt-0.5" />
              <p className="flex-1 text-bad text-sm leading-snug">{error}</p>
              <button
                onClick={() => setError(null)}
                aria-label="Dismiss"
                className="text-bad/60 hover:text-bad transition-colors flex-shrink-0 ml-2"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            {scheduledTests.map(test => {
              const isLocked = test.status === 'locked';
              const isLive = test.status === 'live';

              return (
                <div key={test._id} className={cn(
                  'p-4 rounded-[12px] border transition-colors',
                  isLive ? 'border-brand/40 bg-brand/[0.04]' : 'border-line bg-raised'
                )}>
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <p className="font-semibold text-ink text-[15px] truncate">{test.title}</p>

                    {isLocked ? (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-warn/10 text-warn font-medium">
                        <Lock size={11} /> Not open yet
                      </span>
                    ) : isLive ? (
                      <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-ok/10 text-ok font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-ok" /> Open now
                      </span>
                    ) : (
                      <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-ink/[0.06] text-ink/55 font-medium">
                        Closed
                      </span>
                    )}
                  </div>

                  <p className="text-ink/55 text-[13px] mb-4 line-clamp-1">{test.topic} · {test.questionCount} questions · {test.timeLimit} min</p>

                  <div className="flex justify-between items-end gap-3">
                    <div>
                      <p className="text-xs text-ink/45">Starts</p>
                      <p className={cn('text-[13px] font-mono mt-0.5', isLocked ? 'text-warn' : 'text-ink/70')}>
                        {new Date(test.startTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>

                    <HoloButton
                      variant={isLocked ? 'ghost' : 'cyan'}
                      size="sm"
                      onClick={() => handleStartScheduled(test)}
                      disabled={isLocked || test.status === 'completed'}
                      loading={startingTestId === test._id}
                      icon={isLocked ? <Lock size={14} /> : <Play size={14} />}
                    >
                      {isLocked ? 'Wait' : isLive ? 'Start now' : 'Missed'}
                    </HoloButton>
                  </div>
                </div>
              );
            })}
          </div>
        </NeonCard>
      )}

      {/* ── Main content grid ─────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">

        {/* Score trend chart — 2 cols */}
        <NeonCard className="lg:col-span-2 animate-fade-up" padding="p-5 md:p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-ink">Score trend</h2>
              <p className="text-[13px] text-ink/55 mt-0.5">Your last {chartData.length || 5} tests, oldest first</p>
            </div>
          </div>

          {attempts.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={chartColors.series.accent} stopOpacity={0.14} />
                    <stop offset="100%" stopColor={chartColors.series.accent} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={chartColors.gridStroke} />
                <XAxis dataKey="name" tick={{ fill: chartColors.tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: chartColors.tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip colors={chartColors} />} cursor={{ stroke: chartColors.gridStroke }} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={chartColors.series.accent}
                  strokeWidth={2}
                  fill="url(#scoreGrad)"
                  dot={{ fill: chartColors.series.accent, r: 3.5, strokeWidth: 2, stroke: chartColors.dotStroke }}
                  activeDot={{ r: 5, fill: chartColors.series.accent, stroke: chartColors.dotStroke, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center rounded-[10px] bg-raised border border-dashed border-line">
              <p className="text-ink/50 text-sm">Finish a test and your scores will show up here.</p>
            </div>
          )}
        </NeonCard>

        {/* Performance ring */}
        <NeonCard className="animate-fade-up-delay" padding="p-5 md:p-6">
          <h2 className="text-base font-semibold text-ink mb-5">Performance</h2>
          <div className="flex flex-col items-center gap-5">
            <ProgressRing value={avgScore} size={132} strokeWidth={8} color="cyan" label="Average" />
            <div className="w-full space-y-3">
              {[
                { label: 'Accuracy',    value: avgScore,  color: 'rgb(var(--brand))' },
                { label: 'Completion',  value: Math.min(totalTests * 10, 100), color: 'rgb(var(--plum))' },
                { label: 'Consistency', value: bestScore > 0 ? Math.round((avgScore / bestScore) * 100) : 0, color: 'rgb(var(--green))' },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="text-ink/60 text-[13px] w-24">{m.label}</span>
                  <div className="flex-1 h-1.5 bg-ink/[0.07] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${m.value}%`, background: m.color }}
                    />
                  </div>
                  <span className="text-ink/60 text-xs w-9 text-right font-mono">{m.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </NeonCard>
      </div>

      {/* ── Daily question + shortcuts ─────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* ── Problem of the Day Card ─────────────────────────── */}
        <PotdCard navigate={navigate} userId={user?._id ?? ''} />

        <div className="lg:col-span-2 animate-fade-up">
          <h2 className="text-base font-semibold text-ink mb-3">Shortcuts</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <QuickAction icon={<Plus size={18} />} label="New practice test" desc="Pick topics, difficulty and length" onClick={() => navigate('/test-setup')} />
            <QuickAction icon={<Lightbulb size={18} />} label="Problem of the day" desc="One question a day, keeps your streak" onClick={() => navigate('/problem-of-day')} />
            <QuickAction icon={<BarChart3 size={18} />} label="Analysis" desc="Strengths and weak topics" onClick={() => navigate('/analysis')} />
            <QuickAction icon={<Medal size={18} />} label="Leaderboard" desc="See where you rank" onClick={() => navigate('/leaderboard')} />
          </div>
        </div>
      </div>

      {/* ── Recent Attempts ────────────────────────────────── */}
      <NeonCard className="animate-fade-up" padding="p-0">
        <div className="flex items-center justify-between px-5 md:px-6 pt-5 pb-4">
          <div>
            <h2 className="text-base font-semibold text-ink">Recent tests</h2>
            <p className="text-[13px] text-ink/55 mt-0.5">
              {attempts.length ? `Your last ${attempts.length} ${attempts.length === 1 ? 'attempt' : 'attempts'}` : 'Your attempts will be listed here'}
            </p>
          </div>
          {totalTests > 5 && (
            <HoloButton variant="ghost" size="sm" onClick={() => navigate('/history')} icon={<ArrowRight size={14} />}>
              View all
            </HoloButton>
          )}
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center border-t border-line">
            <LoadingSpinner size="md" label="Loading your tests…" />
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-12 px-6 flex flex-col items-center gap-3 text-center border-t border-line">
            <p className="text-ink/60 text-sm">No attempts yet. Your first test result will show up here.</p>
            <HoloButton variant="cyan" size="sm" onClick={() => navigate('/test-setup')} icon={<Plus size={14} />}>
              Take your first test
            </HoloButton>
          </div>
        ) : (
          <ul className="border-t border-line divide-y divide-line">
            {attempts.map((attempt, idx) => (
              <li
                key={attempt._id}
                className="flex items-center gap-4 px-5 md:px-6 py-3.5 hover:bg-ink/[0.02] transition-colors animate-fade-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <span className="w-7 text-ink/40 font-mono text-xs flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>

                {/* Title + date */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink text-sm truncate">{attempt.title}</p>
                  <p className="text-ink/50 text-xs mt-0.5">
                    {new Date(attempt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
                  <span className="text-ok" title="Correct">{attempt.correctCount} right</span>
                  <span className="text-bad" title="Incorrect">{attempt.incorrectCount} wrong</span>
                  <span className="text-ink/45" title="Skipped">{attempt.skippedCount} skipped</span>
                </div>

                {/* Score + badge */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-display font-medium text-ink text-xl tabular w-14 text-right">{attempt.score}%</span>
                  <span className="hidden md:inline"><ScoreBadge score={attempt.score} /></span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </NeonCard>
    </AppLayout>
  );
};

export default DashboardPage;
