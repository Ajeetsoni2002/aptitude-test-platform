// Hero card: three real sample questions you can answer on the page.
// Options are menu rows; choosing one fills its dot, then the right row
// inverts and a wrong pick is marked in red, with the working below.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SAMPLE_QUESTIONS } from '../data';
import { Mark } from './primitives';

const LETTERS = ['A', 'B', 'C', 'D'];
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

const SampleQuestion = () => {
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = SAMPLE_QUESTIONS[idx];
  const answered = chosen !== null;
  const isLast = idx === SAMPLE_QUESTIONS.length - 1;

  useEffect(() => {
    if (answered || finished) return;
    const t = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [answered, finished, idx]);

  const choose = (i: number) => {
    if (answered) return;
    setChosen(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (isLast) {
      setFinished(true);
      return;
    }
    setIdx((i) => i + 1);
    setChosen(null);
    setSeconds(0);
  };

  const restart = () => {
    setIdx(0);
    setChosen(null);
    setSeconds(0);
    setScore(0);
    setFinished(false);
  };

  return (
    <div className="rounded-xl border border-line bg-canvas/80 p-1 backdrop-blur-sm">
      {/* Status strip */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 font-mono text-[12px] uppercase tracking-[0.06em] text-ink/55">
        <span>
          Q{String(idx + 1).padStart(2, '0')}/{String(SAMPLE_QUESTIONS.length).padStart(2, '0')} · {q.section}
        </span>
        <span className={cn('tabular', !answered && !finished && 'text-ink')} aria-label="Time on this question">
          {fmt(seconds)}
        </span>
      </div>

      {finished ? (
        <div className="rounded-lg bg-surface px-6 py-10 text-center min-h-[380px] flex flex-col items-center justify-center">
          <p className="label-caps">Your score</p>
          <p className="mt-3 font-display text-[88px] leading-none text-ink">
            {score}/{SAMPLE_QUESTIONS.length}
          </p>
          <p className="mt-5 max-w-sm text-[15px] text-ink/65">
            {score === SAMPLE_QUESTIONS.length
              ? 'Clean sheet. The demo has ten more against a ten-minute clock.'
              : 'That is roughly how a set feels. The demo has ten more against a ten-minute clock.'}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link to="/demo" className="btn-ink inline-flex h-11 items-center gap-2 rounded-full px-5 text-[13px]">
              Take the free demo <ArrowRight size={15} />
            </Link>
            <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.06em] text-ink/60 hover:text-ink">
              <RotateCcw size={13} /> Again
            </button>
          </div>
        </div>
      ) : (
        <div className="min-h-[380px]">
          <p className="rounded-lg bg-surface px-5 py-5 text-[17px] leading-[1.6] text-ink" id="lp-q-text">
            {q.text}
          </p>

          <div role="radiogroup" aria-labelledby="lp-q-text" className="mt-1">
            {q.options.map((opt, i) => {
              const isChosen = chosen === i;
              const isRight = answered && i === q.answer;
              const isWrong = answered && isChosen && i !== q.answer;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={isChosen}
                  disabled={answered}
                  onClick={() => choose(i)}
                  className={cn(
                    'lp-row !mt-1',
                    isRight && '!bg-ink !text-paper',
                    isWrong && '!outline-bad !text-bad',
                    answered && !isRight && !isWrong && 'opacity-45'
                  )}
                >
                  <span className="flex items-center gap-4">
                    <span className="w-4 opacity-50">{LETTERS[i]}</span>
                    <span>{opt}</span>
                  </span>
                  {isRight ? (
                    <Mark kind="tick" />
                  ) : isWrong ? (
                    <Mark kind="cross" />
                  ) : (
                    <span className={cn('lp-dot', isChosen && 'is-on')} />
                  )}
                </button>
              );
            })}
          </div>

          <div aria-live="polite" className="px-4 pb-3 pt-4">
            {answered ? (
              <div className="animate-fade-in">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em]">
                  <span className={chosen === q.answer ? 'text-ok' : 'text-bad'}>{chosen === q.answer ? 'Correct' : 'Not quite'}</span>
                  <span className="text-ink/45"> · {q.topic} · {seconds}s</span>
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/75">{q.working}</p>
                <div className="mt-4 flex justify-end">
                  <button type="button" onClick={next} className="btn-ink inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[12px]">
                    {isLast ? 'See score' : 'Next'} <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink/45">Pick one option</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleQuestion;
