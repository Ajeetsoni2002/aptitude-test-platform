// Feature grid. Every card carries a small live demo of the real feature.

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Award, Bot, Check, Flame, Layers, ListChecks, Send, Timer, Trophy } from 'lucide-react';
import { CountUp, Reveal, SectionHead, SpotlightCard } from './primitives';

// ── Card shell ───────────────────────────────────────────────────
const Card = ({
  className,
  icon,
  iconCls,
  chip,
  title,
  desc,
  children,
  delay = 0,
}: {
  className: string;
  icon: ReactNode;
  iconCls: string;
  chip?: string;
  title: string;
  desc: string;
  children: ReactNode;
  delay?: number;
}) => (
  <Reveal className={className} delay={delay}>
    <SpotlightCard className="nx-card" style={{ height: '100%' }}>
      <div className="nx-card-head">
        <div>
          <span className={`nx-ico ${iconCls}`}>{icon}</span>
          <h3 className="nx-card-title">{title}</h3>
          <p className="nx-card-desc">{desc}</p>
        </div>
        {chip && <span className="nx-chip">{chip}</span>}
      </div>
      {children}
    </SpotlightCard>
  </Reveal>
);

// ── AI tutor chat ────────────────────────────────────────────────
type Seg = { text: string; bold: boolean };
const toSegs = (s: string): Seg[] => s.split('**').map((text, i) => ({ text, bold: i % 2 === 1 }));

const CONVOS = [
  {
    q: 'How do I solve time & work problems fast?',
    a: "Use the **LCM method** ⚡\n1. LCM of the days = total work\n2. Divide to get each person's daily output\n3. Total work ÷ combined output = answer\n\nA = 15d, B = 20d, C = 30d → LCM 60 → 4 + 3 + 2 = 9/day → **6⅔ days**",
  },
  {
    q: 'Make me a 2-week plan for TCS NQT',
    a: '**Week 1** → quant core: percentages, ratios, time-speed-distance\n**Week 2** → logical + verbal sprints, two full-length mocks\n\nEvery day: 1 Problem of the Day + a 20-min drill on your weakest subtopic 🎯',
  },
  {
    q: 'Why does 3, 6, 11, 18, 27 continue with 38?',
    a: 'Look at the **gaps**: +3, +5, +7, +9\nThey grow by 2 each time, so the next gap is **+11**.\n27 + 11 = **38** ✅',
  },
].map((c) => ({ ...c, segs: toSegs(c.a), len: c.a.replace(/\*\*/g, '').length }));

const TutorDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-10% 0px' });
  const reduce = useReducedMotion();
  const [convo, setConvo] = useState(0);
  const [stage, setStage] = useState<'user' | 'thinking' | 'typing' | 'hold'>('user');
  const [chars, setChars] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const len = CONVOS[convo].len;
    let t: number | undefined;
    let iv: number | undefined;
    if (stage === 'user') t = window.setTimeout(() => setStage('thinking'), 700);
    else if (stage === 'thinking') t = window.setTimeout(() => setStage('typing'), 1100);
    else if (stage === 'typing') {
      iv = window.setInterval(() => setChars((n) => Math.min(len, n + 3)), 28);
      t = window.setTimeout(() => setStage('hold'), Math.ceil(len / 3) * 28 + 120);
    } else {
      t = window.setTimeout(() => {
        setChars(0);
        setConvo((v) => (v + 1) % CONVOS.length);
        setStage('user');
      }, 3800);
    }
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
  }, [stage, convo, inView, reduce]);

  const c = CONVOS[convo];
  // Reduced motion: show the finished conversation without typing.
  const shownStage = reduce ? 'hold' : stage;
  const shownChars = reduce || stage === 'hold' ? c.len : chars;
  const visible: Seg[] = [];
  for (let i = 0, left = shownChars; i < c.segs.length; i++) {
    const take = Math.max(0, Math.min(c.segs[i].text.length, left));
    left -= take;
    visible.push({ ...c.segs[i], text: c.segs[i].text.slice(0, take) });
  }

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div className="nx-chat">
        <div className="nx-chat-head">
          <span className="nx-chat-avatar">
            <Bot size={19} />
          </span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>NEXUS AI Tutor</div>
            <div className="nx-mono" style={{ fontSize: 9.5, color: '#00FF94', display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <i className="nx-dot" style={{ width: 5, height: 5 }} /> online<span className="nx-hide-sm"> · replies in seconds</span>
            </div>
          </div>
          <span className="nx-chip nx-hide-sm" style={{ marginLeft: 'auto' }}>context-aware</span>
        </div>
        <div className="nx-msg is-ai" style={{ opacity: 0.55 }}>
          Hey! I&apos;m your NEXUS tutor. Ask me anything about aptitude. 👋
        </div>
        <motion.div key={`q-${convo}`} className="nx-msg is-user" initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
          {c.q}
        </motion.div>
        {shownStage === 'thinking' && (
          <div className="nx-msg is-ai" aria-label="Tutor is typing">
            <span className="nx-typing">
              <i />
              <i />
              <i />
            </span>
          </div>
        )}
        {(shownStage === 'typing' || shownStage === 'hold') && (
          <div className="nx-msg is-ai">
            {visible.map((s, i) => (s.bold ? <b key={i}>{s.text}</b> : <span key={i}>{s.text}</span>))}
            {shownStage === 'typing' && <span className="nx-caret" />}
          </div>
        )}
      </div>
      <div className="nx-suggest" aria-hidden="true">
        {['2-week study plan', 'Explain permutations', 'Verbal ability strategy', 'Most asked TCS NQT topics'].map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
      <div className="nx-chat-input" aria-hidden="true">
        Ask about any topic, trick or strategy…
        <span className="nx-chat-send">
          <Send size={15} />
        </span>
      </div>
    </div>
  );
};

// ── Problem of the Day streak ────────────────────────────────────
const HEAT = Array.from({ length: 30 }, (_, i) => {
  const v = (Math.sin(i * 1.7) + Math.cos(i * 0.6) + 2) / 4;
  return i > 25 ? 1 : v;
});

const StreakDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <motion.span
          animate={{ scale: [1, 1.12, 1], rotate: [-3, 3, -3] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ display: 'inline-flex', filter: 'drop-shadow(0 0 14px rgba(255,184,0,0.8))' }}
        >
          <Flame size={40} color="#FFB800" fill="rgba(255,120,0,0.35)" />
        </motion.span>
        <div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1, color: '#FFB800' }}>
            <CountUp to={27} duration={1800} />
          </div>
          <span className="nx-mono" style={{ color: 'rgba(226,232,245,0.45)' }}>
            day streak
          </span>
        </div>
      </div>
      <div className="nx-heat">
        {HEAT.map((v, i) => (
          <i
            key={i}
            style={
              inView
                ? {
                    background: `rgba(255,184,0,${0.12 + v * 0.75})`,
                    boxShadow: v > 0.7 ? '0 0 10px rgba(255,184,0,0.55)' : 'none',
                    transitionDelay: `${i * 35}ms`,
                  }
                : { transitionDelay: `${i * 35}ms` }
            }
          />
        ))}
      </div>
    </div>
  );
};

// ── Adaptive test builder ────────────────────────────────────────
const BUILDS = [
  { domain: 0, subs: ['Percentages', 'Time & Work', 'Profit & Loss'], on: [0, 1], diff: 2, count: 20 },
  { domain: 1, subs: ['Number Series', 'Syllogisms', 'Coding-Decoding'], on: [0, 2], diff: 1, count: 15 },
  { domain: 2, subs: ['Synonyms', 'Grammar', 'Reading Comp.'], on: [1, 2], diff: 3, count: 25 },
];
const DOMAINS = ['Quant', 'Logical', 'Verbal'];
const DIFFS = ['Easy', 'Medium', 'Hard', 'Mixed'];

const BuilderDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-10% 0px' });
  const [k, setK] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => setK((v) => (v + 1) % BUILDS.length), 2600);
    return () => clearInterval(id);
  }, [inView]);
  const b = BUILDS[k];
  return (
    <div ref={ref} style={{ display: 'grid', gap: 12, marginTop: 'auto' }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {DOMAINS.map((d, i) => (
          <span key={d} className={`nx-topic-chip ${i === b.domain ? 'is-on' : ''}`}>
            {d}
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {b.subs.map((s, i) => (
          <motion.span
            key={s}
            className={`nx-topic-chip ${b.on.includes(i) ? 'is-on' : ''}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            style={{ fontSize: 11.5 }}
          >
            {s}
          </motion.span>
        ))}
      </div>
      <div className="nx-seg">
        {DIFFS.map((d, i) => (
          <button key={d} type="button" tabIndex={-1} className={i === b.diff ? 'is-on' : ''}>
            {i === b.diff && (
              <motion.span layoutId="nx-diff-pill" className="nx-seg-pill" style={{ left: 0, right: 0 }} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
            )}
            <span style={{ position: 'relative' }}>{d}</span>
          </button>
        ))}
      </div>
      <div className="nx-mono" style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(226,232,245,0.5)', letterSpacing: '0.1em' }}>
        <span>{b.count} questions</span>
        <span style={{ color: '#00F5FF' }}>⏱ {b.count * 2} min</span>
      </div>
    </div>
  );
};

// ── Leaderboard climb ────────────────────────────────────────────
const PLAYERS = [
  { id: 'a', name: 'Aarav S.', score: 948, color: '#FFB800' },
  { id: 'b', name: 'Diya K.', score: 921, color: '#A970FF' },
  { id: 'c', name: 'Kabir M.', score: 897, color: '#FF3DBB' },
  { id: 'd', name: 'Meera P.', score: 874, color: '#00FF94' },
];

const BoardDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-10% 0px' });
  const [pos, setPos] = useState(4);
  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => setPos((p) => (p === -1 ? 4 : p - 1)), 1700);
    return () => clearInterval(id);
  }, [inView]);
  const yourRank = Math.max(0, pos);
  const yourScore = [962, 935, 910, 886, 851][yourRank];
  const rows = [...PLAYERS.map((p) => ({ ...p, you: false }))];
  rows.splice(yourRank, 0, { id: 'you', name: 'You', score: yourScore, color: '#00F5FF', you: true });

  return (
    <div ref={ref} className="nx-board">
      {rows.map((r, i) => (
        <motion.div key={r.id} layout transition={{ type: 'spring', stiffness: 380, damping: 32 }} className={`nx-board-row ${r.you ? 'is-you' : ''}`}>
          <span className="nx-mono" style={{ letterSpacing: 0, color: i === 0 ? '#FFB800' : 'rgba(226,232,245,0.45)' }}>
            #{i + 1}
          </span>
          <span className="nx-avatar" style={{ background: r.color }}>
            {r.name[0]}
          </span>
          <span style={{ fontWeight: r.you ? 600 : 400, color: r.you ? '#fff' : 'rgba(226,232,245,0.75)' }}>
            {r.name} {r.you && i === 0 && '👑'}
          </span>
          <span className="nx-mono" style={{ letterSpacing: '0.04em', color: r.you ? '#00F5FF' : 'rgba(226,232,245,0.6)' }}>
            {r.score}
          </span>
        </motion.div>
      ))}
    </div>
  );
};

// ── Holographic certificate ──────────────────────────────────────
const CertDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${(x - 0.5) * 22}deg`);
    el.style.setProperty('--rx', `${(0.5 - y) * 18}deg`);
    el.style.setProperty('--px', `${x * 100}%`);
    el.style.setProperty('--py', `${y * 100}%`);
  };
  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--px', '50%');
    el.style.setProperty('--py', '50%');
  };
  return (
    <div className="nx-cert-stage">
      <div ref={ref} className="nx-cert" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 800, letterSpacing: '0.2em', fontSize: 12 }}>NEXUS</div>
            <div className="nx-mono" style={{ fontSize: 9, marginTop: 6, color: 'rgba(255,255,255,0.7)' }}>
              Excellence certificate
            </div>
          </div>
          <span className="nx-cert-seal">
            <Award size={22} />
          </span>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Your Name Here</div>
          <div className="nx-mono" style={{ fontSize: 9.5, marginTop: 6, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.12em' }}>
            Quantitative Aptitude · score 92%
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Step-by-step solution ────────────────────────────────────────
const STEPS = ['Let cost price = ₹100', 'Marked price = 100 + 40% = ₹140', 'Selling price = 140 × 0.75 = ₹105', 'Profit = 105 − 100 = 5% ✓'];

const StepsDemo = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-10% 0px' });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => setN((v) => (v >= STEPS.length + 2 ? 0 : v + 1)), 900);
    return () => clearInterval(id);
  }, [inView]);
  return (
    <div ref={ref} className="nx-steps">
      <div style={{ fontSize: 14, color: 'rgba(238,241,248,0.9)', marginBottom: 4 }}>
        Marked up 40%, sold at 25% off. Profit or loss?
      </div>
      {STEPS.map((s, i) => {
        const on = i < n;
        const last = i === STEPS.length - 1;
        return (
          <motion.div
            key={s}
            className="nx-step"
            animate={{ opacity: on ? 1 : 0.25, x: on ? 0 : -6 }}
            transition={{ duration: 0.35 }}
            style={on && last ? { boxShadow: '0 0 0 1px rgba(0,255,148,0.55) inset', color: '#7dffc4' } : undefined}
          >
            <span
              className="nx-step-num"
              style={{
                background: on ? (last ? 'rgba(0,255,148,0.15)' : 'rgba(0,245,255,0.12)') : 'rgba(255,255,255,0.05)',
                color: on ? (last ? '#00FF94' : '#00F5FF') : 'rgba(255,255,255,0.3)',
              }}
            >
              {on ? <Check size={13} /> : i + 1}
            </span>
            {s}
          </motion.div>
        );
      })}
    </div>
  );
};

// ── Full-length mock: question palette + sectional timeline ──────
const PALETTE = Array.from({ length: 20 }, (_, i) => (i === 13 ? 'is-cur' : [4, 9, 16].includes(i) ? 'is-mark' : i < 13 && i !== 7 ? 'is-ans' : ''));

const MockClock = () => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: '-10% 0px' });
  const [secs, setSecs] = useState(90 * 60 - 1);
  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => setSecs((s) => (s <= 0 ? 90 * 60 - 1 : s - 1)), 1000);
    return () => clearInterval(id);
  }, [inView]);
  const hh = String(Math.floor(secs / 3600)).padStart(2, '0');
  const mm = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return (
    <span ref={ref} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 26, fontWeight: 600, letterSpacing: '0.04em', color: '#eef1f8' }}>
      {hh}:{mm}
      <span style={{ color: '#00F5FF' }}>:{ss}</span>
    </span>
  );
};

