// frontend/src/pages/admin/AnalyticsPage.tsx
// Full platform analytics — score trends, topic performance, top students

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import HoloButton from '@/components/ui/HoloButton';
import {
  AdminPage,
  AdminPanel,
  AdminMetricCard,
  AdminStatusBadge,
  AdminEmptyState,
} from '@/components/admin/AdminUI';
import { getAdminAnalyticsApi } from '@/api/adminApi';
import { useChartColors } from '@/hooks/useChartColors';
import type { ChartColors } from '@/hooks/useChartColors';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  TrendingUp, Users, BookOpen, Trophy,
  BarChart3, Activity, ArrowUpRight, ArrowDownRight, Minus, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────
interface AnalyticsData {
  overview: {
    totalStudents: number;
    totalAttempts: number;
    totalQuestions: number;
    avgScore: number;
    last7DaysAttempts: number;
    growthRate: number;
  };
  scoreDistribution: { range: string; count: number }[];
  dailyActivity: { date: string; label: string; attempts: number; avgScore: number }[];
  topicPerformance: { topic: string; totalCorrect: number; totalQuestions: number; accuracy: number }[];
  topStudents: { name: string; email: string; avgScore: number; tests: number; bestScore: number }[];
  difficultyPerformance: { difficulty: string; accuracy: number; total: number }[];
}

// ── Tooltip ───────────────────────────────────────────────────
const SERIES_LABELS: Record<string, string> = {
  attempts: 'Attempts',
  avgScore: 'Avg score',
  count: 'Students',
  accuracy: 'Accuracy',
};

const PERCENT_KEYS = new Set(['avgScore', 'accuracy']);

const ChartTooltip = ({
  active, payload, label, colors,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; dataKey?: string; color?: string }>;
  label?: string;
  colors: ChartColors;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={colors.tooltipStyle}>
      {label ? <p className="mb-1 text-[12px]" style={{ color: colors.tooltipLabelColor }}>{label}</p> : null}
      {payload.map((p, i) => {
        const key = String(p.dataKey ?? p.name ?? '');
        return (
          <p key={i} className="flex items-center gap-2 text-[13px]" style={{ color: colors.tooltipTextColor }}>
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span>{SERIES_LABELS[key] ?? p.name}</span>
            <span className="ml-auto pl-3 font-mono">{p.value}{PERCENT_KEYS.has(key) ? '%' : ''}</span>
          </p>
        );
      })}
    </div>
  );
};

// Same order on every admin chart: easy → green, medium → amber, hard → red.
const DIFFICULTY_TONE: Record<string, string> = {
  easy: 'green',
  medium: 'amber',
  hard: 'red',
};

const accuracyTone = (value: number) => (value >= 70 ? 'green' : value >= 40 ? 'amber' : 'red');

const MeterBar = ({ value, tone }: { value: number; tone: string }) => (
  <div className="hidden h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07] sm:block">
    <div
      className="h-full rounded-full"
      style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: `rgb(var(--${tone}))` }}
    />
  </div>
);

