import React, { createContext, useContext, ReactNode } from 'react';
import { colors, Colors, ColorToken } from './colors';
import {
  typography,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  typographyPresets,
  Typography,
  FontSize,
  LineHeight,
  TypographyPreset,
} from './typography';
import {
  spacing,
  radius,
  shadows,
  zIndex,
  Spacing,
  Radius,
  ShadowStyle,
  SpacingKey,
  RadiusKey,
  ShadowKey,
  ZIndexKey,
} from './spacing';

/**
 * ARENA STUDIO Unified Dark Theme
 */
export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  zIndex,
  isDark: true,
} as const;

export type Theme = typeof theme;

// Theme Context & Hook for React components
const ThemeContext = createContext<Theme>(theme);

export interface ThemeProviderProps {
  children: ReactNode;
  value?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, value = theme }) => {
  return React.createElement(ThemeContext.Provider, { value }, children);
};

export const useTheme = (): Theme => {
  const context = useContext(ThemeContext);
  return context || theme;
};

// Re-export individual token sets and types
export {
  colors,
  Colors,
  ColorToken,
  typography,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  typographyPresets,
  Typography,
  FontSize,
  LineHeight,
  TypographyPreset,
  spacing,
  radius,
  shadows,
  zIndex,
  Spacing,
  Radius,
  ShadowStyle,
  SpacingKey,
  RadiusKey,
  ShadowKey,
  ZIndexKey,
};

export default theme;
