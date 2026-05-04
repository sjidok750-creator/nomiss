import React, { useMemo, useState } from 'react';
import {
  View,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useReminderStore } from '../src/features/reminders/store';
import { EmptyState } from '../src/components/reminder/EmptyState';
import { SwipeableReminderCard } from '../src/components/reminder/SwipeableReminderCard';
import { Text } from '../src/components/ui/Text';
import { lightTheme, darkTheme, Theme } from '../src/design/theme';
import { Spacing, Radius } from '../src/design/tokens';
import { groupRemindersByDate } from '../src/lib/time';
import { Reminder } from '../src/types/reminder';
import { useResponsive } from '../src/design/responsive';
import { ReminderDetailPane } from '../src/components/reminder/ReminderDetailPane';

type Filter = 'upcoming' | 'past';

export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const reminders = useReminderStore((s) => s.reminders);
  const remove = useReminderStore((s) => s.remove);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { showMasterDetail } = useResponsive();

  const filtered = useMemo(() => {
    const sorted = [...reminders].sort((a, b) => a.triggerAt - b.triggerAt);
    if (filter === 'upcoming') return sorted.filter((r) => r.status === 'scheduled');
    return sorted.filter((r) => r.status === 'fired' || r.status === 'cancelled').reverse();
  }, [reminders, filter]);

  const sections = useMemo(() => groupRemindersByDate(filtered), [filtered]);

  const handleAdd = () => {
    if (showMasterDetail) setSelectedId(null);
    router.push('/new');
  };

  const handleDelete = async (id: string) => {
    if (selectedId === id) setSelectedId(null);
    await remove(id);
  };

  const handlePress = (reminder: Reminder) => {
    if (showMasterDetail) {
      setSelectedId(reminder.id);
    } else {
      router.push({ pathname: '/reminder/[id]', params: { id: reminder.id } });
    }
  };

  // ─── Master-Detail (tablet landscape) ──────────────────────
  if (showMasterDetail) {
    const selectedReminder = reminders.find((r) => r.id === selectedId) ?? null;
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
        <View style={[styles.masterDetail, { borderColor: theme.border }]}>
          {/* Master (left panel) */}
          <View style={[styles.master, { borderRightColor: theme.border }]}>
            <MasterList
              theme={theme}
              filter={filter}
              setFilter={setFilter}
              sections={sections}
              filtered={filtered}
              handleAdd={handleAdd}
              handlePress={handlePress}
              selectedId={selectedId}
              handleDelete={handleDelete}
            />
          </View>
          {/* Detail (right panel) */}
          <View style={styles.detail}>
            {selectedReminder ? (
              <ReminderDetailPane
                reminder={selectedReminder}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <View style={styles.detailEmpty}>
                <Text style={styles.detailEmptyIcon}>👈</Text>
                <Text variant="body" color="tertiary">알림을 선택하면 여기에 표시돼요</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Phone layout ───────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.surface }]}>
      <MasterList
        theme={theme}
        filter={filter}
        setFilter={setFilter}
        sections={sections}
        filtered={filtered}
        handleAdd={handleAdd}
        handlePress={handlePress}
        selectedId={null}
      />
    </SafeAreaView>
  );
}

// ─── Shared list component ──────────────────────────────────
function MasterList({
  theme,
  filter,
  setFilter,
  sections,
  filtered,
  handleAdd,
  handlePress,
  selectedId,
  handleDelete,
}: {
  theme: Theme;
  filter: Filter;
  setFilter: (f: Filter) => void;
  sections: { label: string; data: Reminder[] }[];
  filtered: Reminder[];
  handleAdd: () => void;
  handlePress: (r: Reminder) => void;
  selectedId: string | null;
  handleDelete?: (id: string) => void;
}) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" weight="bold">nomiss</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => router.push('/settings')}
            style={[styles.iconBtn, { backgroundColor: theme.surfaceMuted }]}
            activeOpacity={0.7}
          >
            <Text style={styles.iconText}>⚙</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleAdd}
            style={[styles.fab, { backgroundColor: theme.accent }]}
            activeOpacity={0.8}
          >
            <Text style={styles.fabIcon}>+</Text>
          </TouchableOpacity>
        </View>
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
            <SwipeableReminderCard
              reminder={item}
              onPress={() => handlePress(item)}
              onDelete={() => handleDelete?.(item.id)}
              selected={item.id === selectedId}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={[styles.sectionHeader, { backgroundColor: theme.surface }]}>
              <Text variant="caption" weight="semibold" color="tertiary">{section.label}</Text>
            </View>
          )}
          contentContainerStyle={styles.list}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  masterDetail: { flex: 1, flexDirection: 'row' },
  master: { width: '35%', borderRightWidth: 1 },
  detail: { flex: 1 },
  detailEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  detailEmptyIcon: { fontSize: 48 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
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
  list: { padding: Spacing.lg },
  sectionHeader: { paddingVertical: Spacing.sm },
  emptyPast: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
