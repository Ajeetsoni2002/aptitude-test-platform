/** @type {import('tailwindcss').Config} */

// ─────────────────────────────────────────────────────────────
// Design tokens live in src/index.css as CSS variables (one set for
// dark, one for html.light). Every colour here points at a variable,
// so a component written once works in both themes.
//
// Legacy names (white, zinc, cyber-*, neon-*) are kept on purpose and
// re-pointed at the new tokens, so older markup follows the theme:
//   white  -> ink   (main text colour; dark in light mode)
//   black  -> paper (page colour; white in light mode)
//   zinc / slate / gray -> an ink scale that inverts between themes
// See DESIGN.md for the full guide.
// ─────────────────────────────────────────────────────────────

const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

const inkScale = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((s) => [s, v(`z-${s}`)])
);

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Core tokens ──────────────────────────────
        ink:      v("ink"),
        paper:    v("paper"),
        canvas:   v("bg"),
        surface:  v("surface"),
        raised:   v("raised"),
        line:     v("line"),
        brand:    v("brand"),
        "on-brand": v("on-brand"),
        plum:     v("plum"),
        clay:     v("clay"),
        ok:       v("green"),
        warn:     v("amber"),
        bad:      v("red"),
        snow:     "#ffffff",
        coal:     "#000000",

        // ── Legacy aliases (follow the theme) ────────
        white: v("ink"),
        black: v("paper"),
        zinc:  inkScale,
        slate: inkScale,
        gray:  inkScale,

        cyber: {
          black:   v("bg"),
          darker:  v("bg"),
          surface: v("surface"),
          panel:   v("raised"),
          border:  v("line"),
          muted:   v("z-700"),
        },
        neon: {
          cyan:    v("brand"),
          blue:    v("brand"),
          violet:  v("plum"),
          magenta: v("clay"),
          green:   v("green"),
          amber:   v("amber"),
          red:     v("red"),
          "cyan-dim":    v("brand"),
          "magenta-dim": v("clay"),
          "violet-dim":  v("plum"),
        },

        // ── Shadcn compatibility ─────────────────────
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary:     { DEFAULT: "hsl(var(--primary))",     foreground: "hsl(var(--primary-foreground))" },
        secondary:   { DEFAULT: "hsl(var(--secondary))",   foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted:       { DEFAULT: "hsl(var(--muted))",       foreground: "hsl(var(--muted-foreground))" },
        accent:      { DEFAULT: "hsl(var(--accent))",      foreground: "hsl(var(--accent-foreground))" },
        popover:     { DEFAULT: "hsl(var(--popover))",     foreground: "hsl(var(--popover-foreground))" },
        card:        { DEFAULT: "hsl(var(--card))",        foreground: "hsl(var(--card-foreground))" },
      },

      fontFamily: {
        // Doto (dot-matrix) for display, Space Mono for labels, Space Grotesk for text.
        display:  ["Doto", "'Space Mono'", "monospace"],
        sans:     ["'Space Grotesk'", "system-ui", "sans-serif"],
        mono:     ["'Space Mono'", "ui-monospace", "monospace"],
        // legacy names
        orbitron: ["Doto", "'Space Mono'", "monospace"],
        inter:    ["'Space Grotesk'", "system-ui", "sans-serif"],
      },

      backgroundImage: {
        // legacy names, now quiet
        "cyber-gradient":   "none",
        "hero-gradient":    "none",
        "sidebar-gradient": "none",
        "glass-surface":    "none",
        "card-gradient":    "none",
        "button-cyan":      "none",
        "button-magenta":   "none",
        "button-violet":    "none",
        "neon-cyan-glow":   "none",
        "neon-violet-glow": "none",
        "neon-magenta-glow":"none",
      },

      boxShadow: {
        soft:   "var(--shadow-sm)",
        lift:   "var(--shadow-md)",
        float:  "var(--shadow-lg)",
        // legacy names, now plain elevation
        "neon-cyan":    "var(--shadow-md)",
        "neon-magenta": "var(--shadow-md)",
        "neon-violet":  "var(--shadow-md)",
        "neon-green":   "var(--shadow-md)",
        "neon-amber":   "var(--shadow-md)",
        glass:          "var(--shadow-sm)",
        "glass-strong": "var(--shadow-lg)",
        "card-hover":   "var(--shadow-md)",
        "inner-glow":   "none",
      },

      keyframes: {
        "fade-up":  { "0%": { opacity: "0", transform: "translateY(10px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in":  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-in-left":  { "0%": { transform: "translateX(-16px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        "slide-in-right": { "0%": { transform: "translateX(16px)", opacity: "0" },  "100%": { transform: "translateX(0)", opacity: "1" } },
        "ring-spin":         { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        "ring-spin-reverse": { from: { transform: "rotate(360deg)" }, to: { transform: "rotate(0deg)" } },
        "score-reveal": { "0%": { transform: "scale(0.92)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        "count-up":     { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "expand-width": { "0%": { width: "0%" }, "100%": { width: "var(--target-width, 100%)" } },
        shimmer:  { "0%": { "background-position": "-200% 0" }, "100%": { "background-position": "200% 0" } },
        blink:    { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
        pulse:    { "0%, 100%": { opacity: "1" }, "50%": { opacity: ".55" } },
        scan:     { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(100vh)" } },
      },

      animation: {
        "fade-up":        "fade-up 0.45s cubic-bezier(.2,.7,.2,1) both",
        "fade-up-delay":  "fade-up 0.45s cubic-bezier(.2,.7,.2,1) 0.12s both",
        "fade-in":        "fade-in 0.35s ease-out both",
        "slide-in-left":  "slide-in-left 0.3s ease-out both",
        "slide-in-right": "slide-in-right 0.3s ease-out both",
        "ring-spin":         "ring-spin 0.9s linear infinite",
        "ring-spin-reverse": "ring-spin-reverse 1.2s linear infinite",
        "score-reveal":   "score-reveal 0.5s cubic-bezier(.2,.7,.2,1) both",
        "count-up":       "count-up 0.4s ease-out both",
        shimmer:          "shimmer 2s linear infinite",
        blink:            "blink 1s step-end infinite",
        // legacy names: motion kept calm on purpose
        "neon-pulse":     "pulse 2.4s ease-in-out infinite",
        "neon-glow":      "none",
        float:            "none",
        "float-slow":     "none",
        scan:             "none",
        "orb-pulse":      "none",
        "border-flow":    "none",
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      spacing: {
        sidebar: "248px",
        "sidebar-compact": "72px",
      },

      transitionDuration: { 400: "400ms", 600: "600ms", 800: "800ms" },
    },
  },
  plugins: [],
};
