// Layered, pointer-tilted "hologram" of the analytics dashboard.
// Mirrors the real Analysis page: skills radar, score trajectory,
// activity heatmap and the rule-based AI insight.

import { useRef, useState, type PointerEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Brain, Check, TrendingUp } from 'lucide-react';
import { CountUp, Reveal, SectionHead } from './primitives';

const RADAR = [
  { k: 'Percentages', v: 86 },
  { k: 'Time & Work', v: 54 },
  { k: 'Series', v: 92 },
  { k: 'Syllogisms', v: 71 },
  { k: 'Vocabulary', v: 78 },
];
const TREND = [52, 58, 55, 63, 61, 70, 68, 76, 81, 87];
const HEAT = [0.2, 0.5, 0.35, 0.8, 0.6, 0.95, 0.4, 0.7, 1, 0.55, 0.85, 0.9];

const radarPoint = (i: number, r: number, cx = 100, cy = 100) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / RADAR.length;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
};

const Radar = () => {
  const poly = RADAR.map((d, i) => radarPoint(i, (d.v / 100) * 70).join(',')).join(' ');
  return (
    <svg viewBox="0 0 200 200" width="100%" style={{ maxHeight: 190, overflow: 'visible' }} aria-hidden="true">
      <defs>
        <linearGradient id="nx-radar-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FF3DBB" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {[0.33, 0.66, 1].map((s) => (
        <polygon
          key={s}
          points={RADAR.map((_, i) => radarPoint(i, 70 * s).join(',')).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
        />
      ))}
      {RADAR.map((d, i) => {
        const [x, y] = radarPoint(i, 70);
        const [lx, ly] = radarPoint(i, 88);
        return (
          <g key={d.k}>
            <line x1="100" y1="100" x2={x} y2={y} stroke="rgba(255,255,255,0.07)" />
            <text x={lx} y={ly} fill="rgba(226,232,245,0.5)" fontSize="8.5" textAnchor="middle" dominantBaseline="middle" fontFamily="JetBrains Mono, monospace">
              {d.k}
            </text>
          </g>
        );
      })}
      <motion.polygon
        points={poly}
        fill="url(#nx-radar-fill)"
        stroke="#00F5FF"
        strokeWidth="1.5"
        style={{ filter: 'drop-shadow(0 0 6px rgba(0,245,255,0.7))', transformOrigin: '100px 100px', transformBox: 'view-box' }}
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1], delay: 0.2 }}
      />
      {RADAR.map((d, i) => {
        const [x, y] = radarPoint(i, (d.v / 100) * 70);
        return <circle key={d.k} cx={x} cy={y} r="2.6" fill="#fff" style={{ filter: 'drop-shadow(0 0 4px #00F5FF)' }} />;
      })}
    </svg>
  );
};

const Gauge = () => {
  const r = 52;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const value = 0.812;
  return (
    <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
      <svg viewBox="0 0 140 140" width="100%" style={{ maxHeight: 170, transform: 'rotate(135deg)' }} aria-hidden="true">
        <defs>
          <linearGradient id="nx-gauge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F5FF" />
            <stop offset="60%" stopColor="#A970FF" />
            <stop offset="100%" stopColor="#FF3DBB" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="url(#nx-gauge)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${c}`}
          initial={{ strokeDashoffset: arc }}
          whileInView={{ strokeDashoffset: arc * (1 - value) }}
          viewport={{ once: true }}
          transition={{ duration: 1.8, ease: [0.2, 0.8, 0.2, 1], delay: 0.3 }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(169,112,255,0.8))' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
          <CountUp to={812} duration={1800} />
        </div>
        <div className="nx-mono" style={{ fontSize: 9, color: 'rgba(226,232,245,0.45)', marginTop: 4 }}>
          / 1000
        </div>
      </div>
    </div>
  );
};

