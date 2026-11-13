import { Platform, TextStyle } from 'react-native';

/**
 * ARENA STUDIO Theme - Typography
 * Clean monospace and sans-serif typography scales for developer ergonomics.
 */

export const fontFamilies = {
  sans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
  code: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const fontSizes = {
  xs: 11,
  sm: 12,
  md: 14,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  '2xl': 20,
  '3xl': 24,
  '4xl': 30,
  display: 36,
} as const;

export const fontWeights: Record<string, TextStyle['fontWeight']> = {
  light: '300',
  regular: '400',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const lineHeights = {
  xs: 16,
  sm: 18,
  md: 20,
  base: 20,
  lg: 24,
  xl: 26,
  xxl: 28,
  '2xl': 28,
  '3xl': 32,
  '4xl': 38,
  display: 44,
} as const;

export const letterSpacings = {
  tight: -0.5,
  normal: 0,
  wide: 0.3,
  wider: 0.6,
  widest: 1,
} as const;

export const typographyPresets: Record<string, TextStyle> = {
  display: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.display,
    lineHeight: lineHeights.display,
    fontWeight: '700',
    letterSpacing: letterSpacings.tight,
  },
  h1: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes['4xl'],
    lineHeight: lineHeights['4xl'],
    fontWeight: '700',
    letterSpacing: letterSpacings.tight,
  },
  h2: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes['3xl'],
    lineHeight: lineHeights['3xl'],
    fontWeight: '600',
    letterSpacing: letterSpacings.tight,
  },
  h3: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xxl,
    lineHeight: lineHeights.xxl,
    fontWeight: '600',
  },
  h4: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    lineHeight: lineHeights.lg,
    fontWeight: '600',
  },
  body: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: '500',
  },
  bodySm: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: '400',
  },
  bodyXs: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: '400',
  },
  caption: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: '500',
    letterSpacing: letterSpacings.wide,
  },
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: '500',
  },
  button: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: '600',
  },
  buttonSm: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: '600',
  },
  // Monospace developer typography
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: '400',
  },
  codeMd: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.md,
    lineHeight: lineHeights.md,
    fontWeight: '400',
  },
  codeSm: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    lineHeight: lineHeights.xs,
    fontWeight: '400',
  },
  codeBold: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.sm,
    fontWeight: '700',
  },
  terminal: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
  },
};

export const typography = {
  families: fontFamilies,
  sizes: fontSizes,
  weights: fontWeights,
  lineHeights,
  letterSpacings,
  presets: typographyPresets,
  // Direct shortcuts for ergonomics
  fontFamilies,
  fontSizes,
  fontWeights,
};

export type Typography = typeof typography;
export type FontSize = keyof typeof fontSizes;
export type LineHeight = keyof typeof lineHeights;
export type TypographyPreset = keyof typeof typographyPresets;
export default typography;
