import React from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from '../../design/theme';
import { Spacing, Radius } from '../../design/tokens';
import { Text } from '../ui/Text';
import { Reminder, getCategoryById } from '../../types/reminder';
import { formatTime, formatDate } from '../../lib/time';

interface Props {
  reminder: Reminder;
  onPress: () => void;
  onLongPress?: () => void;
  selected?: boolean;
}

export function ReminderCard({ reminder, onPress, onLongPress, selected = false }: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const isFired = reminder.status === 'fired';
  const category = getCategoryById(reminder.categoryId ?? 'default');
  const barColor = isFired ? theme.border : category.color;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.container,
        { backgroundColor: theme.surfaceMuted, borderColor: selected ? category.color : theme.border },
        selected && { borderWidth: 2 },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: barColor }]} />
      <View style={styles.content}>
        <Text
          variant="display"
          weight="bold"
          style={[styles.time, isFired && styles.firedText]}
          color={isFired ? 'tertiary' : 'primary'}
        >
          {formatTime(reminder.triggerAt)}
        </Text>
        <Text
          variant="heading"
          weight="medium"
          color={isFired ? 'tertiary' : 'primary'}
          numberOfLines={1}
          style={isFired && styles.firedText}
        >
          {reminder.title}
        </Text>
        {reminder.body ? (
          <Text variant="caption" color="secondary" numberOfLines={2} style={styles.body}>
            {reminder.body}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <Text variant="tiny" color="tertiary">{formatDate(reminder.triggerAt)}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: category.color + '22' }]}>
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            <Text variant="tiny" style={{ color: category.color }}>{category.label}</Text>
          </View>
          {reminder.repeatRule !== 'none' && (
            <View style={[styles.repeatBadge, { backgroundColor: theme.accentMuted }]}>
              <Text variant="tiny" color="accent">{REPEAT_LABEL[reminder.repeatRule]}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const REPEAT_LABEL: Record<string, string> = { daily: '매일', weekly: '매주', monthly: '매월', none: '' };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  accentBar: { width: 4 },
  content: { flex: 1, padding: Spacing.lg, gap: Spacing.xs },
  time: { fontSize: 40, lineHeight: 48 },
  body: { marginTop: Spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs, flexWrap: 'wrap' },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  categoryEmoji: { fontSize: 11 },
  repeatBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.pill },
  firedText: { textDecorationLine: 'line-through', opacity: 0.5 },
});
