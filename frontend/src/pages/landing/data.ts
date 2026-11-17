// Landing page static content.
// Scan questions are hand-verified — every `answer` index and `why` line has been checked.

export type Domain = 'quant' | 'logic' | 'verbal';

export interface ScanQuestion {
  id: string;
  domain: Domain;
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export const DOMAIN_META: Record<Domain, { label: string; color: string }> = {
  quant: { label: 'Quantitative', color: '#00F5FF' },
  logic: { label: 'Logical', color: '#A970FF' },
  verbal: { label: 'Verbal', color: '#FF3DBB' },
};

export const SCAN_POOL: ScanQuestion[] = [
  // ── Quantitative ───────────────────────────────────────────────
  { id: 'q1', domain: 'quant', q: 'A train covers 360 km in 4 hours. What is its speed in m/s?', options: ['20 m/s', '25 m/s', '30 m/s', '90 m/s'], answer: 1, why: '360 ÷ 4 = 90 km/h, and 90 × 5/18 = 25 m/s.' },
  { id: 'q2', domain: 'quant', q: 'Goods are marked 40% above cost and sold at a 25% discount. The result is…', options: ['5% profit', '5% loss', '10% profit', '15% profit'], answer: 0, why: 'CP 100 → MP 140 → SP 105. That is a 5% profit.' },
  { id: 'q3', domain: 'quant', q: 'Two successive discounts of 20% and 10% equal a single discount of…', options: ['30%', '28%', '32%', '26%'], answer: 1, why: '100 → 80 → 72, so the total discount is 28%.' },
  { id: 'q4', domain: 'quant', q: 'x + y = 20 and xy = 96. What is |x − y|?', options: ['2', '4', '6', '8'], answer: 1, why: '(x − y)² = 20² − 4·96 = 16, so |x − y| = 4.' },
  { id: 'q5', domain: 'quant', q: 'What is 15% of 15% of 400?', options: ['6', '9', '12', '22.5'], answer: 1, why: '0.15 × 0.15 × 400 = 9.' },
  { id: 'q6', domain: 'quant', q: 'A pipe fills a tank in 8 h; a leak empties it in 12 h. With both open, the tank fills in…', options: ['20 h', '16 h', '24 h', '18 h'], answer: 2, why: '1/8 − 1/12 = 1/24, so 24 hours.' },

  // ── Logical ────────────────────────────────────────────────────
  { id: 'l1', domain: 'logic', q: 'What comes next? 2, 6, 12, 20, 30, …', options: ['40', '42', '44', '46'], answer: 1, why: 'The pattern is n(n+1): 6 × 7 = 42.' },
  { id: 'l2', domain: 'logic', q: 'What comes next? 3, 6, 11, 18, 27, …', options: ['36', '38', '40', '42'], answer: 1, why: 'The gaps grow by 2: +3, +5, +7, +9, +11, giving 38.' },
  { id: 'l3', domain: 'logic', q: 'Riya is 6th from the top and 5th from the bottom of her class. How many students are there?', options: ['9', '10', '11', '12'], answer: 1, why: '6 + 5 − 1 = 10.' },
  { id: 'l4', domain: 'logic', q: 'Odd one out: 121, 169, 196, 225, 270', options: ['121', '196', '225', '270'], answer: 3, why: 'Every number except 270 is a perfect square.' },
  { id: 'l5', domain: 'logic', q: 'All roses are flowers. Some flowers fade quickly. Therefore…', options: ['All roses fade quickly', 'Some roses fade quickly', 'No roses fade quickly', 'Nothing definite follows about roses'], answer: 3, why: 'The quickly fading flowers may or may not include any roses.' },
  { id: 'l6', domain: 'logic', q: 'If CAT = 24 (3 + 1 + 20), then DOG = ?', options: ['26', '24', '22', '28'], answer: 0, why: 'D(4) + O(15) + G(7) = 26.' },

  // ── Verbal ─────────────────────────────────────────────────────
  { id: 'v1', domain: 'verbal', q: 'Closest in meaning to PERSPICACIOUS:', options: ['Confused', 'Astute', 'Verbose', 'Sluggish'], answer: 1, why: 'Perspicacious means sharply perceptive, which is what astute means.' },
  { id: 'v2', domain: 'verbal', q: 'Opposite of LOQUACIOUS:', options: ['Talkative', 'Reserved', 'Expressive', 'Verbose'], answer: 1, why: 'Loquacious means very talkative, and reserved is its opposite.' },
  { id: 'v3', domain: 'verbal', q: 'Petal : Flower :: ?', options: ['Water : Glass', 'Page : Book', 'Wheel : Road', 'Ink : Paper'], answer: 1, why: 'Part to whole: a petal is part of a flower, a page is part of a book.' },
  { id: 'v4', domain: 'verbal', q: 'Pick the correctly spelt word:', options: ['Accomodate', 'Acommodate', 'Accommodate', 'Acomodate'], answer: 2, why: 'It takes a double c and a double m: accommodate.' },
  { id: 'v5', domain: 'verbal', q: 'Passive voice of "The teacher teaches the students":', options: ['The students are taught by the teacher', 'The students were taught by the teacher', 'The students have been taught', 'The students is taught by the teacher'], answer: 0, why: 'Simple present active becomes "are + past participle" in the passive.' },
];

export const SCAN_DURATION_S = 90;
export const SCAN_PER_DOMAIN = 2;

export const MARQUEE_TOP = ['Campus Placements', 'TCS NQT', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Capgemini', 'Off-campus Drives'];
export const MARQUEE_BOTTOM = ['Bank PO', 'SSC CGL', 'CAT Quant', 'GRE Quant', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation', 'Number Series'];

export const NAV_LINKS = [
  { id: 'scan', label: 'Neural Scan' },
  { id: 'features', label: 'Features' },
  { id: 'shield', label: 'Proctor Shield' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'journey', label: 'Journey' },
] as const;

export const scrollToId = (id: string) => {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
};