// ── Main Component ────────────────────────────────────────────
const AnalyticsPage = () => {
  const navigate = useNavigate();
  const chartColors = useChartColors();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAdminAnalyticsApi()
      .then((res) => {
        if (res.success && res.data) setData(res.data);
        else setError(res.message || 'Failed to load analytics.');
      })
      .catch(() => setError('Could not fetch analytics data.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <LoadingSpinner size="lg" label="Loading analytics" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <AdminPage>
          <AdminEmptyState
            icon={<AlertCircle className="h-5 w-5" />}
            title="Analytics didn't load"
            description={`${error || 'No data available.'} Check that the server is running, then try again.`}
            action={
              <HoloButton variant="ghost" size="sm" onClick={() => window.location.reload()}>
                Try again
              </HoloButton>
            }
          />
        </AdminPage>
      </AdminLayout>
    );
  }

  const { overview, scoreDistribution, dailyActivity, topicPerformance, topStudents, difficultyPerformance } = data;

  const GrowthIcon = overview.growthRate > 0
    ? ArrowUpRight
    : overview.growthRate < 0
      ? ArrowDownRight
      : Minus;

  const growthColor = overview.growthRate > 0
    ? 'text-ok'
    : overview.growthRate < 0
      ? 'text-bad'
      : 'text-ink/45';

  // Radar data for topic performance
  const radarData = topicPerformance.slice(0, 6).map((t) => ({
    subject: t.topic.replace(' Aptitude', '').replace(' Ability', '').replace(' Reasoning', ''),
    accuracy: t.accuracy,
  }));

  const testsPerStudent = overview.totalStudents > 0
    ? Math.round(overview.totalAttempts / overview.totalStudents)
    : 0;
  const abovePassMark = overview.avgScore >= 60;

  return (
    <AdminLayout>
      <AdminPage>
        {/* ── KPI Overview ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <AdminMetricCard
            label="Students"
            value={overview.totalStudents}
            icon={<Users />}
            tone="cyan"
            caption="Registered accounts"
          />
          <AdminMetricCard
            label="Test attempts"
            value={overview.totalAttempts}
            icon={<BookOpen />}
            tone="violet"
            caption={
              <span className={cn('inline-flex items-center gap-1', growthColor)}>
                <GrowthIcon size={13} />
                <span className="font-mono">{Math.abs(overview.growthRate)}%</span>
                <span className="text-ink/55">vs last week</span>
              </span>
            }
          />
          <AdminMetricCard
            label="Average score"
            value={`${overview.avgScore}%`}
            icon={<TrendingUp />}
            tone="green"
            caption="Across all attempts"
          />
          <AdminMetricCard
            label="Last 7 days"
            value={overview.last7DaysAttempts}
            icon={<Activity />}
            tone="amber"
            caption="Attempts this week"
          />
        </div>

        {/* ── Secondary numbers ─────────────────────────────── */}
        <div className="admin-panel grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-4">
            <p className="text-[13px] text-ink/60">Tests per student</p>
            <p className="mt-1 font-mono text-xl text-ink">{testsPerStudent}</p>
            <p className="mt-0.5 text-[12px] text-ink/50">Attempts divided by registered students</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-ink/60">Average vs 60% pass mark</p>
              <AdminStatusBadge tone={abovePassMark ? 'green' : 'amber'}>
                {abovePassMark ? 'Above' : 'Below'}
              </AdminStatusBadge>
            </div>
            <p className="mt-1 font-mono text-xl text-ink">{overview.avgScore}%</p>
            <p className="mt-0.5 text-[12px] text-ink/50">Platform average score</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-[13px] text-ink/60">Weekly growth</p>
            <p className={cn('mt-1 font-mono text-xl', overview.growthRate >= 0 ? 'text-ink' : 'text-bad')}>
              {overview.growthRate > 0 ? '+' : ''}{overview.growthRate}%
            </p>
            <p className="mt-0.5 text-[12px] text-ink/50">Attempts vs the previous 7 days</p>
          </div>
        </div>

        {/* ── Daily Activity Chart ───────────────────────────── */}
        <AdminPanel
          title="Daily activity"
          description="Test attempts and average score per day, last 30 days."
          actions={
            <div className="flex items-center gap-4 text-[12px] text-ink/60">
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full" style={{ background: chartColors.series.accent }} />
                Attempts (left)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 rounded-full" style={{ background: chartColors.series.plum }} />
                Avg score % (right)
              </span>
            </div>
          }
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActivity} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attemptsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColors.series.accent} stopOpacity={0.16} />
                    <stop offset="95%" stopColor={chartColors.series.accent} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={chartColors.gridStroke} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: chartColors.tickFill, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: chartColors.tickFillDim, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fill: chartColors.tickFillDim, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip cursor={{ stroke: chartColors.gridStroke }} content={<ChartTooltip colors={chartColors} />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="attempts"
                  name="Attempts"
                  stroke={chartColors.series.accent}
                  strokeWidth={2}
                  fill="url(#attemptsGrad)"
                  dot={false}
                  activeDot={{ r: 4, stroke: chartColors.dotStroke, strokeWidth: 2 }}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgScore"
                  name="avgScore"
                  stroke={chartColors.series.plum}
                  strokeWidth={2}
                  fill="none"
                  dot={false}
                  activeDot={{ r: 4, stroke: chartColors.dotStroke, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminPanel>

        {/* ── Score Distribution + Difficulty ───────────────── */}
        <div className="grid gap-6 xl:grid-cols-2">
          <AdminPanel
            title="Score distribution"
            description="How many attempts fall into each score band."
          >
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={chartColors.gridStroke} />
                  <XAxis
                    dataKey="range"
                    tick={{ fill: chartColors.tickFill, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: chartColors.tickFillDim, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip cursor={{ fill: chartColors.gridStroke }} content={<ChartTooltip colors={chartColors} />} />
                  <Bar dataKey="count" name="Students" fill={chartColors.series.accent} radius={[4, 4, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminPanel>

          <AdminPanel
            title="Accuracy by difficulty"
            description="Share of answers that were correct at each level."
            contentClassName="p-0 sm:p-0"
          >
            {difficultyPerformance.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="!pl-5 sm:!pl-6">Difficulty</th>
                    <th className="!text-right">Answers</th>
                    <th className="w-[45%] !pr-5 sm:!pr-6">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {difficultyPerformance.map((d) => {
                    const tone = DIFFICULTY_TONE[d.difficulty] || 'brand';
                    return (
                      <tr key={d.difficulty}>
                        <td className="!pl-5 sm:!pl-6">
                          <span className="flex items-center gap-2.5 capitalize text-ink">
                            <span className="h-2 w-2 rounded-full" style={{ background: `rgb(var(--${tone}))` }} />
                            {d.difficulty}
                          </span>
                        </td>
                        <td className="!text-right font-mono !text-ink/70">{d.total}</td>
                        <td className="!pr-5 sm:!pr-6">
                          <div className="flex items-center gap-3">
                            <MeterBar value={d.accuracy} tone={tone} />
                            <span className="w-11 text-right font-mono text-ink">{d.accuracy}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="p-5 sm:p-6">
                <AdminEmptyState
                  title="No answers yet"
                  description="Accuracy by difficulty appears once students finish a test."
                />
              </div>
            )}
          </AdminPanel>
        </div>

        {/* ── Topic Performance + Radar ──────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <AdminPanel
            title="Accuracy by topic"
            description="Correct answers out of all answers, per topic."
            contentClassName="p-0 sm:p-0"
          >
            {topicPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="!pl-5 sm:!pl-6">Topic</th>
                      <th className="!text-right">Correct</th>
                      <th className="w-[38%] !pr-5 sm:!pr-6">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topicPerformance.map((t) => (
                      <tr key={t.topic}>
                        <td className="!pl-5 !text-ink sm:!pl-6">{t.topic}</td>
                        <td className="whitespace-nowrap !text-right font-mono !text-ink/70">
                          {t.totalCorrect}<span className="text-ink/35"> / {t.totalQuestions}</span>
                        </td>
                        <td className="!pr-5 sm:!pr-6">
                          <div className="flex items-center gap-3">
                            <MeterBar value={t.accuracy} tone={accuracyTone(t.accuracy)} />
                            <span className="w-11 text-right font-mono text-ink">{t.accuracy}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                <AdminEmptyState title="No topic data yet" description="Topic accuracy appears once students finish a test." />
              </div>
            )}
          </AdminPanel>

          <AdminPanel
            title="Topic overview"
            description="Accuracy across the six largest topics."
          >
            {radarData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="72%">
                    <PolarGrid stroke={chartColors.gridStroke} />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: chartColors.tickFill, fontSize: 11 }}
                    />
                    <Radar
                      name="Accuracy"
                      dataKey="accuracy"
                      stroke={chartColors.series.plum}
                      fill={chartColors.series.plum}
                      fillOpacity={0.14}
                      strokeWidth={2}
                    />
                    <Tooltip content={<ChartTooltip colors={chartColors} />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-ink/50">No topic data yet.</p>
            )}
          </AdminPanel>
        </div>

        {/* ── Top Students Leaderboard ───────────────────────── */}
        <AdminPanel
          title="Top students"
          description="Top 10 by average score across all attempts."
          contentClassName="p-0 sm:p-0"
          actions={
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline"
            >
              All students <ArrowUpRight size={14} />
            </button>
          }
        >
          {topStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="w-12 !pl-5 sm:!pl-6">#</th>
                    <th>Student</th>
                    <th className="hidden !text-right sm:table-cell">Tests</th>
                    <th className="hidden !text-right sm:table-cell">Best</th>
                    <th className="!text-right">Average</th>
                    <th className="w-12 !pr-5 sm:!pr-6"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.map((student, i) => (
                    <tr key={student.email}>
                      <td className={cn('!pl-5 font-mono sm:!pl-6', i < 3 ? '!text-ink' : '!text-ink/45')}>{i + 1}</td>
                      <td className="max-w-[240px]">
                        <p className="truncate font-medium text-ink">{student.name}</p>
                        <p className="truncate font-mono text-[12px] text-ink/50">{student.email}</p>
                      </td>
                      <td className="hidden !text-right font-mono sm:table-cell">{student.tests}</td>
                      <td className="hidden !text-right font-mono !text-ok sm:table-cell">{student.bestScore}%</td>
                      <td className="!text-right font-mono font-medium !text-ink">{student.avgScore}%</td>
                      <td className="!pr-5 !text-right sm:!pr-6">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/students/${student.email}/analytics`)}
                          className="inline-grid h-8 w-8 place-items-center rounded-lg text-ink/40 transition-colors hover:bg-ink/[0.05] hover:text-brand"
                          title="View student analytics"
                          aria-label={`View analytics for ${student.name}`}
                        >
                          <BarChart3 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 sm:p-6">
              <AdminEmptyState
                icon={<Trophy className="h-5 w-5" />}
                title="No attempts yet"
                description="The ranking fills in once students complete tests."
              />
            </div>
          )}
        </AdminPanel>
      </AdminPage>
    </AdminLayout>
  );
};

export default AnalyticsPage;
