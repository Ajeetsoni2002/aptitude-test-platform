# Nexus design guide

How the frontend should look and read. If you are adding or changing a page, skim this first.

## The idea

An exam desk. Light mode is warm answer-sheet paper with black ink. Dark mode is the same desk at night. The accent colour is the blue of a ballpoint pen. Red is the examiner's pen (wrong answers, danger). Green is the tick. The logo is a hand-filled OMR bubble.

The product should feel like a well-made study tool: calm, precise, a little bookish. It should not feel like a sci-fi dashboard. That means:

- **No** neon, glows, glassmorphism or blur panels, gradient text, animated grids or scanlines, floating particles, or rainbow gradients.
- **No** copy like "neural", "quantum", "initialize session", "command grid", "telemetry", "AI-powered", or "classified". Say what the thing does in plain words.
- **No** emoji in UI text. Use lucide icons sparingly, and only where they help scanning.
- **No** made-up numbers ("50,000+ students"). Only show stats that come from real data.

## Tokens

Every colour is a CSS variable (see `src/index.css`), exposed to Tailwind in `tailwind.config.js`. All of them switch with the theme automatically.

| Use | Tailwind | Notes |
| --- | --- | --- |
| Page background | `bg-canvas` | warm paper / near-black |
| Card / panel | `bg-surface` + `border border-line` | the default container |
| Sidebar, wells, subtle fills | `bg-raised` | one step off the canvas |
| Main text | `text-ink` | |
| Secondary text | `text-ink/60` | body copy under headings |
| Tertiary text, captions | `text-ink/45` – `text-ink/50` | don't go below /40 for text |
| Hairlines | `border-line`, or `border-ink/10` | |
| Primary accent (pen blue) | `text-brand`, `bg-brand`, `bg-brand/10` | links, primary buttons, selected state |
| Text on a solid fill | `text-on-brand` | use on `bg-brand`, `bg-bad`, `bg-ok`, `bg-clay` |
| Correct / success | `text-ok`, `bg-ok/10` | |
| Warning | `text-warn`, `bg-warn/10` | |
| Wrong / danger | `text-bad`, `bg-bad/10` | |
| Extra category colours | `text-plum`, `text-clay` | only when you need more than one series |
| Literal white / black | `bg-snow`, `bg-coal` | rare: toggle knobs, camera backgrounds |

Legacy names still work and follow the theme:

- `white` means ink and `black` means paper. So `text-white/60` is fine, and so is `bg-white/5` as a subtle fill.
- `zinc-*`, `slate-*` and `gray-*` map to an ink scale that inverts in light mode.
- `neon-cyan` maps to brand, `neon-violet` to plum, `neon-magenta` to clay, and `neon-green`/`neon-amber`/`neon-red` to ok/warn/bad.
- `cyber-black` maps to canvas, `cyber-surface` to surface, and `cyber-panel` to raised.

Prefer the new names in new code.

**Never hard-code hex or rgba colours in components.** In inline styles use `rgb(var(--brand))` or `rgb(var(--ink) / .5)`. For Recharts, use `useChartColors()`, which returns `series`, `palette`, `tickFill`, `gridStroke`, `tooltipStyle` and `surface` for the current theme.

## Type

- **Fraunces** (`font-display`) for page titles, big numbers (scores, stats, timers on result pages) and the wordmark. Use weight 500–600. Don't use it for all-caps or wide tracking.
- **IBM Plex Sans** (default body font) for everything else.
- **IBM Plex Mono** (`font-mono`) for timers during a test, question numbers, codes, and small tabular data. For small uppercase labels use the `label-caps` class.
- `font-orbitron` and `font-inter` are legacy aliases for display and sans. Replace them when you touch a file.
- Sentence case everywhere: "Start a test", not "START TEST" or "Start Test".
- No `tracking-widest` on body text.

Sizes:

| Element | Classes |
| --- | --- |
| Page title | `font-display text-[28px] md:text-[32px] font-semibold tracking-tight` |
| Section title | `text-base font-semibold` |
| Body | `text-[15px]` |
| Secondary | `text-[13px] text-ink/60` |

## Components

Reuse these before writing new markup:

- `HoloButton`: variant `cyan` is the primary blue button. `violet` is solid ink, `ghost` is outlined, `danger` is red, `magenta` is clay.
- `CyberInput` is the labelled text input. The raw classes are `cyber-input` / `admin-input`.
- `NeonCard` is the plain surface card, and `StatCard` is the label + big number card.
- `ProgressRing`, `LoadingSpinner` and `NeuralAvatar` (initials or photo).
- `ThemeToggle` and the `Wordmark` / `BrandMark` from `components/brand/BrandMark`.
- `AuthShell`, `AuthHeading`, `AuthNotice` and `PasswordMeter` from `components/layout/AuthShell` for login, sign-up and other account pages.
- For admin pages: `AdminPage`, `AdminPageHeader`, `AdminPanel`, `AdminMetricCard`, `AdminStatusBadge`, `AdminEmptyState` and `AdminToggle` from `components/admin/AdminUI`.
- CSS classes: `admin-table`, `admin-tab[data-active]`, `admin-chip`, `admin-dropzone`, `answer-option(.selected|.correct|.wrong)`, `nav-item(.active)`, `graph-paper`, `ruled`, `marker`.

## Shape and motion

- **Radius:** 14px for cards, 10px for inputs and buttons, 8px for small controls, and full rounding for pills and avatars.
- **Elevation:** a 1px `border-line` does most of the work. Use `shadow-soft` on cards, and `shadow-lift`/`shadow-float` only for popovers and modals.
- **Motion:** 150–300ms fades and small slides. No bouncing, spinning, floating or pulsing decoration. Users with `prefers-reduced-motion` get no animation.

## Writing

- Short and specific: "3 tab switches and the test submits itself" beats "Advanced AI-powered integrity enforcement".
- Talk to the student as "you". Avoid hype words: revolutionary, cutting-edge, seamless, unleash, supercharge, next-gen.
- Empty states say what's missing and what to do next: "No attempts yet. Your first test result will show up here."
- Error messages say what happened and how to fix it.
