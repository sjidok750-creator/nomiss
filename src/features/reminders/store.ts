import { create } from 'zustand';
import { Reminder, CreateReminderInput, UpdateReminderInput } from '../../types/reminder';
import { loadReminders, saveReminders } from '../../lib/storage';
import { scheduleAllNotifications, cancelAllNotificationsForReminder } from '../../lib/notifications';

function generateId(): string {
  return `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function migrate(r: any): Reminder {
  return {
    ...r,
    categoryId: r.categoryId ?? 'default',
    advanceNotices: r.advanceNotices ?? ['at_time'],
    sound: r.sound ?? 'default',
  };
}

interface ReminderStore {
  reminders: Reminder[];
  isLoaded: boolean;
  load: () => Promise<void>;
  create: (input: CreateReminderInput) => Promise<void>;
  update: (id: string, input: UpdateReminderInput) => Promise<void>;
  remove: (id: string) => Promise<void>;
  markFired: (id: string) => Promise<void>;
  importReminders: (data: Reminder[]) => Promise<void>;
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: [],
  isLoaded: false,

  load: async () => {
    const raw = await loadReminders();
    const now = Date.now();
    const reminders = raw.map(migrate).map((r) =>
      r.status === 'scheduled' && r.repeatRule === 'none' && r.triggerAt < now
        ? { ...r, status: 'fired' as const }
        : r,
    );
    set({ reminders, isLoaded: true });
    await saveReminders(reminders);
  },

  create: async (input) => {
    const now = Date.now();
    const reminder: Reminder = {
      id: generateId(),
      title: input.title,
      body: input.body,
      triggerAt: input.triggerAt,
      repeatRule: input.repeatRule,
      categoryId: 'default',
      advanceNotices: input.advanceNotices,
      sound: input.sound,
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    };

    // Persist first so a notification-platform error never loses the user's data
    const reminders = [...get().reminders, reminder];
    set({ reminders });
    await saveReminders(reminders);

    try {
      await scheduleAllNotifications(reminder);
    } catch (e) {
      console.warn('[store] scheduleAllNotifications failed', e);
    }
  },

  update: async (id, input) => {
    const existing = get().reminders.find((r) => r.id === id);
    if (!existing) return;
    const updated: Reminder = { ...existing, ...input, updatedAt: Date.now() };

    // Persist first, then schedule
    const reminders = get().reminders.map((r) => (r.id === id ? updated : r));
    set({ reminders });
    await saveReminders(reminders);

    try {
      await cancelAllNotificationsForReminder(id);
      await scheduleAllNotifications(updated);
    } catch (e) {
      console.warn('[store] reschedule failed', e);
    }
  },

  remove: async (id) => {
    await cancelAllNotificationsForReminder(id);
    const reminders = get().reminders.filter((r) => r.id !== id);
    set({ reminders });
    await saveReminders(reminders);
  },

  markFired: async (id) => {
    const reminders = get().reminders.map((r) =>
      r.id === id ? { ...r, status: 'fired' as const, updatedAt: Date.now() } : r,
    );
    set({ reminders });
    await saveReminders(reminders);
  },

  importReminders: async (data) => {
    const migrated = data.map(migrate);
    set({ reminders: migrated });
    await saveReminders(migrated);
  },
}));
