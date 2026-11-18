// src/hooks/useChartColors.ts
// Theme-aware chart colours. Recharts writes colours as SVG attributes,
// where CSS variables are not reliable, so this hook returns concrete
// values for the current theme. Keep these in sync with src/index.css.

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
  accent: '#849AFF',
  plum:   '#C4A6E8',
  clay:   '#EC926C',
  green:  '#68CC92',
  amber:  '#ECB654',
  red:    '#FF7668',
  ink:    '#EDEAE2',
  muted:  '#78766E',
};

const LIGHT: ChartSeries = {
  accent: '#2440D6',
  plum:   '#70469C',
  clay:   '#AA4E26',
  green:  '#167848',
  amber:  '#9A6400',
  red:    '#C42E26',
  ink:    '#181816',
  muted:  '#A09E96',
};

export function useChartColors(): ChartColors {
  const { theme } = useThemeStore();
  const isLight = theme === 'light';
  const series = isLight ? LIGHT : DARK;
  const surface = isLight ? '#FFFFFF' : '#191917';

  return {
    tickFill:    isLight ? 'rgba(24, 24, 22, 0.55)' : 'rgba(237, 234, 226, 0.5)',
    tickFillDim: isLight ? 'rgba(24, 24, 22, 0.42)' : 'rgba(237, 234, 226, 0.38)',
    gridStroke:  isLight ? 'rgba(24, 24, 22, 0.08)' : 'rgba(237, 234, 226, 0.08)',

    tooltipStyle: {
      background: surface,
      border: `1px solid ${isLight ? '#E2DED3' : '#34332F'}`,
      borderRadius: '10px',
      boxShadow: isLight ? '0 8px 24px -12px rgba(24,24,22,0.25)' : '0 8px 24px -12px rgba(0,0,0,0.7)',
      padding: '8px 12px',
    },

    tooltipTextColor:  isLight ? 'rgba(24, 24, 22, 0.92)' : 'rgba(237, 234, 226, 0.92)',
    tooltipLabelColor: isLight ? 'rgba(24, 24, 22, 0.55)' : 'rgba(237, 234, 226, 0.5)',

    dotStroke: surface,
    series,
    palette: [series.accent, series.clay, series.green, series.plum, series.amber, series.red],
    surface,
  };
}
