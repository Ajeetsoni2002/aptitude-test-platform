// Scroll-driven 5-phase timeline. The beam fills as you scroll and each
// node lights up once the beam reaches it.

import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useSpring } from 'framer-motion';
import { Activity, Crosshair, Layers, ShieldCheck, Trophy } from 'lucide-react';
import { Reveal, SectionHead, SpotlightCard } from './primitives';

const STEPS = [
  { Icon: Crosshair, title: 'Calibrate', tag: 'Day 1', desc: 'Take a diagnostic and let NEXUS find your baseline across quant, logic and verbal.' },
  { Icon: Layers, title: 'Train', tag: 'Daily', desc: 'Drill exactly the subtopics that hurt, at a difficulty that stretches you, with the AI tutor on call.' },
  { Icon: ShieldCheck, title: 'Simulate', tag: 'Weekly', desc: 'Sit full-length proctored mocks under real exam pressure, timer and all.' },
  { Icon: Activity, title: 'Analyze', tag: 'Every test', desc: 'Review every solution, read your radar, and follow the AI insight to your next weak spot.' },
  { Icon: Trophy, title: 'Conquer', tag: 'Placement day', desc: 'Climb the leaderboard, earn certificates, and walk into the real exam already warmed up.' },
];

const Journey = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 65%', 'end 55%'] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const [lit, setLit] = useState(-1);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setLit(Math.floor(v * (STEPS.length - 1) + 0.15));
  });

  return (
    <section className="nx-section" id="journey">
      <div className="nx-container">
        <SectionHead
          center
          eyebrow="The journey"
          title={
            <>
              From first attempt to
              <br />
              <span className="nx-grad-text">placement-ready.</span>
            </>
          }
          sub="Five phases, one loop. NEXUS keeps you moving through it until the real exam feels like just another mock."
        />

        <div className="nx-journey" ref={ref}>
          <div className="nx-beam-track" aria-hidden="true">
            <motion.div className="nx-beam" style={{ scaleY }} />
          </div>

          {STEPS.map(({ Icon, title, tag, desc }, i) => (
            <div key={title} className={`nx-jstep ${i % 2 ? 'is-right' : 'is-left'}`}>
              <div className={`nx-jnode ${i <= lit ? 'is-lit' : ''}`}>
                <Icon size={22} />
              </div>
              <Reveal y={30} className="nx-jslot">
                <SpotlightCard className="nx-jstep-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <span className="nx-jphase">PHASE {String(i + 1).padStart(2, '0')}</span>
                    <span className="nx-chip">{tag}</span>
                  </div>
                  <h3 className="nx-jtitle">{title}</h3>
                  <p className="nx-body-text" style={{ margin: 0 }}>
                    {desc}
                  </p>
                </SpotlightCard>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Journey;
