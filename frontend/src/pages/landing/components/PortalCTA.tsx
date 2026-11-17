// Final call-to-action: a wormhole tunnel that accelerates when the CTA is
// hovered. Clicking "Enter NEXUS" hands off to the warp transition.

import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { DecodeText, Reveal } from './primitives';

const COLORS = ['0,245,255', '169,112,255', '255,61,187', '110,150,255'];

const PortalCTA = ({ isAuthed, onEnter }: { isAuthed: boolean; onEnter: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boost = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0;
    let H = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width;
      H = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const RINGS = 26;
    const STREAKS = 140;
    const streaks = Array.from({ length: STREAKS }, () => ({ a: Math.random() * Math.PI * 2, d: Math.random(), c: COLORS[Math.floor(Math.random() * COLORS.length)] }));
    let offset = 0;
    let speed = 0.06;
    let last = performance.now();
    let raf = 0;
    let running = false;

    const project = (d: number, base: number) => base / (d * 1.0 + 0.07);

    const frame = (now: number) => {
      if (!reduce) raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const target = boost.current ? 0.42 : 0.07;
      speed += (target - speed) * 0.04;
      offset = (offset + speed * dt) % 1;

      const cx = W / 2;
      const cy = H / 2;
      const base = Math.min(W, H) * 0.06;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(4,4,10,0.32)';
      ctx.fillRect(0, 0, W, H);

      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 5);
      g.addColorStop(0, `rgba(190,230,255,${boost.current ? 0.55 : 0.32})`);
      g.addColorStop(0.3, 'rgba(124,92,255,0.14)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - base * 5, cy - base * 5, base * 10, base * 10);

      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < RINGS; i++) {
        let d = (i / RINGS - offset) % 1;
        if (d < 0) d += 1;
        const r = project(d, base);
        const fadeNear = d < 0.12 ? d / 0.12 : 1;
        const alpha = fadeNear * Math.pow(1 - d, 0.7) * 0.55;
        if (alpha <= 0.01) continue;
        ctx.strokeStyle = `rgba(${COLORS[i % COLORS.length]},${alpha})`;
        ctx.lineWidth = 0.6 + (1 - d) * 2.2;
        ctx.setLineDash([r * 0.06, r * 0.1 + 4]);
        ctx.lineDashOffset = (now / 1000) * 40 * (i % 2 ? 1 : -1);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      for (const s of streaks) {
        s.d -= speed * dt * 1.6;
        if (s.d <= 0.02) {
          s.d = 1;
          s.a = Math.random() * Math.PI * 2;
        }
        const r1 = project(s.d, base);
        const r2 = project(Math.min(1, s.d + 0.025 + speed * 0.12), base);
        const alpha = Math.pow(1 - s.d, 1.2) * 0.8;
        ctx.strokeStyle = `rgba(${s.c},${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(s.a) * r2, cy + Math.sin(s.a) * r2);
        ctx.lineTo(cx + Math.cos(s.a) * r1, cy + Math.sin(s.a) * r1);
        ctx.stroke();
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()));
    io.observe(canvas);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  const on = () => {
    boost.current = true;
  };
  const off = () => {
    boost.current = false;
  };

  return (
    <section className="nx-portal" aria-labelledby="nx-portal-title">
      <canvas ref={canvasRef} aria-hidden="true" />
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, #04040a 78%)', pointerEvents: 'none', zIndex: 1 }}
      />
      <div className="nx-portal-inner">
        <Reveal>
          <DecodeText text="Your move" className="nx-eyebrow" />
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="nx-portal-title" className="nx-display nx-portal-title">
            The next version of you <br className="nx-br-desk" />
            is <span className="nx-grad-text">one test away.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="nx-lead" style={{ maxWidth: 560, margin: '0 auto' }}>
            Create your account in under a minute. Your first test can start right after.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 40 }}>
            <button
              type="button"
              className="nx-btn nx-btn-primary"
              style={{ height: 62, padding: '0 34px', fontSize: 16.5 }}
              onPointerEnter={on}
              onPointerLeave={off}
              onFocus={on}
              onBlur={off}
              onClick={onEnter}
            >
              {isAuthed ? 'Enter your dashboard' : 'Enter NEXUS'}
              <ArrowRight size={19} className="nx-btn-arrow" />
            </button>
            {!isAuthed && (
              <Link to="/login" className="nx-btn nx-btn-ghost" style={{ height: 62, padding: '0 30px' }}>
                I already have an account
              </Link>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default PortalCTA;
