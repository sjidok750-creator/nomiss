import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import { setupNotificationChannel, addNotificationResponseListener } from '../src/lib/notifications';
import { useReminderStore } from '../src/features/reminders/store';
import 'react-native-reanimated';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const load = useReminderStore((s) => s.load);

  useEffect(() => {
    setupNotificationChannel();
    load().finally(() => SplashScreen.hideAsync());
  }, []);

  useEffect(() => {
    const sub = addNotificationResponseListener((reminderId) => {
      router.push({ pathname: '/reminder/[id]', params: { id: reminderId } });
    });
    return () => sub.remove();
  }, []);

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="new"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen
          name="reminder/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
      </Stack>
    </>
  );
}
