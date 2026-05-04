import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestNotificationPermission } from '../src/lib/notifications';
import { Button } from '../src/components/ui/Button';
import { Text } from '../src/components/ui/Text';
import { lightTheme, darkTheme } from '../src/design/theme';
import { Spacing, Radius, Colors } from '../src/design/tokens';

export const ONBOARDING_KEY = '@nomiss/onboarding_done';

const { width } = Dimensions.get('window');

const PAGES = [
  {
    emoji: '🔔',
    title: '잊지 않아도 돼요',
    desc: '해야 할 일, 약속, 복약 시간…\n중요한 순간을 nomiss가 기억해드려요.',
  },
  {
    emoji: '⚡',
    title: '3초 만에 등록',
    desc: '시간을 고르고 제목만 입력하면 끝.\n복잡한 설정은 필요 없어요.',
  },
  {
    emoji: '📲',
    title: '딱 맞는 시간에',
    desc: '설정한 시간에 정확히 알려드려요.\n반복 알림으로 습관도 만들 수 있어요.',
  },
];

export default function OnboardingScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const isLast = page === PAGES.length - 1;

  const handleNext = () => {
    if (!isLast) {
      Haptics.selectionAsync();
      setPage((p) => p + 1);
    }
  };

  const handleStart = async () => {
    setLoading(true);
    await requestNotificationPermission();
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/');
  };

  const current = PAGES[page];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
      <View style={styles.container}>
        {/* Skip */}
        {!isLast && (
          <TouchableOpacity style={styles.skip} onPress={handleStart}>
            <Text variant="caption" color="tertiary">건너뛰기</Text>
          </TouchableOpacity>
        )}

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.emoji}>{current.emoji}</Text>
          <Text variant="title" weight="bold" style={styles.title}>
            {current.title}
          </Text>
          <Text variant="body" color="secondary" style={styles.desc}>
            {current.desc}
          </Text>
        </View>

        {/* Dots */}
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === page ? theme.accent : theme.border,
                  width: i === page ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA */}
        <View style={styles.footer}>
          {isLast ? (
            <Button
              label="시작하기"
              onPress={handleStart}
              loading={loading}
              fullWidth
              size="lg"
            />
          ) : (
            <Button
              label="다음"
              onPress={handleNext}
              fullWidth
              size="lg"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Spacing.xxl },
  skip: {
    alignSelf: 'flex-end',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  emoji: {
    fontSize: 80,
    lineHeight: 96,
    textAlign: 'center',
  },
  title: {
    textAlign: 'center',
  },
  desc: {
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  dot: {
    height: 8,
    borderRadius: Radius.pill,
  },
  footer: {
    paddingBottom: Spacing.xl,
  },
});
