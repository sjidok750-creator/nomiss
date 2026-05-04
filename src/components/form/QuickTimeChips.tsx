import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../../design/theme';
import { Spacing, Radius } from '../../design/tokens';
import { Text } from '../ui/Text';
import { quickTimeOptions } from '../../lib/time';

interface Props {
  selectedTime: number;
  onSelect: (time: number) => void;
}

export function QuickTimeChips({ selectedTime, onSelect }: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const options = quickTimeOptions();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((opt) => {
        const isSelected = Math.abs(selectedTime - opt.value) < 60_000;
        return (
          <TouchableOpacity
            key={opt.label}
            activeOpacity={0.7}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? theme.accent : theme.surfaceMuted,
                borderColor: isSelected ? theme.accent : theme.border,
              },
            ]}
          >
            <Text
              variant="caption"
              weight="medium"
              style={{ color: isSelected ? '#fff' : theme.textSecondary }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
});