const MockDemo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 'auto' }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div className="nx-mono" style={{ fontSize: 9.5, color: 'rgba(226,232,245,0.45)', marginBottom: 4 }}>
          time remaining
        </div>
        <MockClock />
      </div>
      <div className="nx-legend">
        <span style={{ ['--c' as string]: '#00FF94' }}>answered</span>
        <span style={{ ['--c' as string]: '#A970FF' }}>review</span>
        <span style={{ ['--c' as string]: '#00F5FF' }}>current</span>
      </div>
    </div>
    <div className="nx-palette" aria-hidden="true">
      {PALETTE.map((c, i) => (
        <i key={i} className={c}>
          {i + 1}
        </i>
      ))}
    </div>
    <div className="nx-mono" style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(226,232,245,0.5)', letterSpacing: '0.1em' }}>
      <span>Sectional timer · auto-advance</span>
      <span style={{ color: '#00FF94' }}>● proctored</span>
    </div>
    <div className="nx-mock-track">
      {[
        { l: 'Quantitative', m: 40, c: '0,245,255' },
        { l: 'Logical', m: 30, c: '169,112,255' },
        { l: 'Verbal', m: 20, c: '255,61,187' },
      ].map((s) => (
        <div
          key={s.l}
          className="nx-mock-seg"
          style={{ flex: s.m, background: `linear-gradient(135deg, rgba(${s.c},0.22), rgba(${s.c},0.06))`, boxShadow: `0 0 0 1px rgba(${s.c},0.45) inset` }}
        >
          <b>{s.l}</b>
          <span>{s.m} min</span>
        </div>
      ))}
      <span className="nx-playhead" />
    </div>
  </div>
);

// ── Section ──────────────────────────────────────────────────────
const FeatureBento = () => (
  <section className="nx-section" id="features">
    <div className="nx-container">
      <SectionHead
        eyebrow="The arsenal"
        title={
          <>
            Everything your prep
            <br />
            was <span className="nx-grad-text">missing.</span>
          </>
        }
        sub="Not another question bank. A complete training system that teaches, tests, tracks and pushes you, from your first question to your final mock."
      />

      <div className="nx-bento">
        <Card
          className="nx-b-tutor"
          icon={<Bot size={20} />}
          iconCls="nx-ico-cyan"
          chip="AI · 24/7"
          title="An AI tutor that never sleeps"
          desc="Step-by-step solutions, shortcut tricks, study plans built around your weak areas, and exam strategy for TCS, Infosys and campus drives."
        >
          <TutorDemo />
        </Card>

        <Card className="nx-b-streak" icon={<Flame size={20} />} iconCls="nx-ico-amber" title="Problem of the Day" desc="One sharp problem every day. Keep the streak alive." delay={0.05}>
          <StreakDemo />
        </Card>

        <Card className="nx-b-builder" icon={<Layers size={20} />} iconCls="nx-ico-violet" title="Build any test" desc="Pick a domain, drill into subtopics, choose a difficulty." delay={0.1}>
          <BuilderDemo />
        </Card>

        <Card className="nx-b-board" icon={<Trophy size={20} />} iconCls="nx-ico-magenta" chip="Live" title="Global leaderboard" desc="Every attempt moves you. Watch yourself climb.">
          <BoardDemo />
        </Card>

        <Card className="nx-b-cert" icon={<Award size={20} />} iconCls="nx-ico-amber" title="Certificates worth flexing" desc="Score 80% or more and earn an excellence certificate. Hover it." delay={0.05}>
          <CertDemo />
        </Card>

        <Card className="nx-b-steps" icon={<ListChecks size={20} />} iconCls="nx-ico-green" title="Solution review" desc="Revisit every attempt with a worked solution for each question.">
          <StepsDemo />
        </Card>

        <Card className="nx-b-mock" icon={<Timer size={20} />} iconCls="nx-ico-cyan" title="Full-length mocks" desc="Multi-section papers that feel exactly like exam day." delay={0.05}>
          <MockDemo />
        </Card>
      </div>
    </div>
  </section>
);

export default FeatureBento;
