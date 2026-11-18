# Nexus design guide

How the frontend should look and read. If you are adding or changing a page, skim this first.

## The idea

Monochrome and dot-matrix, in the spirit of a hardware product site.

- **Dark mode:** pure black with white ink.
- **Light mode:** the exact inverse: light grey with black ink. The toggle swaps one for the other.
- **Display face:** headings and big numbers use **Doto**, a dot-matrix face.
- **Labels:** buttons, navigation and labels are capitals in **Space Mono**.
- **Body text:** **Space Grotesk**.
- **Background:** a sparse grid of very faint dots, pinned to the viewport. It does not move when the page scrolls, and cards sit on top of it.

Colour is almost absent:

- Red is the single accent, and in tests it means "wrong".
- Green and amber appear only as status.
- Everything else is ink at different strengths.

Things to avoid:

- **No** neon, glows, glassmorphism or blur panels, gradient text, rainbow gradients, floating particles or decorative animation.
- **No** copy like "neural", "quantum", "initialize session", "command grid", "telemetry", "AI-powered" or "classified". Say what the thing does in plain words.
- **No** emoji in UI text.
- **No** made-up numbers. Only show stats that come from real data.

## Tokens

Every colour is a CSS variable (`src/index.css`), exposed to Tailwind in `tailwind.config.js`, and all of them switch with the theme.

| Use | Tailwind | Notes |
| --- | --- | --- |
| Page background, with dots | `bg-canvas` | black / light grey; paints the fixed dot grid |
| Card / panel | `bg-surface` | #111 / white; covers the dots |
| Sidebar, wells | `bg-raised` | one step off the canvas |
| Main text | `text-ink` | |
| Secondary text | `text-ink/60` | |
| Captions | `text-ink/45` – `text-ink/50` | don't go below /40 for text |
| Hairlines | `border-line` | |
| Primary (= ink) | `bg-brand` / `bg-ink`, `text-paper` on it | solid white button in dark, black in light |
| The accent | `text-clay`, `bg-clay` | signal red, use sparingly |
| Correct / warning / wrong | `text-ok`, `text-warn`, `text-bad` | status only |
| Second data series | `text-plum` | a mid grey |
| Literal white / black | `bg-snow`, `bg-coal` | toggle knobs, camera tiles |

Legacy names still work and follow the theme:

- `white` means ink and `black` means paper.
- `zinc-*`, `slate-*` and `gray-*` map to a neutral scale that inverts in light mode.
- `neon-*` and `cyber-*` map onto the tokens above.

**Never hard-code hex or rgba in components.** In inline styles use `rgb(var(--ink) / .5)` and similar. For charts, use `useChartColors()`; its series order is ink, red, grey, then green and amber.

## Type

- **Doto** (`font-display`): page titles, section titles, big numbers (scores, stats, timers on result screens), the wordmark.
  - Only at **24px and up**; below that the dots are too small to read.
  - Weight is fixed at full in CSS.
  - `h1`/`h2`/`h3` with `font-display` are set in capitals automatically.
  - There is no italic, so never put `italic` on it.
- **Space Mono** (`font-mono`, `label-caps`): buttons, nav, tabs, chips, table heads, timers during a test, codes, small labels.
  - Usually capitals with slight letter spacing.
  - `HoloButton`, `.btn-*`, `.nav-item`, `.admin-tab` and `.admin-chip` already do this.
- **Space Grotesk** (default body): sentences, descriptions, question text.

| Element | Classes |
| --- | --- |
| Page title | `font-display text-[28px] md:text-[32px]` (or larger on marketing pages) |
| Section title | `text-base font-semibold`, or `font-mono uppercase` for labels |
| Body | `text-[15px]` |
| Secondary | `text-[13px] text-ink/60` |

## Components

Reuse these before writing new markup:

- `HoloButton`: pill-shaped, Space Mono capitals. Variants `cyan`/`violet` are solid ink, `ghost` is outlined, `danger` is red.
- `CyberInput` is the labelled text input. The raw classes are `cyber-input` / `admin-input`.
- `NeonCard` is the plain surface card. `StatCard` shows a label with a big Doto number.
- `ProgressRing`, `LoadingSpinner` and `NeuralAvatar` (neutral initials or photo).
- `ThemeToggle` passes the click position to the theme store, so the new theme spreads out from the button.
- `Wordmark` / `BrandMark` from `components/brand/BrandMark` (Doto wordmark, dot-matrix "N").
- `AuthShell`, `AuthHeading`, `AuthNotice` and `PasswordMeter` from `components/layout/AuthShell`.
- For admin pages: `AdminPage`, `AdminPageHeader`, `AdminPanel`, `AdminMetricCard`, `AdminStatusBadge`, `AdminEmptyState` and `AdminToggle` from `components/admin/AdminUI`.
- CSS classes:
  - `admin-table`, `admin-tab[data-active]`, `admin-chip`, `admin-dropzone`
  - `answer-option(.selected|.correct|.wrong)`, `nav-item(.active)`
  - `ruled` (dotted rule lines), `marker` (inverted highlight), `dot-bar`
- The landing page adds `lp-row` (menu row), `LedText` (headline that switches on like an LED) and `Meter` (dot-matrix bar).

## Theme switch

`themeStore.setTheme` / `toggleTheme` accept an optional `{ clientX, clientY }`, so a click event can be passed straight through.

- They wrap the change in a View Transition. The new theme grows from that point as a circle with a dotted leading edge (see "Theme switch" in `index.css`).
- Browsers without the API, and users with reduced motion, get an instant switch.

## Shape and motion

- **Radius:** 10px for cards, 8px for inputs and rows, full rounding for buttons, pills and avatars.
- **Elevation:** flat. Cards are a surface colour, with a 1px `border-line` where they need separation. Shadows only for floating things (nav bar, popovers, modals).
- **Motion:** 150–300ms fades. Headlines may switch on character by character. Nothing bounces or floats. Users with `prefers-reduced-motion` get no animation.

## Writing

- Short and specific: "3 tab switches and the test submits itself" beats "Advanced AI-powered integrity enforcement".
- Talk to the student as "you". Avoid hype words: revolutionary, cutting-edge, seamless, unleash, supercharge, next-gen.
- Empty states say what is missing and what to do next.
- Error messages say what happened and how to fix it.
