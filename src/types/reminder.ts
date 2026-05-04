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
  { value: '1week',      label: '1주일 전' },
  { value: '3days',      label: '3일 전' },
  { value: '1day',       label: '하루 전' },
  { value: 'sameday_am', label: '당일 오전 9시' },
  { value: 'sameday_pm', label: '당일 오후 2시' },
  { value: '1hour',      label: '1시간 전' },
  { value: 'at_time',    label: '정각' },
];

export type SoundOption = 'default' | 'silent';

export const SOUND_OPTIONS: { value: SoundOption; label: string; emoji: string }[] = [
  { value: 'default', label: '기본 소리', emoji: '🔔' },
  { value: 'silent',  label: '무음 (진동)', emoji: '📳' },
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
