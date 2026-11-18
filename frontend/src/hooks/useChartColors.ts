// src/hooks/useChartColors.ts
// Theme-aware chart colours. Recharts writes colours as SVG attributes,
// where CSS variables are not reliable, so this hook returns concrete
// values for the current theme. Keep these in sync with src/index.css.
// Monochrome first: ink, then signal red, then grey; green/amber for status.

import { useThemeStore } from '@/store/themeStore';

export interface ChartSeries {
  accent: string;
  plum: string;
  clay: string;
  green: string;
  amber: string;
  red: string;
  ink: string;
  muted: string;
}

export interface ChartColors {
  /** Axis tick label fill color */
  tickFill: string;
  /** Secondary tick fill (slightly dimmer) */
  tickFillDim: string;
  /** Grid line stroke color */
  gridStroke: string;
  /** Tooltip background style object */
  tooltipStyle: React.CSSProperties;
  /** Tooltip text color */
  tooltipTextColor: string;
  /** Tooltip label color (dimmer) */
  tooltipLabelColor: string;
  /** Dot stroke color for area charts (matches the card surface) */
  dotStroke: string;
  /** Series palette, in the order charts should use it */
  series: ChartSeries;
  /** Same palette as an array, for pie / bar cells */
  palette: string[];
  /** Card surface colour, for gradients that fade into the card */
  surface: string;
}

const DARK: ChartSeries = {
  accent: '#FFFFFF',
  plum:   '#969696',
  clay:   '#EB2D32',
  green:  '#5ACD82',
  amber:  '#EBB946',
  red:    '#FF5050',
  ink:    '#FFFFFF',
  muted:  '#737373',
};

const LIGHT: ChartSeries = {
  accent: '#000000',
  plum:   '#737373',
  clay:   '#D71921',
  green:  '#168046',
  amber:  '#A06900',
  red:    '#CD1E28',
  ink:    '#000000',
  muted:  '#969696',
};

export function useChartColors(): ChartColors {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const series = isLight ? LIGHT : DARK;
  const surface = isLight ? '#FFFFFF' : '#111111';

  return {
    tickFill:    isLight ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.5)',
    tickFillDim: isLight ? 'rgba(0, 0, 0, 0.42)' : 'rgba(255, 255, 255, 0.38)',
    gridStroke:  isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',

    tooltipStyle: {
      background: surface,
      border: `1px solid ${isLight ? '#DADADA' : '#282828'}`,
      borderRadius: '8px',
      fontFamily: "'Space Mono', monospace",
      fontSize: '12px',
      boxShadow: isLight ? '0 8px 24px -12px rgba(24,24,22,0.25)' : '0 8px 24px -12px rgba(0,0,0,0.7)',
      padding: '8px 12px',
    },

    tooltipTextColor:  isLight ? 'rgba(0, 0, 0, 0.92)' : 'rgba(255, 255, 255, 0.92)',
    tooltipLabelColor: isLight ? 'rgba(0, 0, 0, 0.55)' : 'rgba(255, 255, 255, 0.5)',

    dotStroke: surface,
    series,
    palette: [series.accent, series.clay, series.plum, series.green, series.amber, series.red],
    surface,
  };
}
