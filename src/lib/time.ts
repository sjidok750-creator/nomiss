import { format, isToday, isTomorrow, isThisWeek, addMinutes, addHours, set } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatTime(epochMs: number): string {
  return format(new Date(epochMs), 'a h:mm', { locale: ko });
}

export function formatDate(epochMs: number): string {
  const date = new Date(epochMs);
  if (isToday(date)) return '오늘';
  if (isTomorrow(date)) return '내일';
  if (isThisWeek(date)) return format(date, 'EEEE', { locale: ko });
  return format(date, 'M월 d일 (EEE)', { locale: ko });
}

export function formatDateTime(epochMs: number): string {
  return `${formatDate(epochMs)} ${formatTime(epochMs)}`;
}

export function quickTimeOptions(): { label: string; value: number }[] {
  const now = Date.now();
  return [
    { label: '10분 후', value: addMinutes(now, 10).getTime() },
    { label: '30분 후', value: addMinutes(now, 30).getTime() },
    { label: '1시간 후', value: addHours(now, 1).getTime() },
    { label: '3시간 후', value: addHours(now, 3).getTime() },
    {
      label: '내일 오전 9시',
      value: set(addHours(now, 24), { hours: 9, minutes: 0, seconds: 0, milliseconds: 0 }).getTime(),
    },
  ];
}

export function groupRemindersByDate<T extends { triggerAt: number }>(
  reminders: T[],
): { label: string; data: T[] }[] {
  const groups: Map<string, T[]> = new Map();

  for (const reminder of reminders) {
    const key = formatDate(reminder.triggerAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(reminder);
  }

  return Array.from(groups.entries()).map(([label, data]) => ({ label, data }));
}
