import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { lightTheme, darkTheme } from '../../design/theme';
import { Spacing, Radius, Colors } from '../../design/tokens';
import { Text } from '../ui/Text';
import { Reminder } from '../../types/reminder';
import { formatTime, formatDate } from '../../lib/time';

interface Props {
  reminder: Reminder;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ReminderCard({ reminder, onPress, onLongPress }: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const isFired = reminder.status === 'fired';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.container, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
    >
      <View style={[styles.accentBar, { backgroundColor: isFired ? theme.border : theme.accent }]} />
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
          <Text variant="tiny" color="tertiary">
            {formatDate(reminder.triggerAt)}
          </Text>
          {reminder.repeatRule !== 'none' && (
            <View style={[styles.repeatBadge, { backgroundColor: theme.accentMuted }]}>
              <Text variant="tiny" color="accent">
                {repeatLabel(reminder.repeatRule)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function repeatLabel(rule: Reminder['repeatRule']): string {
  const map = { daily: '매일', weekly: '매주', monthly: '매월', none: '' };
  return map[rule];
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  time: {
    fontSize: 40,
    lineHeight: 48,
  },
  body: {
    marginTop: Spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  repeatBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  firedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
});
