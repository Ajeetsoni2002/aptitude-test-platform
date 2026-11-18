// src/pages/AnalysisPage.tsx
// Detailed analytics: full history, filters, charts and a plain-language summary

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyResultsApi } from '@/api/testApi';
import { useChartColors } from '@/hooks/useChartColors';
import type { TestAttempt } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProgressRing from '@/components/ui/ProgressRing';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  Lightbulb, Plus, Filter, X, ChevronLeft, ChevronRight, ExternalLink, Clock,
  CheckCircle2, XCircle, MinusCircle, Search, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Topics list ──────────────────────────────────────────────
const TOPICS = [
  'All Topics',
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
  'General Awareness',
];

// ── Custom Tooltip ────────────────────────────────────────────
const NeonTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-line rounded-[10px] px-3 py-2 shadow-lift">
      <p className="text-ink/55 text-xs mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-medium tabular flex items-center gap-2 text-ink">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || 'rgb(var(--brand))' }} />
          {p.name === 'avg' ? 'Moving average' : 'Score'}
          <span className="font-mono ml-auto pl-3">{Math.round(p.value)}{p.name === 'score' || p.name === 'avg' ? '%' : ''}</span>
        </p>
      ))}
    </div>
  );
};

// ── Score color helper (token name) ───────────────────────────
const scoreToken = (s: number) =>
  s >= 70 ? 'green' : s >= 40 ? 'amber' : 'red';
const scoreColor = (s: number) => `rgb(var(--${scoreToken(s)}))`;

