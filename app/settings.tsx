import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  Linking,
  Switch,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useReminderStore } from '../src/features/reminders/store';
import { cancelAllNotifications } from '../src/lib/notifications';
import { Text } from '../src/components/ui/Text';
import { lightTheme, darkTheme } from '../src/design/theme';
import { Spacing, Radius } from '../src/design/tokens';
import { ONBOARDING_KEY } from './onboarding';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const reminders = useReminderStore((s) => s.reminders);
  const [permGranted, setPermGranted] = useState<boolean | null>(null);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermGranted(status === 'granted');
    });
  }, []);

  const scheduledCount = reminders.filter((r) => r.status === 'scheduled').length;
  const totalCount = reminders.length;

  const openNotificationSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  const handleResetOnboarding = async () => {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
    router.replace('/onboarding');
  };

  const handleClearAll = async () => {
    await cancelAllNotifications();
    router.back();
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
        {/* 알림 권한 */}
        <View style={styles.section}>
          <Text variant="caption" weight="semibold" color="tertiary" style={styles.sectionLabel}>
            알림
          </Text>
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
              <TouchableOpacity
                onPress={openNotificationSettings}
                style={[styles.settingsButton, { backgroundColor: theme.accent }]}
              >
                <Text variant="caption" weight="semibold" style={{ color: '#fff' }}>
                  설정에서 허용하기
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 통계 */}
        <View style={styles.section}>
          <Text variant="caption" weight="semibold" color="tertiary" style={styles.sectionLabel}>
            통계
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <View style={styles.row}>
              <Text variant="body">예정된 알림</Text>
              <Text variant="body" weight="semibold" color="accent">{scheduledCount}개</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.row}>
              <Text variant="body">전체 알림</Text>
              <Text variant="body" weight="medium" color="secondary">{totalCount}개</Text>
            </View>
          </View>
        </View>

        {/* 관리 */}
        <View style={styles.section}>
          <Text variant="caption" weight="semibold" color="tertiary" style={styles.sectionLabel}>
            관리
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <TouchableOpacity style={styles.row} onPress={handleResetOnboarding}>
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
          <Text variant="caption" weight="semibold" color="tertiary" style={styles.sectionLabel}>
            정보
          </Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
            <View style={styles.row}>
              <Text variant="body">버전</Text>
              <Text variant="body" color="secondary">
                {Application.nativeApplicationVersion ?? '1.0.0'}
              </Text>
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
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  rowLeft: { gap: Spacing.xs / 2 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Radius.pill,
  },
  divider: { height: 1, marginHorizontal: Spacing.lg },
  settingsButton: {
    margin: Spacing.md,
    marginTop: 0,
    padding: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  success: {},
  danger: {},
});
