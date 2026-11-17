// ~1.6 s "system boot" shown on the first visit of a session.
// Click / any key skips it. Exits by splitting open like blast doors.

import { useEffect, useRef, useState } from 'react';
import { motion, type Variants } from 'framer-motion';

const LINES = [
  { at: 4, text: 'NEXUS://core · cold boot' },
  { at: 20, text: 'loading cognitive engine', ok: true },
  { at: 38, text: 'calibrating integrity shield', ok: true },
  { at: 56, text: 'syncing AI tutor', ok: true },
  { at: 74, text: 'mapping domains · quant / logic / verbal', ok: true },
  { at: 92, text: 'all systems nominal' },
];

const DURATION = 1550;

const shell: Variants = { show: { opacity: 1 }, exit: { opacity: 1, transition: { duration: 0.9 } } };
const top: Variants = { show: { y: 0 }, exit: { y: '-100%', transition: { duration: 0.85, ease: [0.7, 0, 0.2, 1] } } };
const bottom: Variants = { show: { y: 0 }, exit: { y: '100%', transition: { duration: 0.85, ease: [0.7, 0, 0.2, 1] } } };
const inner: Variants = { show: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.96, transition: { duration: 0.25 } } };

const BootSequence = ({ onDone }: { onDone: () => void }) => {
  const [pct, setPct] = useState(0);
  const doneRef = useRef(onDone);
  const finished = useRef(false);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      doneRef.current();
    };
    const start = performance.now();
    let raf = 0;
    let t = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      setPct(Math.round((1 - Math.pow(1 - p, 2)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else t = window.setTimeout(finish, 220);
    };
    raf = requestAnimationFrame(tick);
    const skip = () => finish();
    window.addEventListener('keydown', skip);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  return (
    <motion.div
      className="nx-boot"
      variants={shell}
      initial="show"
      animate="show"
      exit="exit"
      onClick={() => {
        if (!finished.current) {
          finished.current = true;
          doneRef.current();
        }
      }}
      role="status"
      aria-label="Loading NEXUS"
    >
      <motion.div className="nx-boot-half top" variants={top} />
      <motion.div className="nx-boot-half bottom" variants={bottom} />
      <motion.div className="nx-boot-inner" variants={inner}>
        <div className="nx-boot-console">
          {LINES.filter((l) => pct >= l.at).map((l) => (
            <motion.div key={l.text} className="nx-boot-line" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
              <span>
                <span style={{ color: '#00F5FF' }}>&gt;</span> {l.text}
              </span>
              {l.ok && <b>OK</b>}
            </motion.div>
          ))}
          <div className="nx-boot-bar">
            <i style={{ width: `${pct}%` }} />
          </div>
          <div className="nx-boot-pct">
            <span>INITIALIZING NEURAL CORE</span>
            <b>{String(pct).padStart(3, '0')}%</b>
          </div>
          <div style={{ marginTop: 26, fontSize: 10, letterSpacing: '0.2em', color: 'rgba(226,232,245,0.3)' }}>CLICK OR PRESS ANY KEY TO SKIP</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BootSequence;
