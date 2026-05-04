import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet, useColorScheme, View } from 'react-native';
import { lightTheme, darkTheme } from '../../design/theme';
import { Spacing, Radius } from '../../design/tokens';
import { Text } from '../ui/Text';
import { CATEGORIES, CategoryId } from '../../types/reminder';

interface Props {
  selected: CategoryId;
  onSelect: (id: CategoryId) => void;
}

export function CategoryPicker({ selected, onSelect }: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.id;
        return (
          <TouchableOpacity
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            activeOpacity={0.7}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? cat.color + '22' : theme.surfaceMuted,
                borderColor: isSelected ? cat.color : theme.border,
                borderWidth: isSelected ? 1.5 : 1,
              },
            ]}
          >
            <Text style={styles.emoji}>{cat.emoji}</Text>
            <Text
              variant="caption"
              weight={isSelected ? 'semibold' : 'regular'}
              style={{ color: isSelected ? cat.color : theme.textSecondary }}
            >
              {cat.label}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  emoji: { fontSize: 14 },
});
