import React, { useMemo, useState } from 'react';
import {
  View,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useReminderStore } from '../src/features/reminders/store';
import { EmptyState } from '../src/components/reminder/EmptyState';
import { ReminderCard } from '../src/components/reminder/ReminderCard';
import { Text } from '../src/components/ui/Text';
import { lightTheme, darkTheme } from '../src/design/theme';
import { Spacing, Radius } from '../src/design/tokens';
import { groupRemindersByDate } from '../src/lib/time';
import { Reminder } from '../src/types/reminder';

type Filter = 'upcoming' | 'past';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const reminders = useReminderStore((s) => s.reminders);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => a.triggerAt - b.triggerAt);
    let list =
      filter === 'upcoming'
        ? sorted.filter((r) => r.status === 'scheduled')
        : sorted.filter((r) => r.status === 'fired' || r.status === 'cancelled').reverse();
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.body?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [reminders, filter, query]);

  const sections = useMemo(() => groupRemindersByDate(filtered), [filtered]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" weight="bold">nomiss</Text>
        <TouchableOpacity
          onPress={() => router.push('/new')}
          style={[styles.fab, { backgroundColor: theme.accent }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.fabIcon, Platform.OS === 'android' && styles.fabIconAndroid]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="알림 검색"
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

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { borderBottomColor: theme.border }]}>
        {(['upcoming', 'past'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterTab,
              filter === f && { borderBottomColor: theme.accent, borderBottomWidth: 2 },
            ]}
          >
            <Text
              variant="body"
              weight={filter === f ? 'semibold' : 'regular'}
              color={filter === f ? 'primary' : 'tertiary'}
            >
              {f === 'upcoming' ? '예정' : '지난'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        filter === 'upcoming' ? (
          <EmptyState onAdd={() => router.push('/new')} />
        ) : (
          <View style={styles.emptyPast}>
            <Text variant="body" color="tertiary">지난 알림이 없어요</Text>
          </View>
        )
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: Reminder) => item.id}
          renderItem={({ item }: { item: Reminder }) => (
            <ReminderCard
              reminder={item}
              onPress={() =>
                router.push({ pathname: '/reminder/[id]', params: { id: item.id } })
              }
            />
          )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  fab: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { fontSize: 28, color: '#fff', lineHeight: 32 },
  fabIconAndroid: { marginTop: -2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  searchClear: { fontSize: 13 },
  filterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: Spacing.lg,
  },
  filterTab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.md,
  },
  list: { padding: Spacing.lg },
  sectionHeader: { paddingVertical: Spacing.sm },
  emptyPast: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
