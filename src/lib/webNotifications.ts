/**
 * Web notification scheduler.
 * Uses the browser Notification API + localStorage to persist scheduled alarms.
 *
 * KEY LIMITATION: notifications only fire while the browser tab is open.
 * True background alarms require a server-side push (not possible on static GitHub Pages).
 *
 * Sound: `new Notification()` triggers the OS notification sound automatically
 *        (whatever the user has configured for browser notifications in phone settings).
 *        No custom audio needed — the OS handles it.
 */

import type { Reminder, NoticeType } from '../types/reminder';
import { NOTICE_OPTIONS } from '../types/reminder';

const STORAGE_KEY = 'nomiss.scheduled.v2';

const timers = new Map<string, ReturnType<typeof setTimeout>>();

interface ScheduledEntry {
  id: string;
  reminderId: string;
  title: string;
  body: string;
  fireAt: number;
  silent: boolean;
}

// ─── Storage ──────────────────────────────────────────────────

function load(): ScheduledEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScheduledEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: ScheduledEntry[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch {}
}

// ─── Permission ───────────────────────────────────────────────

export async function requestWebNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getWebPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

// ─── Firing ───────────────────────────────────────────────────

function fire(entry: ScheduledEntry): void {
  timers.delete(entry.id);
  save(load().filter((e) => e.id !== entry.id));

  if (typeof window === 'undefined') return;

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(entry.title, {
        body: entry.body || undefined,
        tag: entry.id,
        renotify: true,
        requireInteraction: true,
        // silent: false → OS plays its own notification sound (phone vibrates + rings)
        // silent: true  → no sound
        silent: entry.silent,
      });
      n.onclick = () => { window.focus(); n.close(); };
    } catch {}
  }
}

function arm(entry: ScheduledEntry): void {
  const delay = entry.fireAt - Date.now();
  if (delay <= 0) {
    // Slightly past due (within 1 min): fire immediately
    if (entry.fireAt >= Date.now() - 60_000) fire(entry);
    return;
  }
  const MAX = 2_100_000_000; // ~24 days max for setTimeout
  const id = setTimeout(delay > MAX ? () => arm(entry) : () => fire(entry), Math.min(delay, MAX));
  timers.set(entry.id, id);
}

function disarm(id: string): void {
  const t = timers.get(id);
  if (t !== undefined) { clearTimeout(t); timers.delete(id); }
}

// ─── Time calculation ─────────────────────────────────────────

function calcFireTime(triggerAt: number, notice: NoticeType): number {
  switch (notice) {
    case 'at_time':    return triggerAt;
    case '1hour':      return triggerAt - 60 * 60 * 1000;
    case '1day':       return triggerAt - 24 * 60 * 60 * 1000;
    case '3days':      return triggerAt - 3 * 24 * 60 * 60 * 1000;
    case '1week':      return triggerAt - 7 * 24 * 60 * 60 * 1000;
    case 'sameday_am': { const d = new Date(triggerAt); d.setHours(9, 0, 0, 0); return d.getTime(); }
    case 'sameday_pm': { const d = new Date(triggerAt); d.setHours(14, 0, 0, 0); return d.getTime(); }
  }
}

// ─── Public API ───────────────────────────────────────────────

export async function scheduleWebNotifications(reminder: Reminder): Promise<void> {
  if (typeof window === 'undefined') return;

  cancelWebNotifications(reminder.id);
  await requestWebNotificationPermission();

  const now = Date.now();
  const entries = load();
  const isSilent = reminder.sound === 'silent';

  for (const notice of reminder.advanceNotices) {
    const fireAt = calcFireTime(reminder.triggerAt, notice);
    if (fireAt <= now) continue;

    const label = NOTICE_OPTIONS.find((o) => o.value === notice)?.label;
    const title = notice === 'at_time' ? reminder.title : `[${label}] ${reminder.title}`;

    const entry: ScheduledEntry = {
      id: `${reminder.id}_${notice}`,
      reminderId: reminder.id,
      title,
      body: reminder.body ?? '',
      fireAt,
      silent: isSilent,
    };
    entries.push(entry);
    arm(entry);
  }

  save(entries);
}

export function cancelWebNotifications(reminderId: string): void {
  if (typeof window === 'undefined') return;
  const remaining: ScheduledEntry[] = [];
  for (const e of load()) {
    if (e.reminderId === reminderId) disarm(e.id);
    else remaining.push(e);
  }
  save(remaining);
}

export function cancelAllWebNotifications(): void {
  if (typeof window === 'undefined') return;
  for (const id of Array.from(timers.keys())) disarm(id);
  save([]);
}

/**
 * Call once on app start to re-arm timers that were saved in a previous session.
 */
export function rehydrateWebNotifications(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const live: ScheduledEntry[] = [];
  for (const e of load()) {
    if (e.fireAt <= now - 60_000) continue; // more than 1 min past → discard
    live.push(e);
    arm(e);
  }
  save(live);
}

// kept for compatibility
export function unlockAudio(): void {}
