import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useReminderStore } from '../src/features/reminders/store';
import { EmptyState } from '../src/components/reminder/EmptyState';
import { SwipeableReminderCard } from '../src/components/reminder/SwipeableReminderCard';
import { ReminderCard } from '../src/components/reminder/ReminderCard';
import { Text } from '../src/components/ui/Text';
import { lightTheme, darkTheme } from '../src/design/theme';
import { Spacing, Radius, Colors } from '../src/design/tokens';
import { groupRemindersByDate } from '../src/lib/time';
import { Reminder } from '../src/types/reminder';
import {
  getWebPermissionState,
  requestWebNotificationPermission,
  unlockAudio,
} from '../src/lib/webNotifications';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const reminders = useReminderStore((s) => s.reminders);
  const remove = useReminderStore((s) => s.remove);
  const [query, setQuery] = useState('');
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [permState, setPermState] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('unsupported');

  useEffect(() => {
    if (Platform.OS === 'web') {
      setPermState(getWebPermissionState());
    }
  }, []);

  const handleEnableAlarms = async () => {
    const ok = await requestWebNotificationPermission();
    unlockAudio();
    setPermState(ok ? 'granted' : 'denied');
  };

  const filtered = useMemo(() => {
    const scheduled = [...reminders]
      .filter((r) => r.status === 'scheduled')
      .sort((a, b) => a.triggerAt - b.triggerAt);
    const past = [...reminders]
      .filter((r) => r.status === 'fired' || r.status === 'cancelled')
      .sort((a, b) => b.triggerAt - a.triggerAt);
    let list = [...scheduled, ...past];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.body?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [reminders, query]);

  const sections = useMemo(() => groupRemindersByDate(filtered), [filtered]);

  const handleDelete = (reminder: Reminder) => {
    Alert.alert(
      'Delete Reminder',
      `Delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await remove(reminder.id);
            if (Platform.OS !== 'web') {
              const Haptics = require('expo-haptics');
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.appTitle, { color: theme.textPrimary }]}>nomiss</Text>
      </View>

      {/* Notification permission banner (web only) */}
      {Platform.OS === 'web' && permState === 'default' && (
        <TouchableOpacity
          onPress={handleEnableAlarms}
          style={[styles.permBanner, { backgroundColor: theme.accent }]}
          activeOpacity={0.85}
        >
          <Text style={styles.permBannerText}>🔔 Tap to enable alarm notifications</Text>
        </TouchableOpacity>
      )}
      {Platform.OS === 'web' && permState === 'denied' && (
        <View style={[styles.permBanner, { backgroundColor: '#EF4444' }]}>
          <Text style={styles.permBannerText}>🔕 Notifications blocked — allow in browser settings</Text>
        </View>
      )}

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search reminders"
          placeholderTextColor={theme.textTertiary}
          style={[styles.searchInput, { color: theme.textPrimary }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
            <Text style={styles.searchClear} color="tertiary">✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState onAdd={() => router.push('/new')} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: Reminder) => item.id}
          scrollEnabled={scrollEnabled}
          renderItem={({ item }: { item: Reminder }) =>
            Platform.OS === 'web' ? (
              <ReminderCard
                reminder={item}
                onPress={() => router.push({ pathname: '/reminder/[id]', params: { id: item.id } })}
                onEdit={() => router.push({ pathname: '/reminder/[id]', params: { id: item.id, edit: '1' } })}
                onDelete={() => handleDelete(item)}
              />
            ) : (
              <SwipeableReminderCard
                reminder={item}
                onPress={() => router.push({ pathname: '/reminder/[id]', params: { id: item.id } })}
                onEdit={() => router.push({ pathname: '/reminder/[id]', params: { id: item.id, edit: '1' } })}
                onDelete={() => handleDelete(item)}
                onSwipeStart={() => setScrollEnabled(false)}
                onSwipeEnd={() => setScrollEnabled(true)}
              />
            )
          }
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.surface }]}>
              <Text variant="caption" weight="semibold" color="tertiary">
                {section.label}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled
        />
      )}

      {/* Bottom FAB */}
      <TouchableOpacity
        onPress={() => router.push('/new')}
        style={[styles.fab, { backgroundColor: theme.accent }]}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    fontFamily: 'Plus Jakarta Sans',
  },
  permBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  permBannerText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  searchClear: { fontSize: 13 },
  list: { padding: Spacing.lg, paddingBottom: 100 },
  sectionHeader: { paddingVertical: Spacing.sm },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabIcon: { fontSize: 32, color: '#fff', lineHeight: 36, marginTop: -2 },
});
