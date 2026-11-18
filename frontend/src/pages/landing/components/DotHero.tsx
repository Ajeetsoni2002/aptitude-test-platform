// Hero: a live dot-matrix display.
//
// The headline is not text on top of dots; it is made of dots. Each lit
// cell is a particle that flies in from a scattered field, springs to its
// place, shies away from the cursor and snaps back. Every few seconds all
// particles re-route into the next phrase. Behind it, a finer grid of
// dots acts as the screen: it swells under the cursor like a lens, a scan
// line sweeps down, and a click sends a shockwave through both layers.
// Between the two, a 3D object made of dots turns slowly behind the
// headline and morphs (sphere, torus, cube) each time the phrase changes,
// with two small satellites drifting at the edges and mouse parallax.
//
// The real headline is in the DOM for screen readers and search; the
// canvas is decorative. With prefers-reduced-motion the phrase is drawn
// once, still.

import { useEffect, useRef, type ReactNode } from 'react';

const PHRASES: string[][] = [
  ['SIT THE PAPER', 'BEFORE THE', 'PAPER.'],
  ['QUANT', 'LOGIC', 'VERBAL'],
  ['TIMED.', 'PROCTORED.', 'REVIEWED.'],
];
const HOLD_MS = 5200;

type Particle = {
  x: number; y: number; vx: number; vy: number;
  tx: number; ty: number;
  has: boolean;     // has a target in the current phrase
  a: number;        // current alpha
  wake: number;     // timestamp before which the particle stays put (intro stagger)
};

type Wave = { x: number; y: number; t0: number };

/* ── 3D point clouds for the background object ──────────────────
   Every shape has the same number of points, so the object can morph
   from one to the next point by point. Coordinates are roughly unit. */
const N3 = 640;

const sphereCloud = (n: number) => {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    out.set([Math.cos(th) * r, y, Math.sin(th) * r], i * 3);
  }
  return out;
};

const torusCloud = (n: number, R = 0.72, r = 0.3) => {
  const out = new Float32Array(n * 3);
  const vs = 16;
  const us = Math.ceil(n / vs);
  for (let i = 0; i < n; i++) {
    const u = ((i % us) / us) * Math.PI * 2;
    const v = (Math.floor(i / us) / vs) * Math.PI * 2;
    out.set([(R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u)], i * 3);
  }
  return out;
};

const cubeCloud = (n: number, h = 0.62) => {
  const out = new Float32Array(n * 3);
  const c = [-h, h];
  const edges: [number[], number[]][] = [];
  for (const a of c) for (const b of c) {
    edges.push([[-h, a, b], [h, a, b]], [[a, -h, b], [a, h, b]], [[a, b, -h], [a, b, h]]);
  }
  const per = Math.ceil(n / edges.length);
  for (let i = 0; i < n; i++) {
    const [p0, p1] = edges[Math.floor(i / per) % edges.length];
    const t = (i % per) / (per - 1);
    out.set([p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t], i * 3);
  }
  return out;
};

// One shape per phrase: sphere, torus, cube.
const CLOUDS = [sphereCloud(N3), torusCloud(N3), cubeCloud(N3)];
const SAT_TORUS = torusCloud(180, 0.7, 0.28);
const SAT_CUBE = cubeCloud(144, 0.6);

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const readInk = () => {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '255 255 255';
  const [r, g, b] = v.split(/\s+/).map(Number);
  return [r, g, b] as const;
};

