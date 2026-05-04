import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { RepeatRule } from '../types/reminder';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: '알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF5A36',
    });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: false, allowSound: true },
  });
  return status === 'granted';
}

export async function scheduleNotification(
  id: string,
  title: string,
  body: string | undefined,
  triggerAt: number,
  repeatRule: RepeatRule,
): Promise<string> {
  if (Platform.OS === 'web') return id;
  const trigger = buildTrigger(triggerAt, repeatRule);

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title,
      body: body ?? '',
      data: { reminderId: id },
      sound: 'default',
    },
    trigger,
  });

  return id;
}

export async function cancelNotification(id: string): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(id);
}

export async function cancelAllNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function addNotificationResponseListener(
  handler: (reminderId: string) => void,
): Notifications.EventSubscription {
  if (Platform.OS === 'web') return { remove: () => {} } as unknown as Notifications.EventSubscription;
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const reminderId = response.notification.request.content.data?.reminderId as string;
    if (reminderId) handler(reminderId);
  });
}

export async function getLastNotificationReminderId(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const response = await Notifications.getLastNotificationResponseAsync();
  const reminderId = response?.notification.request.content.data?.reminderId as string;
  return reminderId ?? null;
}

function buildTrigger(
  triggerAt: number,
  repeatRule: RepeatRule,
): Notifications.NotificationTriggerInput {
  const date = new Date(triggerAt);

  if (repeatRule === 'daily') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }

  if (repeatRule === 'weekly') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: date.getDay() + 1,
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }

  if (repeatRule === 'monthly') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
      day: date.getDate(),
      hour: date.getHours(),
      minute: date.getMinutes(),
    };
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date,
  };
}
