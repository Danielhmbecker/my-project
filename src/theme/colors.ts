/**
 * ARENA STUDIO Theme - Colors
 * Professional developer dark theme color palette.
 */

export const colors = {
  // Backgrounds (Charcoal / graphite scale)
  bgPrimary: '#0d0f12',
  bgSecondary: '#16191f',
  bgTertiary: '#21262d',
  bgElevated: '#2d333b',
  bgSurface: '#16191f',
  bgModal: '#1c2128',
  bgCode: '#0d0f12',
  bgHover: '#262c36',
  bgActive: '#30363d',

  // Borders
  border: '#30363d',
  borderLight: '#444c56',
  borderSubtle: '#21262d',
  borderFocus: '#388bfd',
  borderActive: '#58a6ff',

  // Text
  primary: '#f0f6fc',
  secondary: '#8b949e',
  muted: '#484f58',
  textPrimary: '#f0f6fc',
  textSecondary: '#8b949e',
  textMuted: '#484f58',
  textInverse: '#0d0f12',
  textLink: '#58a6ff',
  textCode: '#e6edf3',
  textDisabled: '#484f58',

  // Accents
  accentPrimary: '#388bfd',
  accentPurple: '#8957e5',
  accentCyan: '#39c5cf',
  accentOrange: '#f0883e',
  accentPink: '#d2a8ff',
  accentGreen: '#3fb950',
  accentYellow: '#e3b341',

  // Statuses
  success: '#3fb950',
  warning: '#d29922',
  error: '#f85149',
  info: '#58a6ff',

  // Status Backgrounds (Subtle tint for badges, callouts, alerts)
  statusBgSuccess: 'rgba(63, 185, 80, 0.15)',
  statusBgWarning: 'rgba(210, 153, 34, 0.15)',
  statusBgError: 'rgba(248, 81, 73, 0.15)',
  statusBgInfo: 'rgba(88, 166, 255, 0.15)',

  // Status Borders
  statusBorderSuccess: 'rgba(63, 185, 80, 0.35)',
  statusBorderWarning: 'rgba(210, 153, 34, 0.35)',
  statusBorderError: 'rgba(248, 81, 73, 0.35)',
  statusBorderInfo: 'rgba(88, 166, 255, 0.35)',

  // Accent Transparencies / Glows
  accentPrimaryAlpha: 'rgba(56, 139, 253, 0.15)',
  accentPrimaryAlphaMedium: 'rgba(56, 139, 253, 0.25)',
  accentPurpleAlpha: 'rgba(137, 87, 229, 0.15)',
  accentCyanAlpha: 'rgba(57, 197, 207, 0.15)',

  // Overlay & Backdrops
  backdrop: 'rgba(0, 0, 0, 0.75)',
  backdropSubtle: 'rgba(0, 0, 0, 0.4)',
  selection: 'rgba(56, 139, 253, 0.35)',

  // Common Constants
  transparent: 'transparent',
  white: '#ffffff',
  black: '#000000',

  // Syntax Highlighting Tokens (for CodeEditor, DevTools, Terminal)
  syntax: {
    keyword: '#ff7b72',
    string: '#a5d6ff',
    number: '#79c0ff',
    comment: '#8b949e',
    func: '#d2a8ff',
    variable: '#ffa657',
    constant: '#79c0ff',
    tag: '#7ee787',
    attribute: '#79c0ff',
    punctuation: '#c9d1d9',
    operator: '#79c0ff',
    type: '#ffa657',
  },

  // Git Status Indicators
  git: {
    added: '#3fb950',
    modified: '#d29922',
    deleted: '#f85149',
    untracked: '#39c5cf',
    staged: '#388bfd',
    conflict: '#f0883e',
    renamed: '#a371f7',
    ignored: '#484f58',
  },

  // Grouped Semantic Helpers
  background: {
    primary: '#0d0f12',
    secondary: '#16191f',
    tertiary: '#21262d',
    elevated: '#2d333b',
    surface: '#16191f',
    modal: '#1c2128',
    code: '#0d0f12',
    hover: '#262c36',
    active: '#30363d',
  },

  text: {
    primary: '#f0f6fc',
    secondary: '#8b949e',
    muted: '#484f58',
    inverse: '#0d0f12',
    link: '#58a6ff',
    code: '#e6edf3',
    disabled: '#484f58',
  },

  status: {
    success: '#3fb950',
    warning: '#d29922',
    error: '#f85149',
    info: '#58a6ff',
  },
} as const;

export type ColorToken = keyof typeof colors;
export type Colors = typeof colors;
export default colors;
