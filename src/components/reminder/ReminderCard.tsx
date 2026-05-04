import React from 'react';
import { View, TouchableOpacity, Pressable, StyleSheet, useColorScheme, Platform } from 'react-native';
import { lightTheme, darkTheme } from '../../design/theme';
import { Spacing, Radius, Colors } from '../../design/tokens';
import { Text } from '../ui/Text';
import { Reminder } from '../../types/reminder';
import { formatTime, formatDate } from '../../lib/time';

interface Props {
  reminder: Reminder;
  onPress: () => void;
  noMargin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

const REPEAT_LABEL: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  none: '',
};

export function ReminderCard({ reminder, onPress, noMargin, onEdit, onDelete }: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const isFired = reminder.status === 'fired';
  const showWebActions = Platform.OS === 'web' && (onEdit || onDelete);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
        noMargin && styles.noMargin,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: isFired ? theme.border : Colors.accent }]} />

      {/* Tappable content area */}
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.content}>
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
          {reminder.repeatRule !== 'none' && (
            <View style={[styles.repeatBadge, { backgroundColor: theme.accentMuted }]}>
              <Text variant="tiny" color="accent">{REPEAT_LABEL[reminder.repeatRule]}</Text>
            </View>
          )}
          {reminder.sound === 'silent' && (
            <Text variant="tiny" color="tertiary">📳</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Web: inline Edit / Delete buttons */}
      {showWebActions && (
        <View style={styles.webActions}>
          {onEdit && !isFired && (
            <Pressable
              onPress={onEdit}
              style={[styles.webBtn, { backgroundColor: '#3B82F6' }]}
            >
              <Text style={styles.webBtnText}>✏️</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable
              onPress={onDelete}
              style={[styles.webBtn, { backgroundColor: Colors.danger }]}
            >
              <Text style={styles.webBtnText}>🗑</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

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
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },
  repeatBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  webActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
    paddingRight: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  webBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webBtnText: { fontSize: 16 },
  noMargin: { marginBottom: 0 },
  firedText: { textDecorationLine: 'line-through', opacity: 0.5 },
});