const DotHero = ({ eyebrow, children }: { eyebrow?: ReactNode; children?: ReactNode }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const hudCount = useRef<HTMLSpanElement>(null);
  const hudPos = useRef<HTMLSpanElement>(null);
  const hudPhrase = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const slot = slotRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, dpr = 1;
    let gap = 8, dotR = 3, gridGap = 24;
    let particles: Particle[] = [];
    let phraseIdx = 0;
    let nextSwap = 0;
    let raf = 0;
    let running = true;
    let visible = true;
    let ink = readInk();
    const mouse = { x: -9999, y: -9999, active: false };
    const waves: Wave[] = [];
    let start = performance.now();
    let fontReady = false;

    // background 3D object
    const cur = new Float32Array(CLOUDS[0]);
    let morphFrom = new Float32Array(CLOUDS[0]);
    let morphTo = CLOUDS[0];
    let morphStart = -1e9;
    let rotY = 0;
    const rotX = 0.5;
    let tiltX = 0, tiltY = 0;          // eased mouse parallax
    let tiltTX = 0, tiltTY = 0;        // parallax targets
    let pulse = 0;
    let sceneCy = 0;                   // vertical centre of the headline slot
    let sceneH = 300;                  // height of the laid-out headline

    /* ── Sample a phrase into dot positions ── */
    const sample = (lines: string[]) => {
      const s = slot.getBoundingClientRect();
      const c = wrap.getBoundingClientRect();
      const rx = s.left - c.left, ry = s.top - c.top, rw = s.width, rh = s.height;
      sceneCy = ry + rh / 2;
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.floor(rw));
      off.height = Math.max(1, Math.floor(rh));
      const o = off.getContext('2d', { willReadFrequently: true })!;
      const family = '"Space Grotesk", system-ui, sans-serif';
      o.font = `700 100px ${family}`;
      const widest = Math.max(...lines.map((l) => o.measureText(l).width)) / 100;
      const capR = o.measureText('H').actualBoundingBoxAscent / 100 || 0.7;

      // Like a real LED sign: capital letters are a whole number of cells
      // tall and start exactly on a cell edge. Otherwise the top of round
      // letters (S, O, C) half-fills an extra row and leaves stray dots.
      const first = Math.min((rw * 0.96) / widest, rh / (lines.length * 1.3), 168);
      gap = Math.max(3, Math.round(first / 11.5));
      let rows = Math.max(5, Math.round((capR * first) / gap));
      let size = 0, spacing = 0, totalCells = 0;
      for (; rows >= 5; rows--) {
        size = (rows * gap) / capR;
        spacing = Math.max(2, Math.round(rows * 0.42));
        totalCells = lines.length * rows + (lines.length - 1) * spacing;
        if (widest * size <= rw * 0.98 && totalCells * gap <= rh) break;
      }
      dotR = gap * 0.36;
      gridGap = Math.max(18, Math.round(gap * 2.6));
      sceneH = totalCells * gap;

      o.font = `700 ${size}px ${family}`;
      o.textAlign = 'center';
      o.textBaseline = 'alphabetic';
      o.fillStyle = '#000';
      // cell centres are at oy + j * gap; cell j spans +- gap / 2
      const oyGrid = ((rh % gap) / 2) + gap / 2;
      const cellsTall = Math.floor((rh - oyGrid + gap / 2) / gap);
      const j0 = Math.max(0, Math.floor((cellsTall - totalCells) / 2));
      const topEdge = oyGrid - gap / 2 + j0 * gap;
      lines.forEach((l, i) => o.fillText(l, rw / 2, topEdge + (i * (rows + spacing) + rows) * gap));
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const pts: [number, number][] = [];
      // Align the sampling grid to the cell size so dots sit on clean rows.
      const ox = ((rw % gap) / 2) + gap / 2;
      const oy = ((rh % gap) / 2) + gap / 2;
      // A cell lights up when most of it is covered by the glyph (3 x 3
      // sub-samples), which gives cleaner letters than testing one pixel.
      const lit = (px: number, py: number) => {
        const ix = Math.floor(px), iy = Math.floor(py);
        if (ix < 0 || iy < 0 || ix >= off.width || iy >= off.height) return 0;
        return data[(iy * off.width + ix) * 4 + 3] > 128 ? 1 : 0;
      };
      const q = gap * 0.3;
      for (let y = oy; y < off.height; y += gap) {
        for (let x = ox; x < off.width; x += gap) {
          let hits = 0;
          for (let sy = -1; sy <= 1; sy++) for (let sx = -1; sx <= 1; sx++) hits += lit(x + sx * q, y + sy * q);
          if (hits >= 5) pts.push([rx + x, ry + y]);
        }
      }
      return pts;
    };

    /* ── Route particles to a new set of targets ── */
    const assign = (pts: [number, number][], now: number, intro: boolean) => {
      // Sort targets left-to-right so particles travel in a sweeping wave
      // instead of crossing over each other at random.
      pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      particles.sort((a, b) => a.x - b.x || a.y - b.y);
      const n = pts.length;
      while (particles.length < n) {
        // New dots fade in from random spots on the screen.
        particles.push({
          x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0,
          tx: 0, ty: 0, has: true, a: 0, wake: 0,
        });
      }
      particles.forEach((p, i) => {
        if (i < n) {
          p.tx = pts[i][0];
          p.ty = pts[i][1];
          p.has = true;
          // Intro: print left to right like an LED board.
          p.wake = intro ? now + (pts[i][0] / W) * 900 + Math.random() * 250 : now + Math.random() * 180;
        } else {
          p.has = false;
          p.vx += (Math.random() - 0.5) * 6;
          p.vy += (Math.random() - 0.5) * 6;
        }
      });
      if (hudCount.current) hudCount.current.textContent = String(n).padStart(4, '0');
      if (hudPhrase.current) hudPhrase.current.textContent = `${String(phraseIdx + 1).padStart(2, '0')}/${String(PHRASES.length).padStart(2, '0')}`;
    };

    /* ── Resize ── */
    const resize = (intro = false) => {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!fontReady) return;
      const now = performance.now();
      if (intro) {
        particles = [];
        start = now;
      }
      assign(sample(PHRASES[phraseIdx]), now, intro);
      if (reduce) {
        particles.forEach((p) => { p.x = p.tx; p.y = p.ty; p.a = p.has ? 1 : 0; });
        draw(now);
      }
    };

    /* ── Draw one frame ── */
    const draw = (now: number) => {
      const [r, g, b] = ink;
      ctx.clearRect(0, 0, W, H);
      const t = (now - start) / 1000;

      // 1. The screen: fine grid that reacts to the cursor, scan line and waves.
      const scanY = ((now / 4200) % 1) * (H + 200) - 100;
      const buckets: number[][] = [[], [], [], [], [], []]; // x, y, radius triples per alpha bucket
      const lens = 150;
      for (let y = gridGap / 2; y < H; y += gridGap) {
        const scan = Math.max(0, 1 - Math.abs(y - scanY) / 60);
        for (let x = gridGap / 2; x < W; x += gridGap) {
          let boost = scan * 0.35;
          let rad = 1;
          if (mouse.active) {
            const d = Math.hypot(x - mouse.x, y - mouse.y);
            if (d < lens) {
              const k = 1 - d / lens;
              boost += k * k * 0.9;
              rad += k * k * 2.4;
            }
          }
          for (const w of waves) {
            const age = (now - w.t0) / 1000;
            const radius = age * 900;
            const d = Math.hypot(x - w.x, y - w.y);
            const band = Math.max(0, 1 - Math.abs(d - radius) / 46) * Math.max(0, 1 - age / 1.4);
            boost += band * 0.9;
            rad += band * 2;
          }
          // a gentle breathing so the field never looks frozen
          boost += (Math.sin(x * 0.02 + y * 0.015 + t * 1.2) + 1) * 0.025;
          const level = Math.min(5, Math.floor(boost * 6));
          buckets[level].push(x, y, rad);
        }
      }
      for (let lv = 0; lv < buckets.length; lv++) {
        const arr = buckets[lv];
        if (!arr.length) continue;
        ctx.fillStyle = `rgba(${r},${g},${b},${0.1 + lv * 0.13})`;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 3) {
          ctx.moveTo(arr[i] + arr[i + 2], arr[i + 1]);
          ctx.arc(arr[i], arr[i + 1], arr[i + 2], 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // 2. The 3D object behind the headline, plus two small satellites.
      //    Front dots are larger and brighter, back dots smaller and dimmer.
      const obj: number[][] = [[], [], [], [], []];
      const project = (
        pts: Float32Array, count: number, cx: number, cy: number, R: number,
        ax: number, ay: number, alphaMax: number, sizeK: number,
      ) => {
        const cxr = Math.cos(ax), sxr = Math.sin(ax), cyr = Math.cos(ay), syr = Math.sin(ay);
        for (let i = 0; i < count; i++) {
          const x = pts[i * 3], y = pts[i * 3 + 1], z = pts[i * 3 + 2];
          const x1 = x * cyr - z * syr;
          const z1 = x * syr + z * cyr;
          const y1 = y * cxr - z1 * sxr;
          const z2 = y * sxr + z1 * cxr;
          const persp = 3.2 / (3.2 + z2);
          const depth = (1 - z2) / 2;                 // 0 = back, 1 = front
          const a = (0.12 + depth * 0.88) * alphaMax;
          const lv = Math.min(4, Math.floor((a / 0.5) * 5));
          obj[lv].push(cx + x1 * R * persp, cy + y1 * R * persp, (0.7 + depth * 1.5) * persp * sizeK);
        }
      };
      const bob = Math.sin(t * 0.7) * 8;
      // Front points of the cube project to about 1.6 x R, so keep R well
      // inside the headline area: the object never runs off the hero.
      const big = Math.min(W * 0.26, sceneH * 0.62, 360) * (1 + pulse * 0.08);
      project(cur, N3, W / 2, (sceneCy || H * 0.4) + bob, big, rotX + tiltY, rotY + tiltX, sceneH < 320 ? 0.2 : 0.3, W < 640 ? 0.8 : 1.15);
      if (W >= 760) {
        const satR = Math.min(56, sceneH * 0.16);
        const cy0 = sceneCy || H * 0.4;
        project(SAT_TORUS, 180, W * 0.09, cy0 - sceneH * 0.32 - bob, satR, t * 0.9 + tiltY, t * 0.6 + tiltX, 0.4, 0.9);
        project(SAT_CUBE, 144, W * 0.91, cy0 + sceneH * 0.3 + bob, satR, t * 0.5 + tiltY, -t * 0.8 + tiltX, 0.4, 0.9);
      }
      for (let lv = 0; lv < obj.length; lv++) {
        const arr = obj[lv];
        if (!arr.length) continue;
        ctx.fillStyle = `rgba(${r},${g},${b},${((lv + 1) / 5) * 0.5})`;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 3) {
          ctx.moveTo(arr[i] + arr[i + 2], arr[i + 1]);
          ctx.arc(arr[i], arr[i + 1], arr[i + 2], 0, Math.PI * 2);
        }
        ctx.fill();
      }

      // 3. The headline particles, grouped by alpha for batched fills.
      const pb: number[][] = [[], [], [], [], []];
      for (const p of particles) {
        if (p.a < 0.02) continue;
        let rad = dotR;
        if (mouse.active) {
          const d = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (d < 110) rad *= 1 + (1 - d / 110) * 0.7;
        }
        const lv = Math.min(4, Math.floor(p.a * 5));
        pb[lv].push(p.x, p.y, rad);
      }
      for (let lv = 0; lv < pb.length; lv++) {
        const arr = pb[lv];
        if (!arr.length) continue;
        ctx.fillStyle = `rgba(${r},${g},${b},${(lv + 1) / 5})`;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i += 3) {
          ctx.moveTo(arr[i] + arr[i + 2], arr[i + 1]);
          ctx.arc(arr[i], arr[i + 1], arr[i + 2], 0, Math.PI * 2);
        }
        ctx.fill();
      }
    };

    /* ── Physics step ── */
    const step = (now: number) => {
      rotY += 0.0042;
      tiltX += (tiltTX - tiltX) * 0.05;
      tiltY += (tiltTY - tiltY) * 0.05;
      pulse *= 0.93;
      // morph the background object point by point, with a slight stagger
      const since = now - morphStart;
      if (since < 1700) {
        for (let i = 0; i < N3; i++) {
          const k = easeInOut(Math.min(1, Math.max(0, (since - (i / N3) * 450) / 1150)));
          for (let d = 0; d < 3; d++) {
            const j = i * 3 + d;
            cur[j] = morphFrom[j] + (morphTo[j] - morphFrom[j]) * k;
          }
        }
      }
      for (const p of particles) {
        if (p.has) {
          if (now >= p.wake) {
            p.vx += (p.tx - p.x) * 0.075;
            p.vy += (p.ty - p.y) * 0.075;
            p.a = Math.min(1, p.a + 0.06);
          } else {
            // waiting its turn: shimmer in place like static
            p.vx += (Math.random() - 0.5) * 0.6;
            p.vy += (Math.random() - 0.5) * 0.6;
            p.a = Math.min(0.35, p.a + 0.02);
          }
        } else {
          p.a = Math.max(0, p.a - 0.03);
          p.vy += 0.05;
        }
        if (mouse.active) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < 120 && d > 0.01) {
            const f = (1 - d / 120) ** 2 * 7;
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        for (const w of waves) {
          const age = (now - w.t0) / 1000;
          const radius = age * 900;
          const dx = p.x - w.x, dy = p.y - w.y;
          const d = Math.hypot(dx, dy) || 1;
          const band = Math.max(0, 1 - Math.abs(d - radius) / 40);
          if (band > 0) {
            const f = band * 14 * Math.max(0, 1 - age / 1.2);
            p.vx += (dx / d) * f;
            p.vy += (dy / d) * f;
          }
        }
        p.vx *= 0.8;
        p.vy *= 0.8;
        p.x += p.vx;
        p.y += p.vy;
      }
      particles = particles.filter((p) => p.has || p.a > 0);
      for (let i = waves.length - 1; i >= 0; i--) if (now - waves[i].t0 > 1600) waves.splice(i, 1);
    };

    /* ── Loop ── */
    const loop = (now: number) => {
      if (!running) return;
      if (visible && fontReady) {
        if (now >= nextSwap) {
          if (nextSwap !== 0) {
            phraseIdx = (phraseIdx + 1) % PHRASES.length;
            assign(sample(PHRASES[phraseIdx]), now, false);
            morphFrom = new Float32Array(cur);
            morphTo = CLOUDS[phraseIdx % CLOUDS.length];
            morphStart = now;
          }
          nextSwap = now + HOLD_MS + (nextSwap === 0 ? 1200 : 0);
        }
        step(now);
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };

    /* ── Input ── */
    const toLocal = (cx: number, cy: number) => {
      const r = wrap.getBoundingClientRect();
      return { x: cx - r.left, y: cy - r.top };
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e.clientX, e.clientY);
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.active = p.x >= 0 && p.y >= 0 && p.x <= W && p.y <= H;
      tiltTX = ((p.x / Math.max(1, W)) - 0.5) * 0.7;
      tiltTY = ((p.y / Math.max(1, H)) - 0.5) * 0.5;
      if (hudPos.current && mouse.active) {
        hudPos.current.textContent = `X${String(Math.round(p.x)).padStart(4, '0')} Y${String(Math.round(p.y)).padStart(4, '0')}`;
      }
    };
    const onLeave = () => { mouse.active = false; tiltTX = 0; tiltTY = 0; };
    const onDown = (e: PointerEvent) => {
      // Ignore clicks on real controls inside the hero (buttons, links).
      if ((e.target as HTMLElement).closest('a,button')) return;
      const p = toLocal(e.clientX, e.clientY);
      waves.push({ x: p.x, y: p.y, t0: performance.now() });
      pulse = 1;
      if (waves.length > 4) waves.shift();
    };

    /* ── Theme: re-read ink when <html> class changes ── */
    const themeObs = new MutationObserver(() => {
      ink = readInk();
      if (reduce) draw(performance.now());
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(wrap);
    const ro = new ResizeObserver(() => resize(false));
    ro.observe(wrap);
    const onVis = () => { visible = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', onVis);

    if (!reduce) {
      wrap.addEventListener('pointermove', onMove);
      wrap.addEventListener('pointerleave', onLeave);
      wrap.addEventListener('pointerdown', onDown);
    }

    // Start within 1.2s even on a slow font download; if the real font
    // arrives later, re-lay the headline with it.
    let begun = false;
    const begin = () => {
      if (begun || !running) return;
      begun = true;
      fontReady = true;
      resize(true);
      if (!reduce) raf = requestAnimationFrame(loop);
    };
    const fontLoad = document.fonts.load('700 100px "Space Grotesk"');
    const fallback = window.setTimeout(begin, 1200);
    fontLoad.finally(() => {
      window.clearTimeout(fallback);
      if (begun) { if (running) resize(false); } else begin();
    });

    return () => {
      running = false;
      window.clearTimeout(fallback);
      cancelAnimationFrame(raf);
      themeObs.disconnect();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerleave', onLeave);
      wrap.removeEventListener('pointerdown', onDown);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative isolate flex flex-col justify-center overflow-hidden sm:min-h-[100svh]" style={{ background: 'rgb(var(--bg))' }}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:linear-gradient(to_bottom,black_75%,transparent)]"
      />

      {/* corner brackets + HUD, like a viewfinder */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-3 bottom-3 top-[84px] sm:inset-x-6 sm:bottom-6 sm:top-[96px]">
        <span className="absolute left-0 top-0 h-5 w-5 border-l border-t border-ink/40" />
        <span className="absolute right-0 top-0 h-5 w-5 border-r border-t border-ink/40" />
        <span className="absolute bottom-0 left-0 h-5 w-5 border-b border-l border-ink/40" />
        <span className="absolute bottom-0 right-0 h-5 w-5 border-b border-r border-ink/40" />
        <div className="absolute left-7 top-1 hidden font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/45 sm:block">
          NX / dot matrix <span className="ml-2 text-clay">●</span> live
        </div>
        <div className="absolute right-7 top-1 hidden font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/45 sm:block">
          dots <span ref={hudCount}>0000</span> · frame <span ref={hudPhrase}>01/03</span>
        </div>
        <div className="absolute bottom-1 left-7 hidden font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/45 sm:block">
          <span ref={hudPos}>X0000 Y0000</span>
        </div>
        <div className="absolute bottom-1 right-7 hidden font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink/45 sm:block">
          move to disturb · click to pulse
        </div>
      </div>

      {/* The slot the headline dots are laid into. The real text is for screen readers. */}
      <div className="px-5 pb-16 pt-24 sm:px-10 sm:pb-10 sm:pt-[92px]">
        {eyebrow && <div className="text-center">{eyebrow}</div>}
        <h1 className="sr-only">Sit the paper before the paper.</h1>
        <div ref={slotRef} className="mx-auto mt-3 h-[200px] max-w-[1180px] select-none sm:h-[clamp(180px,calc(100svh_-_395px),440px)]" />
        {children}
      </div>
    </div>
  );
};

export default DotHero;
