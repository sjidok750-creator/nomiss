/**
 * Web-only scheduled notification system.
 * Uses browser Notification API + Web Audio API + localStorage.
 * Limitation: notifications only fire while the tab is open.
 * On iOS Safari, install as PWA (Add to Home Screen) for best results.
 */

import type { Reminder, NoticeType } from '../types/reminder';
import { NOTICE_OPTIONS } from '../types/reminder';

const STORAGE_KEY = 'nomiss.webScheduled.v1';

// In-memory map of active setTimeout handles
const timers = new Map<string, ReturnType<typeof setTimeout>>();

interface ScheduledEntry {
  id: string;           // `${reminderId}_${noticeType}`
  reminderId: string;
  title: string;
  body: string;
  fireAt: number;       // epoch ms
  sound: string;        // SoundOption key
}

// ─── localStorage ────────────────────────────────────────────

function load(): ScheduledEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScheduledEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: ScheduledEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

function remove(id: string): void {
  save(load().filter((e) => e.id !== id));
}

// ─── Web Audio synthesis (no external files needed) ──────────

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

type SoundKey = string;

/**
 * Call this from a button click to unlock AudioContext (browser autoplay policy).
 */
export function unlockAudio(): void {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

function playBell(ctx: AudioContext, startTime: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, startTime);
  osc.frequency.exponentialRampToValueAtTime(440, startTime + 1.5);
  gain.gain.setValueAtTime(0.6, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);
  osc.start(startTime);
  osc.stop(startTime + 2);
}

function playChime(ctx: AudioContext, startTime: number): void {
  const freqs = [523, 659, 784, 1047];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime + i * 0.18);
    gain.gain.setValueAtTime(0, startTime + i * 0.18);
    gain.gain.linearRampToValueAtTime(0.4, startTime + i * 0.18 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.18 + 1.2);
    osc.start(startTime + i * 0.18);
    osc.stop(startTime + i * 0.18 + 1.5);
  });
}

function playDigital(ctx: AudioContext, startTime: number): void {
  [0, 0.18, 0.36].forEach((offset) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, startTime + offset);
    gain.gain.setValueAtTime(0.3, startTime + offset);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + offset + 0.12);
    osc.start(startTime + offset);
    osc.stop(startTime + offset + 0.15);
  });
}

function playMarimba(ctx: AudioContext, startTime: number): void {
  const freqs = [523, 784];
  freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime + i * 0.25);
    gain.gain.setValueAtTime(0.5, startTime + i * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + i * 0.25 + 0.7);
    osc.start(startTime + i * 0.25);
    osc.stop(startTime + i * 0.25 + 0.8);
  });
}

function playBird(ctx: AudioContext, startTime: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1500, startTime);
  osc.frequency.setValueAtTime(1800, startTime + 0.1);
  osc.frequency.setValueAtTime(1400, startTime + 0.2);
  osc.frequency.setValueAtTime(1700, startTime + 0.3);
  gain.gain.setValueAtTime(0.3, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
  osc.start(startTime);
  osc.stop(startTime + 1.0);
}

export function playWebSound(soundKey: SoundKey): void {
  if (soundKey === 'silent') return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const resume = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
  resume.then(() => {
    const t = ctx.currentTime + 0.05;
    switch (soundKey) {
      case 'default': playBell(ctx, t); break;
      case 'chime':   playChime(ctx, t); break;
      case 'digital': playDigital(ctx, t); break;
      case 'marimba': playMarimba(ctx, t); break;
      case 'bird':    playBird(ctx, t); break;
      default:        playBell(ctx, t); break;
    }
  }).catch(() => {});
}

// ─── Notification firing ──────────────────────────────────────

function fire(entry: ScheduledEntry): void {
  timers.delete(entry.id);
  remove(entry.id);

  // Visual browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(entry.title, {
        body: entry.body || undefined,
        tag: entry.id,
        renotify: true,
        requireInteraction: true,
        silent: entry.sound === 'silent',
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch {}
  }

  // Sound (Notification.sound is not supported in any browser — must do manually)
  playWebSound(entry.sound);
}

function arm(entry: ScheduledEntry): void {
  const delay = entry.fireAt - Date.now();
  if (delay <= 0) {
    // Slightly past due (< 1 min): fire immediately
    if (entry.fireAt >= Date.now() - 60_000) {
      fire(entry);
    }
    return;
  }
  // Clamp to safe setTimeout max (~24 days). Chain for longer delays.
  const MAX = 2_100_000_000;
  const id = setTimeout(
    delay > MAX ? () => arm(entry) : () => fire(entry),
    Math.min(delay, MAX),
  );
  timers.set(entry.id, id);
}

function disarm(id: string): void {
  const t = timers.get(id);
  if (t !== undefined) { clearTimeout(t); timers.delete(id); }
}

// ─── Time calculation (mirrors native side) ──────────────────

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

export async function scheduleWebNotifications(reminder: Reminder): Promise<void> {
  if (typeof window === 'undefined') return;

  cancelWebNotifications(reminder.id);

  const now = Date.now();
  const entries = load();

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
      sound: reminder.sound ?? 'default',
    };
    entries.push(entry);
    arm(entry);
  }

  save(entries);
}

export function cancelWebNotifications(reminderId: string): void {
  if (typeof window === 'undefined') return;
  const entries = load();
  const remaining: ScheduledEntry[] = [];
  for (const e of entries) {
    if (e.reminderId === reminderId) {
      disarm(e.id);
    } else {
      remaining.push(e);
    }
  }
  save(remaining);
}

export function cancelAllWebNotifications(): void {
  if (typeof window === 'undefined') return;
  for (const id of Array.from(timers.keys())) disarm(id);
  save([]);
}

/**
 * Call once on app startup to re-arm any notifications scheduled in a previous session.
 */
export function rehydrateWebNotifications(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const entries = load();
  const live: ScheduledEntry[] = [];
  for (const e of entries) {
    if (e.fireAt <= now - 60_000) continue; // more than 1 min past → drop
    live.push(e);
    arm(e);
  }
  save(live);
}
