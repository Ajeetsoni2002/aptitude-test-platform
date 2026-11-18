// An illustrative result sheet, clearly labelled as a sample. It only
// shows things the real result and analysis pages show: score, correct /
// wrong / skipped, time used, and accuracy by topic.

import { cn } from '@/lib/utils';

const SUMMARY = [
  { label: 'Correct', value: '14', tone: 'text-ok' },
  { label: 'Wrong', value: '4', tone: 'text-bad' },
  { label: 'Skipped', value: '2', tone: 'text-ink/70' },
  { label: 'Time used', value: '18:42', tone: 'text-ink/70' },
];

const TOPICS = [
  { topic: 'Time & work', correct: 1, total: 4 },
  { topic: 'Speed & distance', correct: 3, total: 5 },
  { topic: 'Profit & loss', correct: 4, total: 5 },
  { topic: 'Percentages', correct: 6, total: 6 },
];

const Marksheet = () => (
  <div className="rounded-2xl border border-line bg-surface shadow-float overflow-hidden">
    <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
      <div>
        <p className="label-caps">Sample result</p>
        <p className="mt-1 text-[15px] font-semibold text-ink">Quantitative aptitude</p>
        <p className="text-[13px] text-ink/55">20 questions · medium · 20 min</p>
      </div>
      <div className="text-right">
        <p className="lp-num text-[48px] leading-none font-medium text-ink">
          70<span className="text-ink/35 text-[26px]">%</span>
        </p>
        <p className="mt-1 font-mono text-[12px] text-ink/55">14 of 20</p>
      </div>
    </div>

    <dl className="grid grid-cols-4 divide-x divide-line border-b border-line">
      {SUMMARY.map((s) => (
        <div key={s.label} className="px-4 py-3.5 sm:px-6">
          <dt className="text-[12px] text-ink/55">{s.label}</dt>
          <dd className={cn('mt-0.5 font-mono text-[17px] tabular', s.tone)}>{s.value}</dd>
        </div>
      ))}
    </dl>

    <div className="bg-raised px-6 py-5">
      <p className="text-[13px] font-semibold text-ink">Accuracy by topic</p>
      <ul className="mt-3 space-y-2.5">
        {TOPICS.map((t) => {
          const pct = t.correct / t.total;
          return (
            <li key={t.topic} className="grid grid-cols-[130px_1fr_36px] items-center gap-3 text-[13px] sm:grid-cols-[150px_1fr_40px]">
              <span className="truncate text-ink/75">{t.topic}</span>
              <span className="h-2 rounded-full bg-ink/[0.07]">
                <span
                  className={cn('block h-2 rounded-full', pct < 0.6 ? 'bg-bad/80' : 'bg-brand/70')}
                  style={{ width: `${Math.max(pct, 0.04) * 100}%` }}
                />
              </span>
              <span className="text-right font-mono text-ink/60 tabular">{t.correct}/{t.total}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[13px] text-ink/55">
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-bad/80 align-middle" />
        Under 60%. Time &amp; work is where the next marks are.
      </p>
    </div>
  </div>
);

export default Marksheet;
