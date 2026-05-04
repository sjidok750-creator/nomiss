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
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useReminderStore } from '../src/features/reminders/store';
import { requestNotificationPermission } from '../src/lib/notifications';
import { QuickTimeChips } from '../src/components/form/QuickTimeChips';
import { CategoryPicker } from '../src/components/form/CategoryPicker';
import { Button } from '../src/components/ui/Button';
import { Text } from '../src/components/ui/Text';
import { lightTheme, darkTheme } from '../src/design/theme';
import { Spacing, Radius, FontSize, FontWeight } from '../src/design/tokens';
import { RepeatRule, CategoryId } from '../src/types/reminder';
import { formatTime, formatDate } from '../src/lib/time';
import { addMinutes } from 'date-fns';

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
  const [categoryId, setCategoryId] = useState<CategoryId>('default');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      Alert.alert('제목을 입력해주세요');
      return;
    }
    if (triggerAt <= Date.now()) {
      Alert.alert('미래의 시간을 선택해주세요');
      return;
    }

    setLoading(true);
    try {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          '알림 권한 필요',
          '알림을 받으려면 설정에서 알림 권한을 허용해주세요.',
        );
        setLoading(false);
        return;
      }

      await create({ title: title.trim(), body: body.trim() || undefined, triggerAt, repeatRule, categoryId });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('저장 중 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [title, body, triggerAt, repeatRule, create]);

  const pickerDate = new Date(triggerAt);

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
          {/* Time Display */}
          <View style={styles.timeSection}>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.timeDisplay} weight="bold">
                {formatTime(triggerAt)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
              style={[styles.dateBadge, { backgroundColor: theme.surfaceMuted }]}
            >
              <Text variant="body" color="secondary">{formatDate(triggerAt)}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Time Chips */}
          <View style={styles.chipsSection}>
            <QuickTimeChips selectedTime={triggerAt} onSelect={setTriggerAt} />
          </View>

          {/* Title Input */}
          <View style={styles.formSection}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="무엇을 잊으면 안 되나요?"
              placeholderTextColor={theme.textTertiary}
              style={[
                styles.titleInput,
                { color: theme.textPrimary, borderBottomColor: theme.border },
              ]}
              maxLength={100}
              autoFocus
              returnKeyType="next"
            />

            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="메모 (선택)"
              placeholderTextColor={theme.textTertiary}
              style={[
                styles.bodyInput,
                {
                  color: theme.textPrimary,
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}
              maxLength={300}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {/* Category */}
            <View style={styles.repeatSection}>
              <Text variant="caption" weight="semibold" color="secondary">카테고리</Text>
              <CategoryPicker selected={categoryId} onSelect={setCategoryId} />
            </View>

            {/* Repeat */}
            <View style={styles.repeatSection}>
              <Text variant="caption" weight="semibold" color="secondary" style={styles.repeatLabel}>
                반복
              </Text>
              <View style={styles.repeatRow}>
                {REPEAT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setRepeatRule(opt.value)}
                    style={[
                      styles.repeatChip,
                      {
                        backgroundColor:
                          repeatRule === opt.value ? theme.accent : theme.surfaceMuted,
                        borderColor:
                          repeatRule === opt.value ? theme.accent : theme.border,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      weight="medium"
                      style={{
                        color: repeatRule === opt.value ? '#fff' : theme.textSecondary,
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button
            label="저장"
            onPress={handleSave}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            minimumDate={new Date()}
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) {
                const next = new Date(triggerAt);
                next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                setTriggerAt(next.getTime());
              }
            }}
          />
        )}

        {/* Time Picker */}
        {showTimePicker && (
          <DateTimePicker
            value={pickerDate}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
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
  scroll: {
    paddingBottom: Spacing.huge,
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
  chipsSection: {
    paddingBottom: Spacing.xl,
  },
  formSection: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
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
  repeatSection: {
    gap: Spacing.sm,
  },
  repeatLabel: {
    marginBottom: Spacing.xs,
  },
  repeatRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  repeatChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});
