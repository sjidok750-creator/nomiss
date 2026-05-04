import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupNotificationChannel, addNotificationResponseListener } from '../src/lib/notifications';
import { useReminderStore } from '../src/features/reminders/store';
import { ONBOARDING_KEY } from './onboarding';
import 'react-native-reanimated';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const load = useReminderStore((s) => s.load);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await setupNotificationChannel();
        await load();
        const done = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (!done) {
          router.replace('/onboarding');
        }
      } catch (e) {
        console.warn('Init error:', e);
      } finally {
        if (Platform.OS !== 'web') {
          SplashScreen.hideAsync().catch(() => {});
        }
        setReady(true);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    try {
      const sub = addNotificationResponseListener((reminderId) => {
        router.push({ pathname: '/reminder/[id]', params: { id: reminderId } });
      });
      return () => sub.remove();
    } catch (e) {
      console.warn('Notification listener error:', e);
    }
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="new" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="reminder/[id]" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
