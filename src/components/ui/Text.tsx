import React from 'react';
import { Text as RNText, TextProps, StyleSheet, useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../../design/theme';
import { FontSize, FontWeight } from '../../design/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'caption' | 'tiny';
type Weight = 'regular' | 'medium' | 'semibold' | 'bold';
type Color = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'danger';

interface Props extends TextProps {
  variant?: Variant;
  weight?: Weight;
  color?: Color;
}

export function Text({ variant = 'body', weight = 'regular', color = 'primary', style, ...props }: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  const colorMap: Record<Color, string> = {
    primary: theme.textPrimary,
    secondary: theme.textSecondary,
    tertiary: theme.textTertiary,
    accent: theme.accent,
    danger: theme.danger,
  };

  return (
    <RNText
      style={[
        styles[variant],
        { fontWeight: FontWeight[weight], color: colorMap[color] },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontSize: FontSize.display, lineHeight: 40 },
  title: { fontSize: FontSize.title, lineHeight: 28 },
  heading: { fontSize: FontSize.heading, lineHeight: 24 },
  body: { fontSize: FontSize.body, lineHeight: 22 },
  caption: { fontSize: FontSize.caption, lineHeight: 18 },
  tiny: { fontSize: FontSize.tiny, lineHeight: 15 },
});
