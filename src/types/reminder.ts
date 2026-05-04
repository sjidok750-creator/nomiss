export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly';

export type CategoryId =
  | 'default'
  | 'work'
  | 'health'
  | 'personal'
  | 'finance'
  | 'study'
  | 'errand';

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { id: 'default',  label: '일반',   color: '#6B6B6B', emoji: '📌' },
  { id: 'work',     label: '업무',   color: '#3B82F6', emoji: '💼' },
  { id: 'health',   label: '건강',   color: '#16A34A', emoji: '💊' },
  { id: 'personal', label: '개인',   color: '#F59E0B', emoji: '🙂' },
  { id: 'finance',  label: '금융',   color: '#EF4444', emoji: '💰' },
  { id: 'study',    label: '공부',   color: '#8B5CF6', emoji: '📚' },
  { id: 'errand',   label: '심부름', color: '#EC4899', emoji: '🛒' },
];

export function getCategoryById(id: CategoryId): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];
}

export interface Reminder {
  id: string;
  title: string;
  body?: string;
  triggerAt: number; // epoch ms
  repeatRule: RepeatRule;
  categoryId: CategoryId;
  status: 'scheduled' | 'fired' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export type CreateReminderInput = Pick<
  Reminder,
  'title' | 'body' | 'triggerAt' | 'repeatRule' | 'categoryId'
>;
export type UpdateReminderInput = Partial<CreateReminderInput>;
