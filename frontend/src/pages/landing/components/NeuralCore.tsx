// Interactive 3D particle core for the hero.
// Canvas 2D + additive blending — no WebGL / three.js dependency.
//  • Morphs: sphere → Σ → tesseract → "Aa" → DNA helix (loops)
//  • Pointer repels particles, click fires a shockwave + next shape
//  • Pauses when off-screen or tab hidden; static frame on reduced-motion

import { useEffect, useRef } from 'react';
import { buildShape, scatter, coreParticleCount, CORE_SHAPE_COUNT } from './coreShapes';

interface NeuralCoreProps {
  className?: string;
  ready?: boolean;
  onShapeChange?: (index: number) => void;
}

const PALETTE = [
  [0, 245, 255],
  [110, 150, 255],
  [169, 112, 255],
  [255, 61, 187],
];

function makeSprites(steps: number) {
  const sprites: HTMLCanvasElement[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const seg = t * (PALETTE.length - 1);
    const k = Math.min(PALETTE.length - 2, Math.floor(seg));
    const f = seg - k;
    const [r, g, b] = PALETTE[k].map((v, j) => Math.round(v + (PALETTE[k + 1][j] - v) * f));
    const s = document.createElement('canvas');
    s.width = s.height = 32;
    const ctx = s.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.16, `rgba(${r},${g},${b},0.95)`);
      grad.addColorStop(0.42, `rgba(${r},${g},${b},0.26)`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    sprites.push(s);
  }
  return sprites;
}

