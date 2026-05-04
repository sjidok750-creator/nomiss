import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useReminderStore } from '../../src/features/reminders/store';
import { Button } from '../../src/components/ui/Button';
import { Text } from '../../src/components/ui/Text';
import { lightTheme, darkTheme } from '../../src/design/theme';
import { Spacing, Radius, FontSize, FontWeight } from '../../src/design/tokens';
import { formatTime, formatDate } from '../../src/lib/time';

const REPEAT_LABEL: Record<string, string> = {
  none: '반복 없음',
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
};

export default function ReminderDetailScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const { id } = useLocalSearchParams<{ id: string }>();
  const reminders = useReminderStore((s) => s.reminders);
  const remove = useReminderStore((s) => s.remove);
  const [deleting, setDeleting] = useState(false);

  const reminder = reminders.find((r) => r.id === id);

  if (!reminder) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
        <View style={styles.center}>
          <Text variant="body" color="secondary">알림을 찾을 수 없어요</Text>
          <Button label="닫기" onPress={() => router.back()} variant="ghost" size="md" />
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = useCallback(() => {
    Alert.alert(
      '알림 삭제',
      `"${reminder.title}" 알림을 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            await remove(reminder.id);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ],
    );
  }, [reminder, remove]);

  const isFired = reminder.status === 'fired';
  const isCancelled = reminder.status === 'cancelled';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text variant="body" color="secondary">닫기</Text>
        </TouchableOpacity>
        <Text variant="heading" weight="semibold">알림 상세</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status Badge */}
        {(isFired || isCancelled) && (
          <View style={[styles.statusBadge, { backgroundColor: theme.surfaceMuted }]}>
            <Text variant="caption" color="tertiary" weight="medium">
              {isFired ? '✓ 알림 완료' : '취소됨'}
            </Text>
          </View>
        )}

        {/* Time */}
        <View style={styles.timeSection}>
          <Text
            style={[styles.timeDisplay, isFired && styles.firedText]}
            weight="bold"
            color={isFired ? 'tertiary' : 'primary'}
          >
            {formatTime(reminder.triggerAt)}
          </Text>
          <View style={[styles.dateBadge, { backgroundColor: theme.surfaceMuted }]}>
            <Text variant="body" color="secondary">
              {formatDate(reminder.triggerAt)}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <Text variant="title" weight="semibold" style={isFired && styles.firedText}>
            {reminder.title}
          </Text>
          {reminder.body ? (
            <Text variant="body" color="secondary" style={[styles.bodyText, isFired && styles.firedText]}>
              {reminder.body}
            </Text>
          ) : null}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.metaRow}>
            <Text variant="caption" color="tertiary">반복</Text>
            <Text variant="caption" weight="medium" color="secondary">
              {REPEAT_LABEL[reminder.repeatRule]}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      {!isFired && !isCancelled && (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button
            label="삭제"
            variant="destructive"
            onPress={handleDelete}
            loading={deleting}
            fullWidth
            size="lg"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  timeSection: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  timeDisplay: {
    fontSize: FontSize.displayXl,
    fontWeight: FontWeight.bold,
    lineHeight: 76,
  },
  dateBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  bodyText: {
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  firedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
});
