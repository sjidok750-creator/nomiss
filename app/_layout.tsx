import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupNotificationChannel, addNotificationResponseListener } from '../src/lib/notifications';
import { useReminderStore } from '../src/features/reminders/store';
import { ONBOARDING_KEY } from './onboarding';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const load = useReminderStore((s) => s.load);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      await setupNotificationChannel();
      await load();
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      await SplashScreen.hideAsync();
      setReady(true);
      if (!done) {
        router.replace('/onboarding');
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
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="new" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="reminder/[id]" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </>
  );
}