// ── Format duration ──────────────────────────────────────────
const fmtTime = (secs: number) => {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

// ── Heatmap Grid (12-week) ────────────────────────────────────
const ContributionHeatmap = ({ attempts }: { attempts: TestAttempt[] }) => {
  const weeks = 12;
  const days = 7;
  const today = new Date();

  // Build date → score map
  const dateScoreMap: Record<string, number[]> = {};
  attempts.forEach((a) => {
    const d = new Date(a.createdAt).toISOString().split('T')[0];
    if (!dateScoreMap[d]) dateScoreMap[d] = [];
    dateScoreMap[d].push(a.score);
  });

  const cells: { date: string; score: number; count: number }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = days - 1; d >= 0; d--) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - (w * 7 + d));
      const key = dt.toISOString().split('T')[0];
      const scores = dateScoreMap[key] || [];
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      cells.push({ date: key, score: avg, count: scores.length });
    }
  }

  const fill = (score: number, count: number) =>
    count === 0
      ? 'rgb(var(--ink) / .06)'
      : `rgb(var(--${scoreToken(score)}) / ${Math.min(0.3 + count * 0.18, 1)})`;

  return (
    <div>
      {/* One column per week, oldest on the left */}
      <div className="flex gap-[5px] overflow-x-auto pb-1">
        {Array.from({ length: weeks }, (_, wi) => (
          <div key={wi} className="flex flex-col gap-[5px]">
            {cells.slice(wi * 7, (wi + 1) * 7).map((cell, di) => (
              <div
                key={`${wi}-${di}`}
                title={`${cell.date}: ${cell.count} test(s) · avg ${cell.score}%`}
                className="w-[18px] h-[18px] rounded-[4px] cursor-default"
                style={{ background: fill(cell.score, cell.count) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 justify-between text-xs text-ink/55">
        <span>Each square is a day. Darker means more tests that day.</span>
        <span className="flex items-center gap-3">
          {[
            { label: 'Below 40%', token: 'red' },
            { label: '40–69%', token: 'amber' },
            { label: '70%+', token: 'green' },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: `rgb(var(--${l.token}) / .6)` }} />
              {l.label}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};

// ── Card header helper ────────────────────────────────────────
const CardTitle = ({ title, hint }: { title: string; hint?: string }) => (
  <div className="mb-4">
    <h2 className="text-base font-semibold text-ink">{title}</h2>
    {hint && <p className="text-[13px] text-ink/55 mt-0.5">{hint}</p>}
  </div>
);

// ── Main Page ─────────────────────────────────────────────────
const AnalysisPage = () => {
  const navigate = useNavigate();
  const chartColors = useChartColors();

  // Data state
  const [attempts,  setAttempts]  = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalAttempts: 0 });

  // Filter state
  const [filters, setFilters] = useState({
    topic: '',
    dateFrom: '',
    dateTo: '',
    minScore: '',
    maxScore: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'overview' | 'history'>('overview');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const activeFilters = {
        topic:    filters.topic    || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo:   filters.dateTo   || undefined,
        minScore: filters.minScore ? Number(filters.minScore) : undefined,
        maxScore: filters.maxScore ? Number(filters.maxScore) : undefined,
      };
      const res = await getMyResultsApi(page, 50, activeFilters);
      if (res.success && res.data) {
        setAttempts(res.data.attempts);
        setPagination(res.data.pagination);
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Stats ─────────────────────────────────────────────────
  const avgScore   = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const bestScore  = attempts.length ? Math.max(...attempts.map((a) => a.score)) : 0;

  const totalTime  = attempts.reduce((s, a) => s + (a.totalTime || 0), 0);

  // Chart data
  const trendData = [...attempts].reverse().slice(-20).map((a, i) => ({
    name:  `T${i + 1}`,
    score: a.score,
    date:  new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  // Moving avg
  const movingAvgData = trendData.map((d, i) => {
    const window = trendData.slice(Math.max(0, i - 2), i + 3);
    return { ...d, avg: Math.round(window.reduce((s, w) => s + w.score, 0) / window.length) };
  });

  // Score distribution
  const distData = [
    { range: '0–20',   count: attempts.filter((a) => a.score < 20).length },
    { range: '20–40',  count: attempts.filter((a) => a.score >= 20 && a.score < 40).length },
    { range: '40–60',  count: attempts.filter((a) => a.score >= 40 && a.score < 60).length },
    { range: '60–80',  count: attempts.filter((a) => a.score >= 60 && a.score < 80).length },
    { range: '80–100', count: attempts.filter((a) => a.score >= 80).length },
  ];

  // Topic performance
  const topicMap: Record<string, { correct: number; total: number }> = {};
  attempts.forEach((a) => {
    if (a.topicPerformance) {
      Object.entries(a.topicPerformance).forEach(([topic, perf]) => {
        if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
        topicMap[topic].correct += perf.correct;
        topicMap[topic].total   += perf.total;
      });
    }
  });
  const topicData = Object.entries(topicMap).map(([topic, perf]) => ({
    topic:   topic.replace(' Aptitude', '').replace(' Ability', ''),
    score:   Math.round((perf.correct / (perf.total || 1)) * 100),
    correct: perf.correct,
    total:   perf.total,
  })).sort((a, b) => a.score - b.score);

  // Radar
  const radarData = [
    { subject: 'Quant',    value: topicData.find((t) => t.topic.includes('Quant'))?.score   ?? 0 },
    { subject: 'Verbal',   value: topicData.find((t) => t.topic.includes('Verbal'))?.score  ?? 0 },
    { subject: 'Logical',  value: topicData.find((t) => t.topic.includes('Logic'))?.score   ?? 0 },
    { subject: 'Speed',    value: Math.min(avgScore + 10, 100) },
    { subject: 'Accuracy', value: bestScore },
  ];

  // Plain-language summary
  const aiInsight = (() => {
    if (!attempts.length) return 'Finish at least one test and a short summary of your results will appear here.';
    const recentTrend = trendData.length >= 3
      ? trendData.slice(-3).reduce((s, d) => s + d.score, 0) / 3
      : avgScore;
    const weakTopic = topicData[0]; // lowest score
    const strongTopic = topicData[topicData.length - 1];
    let insight = '';
    if (recentTrend > avgScore + 5)  insight = `Your last three tests average ${Math.round(recentTrend)}%, above your overall ${avgScore}%. You're improving.`;
    else if (recentTrend < avgScore - 5) insight = `Your last three tests average ${Math.round(recentTrend)}%, below your overall ${avgScore}%. It may be worth revisiting the basics.`;
    else insight = `You're scoring steadily around ${avgScore}%. Harder questions are the next step.`;
    if (weakTopic) insight += ` Weakest topic: ${weakTopic.topic} (${weakTopic.score}% correct).`;
    if (strongTopic && strongTopic !== weakTopic) insight += ` Strongest: ${strongTopic.topic} (${strongTopic.score}%).`;
    return insight;
  })();

  // Export CSV
  const exportCSV = () => {
    const header = ['Date', 'Title', 'Score', 'Correct', 'Incorrect', 'Skipped', 'Time (s)'];
    const rows = attempts.map((a) => [
      new Date(a.createdAt).toLocaleDateString('en-IN'),
      (a.title || '').replace(/,/g, ' '),
      a.score,
      a.correctCount,
      a.incorrectCount,
      a.skippedCount,
      a.totalTime || 0,
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'test_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyFilters = () => {
    setPage(1);
    fetchData();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ topic: '', dateFrom: '', dateTo: '', minScore: '', maxScore: '' });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" label="Loading your results…" />
        </div>
      </AppLayout>
    );
  }

  if (!attempts.length && !hasActiveFilters) {
    return (
      <AppLayout>
        <header className="mb-8">
          <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight text-ink">Analysis</h1>
          <p className="text-[15px] text-ink/60 mt-1">Trends, topics and habits across all your tests.</p>
        </header>
        <NeonCard padding="p-10" className="flex flex-col items-center text-center gap-4">
          <p className="text-ink/60 text-[15px] max-w-sm">
            Nothing to analyse yet. Once you finish a test, your scores and topic breakdown will appear here.
          </p>
          <HoloButton variant="cyan" size="md" onClick={() => navigate('/test-setup')} icon={<Plus size={16} />}>
            Take your first test
          </HoloButton>
        </NeonCard>
      </AppLayout>
    );
  }

  const kpis = [
    { label: 'Tests taken',   value: pagination.totalAttempts, color: 'cyan',   ring: 100 },
    { label: 'Average score', value: `${avgScore}%`,           color: 'violet', ring: avgScore },
    { label: 'Best score',    value: `${bestScore}%`,          color: 'green',  ring: bestScore },
    { label: 'Total time',    value: fmtTime(totalTime),       color: 'amber',  ring: Math.min(totalTime / 600, 100) },
  ] as const;

  const distFill = (i: number) =>
    i >= 3 ? chartColors.series.green : i === 2 ? chartColors.series.amber : chartColors.series.red;

  return (
    <AppLayout>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight text-ink">Analysis</h1>
          <p className="text-[15px] text-ink/60 mt-1">
            Trends, topics and habits across {pagination.totalAttempts} {pagination.totalAttempts === 1 ? 'test' : 'tests'}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HoloButton variant="ghost" size="md" onClick={exportCSV} icon={<Download size={15} />}>
            Export CSV
          </HoloButton>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex items-center gap-2 h-10 px-4 rounded-lg border text-sm font-semibold transition-colors',
              hasActiveFilters
                ? 'border-brand/40 text-brand bg-brand/[0.06]'
                : 'border-line bg-surface text-ink hover:border-ink/35'
            )}
          >
            <Filter size={15} />
            Filters
            {hasActiveFilters && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-on-brand text-[11px] font-semibold flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
          <HoloButton variant="cyan" size="md" onClick={() => navigate('/test-setup')} icon={<Plus size={16} />}>
            New test
          </HoloButton>
        </div>
      </header>

      {/* ── Filter Panel ─────────────────────────────────────────── */}
      {showFilters && (
        <NeonCard padding="p-5" className="mb-6 animate-fade-up" hover={false}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-semibold text-ink">Filter results</p>
            <button onClick={() => setShowFilters(false)} aria-label="Close filters" className="text-ink/45 hover:text-ink">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="col-span-2 md:col-span-1">
              <label className="text-ink/60 text-[13px] mb-1.5 block">Topic</label>
              <select
                value={filters.topic}
                onChange={(e) => setFilters({ ...filters, topic: e.target.value === 'All Topics' ? '' : e.target.value })}
                className="cyber-input w-full h-10 text-sm px-3"
              >
                {TOPICS.map((t) => <option key={t} value={t === 'All Topics' ? '' : t}>{t === 'All Topics' ? 'All topics' : t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-ink/60 text-[13px] mb-1.5 block">From</label>
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="cyber-input w-full h-10 text-sm px-3" />
            </div>
            <div>
              <label className="text-ink/60 text-[13px] mb-1.5 block">To</label>
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="cyber-input w-full h-10 text-sm px-3" />
            </div>
            <div>
              <label className="text-ink/60 text-[13px] mb-1.5 block">Min score (%)</label>
              <input type="number" min="0" max="100" value={filters.minScore} onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                className="cyber-input w-full h-10 text-sm px-3" placeholder="0" />
            </div>
            <div>
              <label className="text-ink/60 text-[13px] mb-1.5 block">Max score (%)</label>
              <input type="number" min="0" max="100" value={filters.maxScore} onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
                className="cyber-input w-full h-10 text-sm px-3" placeholder="100" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <HoloButton variant="cyan" size="sm" onClick={applyFilters} icon={<Search size={14} />}>Apply</HoloButton>
            <HoloButton variant="ghost" size="sm" onClick={clearFilters}>Clear all</HoloButton>
          </div>
        </NeonCard>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="inline-flex items-center gap-1 p-1 mb-6 rounded-[10px] bg-raised border border-line">
        {(['overview', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            data-active={tab === t}
            className="admin-tab"
          >
            {t === 'overview' ? 'Overview' : 'All attempts'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* ── KPI Row ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpis.map((k, i) => (
              <NeonCard key={k.label} padding="p-5"
                className="flex items-center justify-between gap-3 animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` } as React.CSSProperties}>
                <div className="min-w-0">
                  <p className="text-[13px] text-ink/60">{k.label}</p>
                  <p className="mt-2 font-display text-[28px] leading-none font-medium tracking-tight text-ink tabular truncate">{k.value}</p>
                </div>
                <ProgressRing value={typeof k.ring === 'number' ? k.ring : 100} size={44} strokeWidth={4}
                  color={k.color} showLabel={false} className="flex-shrink-0 hidden sm:inline-flex" />
              </NeonCard>
            ))}
          </div>

          {/* ── Summary ─────────────────────────────────────────── */}
          <NeonCard padding="p-5 md:p-6" className="animate-fade-up mb-6">
            <div className="flex items-start gap-4">
              <span className="w-9 h-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center flex-shrink-0">
                <Lightbulb size={18} />
              </span>
              <div className="flex-1">
                <p className="text-base font-semibold text-ink mb-1">Summary</p>
                <p className="text-ink/70 text-[15px] leading-relaxed">{aiInsight}</p>
                <div className="flex gap-2 flex-wrap mt-3">
                  {avgScore < 60 && (
                    <span className="admin-chip">Practise the basics daily</span>
                  )}
                  {bestScore < 80 && (
                    <span className="admin-chip">Try a harder test</span>
                  )}
                  <span className="admin-chip">Based on {pagination.totalAttempts} {pagination.totalAttempts === 1 ? 'test' : 'tests'}</span>
                </div>
              </div>
            </div>
          </NeonCard>

          {/* ── Score Trend + Distribution ────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <NeonCard padding="p-5 md:p-6" className="animate-fade-up">
              <CardTitle title="Score over time" hint="Last 20 tests, with a 5-test moving average" />
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={movingAvgData} margin={{ top: 5, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke={chartColors.gridStroke} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: chartColors.tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: chartColors.tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<NeonTooltip />} cursor={{ stroke: chartColors.gridStroke }} />
                  <Line type="monotone" dataKey="score" stroke={chartColors.series.accent} strokeWidth={2}
                    dot={{ fill: chartColors.series.accent, r: 3, strokeWidth: 2, stroke: chartColors.dotStroke }} name="score" />
                  <Line type="monotone" dataKey="avg" stroke={chartColors.series.plum} strokeWidth={1.5}
                    dot={false} strokeDasharray="4 4" name="avg" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-5 mt-3 text-xs text-ink/55">
                <span className="flex items-center gap-2">
                  <span className="w-4 h-0.5 rounded-full" style={{ background: chartColors.series.accent }} />
                  Score
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-4 h-0" style={{ borderTop: `1.5px dashed ${chartColors.series.plum}` }} />
                  Moving average
                </span>
              </div>
            </NeonCard>

            <NeonCard padding="p-5 md:p-6" className="animate-fade-up">
              <CardTitle title="Score distribution" hint="How many tests landed in each range" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={distData} barSize={32} margin={{ top: 5, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid stroke={chartColors.gridStroke} vertical={false} />
                  <XAxis dataKey="range" tick={{ fill: chartColors.tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: chartColors.tickFill, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: chartColors.gridStroke }}
                    contentStyle={chartColors.tooltipStyle}
                    labelStyle={{ color: chartColors.tooltipLabelColor, fontSize: 12 }}
                    itemStyle={{ color: chartColors.tooltipTextColor }}
                    formatter={(v) => [v, 'Tests']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {distData.map((_, i) => (
                      <Cell key={i} fill={distFill(i)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </NeonCard>
          </div>

          {/* ── Topics, skill profile, activity ─────────────────────────────────── */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            <NeonCard padding="p-5 md:p-6" className="animate-fade-up">
              <CardTitle title="Topics" hint="Correct answers per topic, weakest first" />
              {topicData.length > 0 ? (
                <div className="space-y-4">
                  {topicData.map((t) => {
                    const color = scoreColor(t.score);
                    return (
                      <div key={t.topic}>
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-ink text-sm">{t.topic}</span>
                          <div className="flex items-baseline gap-3">
                            <span className="text-ink/45 text-xs font-mono">{t.correct}/{t.total}</span>
                            <span className="font-mono text-sm font-medium w-10 text-right" style={{ color }}>{t.score}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-ink/[0.07] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${t.score}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-ink/50 text-sm">No topic data yet. It fills in as you answer questions.</p>
              )}
            </NeonCard>

            <NeonCard padding="p-5 md:p-6" className="animate-fade-up">
              <CardTitle title="Skill profile" hint="Topic scores, plus speed and accuracy estimated from your results" />
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke={chartColors.gridStroke} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: chartColors.tickFill, fontSize: 11 }} />
                  <Radar name="Score" dataKey="value" stroke={chartColors.series.accent} fill={chartColors.series.accent} fillOpacity={0.12}
                    strokeWidth={1.75} />
                </RadarChart>
              </ResponsiveContainer>
            </NeonCard>
            {/* ── Activity Heatmap ──────────────────────────────── */}
            <NeonCard padding="p-5 md:p-6" className="animate-fade-up">
              <CardTitle title="Activity" hint="The last 12 weeks" />
              <ContributionHeatmap attempts={attempts} />
            </NeonCard>
          </div>

        </>
      )}

      {/* ── History Tab ──────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="animate-fade-up">
          {attempts.length === 0 ? (
            <NeonCard padding="p-10" className="text-center">
              <p className="text-ink/60">No tests match these filters.</p>
              <button onClick={clearFilters} className="mt-3 text-brand text-sm font-medium hover:underline">
                Clear filters
              </button>
            </NeonCard>
          ) : (
            <>
              <NeonCard padding="p-0" className="mb-6 overflow-hidden" hover={false}>
                <ul className="divide-y divide-line">
                  {attempts.map((attempt) => (
                    <li
                      key={attempt._id}
                      className="px-4 md:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-ink/[0.02] transition-colors"
                    >
                      {/* Score */}
                      <div className="flex-shrink-0 w-16">
                        <span className="font-display text-xl font-medium tabular" style={{ color: scoreColor(attempt.score) }}>
                          {attempt.score}%
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink truncate">{attempt.title || 'Practice test'}</p>
                        <p className="text-ink/50 text-xs mt-0.5">
                          {new Date(attempt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {attempt.totalTime ? ` · ${fmtTime(attempt.totalTime)}` : ''}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="flex items-center gap-1.5 text-ok" title="Correct">
                          <CheckCircle2 size={13} />
                          {attempt.correctCount}
                        </span>
                        <span className="flex items-center gap-1.5 text-bad" title="Incorrect">
                          <XCircle size={13} />
                          {attempt.incorrectCount}
                        </span>
                        <span className="flex items-center gap-1.5 text-ink/45" title="Skipped">
                          <MinusCircle size={13} />
                          {attempt.skippedCount}
                        </span>
                        {attempt.totalTime ? (
                          <span className="flex items-center gap-1.5 text-ink/45" title="Time taken">
                            <Clock size={13} />
                            {fmtTime(attempt.totalTime)}
                          </span>
                        ) : null}
                      </div>

                      {/* Action */}
                      <HoloButton variant="ghost" size="sm"
                        onClick={() => navigate(`/result/${attempt._id}`)}
                        icon={<ExternalLink size={13} />}>
                        Review
                      </HoloButton>
                    </li>
                  ))}
                </ul>
              </NeonCard>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <HoloButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    icon={<ChevronLeft size={15} />}
                  >
                    Previous
                  </HoloButton>
                  <span className="font-mono text-xs text-ink/55">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <HoloButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                  >
                    Next <ChevronRight size={15} />
                  </HoloButton>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default AnalysisPage;
