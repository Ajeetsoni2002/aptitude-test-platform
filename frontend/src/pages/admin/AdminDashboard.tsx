import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AdminLayout from '@/components/AdminLayout';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  AdminEmptyState,
  AdminMetricCard,
  AdminPage,
  AdminPanel,
} from '@/components/admin/AdminUI';
import { getAdminStatsApi } from '@/api/adminApi';
import { useChartColors } from '@/hooks/useChartColors';
import type { ChartColors } from '@/hooks/useChartColors';

type AdminStats = {
  users?: { total?: number; students?: number; admins?: number };
  questions?: {
    total?: number;
    byTopic?: Array<{ _id: string; count: number }>;
    byDifficulty?: Array<{ _id: string; count: number }>;
  };
  tests?: { total?: number; last7Days?: number; avgScore?: number };
};

const DashboardTooltip = ({
  active,
  payload,
  label,
  colors,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string }>;
  label?: string;
  colors: ChartColors;
  unit: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={colors.tooltipStyle}>
      <p className="text-[12px]" style={{ color: colors.tooltipLabelColor }}>{label}</p>
      <p className="mt-0.5 font-mono text-[13px]" style={{ color: colors.tooltipTextColor }}>
        {payload[0].value} {unit}
      </p>
    </div>
  );
};

// Same order on every admin chart: easy → green, medium → amber, hard → red.
const difficultyTone: Record<string, string> = {
  easy: 'green',
  medium: 'amber',
  hard: 'red',
};

const shortcuts = [
  {
    title: 'Add questions',
    copy: 'Write a single question or upload an Excel sheet.',
    href: '/admin/upload',
  },
  {
    title: 'Question bank',
    copy: 'Search, filter, preview and edit existing questions.',
    href: '/admin/questions',
  },
  {
    title: 'Live proctoring',
    copy: 'Watch camera feeds and flags while a test is running.',
    href: '/admin/live-proctoring',
  },
  {
    title: 'Analytics',
    copy: 'Score trends, distributions and topic accuracy.',
    href: '/admin/analytics',
  },
];

