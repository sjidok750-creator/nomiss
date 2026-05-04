import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useReminderStore } from '../../src/features/reminders/store';
import { QuickTimeChips } from '../../src/components/form/QuickTimeChips';
import { Button } from '../../src/components/ui/Button';
import { Text } from '../../src/components/ui/Text';
import { lightTheme, darkTheme } from '../../src/design/theme';
import { Spacing, Radius, FontSize, FontWeight } from '../../src/design/tokens';
import { RepeatRule, NoticeType, NOTICE_OPTIONS } from '../../src/types/reminder';
import { formatTime, formatDate } from '../../src/lib/time';

// ─── Web date/time helpers ────────────────────────────────────
function toDateStr(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function toTimeStr(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function applyDateStr(dateStr: string, ts: number): number {
  const d = new Date(ts);
  const [y, m, day] = dateStr.split('-').map(Number);
  d.setFullYear(y, m - 1, day);
  return d.getTime();
}
function applyTimeStr(timeStr: string, ts: number): number {
  const d = new Date(ts);
  const [h, min] = timeStr.split(':').map(Number);
  d.setHours(h, min, 0, 0);
  return d.getTime();
}

const REPEAT_OPTIONS: { label: string; value: RepeatRule }[] = [
  { label: 'Never', value: 'none' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const REPEAT_LABEL: Record<string, string> = {
  none: 'No repeat',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export default function ReminderDetailScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const reminders = useReminderStore((s) => s.reminders);
  const update = useReminderStore((s) => s.update);
  const remove = useReminderStore((s) => s.remove);

  const reminder = reminders.find((r) => r.id === id);

  const [editing, setEditing] = useState(edit === '1');
  const [title, setTitle] = useState(reminder?.title ?? '');
  const [body, setBody] = useState(reminder?.body ?? '');
  const [triggerAt, setTriggerAt] = useState(reminder?.triggerAt ?? Date.now());
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(reminder?.repeatRule ?? 'none');
  const [advanceNotices, setAdvanceNotices] = useState<NoticeType[]>(
    reminder?.advanceNotices ?? ['at_time'],
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  let DateTimePicker: any = null;
  if (Platform.OS !== 'web') {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  }

  if (!reminder) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
        <View style={styles.center}>
          <Text variant="body" color="secondary">Reminder not found</Text>
          <Button label="Close" onPress={() => router.back()} variant="ghost" size="md" />
        </View>
      </SafeAreaView>
    );
  }

  const isFired = reminder.status === 'fired';
  const isCancelled = reminder.status === 'cancelled';
  const isEditable = !isFired && !isCancelled;

  const toggleNotice = (notice: NoticeType) => {
    setAdvanceNotices((prev) =>
      prev.includes(notice) ? prev.filter((n) => n !== notice) : [...prev, notice],
    );
  };

  const handleStartEdit = () => {
    setTitle(reminder.title);
    setBody(reminder.body ?? '');
    setTriggerAt(reminder.triggerAt);
    setRepeatRule(reminder.repeatRule);
    setAdvanceNotices(reminder.advanceNotices ?? ['at_time']);
    setEditing(true);
  };

  const handleSave = useCallback(async () => {
    if (!title.trim()) { Alert.alert('Please enter a title'); return; }
    if (advanceNotices.length === 0) { Alert.alert('Please select at least one alert time'); return; }
    if (triggerAt <= Date.now()) { Alert.alert('Please select a future time'); return; }
    setSaving(true);
    try {
      await update(reminder.id, {
        title: title.trim(),
        body: body.trim() || undefined,
        triggerAt,
        repeatRule,
        advanceNotices,
        sound: 'default',
      });
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setEditing(false);
    } catch {
      Alert.alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [title, body, triggerAt, repeatRule, advanceNotices, reminder.id, update]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Reminder', `Delete "${reminder.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          await remove(reminder.id);
          if (Platform.OS !== 'web') {
            const Haptics = require('expo-haptics');
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          }
          router.back();
        },
      },
    ]);
  }, [reminder, remove]);

  const pickerDate = new Date(triggerAt);
  const webInputStyle = {
    fontSize: 16,
    padding: '8px 14px',
    borderRadius: 20,
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.surfaceMuted,
    color: theme.textPrimary,
    outline: 'none',
    cursor: 'pointer',
  } as any;

  // ─── Edit Mode ────────────────────────────────────────────────
  if (editing) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setEditing(false)} hitSlop={12}>
              <Text variant="body" color="secondary">Cancel</Text>
            </TouchableOpacity>
            <Text variant="heading" weight="semibold">Edit Reminder</Text>
            <TouchableOpacity onPress={handleSave} hitSlop={12} disabled={saving}>
              <Text variant="body" weight="semibold" color="accent">
                {saving ? 'Saving…' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {Platform.OS === 'web' ? (
              <View style={styles.webDateTimeSection}>
                {React.createElement('input', {
                  type: 'date',
                  value: toDateStr(triggerAt),
                  min: toDateStr(Date.now()),
                  onChange: (e: any) => setTriggerAt(applyDateStr(e.target.value, triggerAt)),
                  style: webInputStyle,
                })}
                {React.createElement('input', {
                  type: 'time',
                  value: toTimeStr(triggerAt),
                  onChange: (e: any) => setTriggerAt(applyTimeStr(e.target.value, triggerAt)),
                  style: webInputStyle,
                })}
              </View>
            ) : (
              <View style={styles.timeSection}>
                <TouchableOpacity onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
                  <Text style={styles.timeDisplay} weight="bold">{formatTime(triggerAt)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                  style={[styles.dateBadge, { backgroundColor: theme.surfaceMuted }]}
                >
                  <Text variant="body" color="secondary">{formatDate(triggerAt)}</Text>
                </TouchableOpacity>
              </View>
            )}

            {Platform.OS !== 'web' && (
              <View style={styles.chipsSection}>
                <QuickTimeChips selectedTime={triggerAt} onSelect={setTriggerAt} />
              </View>
            )}

            <View style={styles.formSection}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What can't you miss?"
                placeholderTextColor={theme.textTertiary}
                style={[styles.titleInput, { color: theme.textPrimary, borderBottomColor: theme.border }]}
                maxLength={100}
                autoFocus
              />
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Note (optional)"
                placeholderTextColor={theme.textTertiary}
                style={[styles.bodyInput, { color: theme.textPrimary, backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
                maxLength={300}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Alert Time */}
              <View style={styles.section}>
                <Text variant="caption" weight="semibold" color="secondary" style={styles.sectionLabel}>
                  🔔 Alert Time
                </Text>
                <View style={styles.chipGrid}>
                  {NOTICE_OPTIONS.map((opt) => {
                    const selected = advanceNotices.includes(opt.value);
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => toggleNotice(opt.value)}
                        activeOpacity={0.7}
                        style={[
                          styles.noticeChip,
                          {
                            backgroundColor: selected ? theme.accent + '22' : theme.surfaceMuted,
                            borderColor: selected ? theme.accent : theme.border,
                          },
                        ]}
                      >
                        <Text
                          variant="caption"
                          weight={selected ? 'semibold' : 'regular'}
                          style={{ color: selected ? theme.accent : theme.textSecondary }}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Repeat */}
              <View style={styles.section}>
                <Text variant="caption" weight="semibold" color="secondary" style={styles.sectionLabel}>
                  🔁 Repeat
                </Text>
                <View style={styles.repeatRow}>
                  {REPEAT_OPTIONS.map((opt) => {
                    const selected = repeatRule === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        onPress={() => setRepeatRule(opt.value)}
                        style={[
                          styles.repeatChip,
                          {
                            backgroundColor: selected ? theme.accent : theme.surfaceMuted,
                            borderColor: selected ? theme.accent : theme.border,
                          },
                        ]}
                      >
                        <Text variant="caption" weight="medium" style={{ color: selected ? '#fff' : theme.textSecondary }}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>

          {Platform.OS !== 'web' && DateTimePicker && showDatePicker && (
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(_: any, date?: Date) => {
                setShowDatePicker(false);
                if (date) {
                  const next = new Date(triggerAt);
                  next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                  setTriggerAt(next.getTime());
                }
              }}
            />
          )}
          {Platform.OS !== 'web' && DateTimePicker && showTimePicker && (
            <DateTimePicker
              value={pickerDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_: any, date?: Date) => {
                setShowTimePicker(false);
                if (date) {
                  const next = new Date(triggerAt);
                  next.setHours(date.getHours(), date.getMinutes(), 0, 0);
                  setTriggerAt(next.getTime());
                }
              }}
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ─── View Mode ────────────────────────────────────────────────
  const noticeLabels = (reminder.advanceNotices ?? ['at_time'])
    .map((n) => NOTICE_OPTIONS.find((o) => o.value === n)?.label ?? n)
    .join(' · ');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text variant="body" color="secondary">Close</Text>
        </TouchableOpacity>
        <Text variant="heading" weight="semibold">Reminder</Text>
        {isEditable ? (
          <TouchableOpacity onPress={handleStartEdit} hitSlop={12}>
            <Text variant="body" weight="semibold" color="accent">Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {(isFired || isCancelled) && (
          <View style={[styles.statusBadge, { backgroundColor: theme.surfaceMuted }]}>
            <Text variant="caption" color="tertiary" weight="medium">
              {isFired ? '✓ Completed' : 'Cancelled'}
            </Text>
          </View>
        )}

        <View style={styles.timeSection}>
          <Text
            style={[styles.timeDisplay, isFired && styles.firedText]}
            weight="bold"
            color={isFired ? 'tertiary' : 'primary'}
          >
            {formatTime(reminder.triggerAt)}
          </Text>
          <View style={[styles.dateBadge, { backgroundColor: theme.surfaceMuted }]}>
            <Text variant="body" color="secondary">{formatDate(reminder.triggerAt)}</Text>
          </View>
        </View>

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
            <Text variant="caption" color="tertiary">🔔 Alert Time</Text>
            <Text variant="caption" weight="medium" color="secondary">{noticeLabels}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text variant="caption" color="tertiary">🔁 Repeat</Text>
            <Text variant="caption" weight="medium" color="secondary">
              {REPEAT_LABEL[reminder.repeatRule]}
            </Text>
          </View>
        </View>
      </ScrollView>

      {isEditable && (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button
            label="Delete"
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
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  scroll: { paddingBottom: Spacing.huge },
  scrollView: { padding: Spacing.lg, gap: Spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  webDateTimeSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  timeSection: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  timeDisplay: { fontSize: FontSize.displayXl, fontWeight: FontWeight.bold, lineHeight: 76 },
  dateBadge: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
  chipsSection: { paddingBottom: Spacing.xl },
  formSection: { paddingHorizontal: Spacing.lg, gap: Spacing.xl },
  titleInput: {
    fontSize: FontSize.title,
    fontWeight: FontWeight.medium,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  bodyInput: {
    fontSize: FontSize.body,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    minHeight: 80,
  },
  section: { gap: Spacing.sm },
  sectionLabel: { marginBottom: Spacing.xs },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  noticeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  repeatRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  repeatChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, gap: Spacing.md },
  bodyText: { lineHeight: 22 },
  divider: { height: 1, marginVertical: Spacing.xs },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footer: { padding: Spacing.lg, borderTopWidth: 1 },
  firedText: { textDecorationLine: 'line-through', opacity: 0.5 },
});
