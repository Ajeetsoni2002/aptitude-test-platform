// Point-cloud generators for the hero "Neural Core".
// Every generator returns `n` xyz triplets roughly inside a unit sphere.

export const CORE_SHAPE_LABELS = ['NEURAL CORE', 'QUANTITATIVE', 'LOGICAL', 'VERBAL', 'YOUR PATTERN'] as const;
export const CORE_SHAPE_COUNT = CORE_SHAPE_LABELS.length;

export const coreParticleCount = () => (window.innerWidth < 768 ? 1300 : 2400);

const jitter = (amount: number) => (Math.random() - 0.5) * amount;

function rotate(points: Float32Array, ax: number, ay: number, az: number) {
  const [cx, sx, cy, sy, cz, sz] = [Math.cos(ax), Math.sin(ax), Math.cos(ay), Math.sin(ay), Math.cos(az), Math.sin(az)];
  for (let i = 0; i < points.length; i += 3) {
    let x = points[i];
    let y = points[i + 1];
    let z = points[i + 2];
    // X
    let t = y * cx - z * sx;
    z = y * sx + z * cx;
    y = t;
    // Y
    t = x * cy + z * sy;
    z = -x * sy + z * cy;
    x = t;
    // Z
    t = x * cz - y * sz;
    y = x * sz + y * cz;
    x = t;
    points[i] = x;
    points[i + 1] = y;
    points[i + 2] = z;
  }
  return points;
}

// Fibonacci sphere with soft "cortex" folds.
function sphere(n: number) {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const fold = 1 + 0.07 * Math.sin(x * 7 + y * 5) * Math.cos(z * 6 - y * 3);
    out[i * 3] = x * fold * 1.04;
    out[i * 3 + 1] = y * fold * 0.94;
    out[i * 3 + 2] = z * fold;
  }
  return out;
}

// Sample the filled pixels of a glyph and extrude it into a thin slab.
function glyph(text: string, n: number, fit = 2.1): Float32Array | null {
  const W = 440;
  const H = 300;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return null;

  const font = (s: number) => `800 ${s}px "Geist Variable", Inter, system-ui, sans-serif`;
  let size = 260;
  g.font = font(size);
  const measured = g.measureText(text).width;
  if (measured > W * 0.9) {
    size = Math.floor((size * W * 0.9) / measured);
    g.font = font(size);
  }
  g.fillStyle = '#fff';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, W / 2, H / 2);

  const data = g.getImageData(0, 0, W, H).data;
  const pts: number[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 140) {
        pts.push(x, y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const count = pts.length / 2;
  if (count < 150) return null;

  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const scale = fit / Math.max(maxX - minX, maxY - minY);
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const k = Math.floor(Math.random() * count);
    out[i * 3] = (pts[k * 2] - midX + jitter(2)) * scale;
    out[i * 3 + 1] = -(pts[k * 2 + 1] - midY + jitter(2)) * scale;
    out[i * 3 + 2] = jitter(0.34);
  }
  return out;
}

// Two nested cubes joined at the corners (a tesseract projection).
function cube(n: number) {
  const verts = (s: number) => {
    const v: number[][] = [];
    for (const x of [-s, s]) for (const y of [-s, s]) for (const z of [-s, s]) v.push([x, y, z]);
    return v;
  };
  const edges: number[][] = [];
  const addCube = (s: number) => {
    const v = verts(s);
    for (let a = 0; a < 8; a++) {
      for (let b = a + 1; b < 8; b++) {
        let diff = 0;
        for (let k = 0; k < 3; k++) if (v[a][k] !== v[b][k]) diff++;
        if (diff === 1) edges.push([...v[a], ...v[b]]);
      }
    }
    return v;
  };
  const outer = addCube(0.8);
  const inner = addCube(0.38);
  for (let i = 0; i < 8; i++) edges.push([...outer[i], ...inner[i]]);

  const lens = edges.map((e) => Math.hypot(e[3] - e[0], e[4] - e[1], e[5] - e[2]));
  const total = lens.reduce((a, b) => a + b, 0);
  const corners = [...outer, ...inner];
  const out = new Float32Array(n * 3);

  for (let i = 0; i < n; i++) {
    // ~7% of points cluster on corners → bright "nodes"
    if (Math.random() < 0.07) {
      const v = corners[Math.floor(Math.random() * corners.length)];
      out[i * 3] = v[0] + jitter(0.06);
      out[i * 3 + 1] = v[1] + jitter(0.06);
      out[i * 3 + 2] = v[2] + jitter(0.06);
      continue;
    }
    let r = Math.random() * total;
    let k = 0;
    while (k < edges.length - 1 && r > lens[k]) {
      r -= lens[k];
      k++;
    }
    const e = edges[k];
    const t = Math.random();
    out[i * 3] = e[0] + (e[3] - e[0]) * t + jitter(0.014);
    out[i * 3 + 1] = e[1] + (e[4] - e[1]) * t + jitter(0.014);
    out[i * 3 + 2] = e[2] + (e[5] - e[2]) * t + jitter(0.014);
  }
  return rotate(out, 0.55, 0.7, 0);
}

// DNA double helix with rungs.
function helix(n: number) {
  const out = new Float32Array(n * 3);
  const turns = 2.3;
  const R = 0.52;
  const height = 2.3;
  const rungs = 22;
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    let z: number;
    if (i % 6 < 4) {
      const t = Math.random();
      const ang = t * turns * Math.PI * 2 + (i % 2 ? Math.PI : 0);
      y = (t - 0.5) * height;
      x = Math.cos(ang) * R;
      z = Math.sin(ang) * R;
    } else {
      const k = Math.floor(Math.random() * rungs);
      const t = (k + 0.5) / rungs;
      const ang = t * turns * Math.PI * 2;
      const s = 1 - 2 * Math.random();
      y = (t - 0.5) * height;
      x = Math.cos(ang) * R * s;
      z = Math.sin(ang) * R * s;
    }
    out[i * 3] = x + jitter(0.03);
    out[i * 3 + 1] = y + jitter(0.03);
    out[i * 3 + 2] = z + jitter(0.03);
  }
  return rotate(out, 0, 0, 0.42);
}

// Random cloud far outside the core — the intro "gathers" from here.
export function scatter(n: number) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = 2.4 + Math.random() * 3.2;
    const s = Math.sqrt(1 - u * u);
    out[i * 3] = Math.cos(th) * s * r;
    out[i * 3 + 1] = u * r;
    out[i * 3 + 2] = Math.sin(th) * s * r;
  }
  return out;
}

export function buildShape(index: number, n: number): Float32Array {
  switch (index) {
    case 1:
      return glyph('Σ', n, 2.0) ?? sphere(n);
    case 2:
      return cube(n);
    case 3:
      return glyph('Aa', n, 2.3) ?? sphere(n);
    case 4:
      return helix(n);
    default:
      return sphere(n);
  }
}