const NeuralCore = ({ className, ready = true, onShapeChange }: NeuralCoreProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cbRef = useRef(onShapeChange);
  const readyRef = useRef(ready);

  useEffect(() => {
    cbRef.current = onShapeChange;
  }, [onShapeChange]);

  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const small = window.innerWidth < 768;
    const N = coreParticleCount();
    const MORPH = 1900;
    const HOLD = 4300;
    const SPREAD = 0.38;
    const FOV = 3.4;
    const SPRITES = 28;

    const cache: (Float32Array | undefined)[] = [];
    const shape = (i: number) => (cache[i] ??= buildShape(i, N));

    let to = shape(0);
    let from = reduce ? to : scatter(N);
    let shapeIdx = 0;
    let morphStart = performance.now();

    const cur = new Float32Array(N * 3);
    const dir = new Float32Array(N * 3);
    const delay = new Float32Array(N);
    const burst = new Float32Array(N);
    const size = new Float32Array(N);
    const phase = new Float32Array(N);
    const ox = new Float32Array(N);
    const oy = new Float32Array(N);
    const vx = new Float32Array(N);
    const vy = new Float32Array(N);
    const lastX = new Float32Array(N);
    const lastY = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      delay[i] = Math.random() * SPREAD;
      burst[i] = 0.25 + Math.random() * 0.75;
      size[i] = Math.random() < 0.035 ? 2.4 + Math.random() : 0.65 + Math.random() * 1.1;
      phase[i] = Math.random() * Math.PI * 2;
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      dir[i * 3] = Math.cos(th) * s;
      dir[i * 3 + 1] = u;
      dir[i * 3 + 2] = Math.sin(th) * s;
    }

    const sprites = makeSprites(SPRITES);

    let W = 0;
    let H = 0;
    let cx = 0;
    let cy = 0;
    let R = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (W >= 1024) {
        cx = W * 0.71;
        cy = H * 0.5;
        R = Math.min(W * 0.18, H * 0.29);
      } else {
        cx = W * 0.5;
        cy = H * 0.24;
        R = Math.min(W * 0.3, H * 0.155);
      }
    };

    const pointer = { x: -9999, y: -9999, nx: 0, ny: 0, active: false };
    let px = 0;
    let py = 0;
    let shock: { x: number; y: number; t: number } | null = null;

    const nextShape = (now: number) => {
      from = cur.slice();
      shapeIdx = (shapeIdx + 1) % CORE_SHAPE_COUNT;
      to = shape(shapeIdx);
      morphStart = now;
      cbRef.current?.(shapeIdx);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = pointer.y >= 0 && pointer.y <= rect.height && e.pointerType === 'mouse';
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
      canvas.style.cursor = Math.hypot(pointer.x - cx, pointer.y - cy) < R * 1.3 ? 'pointer' : 'default';
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (Math.hypot(x - cx, y - cy) > R * 1.6) return;
      const reach = R * 2.6;
      for (let i = 0; i < N; i++) {
        const dx = lastX[i] - x;
        const dy = lastY[i] - y;
        const d = Math.hypot(dx, dy) + 0.001;
        const f = 30 * Math.max(0, 1 - d / reach);
        vx[i] += (dx / d) * f;
        vy[i] += (dy / d) * f;
      }
      const now = performance.now();
      shock = { x, y, t: now };
      if (!reduce) nextShape(now);
    };

    const drawOrbits = (t: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.lineWidth = 1;
      for (let k = 0; k < 2; k++) {
        const rxE = R * (k === 0 ? 1.55 : 1.9);
        const ryE = R * (k === 0 ? 0.4 : 0.62);
        ctx.save();
        ctx.rotate((k === 0 ? -0.38 : 0.52) + px * 0.12);
        ctx.setLineDash(k === 0 ? [2, 7] : [1, 10]);
        ctx.lineDashOffset = -t * (k ? 8 : 14);
        ctx.strokeStyle = k === 0 ? 'rgba(0,245,255,0.22)' : 'rgba(169,112,255,0.2)';
        ctx.beginPath();
        ctx.ellipse(0, 0, rxE, ryE, 0, 0, Math.PI * 2);
        ctx.stroke();
        const a = t * (k ? -0.45 : 0.7) + k * 2;
        ctx.setLineDash([]);
        ctx.fillStyle = k ? '#FF3DBB' : '#00F5FF';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * rxE, Math.sin(a) * ryE, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
      }
      ctx.restore();
    };

    let raf = 0;
    let running = false;
    let visible = true;

    const frame = (now: number) => {
      if (!reduce) raf = requestAnimationFrame(frame);
      if (!readyRef.current) morphStart = now;

      const t = now / 1000;
      if (!reduce && now - morphStart > MORPH + HOLD) nextShape(now);
      const mp = (now - morphStart) / MORPH;

      px += (pointer.nx - px) * 0.05;
      py += (pointer.ny - py) * 0.05;
      const ry = (reduce ? 0.35 : Math.sin(t * 0.32) * 0.7) + px * 0.5;
      const rx = (reduce ? 0.1 : Math.sin(t * 0.23) * 0.2) - py * 0.3;
      const cY = Math.cos(ry);
      const sY = Math.sin(ry);
      const cX = Math.cos(rx);
      const sX = Math.sin(rx);

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.7);
      glow.addColorStop(0, 'rgba(90,120,255,0.16)');
      glow.addColorStop(0.5, 'rgba(169,112,255,0.06)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(cx - R * 1.7, cy - R * 1.7, R * 3.4, R * 3.4);

      drawOrbits(t);

      ctx.globalCompositeOperation = 'lighter';
      const span = 1 - SPREAD;
      const repelR = R * 0.6;
      const repelR2 = repelR * repelR;
      const base = small ? 2.5 : 3.1;

      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        let p = (mp - delay[i]) / span;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        const b = Math.sin(e * Math.PI) * burst[i] * 0.85;

        let x = from[i3] + (to[i3] - from[i3]) * e + dir[i3] * b;
        let y = from[i3 + 1] + (to[i3 + 1] - from[i3 + 1]) * e + dir[i3 + 1] * b;
        let z = from[i3 + 2] + (to[i3 + 2] - from[i3 + 2]) * e + dir[i3 + 2] * b;
        cur[i3] = x;
        cur[i3 + 1] = y;
        cur[i3 + 2] = z;

        const w = 1 + Math.sin(t * 1.6 + phase[i]) * 0.012;
        x *= w;
        y *= w;
        z *= w;

        const x1 = x * cY + z * sY;
        const z1 = -x * sY + z * cY;
        const y1 = y * cX - z1 * sX;
        const z2 = y * sX + z1 * cX;
        const persp = FOV / (FOV + z2);

        let sx = cx + x1 * R * persp;
        let sy = cy - y1 * R * persp;

        if (pointer.active) {
          const dx = sx + ox[i] - pointer.x;
          const dy = sy + oy[i] - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < repelR2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / repelR) * 1.7;
            vx[i] += (dx / d) * f;
            vy[i] += (dy / d) * f;
          }
        }
        vx[i] = (vx[i] - ox[i] * 0.045) * 0.86;
        vy[i] = (vy[i] - oy[i] * 0.045) * 0.86;
        ox[i] += vx[i];
        oy[i] += vy[i];
        sx += ox[i];
        sy += oy[i];
        lastX[i] = sx;
        lastY[i] = sy;

        const depth = Math.min(1, Math.max(0, (1.25 - z2) / 2.5));
        const s = size[i] * persp * base * (0.55 + depth * 0.7);
        let ci = (y1 * 0.8 - x1 * 0.35 + 1.2) / 2.4;
        ci = ci < 0 ? 0 : ci > 1 ? 1 : ci;
        ctx.globalAlpha = 0.16 + depth * 0.64;
        ctx.drawImage(sprites[(ci * (SPRITES - 1)) | 0], sx - s, sy - s, s * 2, s * 2);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (shock) {
        const p = (now - shock.t) / 750;
        if (p >= 1) {
          shock = null;
        } else {
          ctx.strokeStyle = `rgba(0,245,255,${(1 - p) * 0.7})`;
          ctx.lineWidth = 2 * (1 - p) + 0.5;
          ctx.beginPath();
          ctx.arc(shock.x, shock.y, R * 0.2 + p * R * 2.4, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) frame(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      if (document.hidden || !visible) stop();
      else start();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
};

export default NeuralCore;
