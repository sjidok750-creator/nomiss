# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (choose platform)
npx expo start
npx expo start --android
npx expo start --ios
npx expo start --web

# Run tests
npx react-test-renderer
```

No lint script is defined in package.json. TypeScript checking is available via `npx tsc --noEmit`.

## Architecture

This is a React Native reminder app built with **Expo SDK 54** and **expo-router v6** (file-based routing).

### Routing (`app/`)
- `_layout.tsx` — Root layout: initializes notifications channel, loads reminder store, handles onboarding redirect
- `index.tsx` — Home screen with list, search, category filter, upcoming/past tabs
- `new.tsx` — Create reminder modal
- `reminder/[id].tsx` — Reminder detail modal
- `settings.tsx` — Settings modal (backup/restore)
- `onboarding.tsx` — First-launch onboarding flow

### State (`src/features/reminders/store.ts`)
Single Zustand store (`useReminderStore`) owns all reminder state. Every mutation (create/update/remove/markFired) atomically updates state, persists to AsyncStorage, and syncs the OS notification schedule. The `load()` action auto-migrates legacy data and marks past one-time reminders as `fired`.

### Data flow
```
store.ts → storage.ts (AsyncStorage @nomiss/reminders)
         → notifications.ts (expo-notifications, uses reminder.id as notification identifier)
```

Notification identifiers are the same as `reminder.id`, so `cancelNotification(id)` and `scheduleNotification(id, ...)` are idempotent by design.

### Types (`src/types/reminder.ts`)
Core types: `Reminder`, `RepeatRule` (`none | daily | weekly | monthly`), `CategoryId`, `Category`. `CATEGORIES` array is the single source of truth for all category metadata (label, color, emoji).

### Design system (`src/design/`)
- `tokens.ts` — `Colors`, `Spacing`, `Radius`, `FontSize`, `FontWeight`, `Breakpoints`
- `theme.ts` — `lightTheme` / `darkTheme` objects derived from tokens; components receive `theme` as a prop
- `responsive.ts` — `useResponsive()` hook; `showMasterDetail` is true on tablet landscape (width ≥ 600 && landscape)

Screens call `useColorScheme()` directly and select the appropriate theme object. There is no React Context for theming.

### UI components (`src/components/`)
- `ui/Text.tsx` — Themed text with `variant`, `weight`, `color` props
- `ui/Button.tsx` — Themed button
- `reminder/ReminderCard.tsx` — Single card; `SwipeableReminderCard.tsx` wraps it with swipe-to-delete
- `reminder/ReminderDetailPane.tsx` — Detail view used in tablet master-detail layout
- `reminder/EmptyState.tsx` — Empty list placeholder
- `form/CategoryPicker.tsx`, `form/QuickTimeChips.tsx` — Form helpers

### Responsive layout
`index.tsx` renders a **master-detail** split (35% list / 65% detail) on tablet landscape, and a standard full-screen list on phones. The detail panel opens modals via `router.push` on phones.
