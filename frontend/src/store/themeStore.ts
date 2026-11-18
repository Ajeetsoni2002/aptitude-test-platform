// frontend/src/store/themeStore.ts
// ─────────────────────────────────────────────────────────────
// Zustand Theme Store — Global Theme State Management
// Persists user's theme preference to localStorage
// ─────────────────────────────────────────────────────────────

import { create } from 'zustand';

// ─── localStorage Key ────────────────────────────────────────
const THEME_KEY = 'apt_theme';

// ─── Theme Type ─────────────────────────────────────────────
export type ThemeMode = 'dark' | 'light';

// Where the switch was triggered from. A React mouse event fits this
// shape, so handlers can pass the event straight through:
//   <button onClick={toggleTheme}>
// The new theme then spreads out from that point.
export type ThemeOrigin = { clientX: number; clientY: number };

// ─── Store State + Actions ka TypeScript Type ─────────────────
interface ThemeState {
  // State
  theme: ThemeMode;
  
  // Actions
  setTheme: (theme: ThemeMode, origin?: ThemeOrigin) => void;
  toggleTheme: (origin?: ThemeOrigin) => void;
  toggleThemeTemporarily: (origin?: ThemeOrigin) => void;
  initTheme: () => void;  // Call on app start to restore saved theme
}

// ─── Store Create karo ────────────────────────────────────────
export const useThemeStore = create<ThemeState>((set, get) => ({
  
  // ─── Initial State ─────────────────────────────────────────
  theme: 'dark',

  // ═══════════════════════════════════════════════════════════
  // ACTION: setTheme
  // Set the theme and persist to localStorage
  // Also apply to document element for Tailwind's darkMode
  // ═══════════════════════════════════════════════════════════
  setTheme: (theme: ThemeMode, origin?: ThemeOrigin) => {
    set({ theme });
    localStorage.setItem(THEME_KEY, theme);
    applyThemeAnimated(theme, origin);
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: toggleTheme
  // Switch between dark and light modes
  // ═══════════════════════════════════════════════════════════
  toggleTheme: (origin?: ThemeOrigin) => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme, origin);
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: toggleThemeTemporarily
  // Switch theme during test without persisting to localStorage
  // This allows flexible theme switching during tests without
  // overwriting the user's saved global preference
  // ═══════════════════════════════════════════════════════════
  toggleThemeTemporarily: (origin?: ThemeOrigin) => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    set({ theme: newTheme });
    applyThemeAnimated(newTheme, origin);
    // Note: Does NOT call localStorage.setItem - theme reverts on page reload
  },

  // ═══════════════════════════════════════════════════════════
  // ACTION: initTheme
  // App start hone pe call karo (App.tsx mein)
  // localStorage se saved theme fetch karo, not found ho to system setting use karo
  // ═══════════════════════════════════════════════════════════
  initTheme: () => {
    const savedTheme = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    // No saved choice yet: follow the operating system setting.
    const systemTheme: ThemeMode =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = (savedTheme && ['dark', 'light'].includes(savedTheme)) ? savedTheme : systemTheme;
    
    set({ theme });
    applyTheme(theme);
  },
}));

// ─── Helper: Apply theme to DOM ──────────────────────────────
// This function applies the theme by:
// 1. Adding/removing 'light' class on document element for custom CSS
// 2. Setting CSS variables for non-Tailwind components
function applyTheme(theme: ThemeMode) {
  const doc = document.documentElement;
  
  if (theme === 'light') {
    doc.classList.add('light');
  } else {
    doc.classList.remove('light');
  }
  
  // Optional: Set custom CSS variable for non-Tailwind components
  doc.style.setProperty('--theme-mode', theme);
}

// ─── Helper: Apply theme with the dot-matrix reveal ──────────
// Uses the View Transitions API: the browser snapshots the old page,
// we flip the theme, and CSS (see "Theme switch" in index.css) grows the
// new theme out of the click point with a dotted leading edge.
// Falls back to an instant switch where the API is missing or the user
// prefers reduced motion.
type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
};

function applyThemeAnimated(theme: ThemeMode, origin?: ThemeOrigin) {
  const doc = document as ViewTransitionDoc;
  const root = document.documentElement;
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const alreadyApplied = root.classList.contains('light') === (theme === 'light');

  if (!doc.startViewTransition || reduceMotion || alreadyApplied) {
    applyTheme(theme);
    return;
  }

  const x = origin && Number.isFinite(origin.clientX) ? origin.clientX : window.innerWidth / 2;
  const y = origin && Number.isFinite(origin.clientY) ? origin.clientY : window.innerHeight / 2;
  // Farthest corner, plus the width of the dotted band, so the reveal
  // ends with the whole screen covered.
  const max = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 170;

  root.style.setProperty('--vt-x', `${x}px`);
  root.style.setProperty('--vt-y', `${y}px`);
  root.style.setProperty('--vt-max', `${max}px`);
  root.classList.add('theme-switching');

  const transition = doc.startViewTransition(() => applyTheme(theme));
  transition.finished.finally(() => root.classList.remove('theme-switching'));
}
