import { useEffect, useState } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { setupNotificationChannel, addNotificationResponseListener } from '../src/lib/notifications';
import { rehydrateWebNotifications } from '../src/lib/webNotifications';
import { useReminderStore } from '../src/features/reminders/store';

if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('react-native-reanimated');
  SplashScreen.preventAutoHideAsync();
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
        if (Platform.OS === 'web') {
          rehydrateWebNotifications();
        } else {
          await SplashScreen.hideAsync();
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
        <Stack.Screen name="new" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="reminder/[id]" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
