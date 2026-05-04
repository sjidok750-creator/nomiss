import { useEffect, useState } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupNotificationChannel, addNotificationResponseListener } from '../src/lib/notifications';
import { useReminderStore } from '../src/features/reminders/store';
import { ONBOARDING_KEY } from './onboarding';

if (Platform.OS !== 'web') {
  require('react-native-reanimated');
  SplashScreen.preventAutoHideAsync();
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const load = useReminderStore((s) => s.load);
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await setupNotificationChannel();
        await load();
        const done = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (Platform.OS !== 'web') {
          await SplashScreen.hideAsync();
        }
        if (!done && pathname !== '/onboarding') {
          router.replace('/onboarding');
        }
      } finally {
        setReady(true);
      }
    }
    init();
  }, []);

  useEffect(() => {
    const sub = addNotificationResponseListener((reminderId) => {
      router.push({ pathname: '/reminder/[id]', params: { id: reminderId } });
    });
    return () => sub.remove();
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
