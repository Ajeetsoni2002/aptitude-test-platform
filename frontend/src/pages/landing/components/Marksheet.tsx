// An illustrative result sheet, clearly labelled as a sample. It only
// shows things the real result and analysis pages show: score, correct /
// wrong / skipped, time used, and accuracy by topic.

import { Meter } from './primitives';

const SUMMARY = [
  { label: 'Correct', value: '14', tone: 'text-ok' },
  { label: 'Wrong', value: '04', tone: 'text-bad' },
  { label: 'Skipped', value: '02', tone: 'text-ink/70' },
  { label: 'Time', value: '18:42', tone: 'text-ink/70' },
];

const TOPICS = [
  { topic: 'Time & work', correct: 1, total: 4 },
  { topic: 'Speed & distance', correct: 3, total: 5 },
  { topic: 'Profit & loss', correct: 4, total: 5 },
  { topic: 'Percentages', correct: 6, total: 6 },
];

const Marksheet = () => (
  <div className="rounded-xl bg-surface">
    <div className="flex items-end justify-between gap-4 px-6 pt-6">
      <div>
        <p className="label-caps">Sample result</p>
        <p className="mt-2 font-mono text-[13px] font-bold uppercase tracking-[0.04em] text-ink">Quantitative aptitude</p>
        <p className="font-mono text-[12px] uppercase tracking-[0.04em] text-ink/50">20 Q · medium · 20 min</p>
      </div>
      <p className="font-display text-[72px] leading-none text-ink">70%</p>
    </div>

    <dl className="mt-6 grid grid-cols-4 border-y border-line">
      {SUMMARY.map((s, i) => (
        <div key={s.label} className={i ? 'border-l border-line px-4 py-4 sm:px-6' : 'px-4 py-4 sm:px-6'}>
          <dt className="label-caps">{s.label}</dt>
          <dd className={`mt-1 font-mono text-[18px] font-bold tabular ${s.tone}`}>{s.value}</dd>
        </div>
      ))}
    </dl>

    <div className="px-6 py-6">
      <p className="label-caps">Accuracy by topic</p>
      <ul className="mt-4 space-y-3.5">
        {TOPICS.map((t) => {
          const pct = t.correct / t.total;
          return (
            <li key={t.topic} className="grid grid-cols-[130px_1fr_36px] items-center gap-4 sm:grid-cols-[160px_1fr_40px]">
              <span className="truncate font-mono text-[12px] uppercase tracking-[0.04em] text-ink/75">{t.topic}</span>
              <Meter value={pct} tone={pct < 0.6 ? 'text-bad' : 'text-ink'} />
              <span className="text-right font-mono text-[12px] text-ink/60 tabular">{t.correct}/{t.total}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-[13px] text-ink/55">Red is under 60%. Time &amp; work is where the next marks are.</p>
    </div>
  </div>
);

export default Marksheet;
