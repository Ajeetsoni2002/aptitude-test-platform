// Interactive, signup-free mini assessment that ends in a generative
// "neural signature" the visitor can download.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Brain, CircleCheck, CircleX, Download, Gauge, RotateCcw, Sparkles, Target, Timer } from 'lucide-react';
import { DOMAIN_META, SCAN_DURATION_S, SCAN_PER_DOMAIN, SCAN_POOL, type Domain, type ScanQuestion } from '../data';
import { computeResult, downloadSignatureCard, drawSignatureRange, signaturePoints, type ScanAnswer, type ScanResult } from './signature';
import { SectionHead } from './primitives';

type Phase = 'idle' | 'running' | 'result';

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const pickQuestions = () => {
  const take = (d: Domain) => shuffle(SCAN_POOL.filter((q) => q.domain === d)).slice(0, SCAN_PER_DOMAIN);
  return shuffle([...take('quant'), ...take('logic'), ...take('verbal')]);
};

const TOTAL_MS = SCAN_DURATION_S * 1000;

// ── Countdown ring ───────────────────────────────────────────────
const TimerRing = ({ remaining }: { remaining: number }) => {
  const r = 32;
  const c = 2 * Math.PI * r;
  const p = remaining / TOTAL_MS;
  const danger = remaining < 15000;
  const color = danger ? '#FF3D6E' : '#00F5FF';
  return (
    <div className="nx-timer" role="timer" aria-label={`${Math.ceil(remaining / 1000)} seconds left`}>
      <svg width="74" height="74" viewBox="0 0 74 74">
        <circle cx="37" cy="37" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="37"
          cy="37"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
        />
      </svg>
      <b style={{ color: danger ? '#FF3D6E' : '#eef1f8' }}>{Math.ceil(remaining / 1000)}</b>
    </div>
  );
};

// ── Animated signature canvas ────────────────────────────────────
const SignatureCanvas = ({ result }: { result: ScanResult }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const pts = signaturePoints(result);
    const count = pts.length / 2;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const radius = rect.width * 0.38;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
      drawSignatureRange(ctx, pts, 1, count, cx, cy, radius, 0.9);
      return;
    }

    const DURATION = 2800;
    const start = performance.now();
    let drawn = 1;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - p, 2.2);
      const target = Math.floor(eased * count);
      drawSignatureRange(ctx, pts, drawn, target, cx, cy, radius, 0.9);
      drawn = Math.max(drawn, target);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result]);

  return <canvas ref={ref} aria-label={`Neural signature ${result.hash}`} role="img" />;
};

