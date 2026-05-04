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

export type NoticeType =
  | '1week'
  | '3days'
  | '1day'
  | 'sameday_am'
  | 'sameday_pm'
  | '1hour'
  | 'at_time';

export const NOTICE_OPTIONS: { value: NoticeType; label: string }[] = [
  { value: '1week',      label: '1 week before' },
  { value: '3days',      label: '3 days before' },
  { value: '1day',       label: '1 day before' },
  { value: 'sameday_am', label: 'Same day 9am' },
  { value: 'sameday_pm', label: 'Same day 2pm' },
  { value: '1hour',      label: '1 hour before' },
  { value: 'at_time',    label: 'At reminder time' },
];

export type SoundOption = 'default' | 'chime' | 'digital' | 'marimba' | 'bird' | 'silent';

export const SOUND_OPTIONS: { value: SoundOption; label: string; emoji: string }[] = [
  { value: 'default', label: 'Bell',    emoji: '🔔' },
  { value: 'chime',   label: 'Chime',   emoji: '🎐' },
  { value: 'digital', label: 'Digital', emoji: '📟' },
  { value: 'marimba', label: 'Marimba', emoji: '🎶' },
  { value: 'bird',    label: 'Bird',    emoji: '🐦' },
  { value: 'silent',  label: 'Silent',  emoji: '📳' },
];

export interface Reminder {
  id: string;
  title: string;
  body?: string;
  triggerAt: number;
  repeatRule: RepeatRule;
  categoryId: CategoryId;
  advanceNotices: NoticeType[];
  sound: SoundOption;
  status: 'scheduled' | 'fired' | 'cancelled';
  createdAt: number;
  updatedAt: number;
}

export type CreateReminderInput = {
  title: string;
  body?: string;
  triggerAt: number;
  repeatRule: RepeatRule;
  advanceNotices: NoticeType[];
  sound: SoundOption;
};

export type UpdateReminderInput = Partial<CreateReminderInput>;
