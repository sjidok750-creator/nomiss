import { create } from 'zustand';
import { Reminder, CreateReminderInput, UpdateReminderInput } from '../../types/reminder';
import { loadReminders, saveReminders } from '../../lib/storage';
import { scheduleNotification, cancelNotification } from '../../lib/notifications';

function generateId(): string {
  return `reminder_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// 기존 데이터에 categoryId 없는 경우 'default' 부여
function migrate(r: Reminder): Reminder {
  if (!r.categoryId) return { ...r, categoryId: 'default' };
  return r;
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
      categoryId: input.categoryId ?? 'default',
      status: 'scheduled',
      createdAt: now,
      updatedAt: now,
    };

    await scheduleNotification(reminder.id, reminder.title, reminder.body, reminder.triggerAt, reminder.repeatRule);

    const reminders = [...get().reminders, reminder];
    set({ reminders });
    await saveReminders(reminders);
  },

  update: async (id, input) => {
    const existing = get().reminders.find((r) => r.id === id);
    if (!existing) return;
    const updated: Reminder = { ...existing, ...input, updatedAt: Date.now() };

    await cancelNotification(id);
    await scheduleNotification(updated.id, updated.title, updated.body, updated.triggerAt, updated.repeatRule);

    const reminders = get().reminders.map((r) => (r.id === id ? updated : r));
    set({ reminders });
    await saveReminders(reminders);
  },

  remove: async (id) => {
    await cancelNotification(id);
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
