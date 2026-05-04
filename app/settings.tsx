import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useReminderStore } from '../src/features/reminders/store';
import { cancelAllNotifications } from '../src/lib/notifications';
import { exportBackup, importBackup } from '../src/lib/backup';
import { CATEGORIES, getCategoryById } from '../src/types/reminder';
import { Text } from '../src/components/ui/Text';
import { lightTheme, darkTheme } from '../src/design/theme';
import { Spacing, Radius } from '../src/design/tokens';
import { ONBOARDING_KEY } from './onboarding';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const reminders = useReminderStore((s) => s.reminders);
  const importReminders = useReminderStore((s) => s.importReminders);
  const [permGranted, setPermGranted] = useState<boolean | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => setPermGranted(status === 'granted'));
  }, []);

  // 통계
  const scheduledCount = reminders.filter((r) => r.status === 'scheduled').length;
  const firedCount = reminders.filter((r) => r.status === 'fired').length;
  const totalCount = reminders.length;
  const completionRate = totalCount > 0 ? Math.round((firedCount / totalCount) * 100) : 0;

  // 카테고리별 통계
  const catStats = CATEGORIES.map((cat) => ({
    cat,
    count: reminders.filter((r) => (r.categoryId ?? 'default') === cat.id).length,
  })).filter((s) => s.count > 0);

  const handleExport = async () => {
    setBackupLoading(true);
    try {
      await exportBackup(reminders);
    } catch (e: any) {
      Alert.alert('내보내기 실패', e?.message ?? '알 수 없는 오류');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleImport = async () => {
    try {
      const imported = await importBackup();
      Alert.alert(
        '백업 가져오기',
        `${imported.length}개의 알림을 불러올까요?\n현재 데이터는 덮어쓰여집니다.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '가져오기',
            style: 'destructive',
            onPress: async () => {
              await importReminders(imported);
              Alert.alert('완료', '백업을 성공적으로 불러왔어요.');
            },
          },
        ],
      );
    } catch (e: any) {
      if (e?.message !== 'CANCELLED') Alert.alert('가져오기 실패', e?.message ?? '알 수 없는 오류');
    }
  };

  const openNotificationSettings = () => {
    Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings();
  };

  const handleClearAll = () => {
    Alert.alert('모든 알림 취소', '예정된 모든 알림을 취소할까요?', [
      { text: '닫기', style: 'cancel' },
      {
        text: '취소',
        style: 'destructive',
        onPress: async () => {
          await cancelAllNotifications();
          Alert.alert('완료', '모든 알림이 취소됐어요.');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={{ width: 40 }} />
        <Text variant="heading" weight="semibold">설정</Text>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text variant="body" color="secondary">닫기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* 통계 */}
        <View style={styles.section}>
          <Text variant="caption" weight="semibold" color="tertiary" style={styles.sectionLabel}>통계</Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            {/* 완료율 */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text variant="display" weight="bold" color="accent">{completionRate}%</Text>
                <Text variant="caption" color="secondary">완료율</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <Text variant="display" weight="bold">{scheduledCount}</Text>
                <Text variant="caption" color="secondary">예정</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <Text variant="display" weight="bold">{firedCount}</Text>
                <Text variant="caption" color="secondary">완료</Text>
              </View>
            </View>
            {/* 완료율 바 */}
            <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${completionRate}%` as any }]} />
            </View>
            {/* 카테고리별 */}
            {catStats.length > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: theme.border }]} />
                {catStats.map(({ cat, count }) => (
                  <View key={cat.id} style={styles.row}>
                    <View style={styles.catLabel}>
                      <Text style={styles.catEmoji}>{cat.emoji}</Text>
                      <Text variant="body">{cat.label}</Text>
                    </View>
                    <View style={styles.rowRight}>
                      <View style={[styles.catBar, { backgroundColor: cat.color + '33' }]}>
                        <View style={[styles.catBarFill, { backgroundColor: cat.color, width: Math.max(8, (count / totalCount) * 80) }]} />
                      </View>
                      <Text variant="caption" weight="semibold" style={{ color: cat.color, minWidth: 24, textAlign: 'right' }}>{count}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        {/* 알림 권한 */}
        <View style={styles.section}>
          <Text variant="caption" weight="semibold" color="tertiary" style={styles.sectionLabel}>알림</Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text variant="body" weight="medium">알림 권한</Text>
                <Text variant="caption" color={permGranted ? 'secondary' : 'danger'}>
                  {permGranted === null ? '확인 중…' : permGranted ? '허용됨' : '거부됨 — 탭하여 설정 열기'}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: permGranted ? theme.successLight : theme.dangerLight }]}>
                <Text variant="tiny" weight="semibold" style={{ color: permGranted ? theme.success : theme.danger }}>
                  {permGranted ? 'ON' : 'OFF'}
                </Text>
              </View>
            </View>
            {!permGranted && (
              <TouchableOpacity onPress={openNotificationSettings} style={[styles.settingsButton, { backgroundColor: theme.accent }]}>
                <Text variant="caption" weight="semibold" style={{ color: '#fff' }}>설정에서 허용하기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 백업 */}
        <View style={styles.section}>
          <Text variant="caption" weight="semibold" color="tertiary" style={styles.sectionLabel}>백업</Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.row} onPress={handleExport} disabled={backupLoading}>
              <View style={styles.rowLeft}>
                <Text variant="body" weight="medium">JSON으로 내보내기</Text>
                <Text variant="caption" color="secondary">전체 {totalCount}개 알림을 파일로 저장</Text>
              </View>
              <Text variant="body" color="tertiary">↑</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={styles.row} onPress={handleImport}>
              <View style={styles.rowLeft}>
                <Text variant="body" weight="medium">백업에서 가져오기</Text>
                <Text variant="caption" color="secondary">nomiss JSON 파일로 복원</Text>
              </View>
              <Text variant="body" color="tertiary">↓</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 관리 */}
        <View style={styles.section}>
          <Text variant="caption" weight="semibold" color="tertiary" style={styles.sectionLabel}>관리</Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.row} onPress={() => { AsyncStorage.removeItem(ONBOARDING_KEY); router.replace('/onboarding'); }}>
              <Text variant="body">소개 화면 다시 보기</Text>
              <Text variant="body" color="tertiary">›</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <TouchableOpacity style={styles.row} onPress={handleClearAll}>
              <Text variant="body" color="danger">모든 알림 취소</Text>
              <Text variant="body" color="tertiary">›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 앱 정보 */}
        <View style={styles.section}>
          <Text variant="caption" weight="semibold" color="tertiary" style={styles.sectionLabel}>정보</Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <View style={styles.row}>
              <Text variant="body">버전</Text>
              <Text variant="body" color="secondary">{Application.nativeApplicationVersion ?? '1.0.0'}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
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
  scroll: { padding: Spacing.lg, gap: Spacing.xl },
  section: { gap: Spacing.sm },
  sectionLabel: { paddingHorizontal: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.8 },
  card: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  statsRow: { flexDirection: 'row', padding: Spacing.lg },
  statBox: { flex: 1, alignItems: 'center', gap: Spacing.xs },
  statDivider: { width: 1, marginVertical: Spacing.sm },
  progressBg: { height: 6, marginHorizontal: Spacing.lg, marginBottom: Spacing.md, borderRadius: Radius.pill },
  progressFill: { height: 6, borderRadius: Radius.pill, minWidth: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  rowLeft: { gap: Spacing.xs / 2, flex: 1 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs / 2, borderRadius: Radius.pill },
  divider: { height: 1, marginHorizontal: Spacing.lg },
  settingsButton: { margin: Spacing.md, marginTop: 0, padding: Spacing.md, borderRadius: Radius.md, alignItems: 'center' },
  catLabel: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  catEmoji: { fontSize: 16 },
  catBar: { height: 6, width: 80, borderRadius: Radius.pill, overflow: 'hidden' },
  catBarFill: { height: 6, borderRadius: Radius.pill },
});
