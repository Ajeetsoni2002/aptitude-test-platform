// Proctoring showcase. When the visitor arms the demo, it listens for the
// same signals the real test page watches (tab switch, focus loss, copy,
// right-click, devtools shortcuts) and reacts live, 3 strikes → auto-submit.
// Listeners are attached only while armed AND the section is on screen.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Activity, Camera, Copy, Lock, MousePointerClick, Radio, RotateCcw, ShieldCheck, Siren, Stamp, TriangleAlert, User } from 'lucide-react';
import { Reveal, SectionHead, SpotlightCard } from './primitives';

type LogKind = 'info' | 'good' | 'bad' | 'warn';
interface LogEntry {
  id: number;
  time: string;
  text: string;
  kind: LogKind;
}

const MAX_STRIKES = 3;
const now = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

// ── Procedural face landmarks (68-point style) ───────────────────
type P = [number, number];
const ellipsePts = (cx: number, cy: number, rx: number, ry: number, from: number, to: number, n: number): P[] =>
  Array.from({ length: n }, (_, i) => {
    const t = from + ((to - from) * i) / (n - 1);
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
  });

const FACE = (() => {
  const jaw = ellipsePts(100, 112, 68, 96, Math.PI * 1.04, -Math.PI * 0.04, 17);
  const skull = ellipsePts(100, 112, 70, 104, Math.PI * 1.04, Math.PI * 1.96, 13);
  const browL = ellipsePts(70, 92, 20, 10, Math.PI * 1.1, Math.PI * 1.9, 5);
  const browR = ellipsePts(130, 92, 20, 10, Math.PI * 1.1, Math.PI * 1.9, 5);
  const eyeL = ellipsePts(72, 104, 13, 6, 0, Math.PI * 2, 7).slice(0, 6);
  const eyeR = ellipsePts(128, 104, 13, 6, 0, Math.PI * 2, 7).slice(0, 6);
  const bridge: P[] = [[100, 94], [100, 106], [100, 118], [100, 128]];
  const noseBase: P[] = [[86, 134], [93, 138], [100, 140], [107, 138], [114, 134]];
  const mouthOuter = ellipsePts(100, 166, 25, 10, 0, Math.PI * 2, 13).slice(0, 12);
  const mouthInner = ellipsePts(100, 166, 16, 4, 0, Math.PI * 2, 9).slice(0, 8);
  return { jaw, skull, browL, browR, eyeL, eyeR, bridge, noseBase, mouthOuter, mouthInner };
})();

const toPath = (pts: P[], close = false) => `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')}${close ? ' Z' : ''}`;

const FaceMesh = ({ alert }: { alert: boolean }) => {
  const stroke = alert ? '#FF3D6E' : '#00F5FF';
  const tip = FACE.bridge[3];
  const all = Object.values(FACE).flat();
  return (
    <svg viewBox="0 0 200 240" aria-hidden="true">
      <defs>
        <filter id="nx-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g stroke={stroke} fill="none" strokeLinecap="round" style={{ transition: 'stroke 0.3s' }}>
        {/* mesh fan */}
        <g strokeWidth="0.4" opacity="0.22">
          {FACE.jaw.map((p, i) => (
            <line key={`j${i}`} x1={p[0]} y1={p[1]} x2={tip[0]} y2={tip[1]} />
          ))}
          {FACE.skull.map((p, i) => {
            const b = i < 7 ? FACE.browL[Math.min(4, Math.floor(i * 0.7))] : FACE.browR[Math.min(4, Math.floor((i - 6) * 0.7))];
            return <line key={`s${i}`} x1={p[0]} y1={p[1]} x2={b[0]} y2={b[1]} />;
          })}
          {[...FACE.eyeL, ...FACE.eyeR].map((p, i) => (
            <line key={`e${i}`} x1={p[0]} y1={p[1]} x2={FACE.bridge[1][0]} y2={FACE.bridge[1][1]} />
          ))}
          {FACE.mouthOuter.map((p, i) => (
            <line key={`m${i}`} x1={p[0]} y1={p[1]} x2={FACE.noseBase[2][0]} y2={FACE.noseBase[2][1]} />
          ))}
        </g>
        {/* features */}
        <g strokeWidth="1.1" filter="url(#nx-glow)">
          <path d={toPath(FACE.jaw)} />
          <path d={toPath(FACE.skull)} strokeDasharray="2 4" opacity="0.6" />
          <path d={toPath(FACE.browL)} />
          <path d={toPath(FACE.browR)} />
          <path d={toPath(FACE.bridge)} />
          <path d={toPath(FACE.noseBase)} />
          <path className="nx-eye" d={toPath(FACE.eyeL, true)} />
          <path className="nx-eye" d={toPath(FACE.eyeR, true)} />
          <path d={toPath(FACE.mouthOuter, true)} />
          <path d={toPath(FACE.mouthInner, true)} opacity="0.7" />
        </g>
      </g>
      <g fill={alert ? '#FF8AA8' : '#BFFCFF'}>
        {all.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="1.5" />
        ))}
      </g>
      {/* iris */}
      <g fill={stroke}>
        <circle className="nx-eye" cx="72" cy="104" r="3" />
        <circle className="nx-eye" cx="128" cy="104" r="3" />
      </g>
    </svg>
  );
};

