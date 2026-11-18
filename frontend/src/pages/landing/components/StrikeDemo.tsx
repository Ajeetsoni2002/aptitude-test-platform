// A live version of the tab-switch rule. It listens for the same
// visibilitychange event the real test uses, but nothing is recorded:
// it only counts in this tab.

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ExaminerMark } from './primitives';

const MAX = 3;

const messages = [
  'Go on: switch to another tab, then come back here.',
  'Strike one. In a real test this is logged with the time it happened.',
  'Strike two. The next one ends the paper.',
  'Third strike. A real test would now submit itself, answers as they stand.',
];

const StrikeDemo = () => {
  const [strikes, setStrikes] = useState(0);

  useEffect(() => {
    let wasHidden = false;
    const onChange = () => {
      if (document.visibilityState === 'hidden') wasHidden = true;
      else if (wasHidden) {
        wasHidden = false;
        setStrikes((s) => Math.min(MAX, s + 1));
      }
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="label-caps">Tab-switch strikes</p>
        <p className="font-mono text-[12px] text-ink/55 tabular">
          {strikes} / {MAX}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-4">
        {Array.from({ length: MAX }, (_, i) => {
          const struck = i < strikes;
          return (
            <span
              key={i}
              className={cn(
                'relative grid h-14 w-14 place-items-center rounded-full border-[1.5px] transition-colors',
                struck ? 'border-bad/70 bg-bad/[0.06]' : 'border-ink/25'
              )}
            >
              <span className={cn('font-mono text-sm', struck ? 'text-bad/50' : 'text-ink/40')}>{i + 1}</span>
              {struck && <ExaminerMark kind="cross" size={44} className="absolute" />}
            </span>
          );
        })}
      </div>

      <p className="mt-5 min-h-[48px] text-[15px] leading-6 text-ink/75" aria-live="polite">
        {messages[strikes]}
      </p>

      {strikes > 0 && (
        <button type="button" onClick={() => setStrikes(0)} className="mt-2 text-[13px] text-ink/50 underline hover:text-ink">
          Reset
        </button>
      )}
    </div>
  );
};

export default StrikeDemo;