const Trend = () => {
  const W = 400;
  const H = 110;
  const pts = TREND.map((v, i) => [(i / (TREND.length - 1)) * W, H - ((v - 40) / 60) * H]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H + 6}`} width="100%" style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      <defs>
        <linearGradient id="nx-trend-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00F5FF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nx-trend-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#A970FF" />
          <stop offset="100%" stopColor="#00F5FF" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 5" />
      ))}
      <motion.path d={area} fill="url(#nx-trend-area)" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 1, duration: 1 }} />
      <motion.path
        d={line}
        fill="none"
        stroke="url(#nx-trend-line)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: 'easeInOut' }}
        style={{ filter: 'drop-shadow(0 0 5px rgba(0,245,255,0.8))' }}
      />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#fff" />
      <circle cx={last[0]} cy={last[1]} r="9" fill="none" stroke="#00F5FF" strokeOpacity="0.6">
        <animate attributeName="r" values="4;14;4" dur="2s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};

const HoloAnalytics = () => {
  const stageRef = useRef<HTMLDivElement>(null);
  // Flat on phones: the resting tilt skews a single-column card too much.
  const [flat] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [16, -2]), { stiffness: 110, damping: 18 });
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-20, 6]), { stiffness: 110, damping: 18 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <section className="nx-section" id="analytics">
      <div className="nx-container">
        <div className="nx-analytics">
          <div>
            <SectionHead
              compact
              eyebrow="Deep analytics"
              title={
                <>
                  See your mind in
                  <br />
                  <span className="nx-grad-text">high resolution.</span>
                </>
              }
              sub="Every answer becomes a data point. NEXUS turns your attempts into a living map of strengths, blind spots and momentum, then tells you what to fix next."
            />
            <Reveal delay={0.1}>
              <ul className="nx-check-list" style={{ marginTop: -24 }}>
                {[
                  'Skills radar and topic mastery across every domain',
                  'Score trajectory with moving averages',
                  'Activity heatmap that keeps you honest',
                  'AI insights that name your weakest topic',
                  'Full history with solution review per attempt',
                ].map((t) => (
                  <li key={t}>
                    <Check size={17} /> {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="nx-holo-stage" ref={stageRef} onPointerMove={onMove} onPointerLeave={onLeave}>
              <motion.div className="nx-holo" style={flat ? undefined : { rotateX, rotateY }}>
                <div className="nx-holo-layer" style={{ transform: 'translateZ(20px)' }}>
                  <div className="nx-holo-label" style={{ marginBottom: 16 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#00F5FF' }}>
                      <i className="nx-dot" style={{ background: '#00F5FF', boxShadow: '0 0 10px #00F5FF' }} /> performance matrix
                    </span>
                    <span>last 10 attempts</span>
                  </div>
                  <div className="nx-holo-grid">
                    <div className="nx-holo-card" style={{ transform: 'translateZ(30px)' }}>
                      <div className="nx-holo-label">
                        <span>skills radar</span>
                      </div>
                      <Radar />
                    </div>
                    <div className="nx-holo-card" style={{ transform: 'translateZ(30px)' }}>
                      <div className="nx-holo-label">
                        <span>neural index</span>
                        <span style={{ color: '#00FF94' }}>▲ 64</span>
                      </div>
                      <Gauge />
                    </div>
                    <div className="nx-holo-card span-2" style={{ transform: 'translateZ(40px)' }}>
                      <div className="nx-holo-label">
                        <span>score trajectory</span>
                        <span style={{ color: '#00F5FF' }}>87%</span>
                      </div>
                      <Trend />
                    </div>
                    <div className="nx-holo-card span-2" style={{ transform: 'translateZ(30px)' }}>
                      <div className="nx-holo-label">
                        <span>activity · last 12 days</span>
                        <span>tests / day</span>
                      </div>
                      <div className="nx-heatstrip">
                        {HEAT.map((v, i) => (
                          <motion.i
                            key={i}
                            initial={{ opacity: 0, scaleY: 0.2 }}
                            whileInView={{ opacity: 1, scaleY: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                            style={{
                              background: `linear-gradient(180deg, rgba(169,112,255,${0.2 + v * 0.7}), rgba(0,245,255,${0.1 + v * 0.6}))`,
                              boxShadow: v > 0.8 ? '0 0 12px rgba(169,112,255,0.6)' : 'none',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="nx-float-chip" style={{ transform: 'translateZ(90px)' }}>
                  <TrendingUp size={14} /> +18% accuracy this week
                </div>

                <div className="nx-insight" style={{ transform: 'translateZ(110px)' }}>
                  <div className="nx-mono" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#FF9BDB', marginBottom: 8, fontSize: 10 }}>
                    <Brain size={13} /> AI insight
                  </div>
                  📈 Your recent trend (81%) is above your average (68%). Focus on <b>Time &amp; Work</b> (54%). Strong in <b>Series</b> (92%).
                </div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default HoloAnalytics;
