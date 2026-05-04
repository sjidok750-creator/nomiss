import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { RepeatRule, NoticeType, SoundOption, NOTICE_OPTIONS } from '../types/reminder';
import type { Reminder } from '../types/reminder';

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

function noticeId(reminderId: string, notice: NoticeType): string {
  return `${reminderId}_${notice}`;
}

function calcNoticeTime(triggerAt: number, notice: NoticeType): number {
  switch (notice) {
    case 'at_time':    return triggerAt;
    case '1hour':      return triggerAt - 60 * 60 * 1000;
    case '1day':       return triggerAt - 24 * 60 * 60 * 1000;
    case '3days':      return triggerAt - 3 * 24 * 60 * 60 * 1000;
    case '1week':      return triggerAt - 7 * 24 * 60 * 60 * 1000;
    case 'sameday_am': {
      const d = new Date(triggerAt);
      d.setHours(9, 0, 0, 0);
      return d.getTime();
    }
    case 'sameday_pm': {
      const d = new Date(triggerAt);
      d.setHours(14, 0, 0, 0);
      return d.getTime();
    }
  }
}

export async function scheduleAllNotifications(reminder: Reminder): Promise<void> {
  if (Platform.OS === 'web') return;

  const sound: string | undefined = reminder.sound === 'silent' ? undefined : 'default';

  for (const notice of reminder.advanceNotices) {
    const noticeTime = calcNoticeTime(reminder.triggerAt, notice);
    if (noticeTime <= Date.now()) continue;

    const label = NOTICE_OPTIONS.find((o) => o.value === notice)?.label;
    const noticeTitle =
      notice === 'at_time' ? reminder.title : `[${label}] ${reminder.title}`;

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: noticeId(reminder.id, notice),
        content: {
          title: noticeTitle,
          body: reminder.body ?? '',
          data: { reminderId: reminder.id },
          sound,
        },
        trigger: buildTrigger(noticeTime, reminder.repeatRule),
      });
    } catch {
      // skip if past time for repeating triggers
    }
  }
}

export async function cancelAllNotificationsForReminder(reminderId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const allNotices: NoticeType[] = [
    '1week', '3days', '1day', 'sameday_am', 'sameday_pm', '1hour', 'at_time',
  ];
  await Promise.all(
    allNotices.map((n) =>
      Notifications.cancelScheduledNotificationAsync(noticeId(reminderId, n)).catch(() => {}),
    ),
  );
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
  return { type: Notifications.SchedulableTriggerInputTypes.DATE, date };
}
