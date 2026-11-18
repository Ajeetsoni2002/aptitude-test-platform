// frontend/src/pages/admin/StudentAnalyticsPage.tsx
// Admin view: Detailed per-student analytics, topic mastery, violations

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import apiClient from '@/api/axios';
import { useChartColors } from '@/hooks/useChartColors';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NeuralAvatar from '@/components/ui/NeuralAvatar';
import HoloButton from '@/components/ui/HoloButton';
import {
  AdminPage,
  AdminPanel,
  AdminMetricCard,
  AdminStatusBadge,
  AdminEmptyState,
} from '@/components/admin/AdminUI';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  ArrowLeft, Trophy, Target, Clock, AlertTriangle,
  CheckCircle2, BarChart2, AlertCircle,
} from 'lucide-react';

interface StudentAnalytics {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
  stats: {
    totalAttempts: number;
    avgScore: number;
    bestScore: number;
    totalTime: number;
    totalViolations: number;
  };
  topicPerformance: { topic: string; correct: number; total: number; accuracy: number }[];
  scoreTrend: { date: string; score: number; title?: string }[];
  recentAttempts: {
    _id: string;
    title: string;
    score: number;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    totalTime: number;
    createdAt: string;
  }[];
}

// Score bands: 70+ is good (green), 40–69 is middling (amber), below 40 is weak (red).
const SCORE_TONE = (s: number) =>
  s >= 70 ? 'green' : s >= 40 ? 'amber' : 'red';

const SCORE_TEXT = (s: number) =>
  s >= 70 ? '!text-ok' : s >= 40 ? '!text-warn' : '!text-bad';

