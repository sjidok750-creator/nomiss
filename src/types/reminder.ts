export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Reminder {
  id: string;
  title: string;
  body?: string;
  triggerAt: number; // epoch ms
  repeatRule: RepeatRule;
  status: 'scheduled' | 'fired' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export type CreateReminderInput = Pick<Reminder, 'title' | 'body' | 'triggerAt' | 'repeatRule'>;
export type UpdateReminderInput = Partial<CreateReminderInput>;