// ── Main section ─────────────────────────────────────────────────
const NeuralScan = ({ isAuthed }: { isAuthed: boolean }) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [questions, setQuestions] = useState<ScanQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<ScanAnswer[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(TOTAL_MS);
  const [result, setResult] = useState<ScanResult | null>(null);

  const phaseRef = useRef<Phase>('idle');
  const answersRef = useRef<ScanAnswer[]>([]);
  const questionsRef = useRef<ScanQuestion[]>([]);
  const qStart = useRef(0);
  const scanStart = useRef(0);
  const feedbackTimer = useRef<number | undefined>(undefined);

  const finish = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    phaseRef.current = 'result';
    clearTimeout(feedbackTimer.current);
    setResult(computeResult(answersRef.current, questionsRef.current));
    setPhase('result');
  }, []);

  const start = useCallback(() => {
    clearTimeout(feedbackTimer.current);
    const qs = pickQuestions();
    questionsRef.current = qs;
    answersRef.current = [];
    setQuestions(qs);
    setAnswers([]);
    setIdx(0);
    setPicked(null);
    setResult(null);
    setRemaining(TOTAL_MS);
    qStart.current = scanStart.current = performance.now();
    phaseRef.current = 'running';
    setPhase('running');
  }, []);

  const answer = useCallback(
    (choice: number) => {
      if (phaseRef.current !== 'running' || picked !== null) return;
      const q = questionsRef.current[idx];
      if (!q) return;
      const entry: ScanAnswer = { id: q.id, domain: q.domain, correct: choice === q.answer, ms: performance.now() - qStart.current, choice };
      const next = [...answersRef.current, entry];
      answersRef.current = next;
      setAnswers(next);
      setPicked(choice);
      feedbackTimer.current = window.setTimeout(() => {
        if (idx + 1 >= questionsRef.current.length) {
          finish();
        } else {
          setIdx(idx + 1);
          setPicked(null);
          qStart.current = performance.now();
        }
      }, 1250);
    },
    [idx, picked, finish],
  );

  // global countdown
  useEffect(() => {
    if (phase !== 'running') return;
    const id = window.setInterval(() => {
      const rem = Math.max(0, TOTAL_MS - (performance.now() - scanStart.current));
      setRemaining(rem);
      if (rem <= 0) finish();
    }, 100);
    return () => clearInterval(id);
  }, [phase, finish]);

  // keyboard: 1-4 or A-D
  useEffect(() => {
    if (phase !== 'running') return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const map: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
      if (k in map) {
        e.preventDefault();
        answer(map[k]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, answer]);

  useEffect(() => () => clearTimeout(feedbackTimer.current), []);

  const q = questions[idx];
  const statusText = phase === 'idle' ? 'standby' : phase === 'running' ? 'scanning…' : 'scan complete';

  return (
    <section className="nx-section" id="scan">
      <div className="nx-container">
        <SectionHead
          eyebrow="Live demo · no signup"
          title={
            <>
              Don&apos;t take our word for it.
              <br />
              <span className="nx-grad-text">Take a scan.</span>
            </>
          }
          sub="Six questions, ninety seconds. We map your speed, accuracy and domain balance into a neural signature that is unique to you."
        />

        <div className="nx-scan-shell">
          <div className="nx-scan">
            <div className="nx-scan-grid" />
            <div className="nx-scan-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span className="nx-scan-lights" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="nx-hide-sm">nexus://neural-scan</span>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: phase === 'running' ? '#00F5FF' : undefined }}>
                <i className="nx-dot" style={phase === 'running' ? { background: '#00F5FF', boxShadow: '0 0 10px #00F5FF' } : undefined} />
                {statusText}
              </span>
            </div>

            <div className="nx-scan-body">
              <AnimatePresence mode="wait">
                {/* ── IDLE ─────────────────────────────────────────── */}
                {phase === 'idle' && (
                  <motion.div
                    key="idle"
                    className="nx-scan-idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.97, filter: 'blur(8px)' }}
                    transition={{ duration: 0.45 }}
                  >
                    <div>
                      <span className="nx-mono" style={{ color: 'rgba(226,232,245,0.45)' }}>
                        What the scan measures
                      </span>
                      <ul className="nx-measure-list">
                        {[
                          { icon: <Gauge size={18} />, cls: 'nx-ico-cyan', t: 'Processing speed', d: 'how fast you lock onto an answer' },
                          { icon: <Target size={18} />, cls: 'nx-ico-violet', t: 'Accuracy under pressure', d: 'what holds while the clock runs' },
                          { icon: <Brain size={18} />, cls: 'nx-ico-magenta', t: 'Domain balance', d: 'quant vs logic vs verbal' },
                          { icon: <Sparkles size={18} />, cls: 'nx-ico-amber', t: 'Neural signature', d: 'generative art drawn from your answers' },
                        ].map((m) => (
                          <li key={m.t}>
                            <span className={`nx-measure-ico ${m.cls}`}>{m.icon}</span>
                            <span>
                              <b>{m.t}</b> · {m.d}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="nx-scan-orb-wrap">
                      <span className="nx-orb-ring r2" />
                      <span className="nx-orb-ring r1" />
                      <span className="nx-orb-ring r3" />
                      <span className="nx-orb-ring r4" />
                      <button type="button" className="nx-scan-orb" onClick={start} aria-label="Start the neural scan">
                        <span>
                          <Brain size={34} strokeWidth={1.8} />
                          START SCAN
                        </span>
                      </button>
                      <div className="nx-mono" style={{ position: 'absolute', bottom: 0, color: 'rgba(226,232,245,0.45)', textAlign: 'center' }}>
                        6 questions · 90 seconds · keys 1–4
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── RUNNING ──────────────────────────────────────── */}
                {phase === 'running' && q && (
                  <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: 'blur(8px)' }}>
                    <div className="nx-q-head">
                      <div>
                        <div className="nx-mono" style={{ color: DOMAIN_META[q.domain].color }}>
                          Question {String(idx + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')} · {DOMAIN_META[q.domain].label}
                        </div>
                        <div className="nx-q-progress" aria-hidden="true">
                          {questions.map((qq, i) => {
                            const a = answers.find((x) => x.id === qq.id);
                            const cls = a ? (a.correct ? 'is-done-ok' : 'is-done-bad') : i === idx ? 'is-current' : '';
                            return <i key={qq.id} className={cls} />;
                          })}
                        </div>
                      </div>
                      <TimerRing remaining={remaining} />
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                      >
                        <h3 className="nx-q-text">{q.q}</h3>
                        <div className="nx-q-options">
                          {q.options.map((opt, i) => {
                            let cls = '';
                            if (picked !== null) {
                              if (i === q.answer) cls = 'is-correct';
                              else if (i === picked) cls = 'is-wrong';
                              else cls = 'is-dim';
                            }
                            return (
                              <button key={opt} type="button" className={`nx-q-opt ${cls}`} disabled={picked !== null} onClick={() => answer(i)}>
                                <span className="nx-q-key">{i + 1}</span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        <div style={{ minHeight: 46 }}>
                          {picked !== null && (
                            <motion.div className="nx-q-why" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                              {picked === q.answer ? <CircleCheck size={18} color="#00FF94" /> : <CircleX size={18} color="#FF3D6E" />}
                              {q.why}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* ── RESULT ───────────────────────────────────────── */}
                {phase === 'result' && result && (
                  <motion.div
                    key="result"
                    className="nx-result"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <div className="nx-sig-frame">
                      <SignatureCanvas result={result} />
                      <div className="nx-sig-label" style={{ top: 14 }}>
                        <span>neural signature</span>
                        <span>SIG·{result.hash}</span>
                      </div>
                      <div className="nx-sig-label" style={{ bottom: 14 }}>
                        <span>
                          {result.answered}/{result.total} answered
                        </span>
                        <span>unique to you</span>
                      </div>
                    </div>

                    <div>
                      <span className="nx-eyebrow" style={{ color: result.archetype.color }}>
                        Scan complete · your archetype
                      </span>
                      <h3 className="nx-archetype" style={{ color: result.archetype.color, textShadow: `0 0 40px ${result.archetype.color}55` }}>
                        {result.archetype.name}
                      </h3>
                      <p className="nx-body-text" style={{ fontSize: 16, margin: 0, maxWidth: 520 }}>
                        {result.archetype.blurb}
                      </p>

                      <div className="nx-metrics">
                        <div className="nx-metric">
                          <b>{Math.round(result.accuracy * 100)}%</b>
                          <span>accuracy</span>
                        </div>
                        <div className="nx-metric">
                          <b>{result.answered ? `${(result.avgMs / 1000).toFixed(1)}s` : '—'}</b>
                          <span>avg / question</span>
                        </div>
                        <div className="nx-metric">
                          <b className="nx-grad-text">{result.index}</b>
                          <span>neural index</span>
                        </div>
                      </div>

                      <div className="nx-domain-bars">
                        {(Object.keys(DOMAIN_META) as Domain[]).map((d, i) => (
                          <div key={d} className="nx-domain-bar">
                            <span>{DOMAIN_META[d].label}</span>
                            <div className="nx-domain-track">
                              <motion.div
                                className="nx-domain-fill"
                                style={{ background: DOMAIN_META[d].color, boxShadow: `0 0 12px ${DOMAIN_META[d].color}` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${result.domain[d]}%` }}
                                transition={{ delay: 0.4 + i * 0.15, duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
                              />
                            </div>
                            <span className="nx-mono" style={{ fontSize: 11, letterSpacing: '0.05em', textAlign: 'right' }}>
                              {result.domain[d]}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="nx-result-ctas">
                        <Link to={isAuthed ? '/test-setup' : '/register'} className="nx-btn nx-btn-primary">
                          {isAuthed ? 'Start a full test' : 'Unlock full analysis'}
                          <ArrowRight size={17} className="nx-btn-arrow" />
                        </Link>
                        <button type="button" className="nx-btn nx-btn-ghost" onClick={() => downloadSignatureCard(result)}>
                          <Download size={16} /> Save signature
                        </button>
                        <button type="button" className="nx-btn nx-btn-ghost" onClick={start} aria-label="Retake the scan">
                          <RotateCcw size={16} />
                        </button>
                      </div>
                      <p className="nx-mono" style={{ marginTop: 18, color: 'rgba(226,232,245,0.35)', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '0.1em' }}>
                        <Timer size={12} /> Demo estimate from a 6-question sample, not a graded result.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NeuralScan;
