import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  View,
} from 'react-native';
import { lightTheme, darkTheme } from '../../design/theme';
import { Radius, Spacing, FontSize, FontWeight } from '../../design/tokens';
import { Text } from './Text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface Props extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  label: string;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  fullWidth = false,
  disabled,
  style,
  ...props
}: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const isDisabled = disabled || loading;

  const bgMap: Record<Variant, string> = {
    primary: theme.accent,
    secondary: theme.surfaceMuted,
    ghost: 'transparent',
    destructive: theme.dangerLight,
  };

  const textColorMap: Record<Variant, 'primary' | 'secondary' | 'accent' | 'danger'> = {
    primary: 'primary',
    secondary: 'secondary',
    ghost: 'secondary',
    destructive: 'danger',
  };

  const paddingMap: Record<Size, { paddingHorizontal: number; paddingVertical: number }> = {
    sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
    md: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
    lg: { paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.lg },
  };

  const fontSizeMap: Record<Size, number> = {
    sm: FontSize.caption,
    md: FontSize.body,
    lg: FontSize.heading,
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        styles.base,
        { backgroundColor: bgMap[variant], ...paddingMap[size] },
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#fff' : theme.accent}
        />
      ) : (
        <Text
          style={{
            fontSize: fontSizeMap[size],
            fontWeight: FontWeight.semibold,
            color: variant === 'primary' ? '#fff' : undefined,
          }}
          color={variant === 'primary' ? 'primary' : textColorMap[variant]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.4 },
});