// ── Section ──────────────────────────────────────────────────────
const ProctorShield = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: '-15% 0px' });
  const [armed, setArmed] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const [flash, setFlash] = useState(false);
  const [focusLost, setFocusLost] = useState(false);
  const [flagged, setFlagged] = useState<number | null>(null);
  const [log, setLog] = useState<LogEntry[]>(() => [
    { id: 4, time: now(), text: 'watermark applied · candidate ID embedded', kind: 'info' },
    { id: 3, time: now(), text: 'fullscreen lock engaged', kind: 'good' },
    { id: 2, time: now(), text: 'camera verified · frames rendering', kind: 'good' },
    { id: 1, time: now(), text: 'secure session handshake ok', kind: 'info' },
  ]);

  const logId = useRef(10);
  const strikesRef = useRef(0);
  const hiddenAt = useRef(0);
  const flashTimer = useRef<number | undefined>(undefined);

  const submitted = strikes >= MAX_STRIKES;
  const active = armed && inView && !submitted;

  const push = useCallback((text: string, kind: LogKind) => {
    logId.current += 1;
    const entry = { id: logId.current, time: now(), text, kind };
    setLog((l) => [entry, ...l].slice(0, 7));
  }, []);

  const strike = useCallback(
    (reason: string) => {
      if (strikesRef.current >= MAX_STRIKES) return;
      strikesRef.current += 1;
      const n = strikesRef.current;
      setStrikes(n);
      push(`VIOLATION ${n}/${MAX_STRIKES} · ${reason}`, 'bad');
      if (n >= MAX_STRIKES) push('3 strikes reached · test auto-submitted', 'bad');
      setFlash(true);
      clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(false), 900);
    },
    [push],
  );

  const blocked = useCallback(
    (what: string) => {
      push(`${what} blocked`, 'warn');
      setFlash(true);
      clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(false), 450);
    },
    [push],
  );

  // real browser signals while armed
  useEffect(() => {
    if (!active) return;
    let blurTimer: number | undefined;

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        strike('tab switch detected');
      } else if (hiddenAt.current) {
        const secs = ((Date.now() - hiddenAt.current) / 1000).toFixed(1);
        push(`candidate returned after ${secs}s away`, 'info');
        hiddenAt.current = 0;
      }
    };
    const onBlur = () => {
      setFocusLost(true);
      blurTimer = window.setTimeout(() => {
        if (!document.hidden) strike('window focus lost');
      }, 250);
    };
    const onFocus = () => setFocusLost(false);
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      blocked('clipboard copy');
    };
    const onContext = (e: MouseEvent) => {
      e.preventDefault();
      blocked('right-click menu');
    };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const devtools = e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(k));
      const source = (e.ctrlKey || e.metaKey) && k === 'u';
      if (devtools || source) {
        e.preventDefault();
        blocked(devtools ? 'devtools shortcut' : 'view-source shortcut');
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('copy', onCopy);
    document.addEventListener('contextmenu', onContext);
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(blurTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('contextmenu', onContext);
      window.removeEventListener('keydown', onKey);
    };
  }, [active, strike, blocked, push]);

  // proctor grid: a random tile gets flagged now and then
  useEffect(() => {
    if (!inView) return;
    let off: number | undefined;
    const id = window.setInterval(() => {
      setFlagged(Math.floor(Math.random() * 6));
      off = window.setTimeout(() => setFlagged(null), 1800);
    }, 3600);
    return () => {
      clearInterval(id);
      clearTimeout(off);
    };
  }, [inView]);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const toggleArm = () => {
    if (submitted) return;
    const next = !armed;
    setArmed(next);
    push(next ? 'shield armed · demo is watching this tab' : 'shield disarmed', next ? 'warn' : 'info');
  };

  const reset = () => {
    strikesRef.current = 0;
    setStrikes(0);
    setArmed(false);
    setFocusLost(false);
    push('session reset · new attempt', 'good');
  };

  const alertOn = flash || submitted;

  const telemetry = useMemo(
    () => [
      { k: 'camera', v: 'verified', s: '' },
      { k: 'focus', v: focusLost && armed ? 'lost' : 'locked', s: focusLost && armed ? 'is-bad' : '' },
      { k: 'fullscreen', v: 'enforced', s: '' },
      { k: 'tab switches', v: `${strikes} / ${MAX_STRIKES}`, s: strikes >= MAX_STRIKES ? 'is-bad' : strikes > 0 ? 'is-warn' : '' },
      { k: 'clipboard', v: 'blocked', s: '' },
      { k: 'devtools', v: 'blocked', s: '' },
      { k: 'watermark', v: 'active', s: '' },
      { k: 'proctor link', v: 'live', s: '' },
    ],
    [focusLost, armed, strikes],
  );

  return (
    <section className="nx-section" id="shield" ref={sectionRef}>
      <div className="nx-container">
        <div className="nx-shield">
          {/* ── Left: copy + controls ─────────────────────────── */}
          <div>
            <SectionHead
              compact
              eyebrow="Proctor shield"
              title={
                <>
                  Cheating?
                  <br />
                  <span className="nx-grad-text">Not on our watch.</span>
                </>
              }
              sub="Every proctored session runs inside a ten-layer integrity shield, and admins can watch it live. Don't believe it? Arm the demo and try to cheat."
            />

            <Reveal delay={0.1}>
              <div className="nx-arm" style={{ marginTop: -24 }}>
                <button
                  type="button"
                  className={`nx-switch ${armed ? 'is-on' : ''}`}
                  onClick={toggleArm}
                  role="switch"
                  aria-checked={armed}
                  aria-label="Arm the proctoring demo"
                  disabled={submitted}
                >
                  <motion.span className="nx-switch-knob" animate={{ x: armed ? 30 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                </button>
                <div>
                  <div className="nx-mono" style={{ color: armed ? '#FF3D6E' : '#eef1f8', fontWeight: 600 }}>
                    {submitted ? 'Test auto-submitted' : armed ? 'Shield armed' : 'Arm the shield'}
                  </div>
                  <div style={{ fontSize: 13.5, color: 'rgba(226,232,245,0.6)', marginTop: 4 }}>
                    {submitted
                      ? 'Three strikes. On a real test, your answers would be submitted now.'
                      : armed
                        ? 'Go on: switch tabs, click another window, right-click or copy text. We will know.'
                        : 'Turn it on, then try the tricks people usually try. Nothing leaves your browser.'}
                  </div>
                </div>
              </div>

              <div className="nx-sim-btns">
                <button type="button" className="nx-sim-btn" disabled={!active} onClick={() => strike('tab switch detected')}>
                  <TriangleAlert size={14} /> Simulate tab switch
                </button>
                <button type="button" className="nx-sim-btn" disabled={!active} onClick={() => blocked('clipboard copy')}>
                  <Copy size={14} /> Copy attempt
                </button>
                <button type="button" className="nx-sim-btn" disabled={!active} onClick={() => blocked('right-click menu')}>
                  <MousePointerClick size={14} /> Right-click
                </button>
              </div>

              <div className="nx-log" aria-live="polite">
                <AnimatePresence initial={false}>
                  {log.map((l) => (
                    <motion.div
                      key={l.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={`nx-log-row ${l.kind === 'bad' ? 'is-bad' : l.kind === 'good' ? 'is-good' : ''}`}
                      style={l.kind === 'warn' ? { color: '#ffd27a' } : undefined}
                    >
                      <time>{l.time}</time>
                      <span>{l.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </Reveal>
          </div>

          {/* ── Right: HUD ────────────────────────────────────── */}
          <Reveal delay={0.15}>
            <div className={`nx-hud-panel ${alertOn ? 'is-alert' : ''}`}>
              <div className="nx-hud-grid">
                <div className="nx-cam">
                  <div className="nx-face">
                    <FaceMesh alert={alertOn} />
                  </div>
                  <div className="nx-track-box">
                    <span className="nx-track-tag">{alertOn ? 'VIOLATION' : 'CANDIDATE · IN FRAME'}</span>
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="nx-scanbar" />
                  <div className="nx-cam-label" style={{ top: 12 }}>
                    <span className="nx-rec">REC</span>
                    <span>CAM-01 · 720P</span>
                  </div>
                  <div className="nx-cam-label" style={{ bottom: 12 }}>
                    <span>ATTEMPT #A7F2</span>
                    <span style={{ color: alertOn ? '#FF3D6E' : '#00FF94' }}>{alertOn ? 'FLAGGED' : 'SECURE'}</span>
                  </div>
                </div>

                <div className="nx-telemetry">
                  <div className="nx-mono" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00F5FF', marginBottom: 6 }}>
                    <ShieldCheck size={14} /> integrity telemetry
                  </div>
                  {telemetry.map((t) => (
                    <div key={t.k} className={`nx-tele ${t.s}`}>
                      <span>{t.k}</span>
                      <b>{t.v}</b>
                    </div>
                  ))}
                </div>
              </div>

              <div className="nx-mono" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, color: 'rgba(226,232,245,0.45)' }}>
                <span>proctor view · 6 live</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Radio size={12} color="#00FF94" /> websocket
                </span>
              </div>
              <div className="nx-proctor-grid" style={{ marginTop: 10 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={`nx-pt ${flagged === i ? 'is-flag' : ''}`}>
                    <User size={26} strokeWidth={1.4} />
                    <span className="nx-pt-tag">
                      C-0{i + 1} {flagged === i ? 'FLAG' : 'OK'}
                    </span>
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {submitted && (
                  <motion.div className="nx-autosubmit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ padding: 24 }}>
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                        style={{ display: 'inline-flex', marginBottom: 16, filter: 'drop-shadow(0 0 20px #FF3D6E)' }}
                      >
                        <Siren size={54} color="#FF3D6E" />
                      </motion.div>
                      <div className="nx-mono" style={{ color: '#FF3D6E', fontSize: 12 }}>
                        3 / 3 strikes
                      </div>
                      <div style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.6rem)', fontWeight: 700, letterSpacing: '-0.04em', margin: '8px 0 6px' }}>
                        Test auto-submitted
                      </div>
                      <p style={{ color: 'rgba(255,220,228,0.75)', fontSize: 14.5, margin: '0 auto 22px', maxWidth: 360 }}>
                        That is exactly what happens on a real NEXUS proctored test.
                      </p>
                      <button type="button" className="nx-btn nx-btn-ghost nx-btn-sm" onClick={reset}>
                        <RotateCcw size={15} /> Reset demo
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>

        {/* ── Layers ─────────────────────────────────────────── */}
        <div className="nx-shield-feats">
          {[
            { icon: <Camera size={19} />, cls: 'nx-ico-cyan', t: 'Camera-verified start', d: 'No working camera, no proctored test. Checked before the first question appears.' },
            { icon: <Siren size={19} />, cls: 'nx-ico-magenta', t: '3-strike auto-submit', d: 'Tab switches and focus loss are counted. Strike three submits the test.' },
            { icon: <Radio size={19} />, cls: 'nx-ico-green', t: 'Live command center', d: 'Admins watch every active candidate in real time over WebSockets.' },
            { icon: <Lock size={19} />, cls: 'nx-ico-violet', t: 'Lockdown mode', d: 'Fullscreen enforced. DevTools, copy-paste, right-click and risky shortcuts blocked.' },
            { icon: <Stamp size={19} />, cls: 'nx-ico-amber', t: 'Identity watermark', d: "Every paper carries the candidate's identity, so leaked screenshots trace back." },
            { icon: <Activity size={19} />, cls: 'nx-ico-cyan', t: 'Violation timeline', d: 'Every incident is time-stamped and logged against the attempt for review.' },
          ].map((f, i) => (
            <Reveal key={f.t} delay={(i % 3) * 0.08}>
              <SpotlightCard className="nx-feat" style={{ height: '100%' }}>
                <span className={`nx-ico ${f.cls}`}>{f.icon}</span>
                <div>
                  <h4>{f.t}</h4>
                  <p>{f.d}</p>
                </div>
              </SpotlightCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProctorShield;
