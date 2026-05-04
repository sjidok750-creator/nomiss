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
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useReminderStore } from '../../features/reminders/store';
import { QuickTimeChips } from '../form/QuickTimeChips';
import { Button } from '../ui/Button';
import { Text } from '../ui/Text';
import { lightTheme, darkTheme } from '../../design/theme';
import { Spacing, Radius, FontSize, FontWeight } from '../../design/tokens';
import { RepeatRule, Reminder } from '../../types/reminder';
import { formatTime, formatDate } from '../../lib/time';

const REPEAT_OPTIONS: { label: string; value: RepeatRule }[] = [
  { label: '안 함', value: 'none' },
  { label: '매일', value: 'daily' },
  { label: '매주', value: 'weekly' },
  { label: '매월', value: 'monthly' },
];

const REPEAT_LABEL: Record<string, string> = {
  none: '반복 없음', daily: '매일', weekly: '매주', monthly: '매월',
};

interface Props {
  reminder: Reminder;
  onClose: () => void;
}

export function ReminderDetailPane({ reminder, onClose }: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const update = useReminderStore((s) => s.update);
  const remove = useReminderStore((s) => s.remove);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(reminder.title);
  const [body, setBody] = useState(reminder.body ?? '');
  const [triggerAt, setTriggerAt] = useState(reminder.triggerAt);
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(reminder.repeatRule);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isFired = reminder.status === 'fired';
  const isCancelled = reminder.status === 'cancelled';
  const isEditable = !isFired && !isCancelled;

  const handleStartEdit = () => {
    setTitle(reminder.title);
    setBody(reminder.body ?? '');
    setTriggerAt(reminder.triggerAt);
    setRepeatRule(reminder.repeatRule);
    setEditing(true);
  };

  const handleSave = useCallback(async () => {
    if (!title.trim()) { Alert.alert('제목을 입력해주세요'); return; }
    if (triggerAt <= Date.now()) { Alert.alert('미래의 시간을 선택해주세요'); return; }
    setSaving(true);
    try {
      await update(reminder.id, { title: title.trim(), body: body.trim() || undefined, triggerAt, repeatRule });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditing(false);
    } catch {
      Alert.alert('저장 중 오류가 발생했어요.');
    } finally {
      setSaving(false);
    }
  }, [title, body, triggerAt, repeatRule, reminder.id, update]);

  const handleDelete = useCallback(() => {
    Alert.alert('알림 삭제', `"${reminder.title}" 알림을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          await remove(reminder.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onClose();
        },
      },
    ]);
  }, [reminder, remove, onClose]);

  const pickerDate = new Date(triggerAt);

  if (editing) {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => setEditing(false)} hitSlop={12}>
            <Text variant="body" color="secondary">취소</Text>
          </TouchableOpacity>
          <Text variant="heading" weight="semibold">알림 편집</Text>
          <TouchableOpacity onPress={handleSave} hitSlop={12} disabled={saving}>
            <Text variant="body" weight="semibold" color="accent">{saving ? '저장 중…' : '저장'}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.timeSection}>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
              <Text style={styles.timeDisplay} weight="bold">{formatTime(triggerAt)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.dateBadge, { backgroundColor: theme.surfaceMuted }]}
            >
              <Text variant="body" color="secondary">{formatDate(triggerAt)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.chipsSection}>
            <QuickTimeChips selectedTime={triggerAt} onSelect={setTriggerAt} />
          </View>
          <View style={styles.formSection}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="무엇을 잊으면 안 되나요?"
              placeholderTextColor={theme.textTertiary}
              style={[styles.titleInput, { color: theme.textPrimary, borderBottomColor: theme.border }]}
              maxLength={100}
              autoFocus
            />
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="메모 (선택)"
              placeholderTextColor={theme.textTertiary}
              style={[styles.bodyInput, { color: theme.textPrimary, backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}
              maxLength={300}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={styles.repeatSection}>
              <Text variant="caption" weight="semibold" color="secondary">반복</Text>
              <View style={styles.repeatRow}>
                {REPEAT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setRepeatRule(opt.value)}
                    style={[
                      styles.repeatChip,
                      { backgroundColor: repeatRule === opt.value ? theme.accent : theme.surfaceMuted, borderColor: repeatRule === opt.value ? theme.accent : theme.border },
                    ]}
                  >
                    <Text variant="caption" weight="medium" style={{ color: repeatRule === opt.value ? '#fff' : theme.textSecondary }}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
        {showDatePicker && (
          <DateTimePicker value={pickerDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={new Date()}
            onChange={(_, date) => { setShowDatePicker(false); if (date) { const n = new Date(triggerAt); n.setFullYear(date.getFullYear(), date.getMonth(), date.getDate()); setTriggerAt(n.getTime()); } }} />
        )}
        {showTimePicker && (
          <DateTimePicker value={pickerDate} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => { setShowTimePicker(false); if (date) { const n = new Date(triggerAt); n.setHours(date.getHours(), date.getMinutes(), 0, 0); setTriggerAt(n.getTime()); } }} />
        )}
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onClose} hitSlop={12}>
          <Text variant="body" color="secondary">닫기</Text>
        </TouchableOpacity>
        <Text variant="heading" weight="semibold">알림 상세</Text>
        {isEditable ? (
          <TouchableOpacity onPress={handleStartEdit} hitSlop={12}>
            <Text variant="body" weight="semibold" color="accent">편집</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {(isFired || isCancelled) && (
          <View style={[styles.statusBadge, { backgroundColor: theme.surfaceMuted }]}>
            <Text variant="caption" color="tertiary" weight="medium">
              {isFired ? '✓ 알림 완료' : '취소됨'}
            </Text>
          </View>
        )}
        <View style={styles.timeSection}>
          <Text style={[styles.timeDisplay, isFired && styles.firedText]} weight="bold" color={isFired ? 'tertiary' : 'primary'}>
            {formatTime(reminder.triggerAt)}
          </Text>
          <View style={[styles.dateBadge, { backgroundColor: theme.surfaceMuted }]}>
            <Text variant="body" color="secondary">{formatDate(reminder.triggerAt)}</Text>
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <Text variant="title" weight="semibold" style={isFired && styles.firedText}>{reminder.title}</Text>
          {reminder.body ? (
            <Text variant="body" color="secondary" style={[styles.bodyText, isFired && styles.firedText]}>{reminder.body}</Text>
          ) : null}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.metaRow}>
            <Text variant="caption" color="tertiary">반복</Text>
            <Text variant="caption" weight="medium" color="secondary">{REPEAT_LABEL[reminder.repeatRule]}</Text>
          </View>
        </View>
      </ScrollView>
      {isEditable && (
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button label="삭제" variant="destructive" onPress={handleDelete} loading={deleting} fullWidth size="lg" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  scroll: { padding: Spacing.lg, gap: Spacing.xl },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.pill },
  timeSection: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  timeDisplay: { fontSize: FontSize.displayXl, fontWeight: FontWeight.bold, lineHeight: 76 },
  dateBadge: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.pill },
  card: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.lg, gap: Spacing.md },
  bodyText: { lineHeight: 22 },
  divider: { height: 1, marginVertical: Spacing.xs },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footer: { padding: Spacing.lg, borderTopWidth: 1 },
  firedText: { textDecorationLine: 'line-through', opacity: 0.5 },
  chipsSection: { paddingBottom: Spacing.xl },
  formSection: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  titleInput: { fontSize: FontSize.title, fontWeight: FontWeight.medium, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  bodyInput: { fontSize: FontSize.body, padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1, minHeight: 80 },
  repeatSection: { gap: Spacing.sm },
  repeatRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  repeatChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.pill, borderWidth: 1 },
});
