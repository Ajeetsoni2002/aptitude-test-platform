// A live version of the tab-switch rule. It listens for the same
// visibilitychange event the real test uses, but nothing is recorded:
// it only counts in this tab.

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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
    <div className="rounded-xl bg-surface p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <p className="label-caps">Tab-switch strikes</p>
        {strikes > 0 && (
          <button type="button" onClick={() => setStrikes(0)} className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink/50 hover:text-ink">
            Reset
          </button>
        )}
      </div>

      <p className="mt-6 font-display text-[96px] leading-none text-ink tabular" aria-live="polite">
        <span className={strikes === MAX ? 'text-bad' : undefined}>{strikes}</span>
        <span className="text-ink/25">/{MAX}</span>
      </p>

      <div className="mt-6 flex gap-2" aria-hidden="true">
        {Array.from({ length: MAX }, (_, i) => (
          <span
            key={i}
            className={cn(
              'h-3 flex-1 rounded-full transition-colors duration-300',
              i < strikes ? (strikes === MAX ? 'bg-bad' : 'bg-ink') : 'bg-ink/12'
            )}
          />
        ))}
      </div>

      <p className="mt-6 min-h-[48px] text-[15px] leading-6 text-ink/70">{messages[strikes]}</p>
    </div>
  );
};

export default StrikeDemo;
