// Neural Scan scoring + generative "neural signature" art.
// The signature is a damped harmonograph whose frequencies, phases and
// decay are derived from the visitor's answers and timings, so no two
// scans draw the same curve.

import type { Domain, ScanQuestion } from '../data';

export interface ScanAnswer {
  id: string;
  domain: Domain;
  correct: boolean;
  ms: number;
  choice: number;
}

export interface Archetype {
  name: string;
  blurb: string;
  color: string;
}

export interface ScanResult {
  answers: ScanAnswer[];
  total: number;
  answered: number;
  accuracy: number;
  avgMs: number;
  speed: number;
  index: number;
  domain: Record<Domain, number>;
  archetype: Archetype;
  hash: string;
  seed: number;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function fnv1a(str: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function computeResult(answers: ScanAnswer[], questions: ScanQuestion[]): ScanResult {
  const total = questions.length;
  const answered = answers.length;
  const correct = answers.filter((a) => a.correct).length;
  const accuracy = total ? correct / total : 0;
  const avgMs = answered ? answers.reduce((s, a) => s + a.ms, 0) / answered : 0;
  const speed = answered ? clamp01(1 - (avgMs - 5000) / 15000) : 0;
  const index = Math.round(accuracy * 700 + speed * 300 * accuracy);

  const domain = { quant: 0, logic: 0, verbal: 0 } as Record<Domain, number>;
  (Object.keys(domain) as Domain[]).forEach((d) => {
    const qs = questions.filter((q) => q.domain === d);
    if (!qs.length) return;
    const sum = qs.reduce((s, q) => {
      const a = answers.find((x) => x.id === q.id);
      if (!a) return s;
      const qSpeed = clamp01(1 - (a.ms - 3000) / 17000);
      return s + (a.correct ? 55 + 45 * qSpeed : 8);
    }, 0);
    domain[d] = Math.round(sum / qs.length);
  });

  const fast = answered > 0 && avgMs <= 11000;
  const sharp = accuracy >= 0.67;
  const archetype: Archetype = sharp
    ? fast
      ? { name: 'Neural Sprinter', blurb: 'Fast and precise. You are built for speed rounds where every second is a mark.', color: '#00F5FF' }
      : { name: 'The Architect', blurb: 'Methodical and exact. Shave off a few seconds per question and you become lethal.', color: '#A970FF' }
    : fast
      ? { name: 'The Maverick', blurb: 'Sharp instincts with a few misfires. Accuracy drills are your biggest unlock.', color: '#FF3DBB' }
      : { name: 'The Explorer', blurb: 'Still calibrating, which means the steepest gains are right ahead of you.', color: '#FFB800' };

  const raw = answers.map((a) => `${a.id}:${a.choice}:${Math.round(a.ms / 50)}`).join('|') + `|${Date.now()}`;
  const seed = fnv1a(raw);
  const hex = seed.toString(16).toUpperCase().padStart(8, '0');

  return {
    answers,
    total,
    answered,
    accuracy,
    avgMs,
    speed,
    index,
    domain,
    archetype,
    hash: `${hex.slice(0, 4)}-${hex.slice(4)}`,
    seed,
  };
}

// ── Harmonograph path (normalised to roughly −1…1) ───────────────
export function signaturePoints(r: ScanResult) {
  const rng = mulberry32(r.seed);
  const det = () => (rng() - 0.5) * 0.024;
  const f1 = 2 + Math.round(r.accuracy * 3) + det();
  const f2 = 3 + Math.floor(r.domain.logic / 40) + det();
  const f3 = 2 + Math.round(r.speed * 3) + det();
  const f4 = 3 + Math.floor(r.domain.verbal / 40) + det();
  const choiceSum = r.answers.reduce((s, a) => s + a.choice + 1, 0);
  const p1 = rng() * Math.PI * 2;
  const p2 = (choiceSum % 7) * 0.45 + rng();
  const p3 = rng() * Math.PI * 2;
  const p4 = (r.domain.quant / 100) * Math.PI + rng();
  const d1 = 0.0014 + rng() * 0.002;
  const d2 = 0.0014 + rng() * 0.002;

  const T = 250;
  const step = 0.036;
  const count = Math.floor(T / step);
  const pts = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const t = i * step;
    const e1 = Math.exp(-d1 * t);
    const e2 = Math.exp(-d2 * t);
    pts[i * 2] = 0.5 * Math.sin(f1 * t + p1) * e1 + 0.5 * Math.sin(f2 * t + p2) * e2;
    pts[i * 2 + 1] = 0.5 * Math.sin(f3 * t + p3) * e2 + 0.5 * Math.sin(f4 * t + p4) * e1;
  }
  return pts;
}

const STOPS = [
  [0, 245, 255],
  [124, 140, 255],
  [169, 112, 255],
  [255, 61, 187],
];

function colorAt(t: number, alpha: number) {
  const seg = clamp01(t) * (STOPS.length - 1);
  const k = Math.min(STOPS.length - 2, Math.floor(seg));
  const f = seg - k;
  const c = STOPS[k].map((v, j) => Math.round(v + (STOPS[k + 1][j] - v) * f));
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}

// Draw points [fromIdx, toIdx) — call repeatedly to animate the pen.
export function drawSignatureRange(
  ctx: CanvasRenderingContext2D,
  pts: Float32Array,
  fromIdx: number,
  toIdx: number,
  cx: number,
  cy: number,
  radius: number,
  lineWidth = 1,
) {
  const count = pts.length / 2;
  const end = Math.min(toIdx, count);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  const CHUNK = 36;
  for (let s = Math.max(1, fromIdx); s < end; s += CHUNK) {
    const e = Math.min(end, s + CHUNK);
    const t = s / count;
    ctx.strokeStyle = colorAt(t, 0.75 - t * 0.35);
    ctx.beginPath();
    ctx.moveTo(cx + pts[(s - 1) * 2] * radius, cy + pts[(s - 1) * 2 + 1] * radius);
    for (let i = s; i < e; i++) ctx.lineTo(cx + pts[i * 2] * radius, cy + pts[i * 2 + 1] * radius);
    ctx.stroke();
  }
  ctx.restore();
}

// ── Shareable PNG card ───────────────────────────────────────────
export async function downloadSignatureCard(r: ScanResult) {
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#04040a';
  ctx.fillRect(0, 0, W, H);
  const g1 = ctx.createRadialGradient(W * 0.5, 520, 0, W * 0.5, 520, 620);
  g1.addColorStop(0, 'rgba(124,92,255,0.22)');
  g1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 54) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 54) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const pts = signaturePoints(r);
  drawSignatureRange(ctx, pts, 1, pts.length / 2, W / 2, 520, 380, 1.6);

  const mono = '"JetBrains Mono", ui-monospace, monospace';
  const sans = '"Geist Variable", Inter, system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#00F5FF';
  ctx.font = `600 24px ${mono}`;
  ctx.fillText('NEXUS · NEURAL SIGNATURE', 72, 96);
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(226,232,245,0.5)';
  ctx.fillText(`SIG·${r.hash}`, W - 72, 96);
  ctx.textAlign = 'left';

  ctx.fillStyle = 'rgba(226,232,245,0.5)';
  ctx.font = `500 24px ${mono}`;
  ctx.fillText('ARCHETYPE', 72, 1000);
  ctx.fillStyle = r.archetype.color;
  ctx.font = `700 92px ${sans}`;
  ctx.fillText(r.archetype.name, 68, 1092);

  const metrics: [string, string][] = [
    [`${Math.round(r.accuracy * 100)}%`, 'ACCURACY'],
    [r.answered ? `${(r.avgMs / 1000).toFixed(1)}s` : '—', 'AVG / QUESTION'],
    [`${r.index}`, 'NEURAL INDEX'],
  ];
  metrics.forEach(([v, l], i) => {
    const x = 72 + i * 320;
    ctx.fillStyle = '#eef1f8';
    ctx.font = `650 64px ${sans}`;
    ctx.fillText(v, x, 1200);
    ctx.fillStyle = 'rgba(226,232,245,0.45)';
    ctx.font = `500 20px ${mono}`;
    ctx.fillText(l, x, 1236);
  });

  ctx.fillStyle = 'rgba(226,232,245,0.4)';
  ctx.font = `500 20px ${mono}`;
  ctx.fillText(`Take your own scan → ${window.location.host}`, 72, H - 48);

  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nexus-signature-${r.hash}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
