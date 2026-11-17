// Full-screen hyperspace jump used before leaving the landing page.

import { useEffect, useRef } from 'react';

const WarpTransition = ({ onDone }: { onDone: () => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      doneRef.current();
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      doneRef.current();
      return;
    }

    const W = window.innerWidth;
    const H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    // Stars live in screen-sized space; at z = 1 they sit in the central quarter
    // and stream outward as z shrinks (px = cx + x * FOCAL / z).
    const FOCAL = 0.22;
    const colors = ['#ffffff', '#9ffcff', '#00F5FF', '#c9a8ff', '#FF8FD8'];
    const spawn = (z: number) => ({
      x: (Math.random() * 2 - 1) * W,
      y: (Math.random() * 2 - 1) * H,
      z,
      c: colors[Math.floor(Math.random() * colors.length)],
    });
    const stars = Array.from({ length: 700 }, () => spawn(Math.random() * 0.85 + 0.15));

    const DURATION = 1050;
    const start = performance.now();
    let raf = 0;
    let finished = false;

    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      const speed = 0.004 + Math.pow(p, 2.4) * 0.09;
      ctx.fillStyle = `rgba(0,0,0,${0.35 - p * 0.25})`;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const px = cx + (s.x * FOCAL) / s.z;
        const py = cy + (s.y * FOCAL) / s.z;
        s.z -= speed;
        if (s.z <= 0.02) {
          stars[i] = spawn(1);
          continue;
        }
        const nx = cx + (s.x * FOCAL) / s.z;
        const ny = cy + (s.y * FOCAL) / s.z;
        ctx.strokeStyle = s.c;
        ctx.globalAlpha = Math.min(1, 0.25 + (1 - s.z) * 1.2);
        ctx.lineWidth = Math.min(3.2, 0.7 / s.z);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(nx, ny);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (flashRef.current) flashRef.current.style.opacity = String(Math.max(0, (p - 0.72) / 0.28));
      if (p < 1) {
        raf = requestAnimationFrame(frame);
      } else if (!finished) {
        finished = true;
        doneRef.current();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="nx-warp" role="presentation">
      <canvas ref={canvasRef} />
      <div ref={flashRef} className="nx-warp-flash" />
    </div>
  );
};

export default WarpTransition;
