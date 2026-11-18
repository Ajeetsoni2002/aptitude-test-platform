// src/pages/ResultPage.tsx
// Result marksheet: score, section-wise table and next steps.

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import HoloButton from '@/components/ui/HoloButton';
import { BrandMark } from '@/components/brand/BrandMark';
import { RotateCcw, LayoutDashboard, BarChart3, Share2, AlertTriangle, Award, BookOpenCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);

  const state = location.state as {
    result: {
      attemptId: string;
      score: number;
      totalQuestions: number;
      correctCount: number;
      incorrectCount: number;
      skippedCount: number;
      totalTime?: number;
      topicPerformance: Record<string, { correct: number; total: number }>;
    };
    title: string;
    isAutoSubmit?: boolean;
  } | null;

  useEffect(() => {
    if (!state?.result) { navigate('/dashboard', { replace: true }); return; }
    const t = setTimeout(() => setRevealed(true), 400);
    return () => clearTimeout(t);
  }, [state, navigate]);

  if (!state?.result) return null;

  const { result, title, isAutoSubmit } = state;
  const { score, totalQuestions, correctCount, incorrectCount, skippedCount, topicPerformance } = result;

  const scoreColor: 'green' | 'cyan' | 'amber' | 'red' =
    score >= 80 ? 'green' : score >= 60 ? 'cyan' : score >= 40 ? 'amber' : 'red';

  const grade =
    score >= 80 ? 'Excellent' :
    score >= 60 ? 'Good'      :
    score >= 40 ? 'Fair'      : 'Needs work';

  const gradeColor =
    score >= 80 ? 'text-ok'    :
    score >= 60 ? 'text-brand' :
    score >= 40 ? 'text-warn'  : 'text-bad';

  const gradeDesc =
    score >= 80 ? 'Excellent work. You\'re ready for the real exam.' :
    score >= 60 ? 'A solid result. A little more practice will get you there.' :
    score >= 40 ? 'Room to improve. Spend some time on your weaker sections.' :
                  'Keep going. Read through the solutions, then try again.';

  const scoreFill = { green: 'bg-ok', cyan: 'bg-brand', amber: 'bg-warn', red: 'bg-bad' }[scoreColor];
  const timeAllowedMin = result.totalTime ? Math.round(result.totalTime / 60) : 0;

  const marks = [
    { label: 'Correct', value: correctCount,   tone: 'text-ok' },
    { label: 'Wrong',   value: incorrectCount, tone: 'text-bad' },
    { label: 'Skipped', value: skippedCount,   tone: 'text-ink/70' },
    ...(timeAllowedMin > 0 ? [{ label: 'Time allowed', value: `${timeAllowedMin} min`, tone: 'text-ink/70' }] : []),
  ];

  return (
    <div className="min-h-screen bg-canvas px-4 py-10 sm:py-14">
      <div className="w-full max-w-3xl mx-auto">

        <div className="flex items-center gap-2 mb-6">
          <BrandMark size={24} />
          <span className="font-display text-[20px] font-black uppercase text-ink">Nexus</span>
        </div>

        {/* Auto-submit banner */}
        {isAutoSubmit && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-[12px] bg-warn/[0.08] border border-warn/30 animate-fade-in">
            <AlertTriangle size={16} className="text-warn flex-shrink-0 mt-0.5" />
            <p className="text-ink/80 text-[14px]">
              This test was submitted automatically, because the time ran out or the tab-switch limit was reached.
            </p>
          </div>
        )}

        {/* ── Marksheet ──────────────────────────────────── */}
        <section className="bg-surface border border-line rounded-[14px] shadow-soft mb-6 overflow-hidden">
          <header className="px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-line">
            <p className="label-caps mb-1.5">Result</p>
            <h1 className="font-display text-[22px] sm:text-[26px] font-semibold tracking-tight text-ink leading-snug">{title}</h1>
          </header>

          <div className="px-6 sm:px-8 py-7 grid sm:grid-cols-[auto_1fr] gap-6 sm:gap-10 items-center">
            {/* Score */}
            <div className={cn(revealed ? 'animate-score-reveal' : 'opacity-0')}>
              <p className="label-caps mb-2">Score</p>
              <p className="font-display font-medium text-ink leading-none tabular">
                <span className="text-[72px] sm:text-[84px] tracking-tight">{score}</span>
                <span className="text-[32px] text-ink/45 ml-1">%</span>
              </p>
              <div className="mt-4 h-1.5 w-full sm:w-48 bg-ink/[0.07] rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-1000', scoreFill)}
                  style={{ width: revealed ? `${score}%` : '0%' }}
                />
              </div>
            </div>

            {/* Grade */}
            <div className={cn(revealed && 'animate-fade-up')}>
              <p className={cn('font-display text-[26px] font-semibold tracking-tight mb-1', gradeColor)}>
                {grade}
              </p>
              <p className="text-ink/60 text-[15px] leading-relaxed max-w-sm">{gradeDesc}</p>
              <p className="font-mono text-[13px] text-ink/50 mt-3 tabular">
                {correctCount} of {totalQuestions} marks
              </p>
            </div>
          </div>

          {/* Breakdown row */}
          <div className={cn(
            'grid gap-px bg-line border-t border-line',
            marks.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'
          )}>
            {marks.map((item, i) => (
              <div key={item.label} className="bg-surface px-6 sm:px-8 py-5">
                <div className={cn(revealed && 'animate-fade-up')} style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                  <p className="label-caps mb-1.5">{item.label}</p>
                  <p className={cn('font-display text-[28px] font-medium leading-none tabular', item.tone)}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section-wise table ─────────────────────────── */}
        {Object.keys(topicPerformance).length > 0 && (
          <section className="bg-surface border border-line rounded-[14px] shadow-soft mb-6 overflow-hidden animate-fade-up-delay">
            <h2 className="text-base font-semibold text-ink px-6 sm:px-8 pt-6 pb-4">By section</h2>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr className="border-y border-line bg-raised">
                    <th className="!pl-6 sm:!pl-8">Section</th>
                    <th className="text-right">Correct</th>
                    <th className="w-[38%] !pr-6 sm:!pr-8">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(topicPerformance).map(([topic, perf]) => {
                    const pct = Math.round((perf.correct / perf.total) * 100);
                    const barColor = pct >= 70 ? 'bg-ok' : pct >= 40 ? 'bg-warn' : 'bg-bad';
                    return (
                      <tr key={topic}>
                        <td className="!pl-6 sm:!pl-8 text-[14px] text-ink">{topic}</td>
                        <td className="text-right font-mono text-[13px] tabular whitespace-nowrap">
                          {perf.correct}<span className="text-ink/45"> / {perf.total}</span>
                        </td>
                        <td className="!pr-6 sm:!pr-8">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-ink/[0.07] rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all duration-1000', barColor)}
                                style={{ width: revealed ? `${pct}%` : '0%' }}
                              />
                            </div>
                            <span className="font-mono text-[13px] text-ink tabular w-10 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ── Certificate ─────────────────────────────────── */}
        {score >= 60 && (
          <section className="bg-surface border border-line rounded-[14px] shadow-soft p-5 sm:p-6 mb-6 animate-fade-up">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-warn/10 text-warn flex items-center justify-center flex-shrink-0">
                <Award size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-ink">
                  {score >= 80 ? 'Certificate of excellence' : 'Certificate of completion'}
                </p>
                <p className="text-ink/60 text-[13px] mt-0.5">
                  Awarded for scoring {score}% on {title}
                </p>
              </div>
              <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-line text-ink/70 hover:text-ink hover:border-ink/30 text-[13px] font-medium transition-colors">
                <Share2 size={13} /> Share
              </button>
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <HoloButton variant="cyan" size="md" onClick={() => navigate(`/solutions/${result.attemptId}`)} icon={<BookOpenCheck size={15} />}>
            Review solutions
          </HoloButton>
          <HoloButton variant="ghost" size="md" onClick={() => navigate('/test-setup')} icon={<RotateCcw size={15} />}>
            New test
          </HoloButton>
          <HoloButton variant="ghost" size="md" onClick={() => navigate('/analysis')} icon={<BarChart3 size={15} />}>
            Analysis
          </HoloButton>
          <HoloButton variant="ghost" size="md" onClick={() => navigate('/dashboard')} icon={<LayoutDashboard size={15} />}>
            Dashboard
          </HoloButton>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