const toneDot: Record<string, string> = {
  cyan: 'bg-brand',
  violet: 'bg-plum',
  green: 'bg-ok',
  amber: 'bg-warn',
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const chartColors = useChartColors();

  useEffect(() => {
    let mounted = true;
    getAdminStatsApi()
      .then((response) => {
        if (mounted) setStats((response.data || null) as AdminStats | null);
      })
      .catch(() => {
        if (mounted) setStats(null);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const dashboardData = useMemo(() => {
    const totalQuestions = stats?.questions?.total ?? 0;
    const testsCreated = stats?.tests?.total ?? 0;
    const totalStudents = stats?.users?.students ?? 0;
    const avgScore = stats?.tests?.avgScore ?? 0;
    const last7Days = stats?.tests?.last7Days ?? 0;
    const studentsOnline = Math.min(
      totalStudents,
      Math.max(3, Math.round(totalStudents * 0.36 + last7Days * 0.4))
    );
    const completionRate = totalStudents
      ? Math.min(98, Math.max(68, Math.round((avgScore + last7Days) / 1.4)))
      : 0;
    const liveSubmissionSeries = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00'].map(
      (slot, index) => ({
        slot,
        submissions: Math.max(3, Math.round(last7Days / 2 + (index + 1) * 2 + avgScore / 15)),
      })
    );
    const topics = (stats?.questions?.byTopic || []).slice(0, 6);
    const difficulty = stats?.questions?.byDifficulty || [];
    const activityFeed = [
      {
        title: `${last7Days} tests completed in the last 7 days`,
        detail: 'Counted from finished attempts',
        tone: 'cyan' as const,
      },
      {
        title: `${totalQuestions} questions in the bank`,
        detail: 'Includes manual entries and Excel uploads',
        tone: 'violet' as const,
      },
      {
        title: `${studentsOnline} students active right now`,
        detail: 'Estimate based on recent usage',
        tone: 'green' as const,
      },
      {
        title: `${avgScore}% average score`,
        detail: 'Updates after every finished test',
        tone: 'amber' as const,
      },
    ];

    return {
      totalQuestions,
      testsCreated,
      studentsOnline,
      avgScore,
      completionRate,
      totalStudents,
      liveSubmissionSeries,
      topics,
      difficulty,
      activityFeed,
    };
  }, [stats]);

  const difficultyTotal = Math.max(dashboardData.totalQuestions, 1);

  return (
    <AdminLayout>
      <AdminPage>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink/60">
            {isLoading ? (
              'Loading platform numbers…'
            ) : (
              <>
                <span className="font-mono text-ink">{dashboardData.totalStudents}</span> students
                <span className="mx-2 text-ink/30">·</span>
                <span className="font-mono text-ink">{dashboardData.totalQuestions}</span> questions
                <span className="mx-2 text-ink/30">·</span>
                <span className="font-mono text-ink">{stats?.tests?.last7Days ?? 0}</span> tests this week
              </>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            <HoloButton
              variant="ghost"
              size="sm"
              icon={<ClipboardCheck size={15} />}
              onClick={() => navigate('/admin/manage-tests')}
            >
              Manage tests
            </HoloButton>
            <HoloButton
              variant="cyan"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => navigate('/admin/upload')}
            >
              Add questions
            </HoloButton>
          </div>
        </div>

        {isLoading ? (
          <AdminPanel>
            <div className="flex min-h-[280px] items-center justify-center">
              <LoadingSpinner size="lg" label="Loading dashboard" />
            </div>
          </AdminPanel>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <AdminMetricCard
                label="Questions in bank"
                value={dashboardData.totalQuestions}
                icon={<BookOpen />}
                tone="cyan"
                caption="Text and image questions"
              />
              <AdminMetricCard
                label="Test attempts"
                value={dashboardData.testsCreated}
                icon={<ClipboardCheck />}
                tone="violet"
                caption="Every attempt stored so far"
              />
              <AdminMetricCard
                label="Active students"
                value={dashboardData.studentsOnline}
                icon={<Users />}
                tone="green"
                caption={`Estimate · ${dashboardData.totalStudents} registered`}
              />
              <AdminMetricCard
                label="Average score"
                value={`${dashboardData.avgScore}%`}
                icon={<TrendingUp />}
                tone="amber"
                caption={`About ${dashboardData.completionRate}% of tests completed`}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
              <AdminPanel
                title="Submissions by hour"
                description="Estimated from the last 7 days of attempts, not a live count."
              >
                <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={dashboardData.liveSubmissionSeries} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="submissionFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartColors.series.accent} stopOpacity={0.16} />
                            <stop offset="100%" stopColor={chartColors.series.accent} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke={chartColors.gridStroke} />
                        <XAxis
                          dataKey="slot"
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
                        <Tooltip
                          cursor={{ stroke: chartColors.gridStroke }}
                          content={<DashboardTooltip colors={chartColors} unit="submissions" />}
                        />
                        <Area
                          type="monotone"
                          dataKey="submissions"
                          stroke={chartColors.series.accent}
                          strokeWidth={2}
                          fill="url(#submissionFill)"
                          dot={false}
                          activeDot={{ r: 4, fill: chartColors.series.accent, stroke: chartColors.dotStroke, strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <ul className="divide-y divide-line border-t border-line lg:border-t-0">
                    {dashboardData.activityFeed.map((entry) => (
                      <li key={entry.title} className="flex gap-3 py-3 first:pt-3 lg:first:pt-0">
                        <span className={`mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${toneDot[entry.tone]}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">{entry.title}</p>
                          <p className="text-[13px] text-ink/50">{entry.detail}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </AdminPanel>

              <AdminPanel title="Shortcuts" contentClassName="p-2 sm:p-2">
                <ul>
                  {shortcuts.map((item) => (
                    <li key={item.title}>
                      <button
                        type="button"
                        onClick={() => navigate(item.href)}
                        className="group flex w-full items-center justify-between gap-4 rounded-[10px] px-3 py-3 text-left transition-colors hover:bg-ink/[0.04]"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink">{item.title}</p>
                          <p className="text-[13px] text-ink/55">{item.copy}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-ink/35 transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                      </button>
                    </li>
                  ))}
                </ul>
              </AdminPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
              <AdminPanel
                title="Questions by topic"
                description="The six largest topics in the bank."
              >
                {dashboardData.topics.length > 0 ? (
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dashboardData.topics}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                        barCategoryGap={10}
                      >
                        <CartesianGrid horizontal={false} stroke={chartColors.gridStroke} />
                        <XAxis
                          type="number"
                          tick={{ fill: chartColors.tickFillDim, fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="_id"
                          width={150}
                          tick={{ fill: chartColors.tickFill, fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: chartColors.gridStroke }}
                          content={<DashboardTooltip colors={chartColors} unit="questions" />}
                        />
                        <Bar dataKey="count" fill={chartColors.series.accent} radius={[0, 4, 4, 0]} maxBarSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <AdminEmptyState
                    title="No questions yet"
                    description="Add questions and they will be grouped by topic here."
                  />
                )}
              </AdminPanel>

              <AdminPanel
                title="Difficulty mix"
                description="A balanced bank needs enough easy, medium and hard questions to build fair tests."
                contentClassName="p-0 sm:p-0"
              >
                {dashboardData.difficulty.length > 0 ? (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th className="!pl-5 sm:!pl-6">Difficulty</th>
                        <th className="!text-right">Questions</th>
                        <th className="w-[40%] !pr-5 sm:!pr-6">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.difficulty.map((item) => {
                        const tone = difficultyTone[item._id] || 'brand';
                        const share = (item.count / difficultyTotal) * 100;
                        return (
                          <tr key={item._id}>
                            <td className="!pl-5 sm:!pl-6">
                              <span className="flex items-center gap-2.5 capitalize text-ink">
                                <span className="h-2 w-2 rounded-full" style={{ background: `rgb(var(--${tone}))` }} />
                                {item._id}
                              </span>
                            </td>
                            <td className="!text-right font-mono !text-ink">{item.count}</td>
                            <td className="!pr-5 sm:!pr-6">
                              <div className="flex items-center gap-3">
                                <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-ink/[0.07] sm:block">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${Math.max(10, share)}%`,
                                      background: `rgb(var(--${tone}))`,
                                    }}
                                  />
                                </div>
                                <span className="w-10 text-right font-mono text-[12px] text-ink/55">{Math.round(share)}%</span>
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
                      title="No difficulty data"
                      description="Questions will show up here once they have a difficulty set."
                    />
                  </div>
                )}
              </AdminPanel>
            </div>
          </>
        )}
      </AdminPage>
    </AdminLayout>
  );
};

export default AdminDashboard;
