import { useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import NeuralCore from './NeuralCore';
import { CORE_SHAPE_LABELS } from './coreShapes';
import { DecodeText, ScrambleWords } from './primitives';
import { scrollToId } from '../data';

const WORDS = ['the clock.', 'every pattern.', 'the cutoff.', 'the exam.', 'your limits.'] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 34, filter: 'blur(12px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1, ease: [0.2, 0.8, 0.2, 1] } },
};

const Corner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const style: CSSProperties = {
    tl: { left: -1, top: -1, borderWidth: '1px 0 0 1px' },
    tr: { right: -1, top: -1, borderWidth: '1px 1px 0 0' },
    bl: { left: -1, bottom: -1, borderWidth: '0 0 1px 1px' },
    br: { right: -1, bottom: -1, borderWidth: '0 1px 1px 0' },
  }[pos];
  return <i className="nx-hud-corner" style={style} />;
};

const Hero = ({ ready, isAuthed }: { ready: boolean; isAuthed: boolean }) => {
  const [shape, setShape] = useState(0);

  return (
    <section className="nx-hero" id="top">
      <div className="nx-hero-glow" style={{ width: 760, height: 760, right: '-12%', top: '0%', background: 'radial-gradient(circle, rgba(124,92,255,0.2), transparent 65%)' }} />
      <div className="nx-hero-glow" style={{ width: 620, height: 620, left: '-14%', bottom: '-10%', background: 'radial-gradient(circle, rgba(0,245,255,0.12), transparent 65%)' }} />
      <div className="nx-floor" aria-hidden="true">
        <div className="nx-floor-plane" />
      </div>

      <NeuralCore className="nx-hero-canvas" ready={ready} onShapeChange={setShape} />

      {/* ── HUD read-outs around the core (desktop only) ───────── */}
      <motion.div
        className="nx-hud"
        style={{ right: '3%', top: '13%' }}
        initial={{ opacity: 0, x: 20 }}
        animate={ready ? { opacity: 1, x: 0 } : {}}
        transition={{ delay: 1.1, duration: 0.8 }}
        aria-hidden="true"
      >
        <div className="nx-hud-box" style={{ position: 'relative' }}>
          <Corner pos="tl" />
          <Corner pos="tr" />
          <Corner pos="bl" />
          <Corner pos="br" />
          <div className="nx-hud-row">
            <span>core.mode</span>
            <b className="nx-hud-mode">
              <DecodeText key={shape} text={CORE_SHAPE_LABELS[shape]} />
            </b>
          </div>
          <div className="nx-hud-row">
            <span>nodes</span>
            <b>2,400</b>
          </div>
          <div className="nx-hud-row">
            <span>domains</span>
            <b>03</b>
          </div>
          <div className="nx-hud-row">
            <span>sync</span>
            <b style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i className="nx-dot" /> online
            </b>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="nx-hud"
        style={{ right: '6%', bottom: '16%', textAlign: 'right' }}
        initial={{ opacity: 0 }}
        animate={ready ? { opacity: 1 } : {}}
        transition={{ delay: 1.5, duration: 0.8 }}
        aria-hidden="true"
      >
        <div style={{ display: 'flex', gap: 3, justifyContent: 'flex-end', alignItems: 'flex-end', height: 26, marginBottom: 8 }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.i
              key={i}
              style={{ width: 3, borderRadius: 2, background: i % 5 === 0 ? '#FF3DBB' : '#00F5FF', display: 'block' }}
              animate={{ height: [6, 8 + ((i * 7) % 18), 4, 12 + ((i * 3) % 14), 6] }}
              transition={{ duration: 1.6 + (i % 4) * 0.3, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
        ◎ click the core · move to disturb
      </motion.div>

      {/* ── Copy ─────────────────────────────────────────────── */}
      <div className="nx-container nx-hero-content">
        <motion.div className="nx-hero-text" variants={container} initial="hidden" animate={ready ? 'show' : 'hidden'}>
          <motion.div variants={item}>
            <span className="nx-badge">
              <span className="nx-badge-tag">NEW</span>
              AI-proctored aptitude arena · now live
            </span>
          </motion.div>

          <motion.h1 variants={item} className="nx-display nx-hero-title" aria-label="Outthink the clock.">
            <span aria-hidden="true" style={{ display: 'block' }}>Outthink</span>
            <span aria-hidden="true" className="nx-grad-text nx-scramble">
              <ScrambleWords words={WORDS} interval={2700} />
            </span>
          </motion.h1>

          <motion.p variants={item} className="nx-lead nx-hero-sub">
            NEXUS is an aptitude arena built for the AI era: adaptive tests, a 24/7 AI tutor, exam-grade proctoring, and
            analytics that show exactly how you think.
          </motion.p>

          <motion.div variants={item} className="nx-hero-ctas">
            <button type="button" className="nx-btn nx-btn-primary" onClick={() => scrollToId('scan')}>
              <Zap size={18} strokeWidth={2.4} />
              Take the 90-sec Neural Scan
            </button>
            <Link to={isAuthed ? '/dashboard' : '/register'} className="nx-btn nx-btn-ghost">
              {isAuthed ? 'Open dashboard' : 'Create account'}
              <ArrowRight size={17} className="nx-btn-arrow" />
            </Link>
          </motion.div>

          <motion.div variants={item} className="nx-hero-meta">
            {[
              ['03', 'core domains'],
              ['10', 'integrity layers'],
              ['24/7', 'AI tutor'],
            ].map(([n, l]) => (
              <div key={l} className="nx-hero-meta-item">
                <b>{n}</b>
                <span>{l}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <button type="button" className="nx-scroll-cue" onClick={() => scrollToId('scan')} aria-label="Scroll to the Neural Scan">
        SCROLL TO INITIALIZE
        <span className="nx-scroll-line" />
      </button>
    </section>
  );
};

export default Hero;
