// frontend/src/components/ui/StartTestModal.tsx
// Modal: Customize questions, time, and proctoring mode before launching test.

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Shield, BookOpen, Clock, X, Camera, EyeOff,
  AlertTriangle, ChevronRight
} from 'lucide-react';
import HoloButton from './HoloButton';

type TestEnvironment = 'proctored' | 'normal';

interface StartTestModalProps {
  isOpen:         boolean;
  onClose:        () => void;
  onStart:        (config: StartTestConfig) => void;
  loading:        boolean;
  defaultCount?:  number;
  defaultTime?:   number; // in minutes
}

export interface StartTestConfig {
  questionCount:  number;
  timeMinutes:    number;
  environment:    TestEnvironment;
}

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 100;
const MIN_TIME      = 5;
const MAX_TIME      = 180;

const StartTestModal = ({
  isOpen, onClose, onStart, loading,
  defaultCount = 10,
  defaultTime,
}: StartTestModalProps) => {
  const [count,       setCount]       = useState(defaultCount);
  const [time,        setTime]        = useState(defaultTime ?? defaultCount * 2);
  const [environment, setEnvironment] = useState<TestEnvironment>('proctored');
  const [countInput,  setCountInput]  = useState(String(defaultCount));
  const [timeInput,   setTimeInput]   = useState(String(defaultTime ?? defaultCount * 2));

  // Sync sliders ↔ text inputs
  const handleCountChange = (val: number) => {
    const v = Math.max(MIN_QUESTIONS, Math.min(MAX_QUESTIONS, val));
    setCount(v); setCountInput(String(v));
    if (!defaultTime) { setTime(v * 2); setTimeInput(String(v * 2)); }
  };
  const handleTimeChange = (val: number) => {
    const v = Math.max(MIN_TIME, Math.min(MAX_TIME, val));
    setTime(v); setTimeInput(String(v));
  };

  // Reset on re-open
  useEffect(() => {
    if (isOpen) {
      handleCountChange(defaultCount);
    }
  }, [isOpen, defaultCount]);

  if (!isOpen) return null;

  const countPct = ((count - MIN_QUESTIONS) / (MAX_QUESTIONS - MIN_QUESTIONS)) * 100;
  const timePct  = ((time  - MIN_TIME)      / (MAX_TIME - MIN_TIME)) * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[90] bg-coal/50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[91] flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="start-test-title"
          className="w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto pointer-events-auto animate-fade-up bg-surface border border-line rounded-[16px] shadow-float"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-line">
            <div>
              <h2 id="start-test-title" className="font-display text-[22px] font-semibold tracking-tight text-ink">Start your test</h2>
              <p className="text-ink/60 text-[13px] mt-0.5">Set the length and time limit, then pick a mode.</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-ink/50 hover:text-ink hover:border-ink/30 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-6">

            {/* ── Question Count ─────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="start-count" className="flex items-center gap-2 text-[14px] font-medium text-ink">
                  <BookOpen size={15} className="text-ink/50" />
                  Questions
                </label>
                <input
                  id="start-count"
                  type="number"
                  min={MIN_QUESTIONS} max={MAX_QUESTIONS}
                  value={countInput}
                  onChange={e => { setCountInput(e.target.value); const n = parseInt(e.target.value); if (!isNaN(n)) handleCountChange(n); }}
                  onBlur={() => handleCountChange(parseInt(countInput) || MIN_QUESTIONS)}
                  className="cyber-input w-20 h-9 text-center font-mono font-medium text-[14px] tabular"
                />
              </div>
              {/* Slider */}
              <div className="relative h-1.5 bg-ink/10 rounded-full">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-brand transition-all duration-150"
                  style={{ width: `${countPct}%` }}
                />
                <input
                  type="range" min={MIN_QUESTIONS} max={MAX_QUESTIONS} value={count}
                  onChange={e => handleCountChange(Number(e.target.value))}
                  aria-label="Number of questions"
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                  style={{ accentColor: 'rgb(var(--brand))' }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface border-2 border-brand shadow-soft pointer-events-none transition-all"
                  style={{ left: `calc(${countPct}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[11px] text-ink/45 font-mono">{MIN_QUESTIONS}</span>
                <span className="text-[11px] text-ink/45 font-mono">{MAX_QUESTIONS}</span>
              </div>
            </div>

            {/* ── Time ──────────────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label htmlFor="start-time" className="flex items-center gap-2 text-[14px] font-medium text-ink">
                  <Clock size={15} className="text-ink/50" />
                  Time limit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="start-time"
                    type="number"
                    min={MIN_TIME} max={MAX_TIME}
                    value={timeInput}
                    onChange={e => { setTimeInput(e.target.value); const n = parseInt(e.target.value); if (!isNaN(n)) handleTimeChange(n); }}
                    onBlur={() => handleTimeChange(parseInt(timeInput) || MIN_TIME)}
                    className="cyber-input w-20 h-9 text-center font-mono font-medium text-[14px] tabular"
                  />
                  <span className="text-ink/55 text-[13px]">min</span>
                </div>
              </div>
              <div className="relative h-1.5 bg-ink/10 rounded-full">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-brand transition-all duration-150"
                  style={{ width: `${timePct}%` }}
                />
                <input
                  type="range" min={MIN_TIME} max={MAX_TIME} value={time}
                  onChange={e => handleTimeChange(Number(e.target.value))}
                  aria-label="Time limit in minutes"
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-surface border-2 border-brand shadow-soft pointer-events-none"
                  style={{ left: `calc(${timePct}% - 8px)` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[11px] text-ink/45 font-mono">{MIN_TIME}m</span>
                <span className="text-[11px] text-ink/45 font-mono">{MAX_TIME}m</span>
              </div>
            </div>

            {/* ── Environment Toggle ─────────────────────────── */}
            <div>
              <p className="text-[14px] font-medium text-ink mb-3 flex items-center gap-2">
                <Shield size={15} className="text-ink/50" />
                Mode
              </p>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Mode">
                {([
                  { value: 'proctored' as const, icon: Camera, title: 'Proctored', desc: 'Camera, fullscreen and tab monitoring' },
                  { value: 'normal'    as const, icon: EyeOff, title: 'Normal',    desc: 'No camera, no monitoring' },
                ]).map((opt) => {
                  const selected = environment === opt.value;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setEnvironment(opt.value)}
                      className={cn(
                        'flex flex-col p-4 rounded-[12px] border text-left transition-colors duration-150',
                        selected ? 'border-brand bg-brand/[0.05]' : 'border-line bg-surface hover:border-ink/30'
                      )}
                    >
                      <div className="w-full flex items-center justify-between mb-3">
                        <span className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          selected ? 'bg-brand/10 text-brand' : 'bg-raised border border-line text-ink/55'
                        )}>
                          <Icon size={16} />
                        </span>
                        <span className={cn(
                          'w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center',
                          selected ? 'border-brand bg-brand' : 'border-ink/30'
                        )}>
                          {selected && <span className="w-2 h-2 rounded-full bg-on-brand" />}
                        </span>
                      </div>
                      <p className="text-[14px] font-medium text-ink">{opt.title}</p>
                      <p className="text-ink/55 text-[12px] mt-0.5 leading-snug">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Proctored warnings */}
              {environment === 'proctored' && (
                <div className="mt-3 px-4 py-3 rounded-[10px] bg-warn/[0.07] border border-warn/30 animate-fade-in">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={14} className="text-warn flex-shrink-0 mt-0.5" />
                    <ul className="text-[13px] text-ink/75 space-y-1 leading-snug list-disc pl-4 marker:text-ink/35">
                      <li>You'll need to allow camera access, and your face must stay in the frame.</li>
                      <li>Switch tabs 3 times and the test submits itself.</li>
                      <li>Fullscreen is required. Pressing Esc counts as a warning.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* ── Summary ───────────────────────────────────── */}
            <dl className="grid grid-cols-3 border border-line rounded-[12px] divide-x divide-line">
              {[
                { label: 'Questions', value: count },
                { label: 'Minutes',   value: time },
                { label: 'Mode',      value: environment === 'proctored' ? 'Proctored' : 'Normal' },
              ].map(s => (
                <div key={s.label} className="text-center px-2 py-3">
                  <dd className={cn('text-ink leading-none tabular', typeof s.value === 'number' ? 'font-display text-[28px]' : 'font-mono text-[14px] font-bold uppercase pt-2')}>{s.value}</dd>
                  <dt className="label-caps mt-2">{s.label}</dt>
                </div>
              ))}
            </dl>

            {/* ── Actions ───────────────────────────────────── */}
            <div className="flex gap-3">
              <HoloButton variant="ghost" size="lg" onClick={onClose} className="flex-1">
                Cancel
              </HoloButton>
              <HoloButton
                variant="cyan"
                size="lg"
                loading={loading}
                onClick={() => onStart({ questionCount: count, timeMinutes: time, environment })}
                icon={<ChevronRight size={16} />}
                className="flex-[2]"
              >
                {environment === 'proctored' ? 'Start proctored test' : 'Start test'}
              </HoloButton>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default StartTestModal;