const fmtTime = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const StudentAnalyticsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate   = useNavigate();
  const chartColors = useChartColors();
  const [data,      setData]      = useState<StudentAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await apiClient.get(`/admin/students/${userId}/analytics`);
        if (res.data.success) setData(res.data.data);
        else setError('Failed to load analytics.');
      } catch {
        setError('Could not fetch student data.');
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) fetch();
  }, [userId]);

  const backLink = (
    <button
      type="button"
      onClick={() => navigate('/admin/users')}
      className="inline-flex items-center gap-1.5 text-[13px] text-ink/55 transition-colors hover:text-ink"
    >
      <ArrowLeft size={15} /> Back to students
    </button>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" label="Loading student" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout>
        <AdminPage>
          {backLink}
          <AdminEmptyState
            icon={<AlertCircle className="h-5 w-5" />}
            title="Couldn't load this student"
            description={`${error || 'No data.'} The account may have been removed, or the server is unreachable.`}
            action={
              <HoloButton variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>
                Back to students
              </HoloButton>
            }
          />
        </AdminPage>
      </AdminLayout>
    );
  }

  const { user, stats, topicPerformance, scoreTrend, recentAttempts } = data;

  const radarData = topicPerformance.slice(0, 5).map((t) => ({
    subject: t.topic.replace(' Aptitude', '').replace(' Ability', '').slice(0, 8),
    value:   t.accuracy,
  }));

  return (
    <AdminLayout>
      <AdminPage>
        {/* ── Back + profile ────────────────────────────────── */}
        <div className="space-y-4">
          {backLink}
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center">
            <NeuralAvatar name={user.name} size="lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <h2 className="truncate font-display text-[26px] font-semibold leading-tight tracking-tight text-ink md:text-[28px]">
                {user.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-ink/55">
                <span className="font-mono">{user.email}</span>
                <span className="text-ink/25">·</span>
                <span>Joined {fmtDate(user.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge className="capitalize">{user.role}</AdminStatusBadge>
              <AdminStatusBadge tone={user.isActive ? 'green' : 'red'}>
                {user.isActive ? 'Active' : 'Deactivated'}
              </AdminStatusBadge>
            </div>
          </div>
        </div>

        {/* ── KPI Stats ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <AdminMetricCard label="Tests taken" value={stats.totalAttempts} icon={<BarChart2 />} tone="cyan" />
          <AdminMetricCard label="Average score" value={`${stats.avgScore}%`} icon={<Target />} tone="violet" />
          <AdminMetricCard label="Best score" value={`${stats.bestScore}%`} icon={<Trophy />} tone="green" />
          <AdminMetricCard label="Time spent" value={fmtTime(stats.totalTime)} icon={<Clock />} tone="amber" />
          <AdminMetricCard
            label="Violations"
            value={<span className={stats.totalViolations > 0 ? 'text-bad' : undefined}>{stats.totalViolations}</span>}
            icon={stats.totalViolations > 0 ? <AlertTriangle /> : <CheckCircle2 />}
            tone={stats.totalViolations > 0 ? 'red' : 'green'}
            caption={stats.totalViolations > 0 ? 'Across all proctored tests' : 'None recorded'}
          />
        </div>

        {/* ── Score Trend + Radar ────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-3">
          <AdminPanel className="lg:col-span-2" title="Score over time" description="Score on each finished test, oldest first.">
            {scoreTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={scoreTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={chartColors.series.plum} stopOpacity={0.16} />
                      <stop offset="95%" stopColor={chartColors.series.plum} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={chartColors.gridStroke} />
                  <XAxis dataKey="date" tick={{ fill: chartColors.tickFill, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} />
                  <YAxis domain={[0, 100]} tick={{ fill: chartColors.tickFillDim, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ stroke: chartColors.gridStroke }}
                    contentStyle={chartColors.tooltipStyle}
                    labelStyle={{ color: chartColors.tooltipLabelColor, fontSize: 12 }}
                    itemStyle={{ color: chartColors.tooltipTextColor, fontSize: 13 }}
                    labelFormatter={(v) => fmtDate(String(v))}
                    formatter={(v) => [`${v}%`, 'Score']}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={chartColors.series.plum}
                    fill="url(#studGrad)"
                    strokeWidth={2}
                    name="Score"
                    dot={{ r: 3, fill: chartColors.series.plum, stroke: chartColors.dotStroke, strokeWidth: 1.5 }}
                    activeDot={{ r: 5, stroke: chartColors.dotStroke, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-ink/50">No finished tests yet.</p>
            )}
          </AdminPanel>

          <AdminPanel title="Topic overview" description="Accuracy in the top five topics.">
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} outerRadius="70%">
                  <PolarGrid stroke={chartColors.gridStroke} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: chartColors.tickFill, fontSize: 11 }} />
                  <Radar name="Accuracy" dataKey="value" stroke={chartColors.series.plum} fill={chartColors.series.plum} fillOpacity={0.14} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-12 text-center text-sm text-ink/50">No topic data yet.</p>
            )}
          </AdminPanel>
        </div>

        {/* ── Topic Mastery ─────────────────────────────────── */}
        {topicPerformance.length > 0 && (
          <AdminPanel
            title="Accuracy by topic"
            description="Green is 70% or more, amber 40–69%, red below 40%."
            contentClassName="p-0 sm:p-0"
          >
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="!pl-5 sm:!pl-6">Topic</th>
                    <th className="!text-right">Correct</th>
                    <th className="w-[40%] !pr-5 sm:!pr-6">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {topicPerformance.map((t) => (
                    <tr key={t.topic}>
                      <td className="!pl-5 !text-ink sm:!pl-6">{t.topic}</td>
                      <td className="whitespace-nowrap !text-right font-mono !text-ink/70">
                        {t.correct}<span className="text-ink/35"> / {t.total}</span>
                      </td>
                      <td className="!pr-5 sm:!pr-6">
                        <div className="flex items-center gap-3">
                          <div className="hidden h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.07] sm:block">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${t.accuracy}%`, background: `rgb(var(--${SCORE_TONE(t.accuracy)}))` }}
                            />
                          </div>
                          <span className={`w-11 text-right font-mono ${SCORE_TEXT(t.accuracy)}`}>{t.accuracy}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminPanel>
        )}

        {/* ── Recent Attempts ───────────────────────────────── */}
        {recentAttempts.length > 0 && (
          <AdminPanel title="Recent attempts" contentClassName="p-0 sm:p-0">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="!pl-5 sm:!pl-6">Test</th>
                    <th className="hidden md:table-cell">Date</th>
                    <th className="hidden !text-right md:table-cell">Time</th>
                    <th className="!text-right">Correct</th>
                    <th className="!text-right">Wrong</th>
                    <th className="hidden !text-right sm:table-cell">Skipped</th>
                    <th className="!pr-5 !text-right sm:!pr-6">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAttempts.map((a) => (
                    <tr key={a._id}>
                      <td className="max-w-[260px] !pl-5 sm:!pl-6">
                        <p className="truncate font-medium text-ink">{a.title || 'Practice test'}</p>
                        <p className="text-[12px] text-ink/50 md:hidden">{fmtDate(a.createdAt)}</p>
                      </td>
                      <td className="hidden whitespace-nowrap font-mono text-[13px] !text-ink/60 md:table-cell">{fmtDate(a.createdAt)}</td>
                      <td className="hidden !text-right font-mono !text-ink/60 md:table-cell">{a.totalTime ? fmtTime(a.totalTime) : '—'}</td>
                      <td className="!text-right font-mono !text-ok">{a.correctCount}</td>
                      <td className="!text-right font-mono !text-bad">{a.incorrectCount}</td>
                      <td className="hidden !text-right font-mono !text-ink/50 sm:table-cell">{a.skippedCount ?? '—'}</td>
                      <td className={`!pr-5 !text-right font-mono font-medium sm:!pr-6 ${SCORE_TEXT(a.score)}`}>{a.score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminPanel>
        )}
      </AdminPage>
    </AdminLayout>
  );
};

export default StudentAnalyticsPage;
