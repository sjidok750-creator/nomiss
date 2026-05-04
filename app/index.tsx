import React, { useMemo, useState } from 'react';
import {
  View,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  SafeAreaView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useReminderStore } from '../src/features/reminders/store';
import { ReminderCard } from '../src/components/reminder/ReminderCard';
import { EmptyState } from '../src/components/reminder/EmptyState';
import { Text } from '../src/components/ui/Text';
import { lightTheme, darkTheme } from '../src/design/theme';
import { Spacing, Radius, Colors } from '../src/design/tokens';
import { groupRemindersByDate } from '../src/lib/time';
import { Reminder } from '../src/types/reminder';

type Filter = 'upcoming' | 'past';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const reminders = useReminderStore((s) => s.reminders);
  const [filter, setFilter] = useState<Filter>('upcoming');

  const filtered = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => a.triggerAt - b.triggerAt);
    if (filter === 'upcoming') {
      return sorted.filter((r) => r.status === 'scheduled');
    }
    return sorted
      .filter((r) => r.status === 'fired' || r.status === 'cancelled')
      .reverse();
  }, [reminders, filter]);

  const sections = useMemo(() => groupRemindersByDate(filtered), [filtered]);

  const handleAdd = () => router.push('/new');
  const handlePress = (reminder: Reminder) =>
    router.push({ pathname: '/reminder/[id]', params: { id: reminder.id } });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="title" weight="bold">
            nomiss
          </Text>
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.fab, { backgroundColor: theme.accent }]}
            activeOpacity={0.8}
          >
            <Text style={styles.fabIcon} weight="regular">+</Text>
          </TouchableOpacity>
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
            <EmptyState onAdd={handleAdd} />
          ) : (
            <View style={styles.emptyPast}>
              <Text variant="body" color="tertiary">지난 알림이 없어요</Text>
            </View>
          )
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ReminderCard
                reminder={item}
                onPress={() => handlePress(item)}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
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
  fabIcon: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 32,
    marginTop: Platform.OS === 'android' ? -2 : 0,
  },
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
  list: {
    padding: Spacing.lg,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: 0,
  },
  emptyPast: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
