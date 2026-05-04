export const Colors = {
  // Base
  black: '#0A0A0A',
  white: '#FFFFFF',

  // Accent
  accent: '#FF5A36',
  accentLight: '#FF7A5A',
  accentMuted: '#FFF0EC',

  // Light theme surfaces
  surfaceLight: '#FFFFFF',
  surfaceMutedLight: '#F7F7F8',
  borderLight: '#E5E5E5',
  textPrimaryLight: '#0A0A0A',
  textSecondaryLight: '#6B6B6B',
  textTertiaryLight: '#ABABAB',

  // Dark theme surfaces
  surfaceDark: '#111111',
  surfaceMutedDark: '#1A1A1A',
  borderDark: '#262626',
  textPrimaryDark: '#F5F5F5',
  textSecondaryDark: '#A0A0A0',
  textTertiaryDark: '#606060',

  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const FontSize = {
  tiny: 11,
  caption: 13,
  body: 16,
  heading: 18,
  title: 22,
  display: 32,
  displayLg: 48,
  displayXl: 64,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Breakpoints = {
  sm: 600,
  md: 900,
} as const;
