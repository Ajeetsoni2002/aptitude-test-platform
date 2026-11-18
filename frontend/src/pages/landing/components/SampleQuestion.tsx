// Hero card: three real sample questions you can answer right on the page.
// Picking an option shades the OMR bubble; the examiner then marks it and
// shows the working, the same way the review screen does after a test.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SAMPLE_QUESTIONS } from '../data';
import { Bubble, ExaminerMark } from './primitives';

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
    <div className="lp-sheet lp-sheet--plain relative rounded-2xl border border-line shadow-float overflow-hidden">
      {/* Header strip, like the top of an answer booklet */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3 font-mono text-[12px] text-ink/60">
        <span>
          Q.{String(idx + 1).padStart(2, '0')} <span className="text-ink/35">/ 0{SAMPLE_QUESTIONS.length}</span>
          <span className="mx-2 text-ink/25">·</span>
          {q.section}
        </span>
        <span className={cn('tabular', !answered && !finished && 'text-ink')} aria-label="Time on this question">
          {fmt(seconds)}
        </span>
      </div>

      {finished ? (
        <div className="px-6 py-10 pl-[64px] min-h-[392px] flex flex-col justify-center">
          <p className="label-caps">Your sheet</p>
          <p className="mt-3 font-display text-[56px] leading-none font-medium text-ink lp-num">
            {score}
            <span className="text-ink/35">/{SAMPLE_QUESTIONS.length}</span>
          </p>
          <p className="mt-4 max-w-sm text-[15px] text-ink/65">
            {score === SAMPLE_QUESTIONS.length
              ? 'Clean sheet. The demo has ten more, against a ten-minute clock.'
              : 'That is roughly what a set feels like. The demo has ten more, against a ten-minute clock.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/demo" className="btn-holo-cyan inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm">
              Take the free demo <ArrowRight size={16} />
            </Link>
            <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-ink">
              <RotateCcw size={14} /> Start over
            </button>
          </div>
        </div>
      ) : (
        <div className="py-6 pr-5 pl-[64px] min-h-[392px]">
          <p className="text-[17px] leading-[1.6] text-ink" id="lp-q-text">
            {q.text}
          </p>

          <div role="radiogroup" aria-labelledby="lp-q-text" className="mt-5 space-y-1.5">
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
                    'group relative flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[15px] transition-colors',
                    !answered && 'hover:bg-ink/[0.04]',
                    answered && !isRight && !isChosen && 'opacity-55'
                  )}
                >
                  {(isRight || isWrong) && (
                    <span className="absolute -left-[46px] top-1/2 -translate-y-1/2">
                      <ExaminerMark kind={isRight ? 'tick' : 'cross'} />
                    </span>
                  )}
                  <Bubble letter={LETTERS[i]} filled={isChosen} />
                  <span className={cn('text-ink/85', isRight && 'text-ink font-medium')}>{opt}</span>
                </button>
              );
            })}
          </div>

          <div aria-live="polite">
            {answered && (
              <div className="mt-5 animate-fade-in">
                <p className="font-display italic text-[16px] leading-relaxed text-ink/80">
                  <span className="not-italic font-mono text-[11px] uppercase tracking-[0.08em] text-bad mr-2">
                    {chosen === q.answer ? 'Correct' : 'Not quite'}
                  </span>
                  {q.working}
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-mono text-[12px] text-ink/50">{q.topic} · {seconds}s</span>
                  <button
                    type="button"
                    onClick={next}
                    className="btn-ink inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px]"
                  >
                    {isLast ? 'See your sheet' : 'Next question'} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
            {!answered && (
              <p className="mt-6 font-mono text-[12px] text-ink/45">Shade one bubble.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SampleQuestion;
