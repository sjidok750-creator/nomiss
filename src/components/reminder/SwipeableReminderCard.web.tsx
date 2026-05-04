/**
 * Web-specific swipe card — uses touch events directly (no PanResponder)
 * so it works reliably in mobile browser without SectionList conflicts.
 */
import React, { useRef } from 'react';
import { View, Animated, StyleSheet, Pressable } from 'react-native';
import { Colors, Radius, Spacing } from '../../design/tokens';
import { Text } from '../ui/Text';
import { ReminderCard } from './ReminderCard';
import type { Reminder } from '../../types/reminder';

const ACTION_WIDTH = 160;
const SWIPE_THRESHOLD = 50;

interface Props {
  reminder: Reminder;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export function SwipeableReminderCard({
  reminder, onPress, onEdit, onDelete, onSwipeStart, onSwipeEnd,
}: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);

  const snapOpen = () => {
    isOpen.current = true;
    Animated.spring(translateX, { toValue: -ACTION_WIDTH, useNativeDriver: false, bounciness: 0 }).start();
  };

  const snapClose = () => {
    isOpen.current = false;
    Animated.spring(translateX, { toValue: 0, useNativeDriver: false, bounciness: 0 }).start();
  };

  const onTouchStart = (e: any) => {
    const touch = e.nativeEvent.touches?.[0] ?? e.nativeEvent;
    startX.current = touch.pageX;
    startY.current = touch.pageY;
    dragging.current = false;
  };

  const onTouchMove = (e: any) => {
    if (startX.current === null) return;
    const touch = e.nativeEvent.touches?.[0] ?? e.nativeEvent;
    const dx = touch.pageX - startX.current;
    const dy = touch.pageY - (startY.current ?? touch.pageY);

    // Reject vertical scrolls
    if (!dragging.current) {
      if (Math.abs(dy) > Math.abs(dx)) { startX.current = null; return; }
      if (Math.abs(dx) > 6) { dragging.current = true; onSwipeStart?.(); }
    }
    if (!dragging.current) return;

    const base = isOpen.current ? -ACTION_WIDTH : 0;
    const x = Math.max(-ACTION_WIDTH - 8, Math.min(8, base + dx));
    translateX.setValue(x);
  };

  const onTouchEnd = (e: any) => {
    if (!dragging.current) { startX.current = null; return; }
    onSwipeEnd?.();

    const touch = e.nativeEvent.changedTouches?.[0] ?? e.nativeEvent;
    const dx = (touch.pageX ?? 0) - (startX.current ?? 0);
    const base = isOpen.current ? -ACTION_WIDTH : 0;
    const x = base + dx;

    if (x < -SWIPE_THRESHOLD) { snapOpen(); } else { snapClose(); }

    startX.current = null;
    dragging.current = false;
  };

  return (
    <View style={styles.wrapper}>
      {/* Action buttons revealed behind the card */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
          onPress={() => { snapClose(); onEdit(); }}
        >
          <Text style={styles.icon}>✏️</Text>
          <Text variant="tiny" weight="semibold" style={styles.label}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: Colors.danger }]}
          onPress={() => { snapClose(); onDelete(); }}
        >
          <Text style={styles.icon}>🗑</Text>
          <Text variant="tiny" weight="semibold" style={styles.label}>Delete</Text>
        </Pressable>
      </View>

      {/* Sliding card */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <Pressable onPress={() => { if (isOpen.current) { snapClose(); } else { onPress(); } }}>
          <ReminderCard reminder={reminder} noMargin />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'hidden', borderRadius: Radius.lg, marginBottom: Spacing.md },
  actions: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    width: ACTION_WIDTH, flexDirection: 'row',
  },
  actionBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  icon: { fontSize: 20 },
  label: { color: '#fff' },
});
