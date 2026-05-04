import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useReminderStore } from '../src/features/reminders/store';
import { requestNotificationPermission } from '../src/lib/notifications';
import { QuickTimeChips } from '../src/components/form/QuickTimeChips';
import { Button } from '../src/components/ui/Button';
import { Text } from '../src/components/ui/Text';
import { lightTheme, darkTheme } from '../src/design/theme';
import { Spacing, Radius, FontSize, FontWeight } from '../src/design/tokens';
import { RepeatRule, NoticeType, SoundOption, NOTICE_OPTIONS, SOUND_OPTIONS } from '../src/types/reminder';
import { formatTime, formatDate } from '../src/lib/time';
import { addMinutes } from 'date-fns';

// ─── Web date/time helpers ───────────────────────────────────
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
  { label: '안 함', value: 'none' },
  { label: '매일', value: 'daily' },
  { label: '매주', value: 'weekly' },
  { label: '매월', value: 'monthly' },
];

export default function NewReminderScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const create = useReminderStore((s) => s.create);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [triggerAt, setTriggerAt] = useState(() => addMinutes(Date.now(), 10).getTime());
  const [repeatRule, setRepeatRule] = useState<RepeatRule>('none');
  const [advanceNotices, setAdvanceNotices] = useState<NoticeType[]>(['at_time']);
  const [sound, setSound] = useState<SoundOption>('default');
  const [loading, setLoading] = useState(false);

  // Native only pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  let DateTimePicker: any = null;
  if (Platform.OS !== 'web') {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  }

  const toggleNotice = (notice: NoticeType) => {
    setAdvanceNotices((prev) =>
      prev.includes(notice) ? prev.filter((n) => n !== notice) : [...prev, notice],
    );
  };

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('제목을 입력해주세요');
      return;
    }
    if (advanceNotices.length === 0) {
      Alert.alert('알림 시점을 하나 이상 선택해주세요');
      return;
    }
    if (triggerAt <= Date.now()) {
      Alert.alert('미래의 시간을 선택해주세요');
      return;
    }
    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (!granted && Platform.OS !== 'web') {
        Alert.alert('알림 권한 필요', '설정에서 알림 권한을 허용해주세요.');
        setLoading(false);
        return;
      }
      await create({ title: title.trim(), body: body.trim() || undefined, triggerAt, repeatRule, advanceNotices, sound });
      if (Platform.OS !== 'web') {
        const Haptics = require('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch {
      Alert.alert('저장 중 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [title, body, triggerAt, repeatRule, advanceNotices, sound, create]);

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Text variant="body" color="secondary">취소</Text>
          </TouchableOpacity>
          <Text variant="heading" weight="semibold">새 알림</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Time Display / Web Inputs */}
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

          {/* Quick Time Chips (native only) */}
          {Platform.OS !== 'web' && (
            <View style={styles.chipsSection}>
              <QuickTimeChips selectedTime={triggerAt} onSelect={setTriggerAt} />
            </View>
          )}

          <View style={styles.formSection}>
            {/* Title */}
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="무엇을 잊으면 안 되나요?"
              placeholderTextColor={theme.textTertiary}
              style={[styles.titleInput, { color: theme.textPrimary, borderBottomColor: theme.border }]}
              maxLength={100}
              autoFocus
              returnKeyType="next"
            />

            {/* Memo */}
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="메모 (선택)"
              placeholderTextColor={theme.textTertiary}
              style={[
                styles.bodyInput,
                { color: theme.textPrimary, backgroundColor: theme.surfaceMuted, borderColor: theme.border },
              ]}
              maxLength={300}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* 알림 시점 */}
            <View style={styles.section}>
              <Text variant="caption" weight="semibold" color="secondary" style={styles.sectionLabel}>
                🔔 알림 시점
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

            {/* 소리 */}
            <View style={styles.section}>
              <Text variant="caption" weight="semibold" color="secondary" style={styles.sectionLabel}>
                🔊 소리
              </Text>
              <View style={styles.soundRow}>
                {SOUND_OPTIONS.map((opt) => {
                  const selected = sound === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => setSound(opt.value)}
                      activeOpacity={0.7}
                      style={[
                        styles.soundChip,
                        {
                          backgroundColor: selected ? theme.accent + '22' : theme.surfaceMuted,
                          borderColor: selected ? theme.accent : theme.border,
                        },
                      ]}
                    >
                      <Text style={styles.soundEmoji}>{opt.emoji}</Text>
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

            {/* 반복 */}
            <View style={styles.section}>
              <Text variant="caption" weight="semibold" color="secondary" style={styles.sectionLabel}>
                🔁 반복
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
                      <Text
                        variant="caption"
                        weight="medium"
                        style={{ color: selected ? '#fff' : theme.textSecondary }}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Save */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button label="저장" onPress={handleSave} loading={loading} fullWidth size="lg" />
        </View>

        {/* Native pickers */}
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
  webDateTimeSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  timeSection: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  timeDisplay: {
    fontSize: FontSize.displayXl,
    fontWeight: FontWeight.bold,
    lineHeight: 76,
    textAlign: 'center',
  },
  dateBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
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
  soundRow: { flexDirection: 'row', gap: Spacing.sm },
  soundChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  soundEmoji: { fontSize: 14 },
  repeatRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  repeatChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  footer: { padding: Spacing.lg, borderTopWidth: 1 },
});
