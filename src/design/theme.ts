import { Colors } from './tokens';

export const lightTheme = {
  surface: Colors.surfaceLight,
  surfaceMuted: Colors.surfaceMutedLight,
  border: Colors.borderLight,
  textPrimary: Colors.textPrimaryLight,
  textSecondary: Colors.textSecondaryLight,
  textTertiary: Colors.textTertiaryLight,
  accent: Colors.accent,
  accentLight: Colors.accentLight,
  accentMuted: Colors.accentMuted,
  success: Colors.success,
  successLight: Colors.successLight,
  warning: Colors.warning,
  warningLight: Colors.warningLight,
  danger: Colors.danger,
  dangerLight: Colors.dangerLight,
  tabBar: Colors.white,
  tabBarBorder: Colors.borderLight,
} as const;

export const darkTheme = {
  surface: Colors.surfaceDark,
  surfaceMuted: Colors.surfaceMutedDark,
  border: Colors.borderDark,
  textPrimary: Colors.textPrimaryDark,
  textSecondary: Colors.textSecondaryDark,
  textTertiary: Colors.textTertiaryDark,
  accent: Colors.accent,
  accentLight: Colors.accentLight,
  accentMuted: '#3A1A14',
  success: Colors.success,
  successLight: '#052E16',
  warning: Colors.warning,
  warningLight: '#292524',
  danger: Colors.danger,
  dangerLight: '#3B1219',
  tabBar: Colors.surfaceDark,
  tabBarBorder: Colors.borderDark,
} as const;

export type Theme = typeof lightTheme;
