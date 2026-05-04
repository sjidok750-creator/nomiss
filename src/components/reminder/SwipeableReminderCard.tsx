import React, { useRef, useCallback } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { PanResponder } from 'react-native';
import { Colors, Radius, Spacing } from '../../design/tokens';
import { Text } from '../ui/Text';
import { ReminderCard } from './ReminderCard';
import { Reminder } from '../../types/reminder';

const ACTION_WIDTH = 160;
const SWIPE_THRESHOLD = 60;

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

  const open = useCallback(() => {
    isOpen.current = true;
    Animated.spring(translateX, {
      toValue: -ACTION_WIDTH,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [translateX]);

  const close = useCallback(() => {
    isOpen.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      // Don't claim taps — only claim clear horizontal moves
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 2,

      onPanResponderGrant: () => {
        onSwipeStart?.();
      },

      onPanResponderMove: (_, g) => {
        const base = isOpen.current ? -ACTION_WIDTH : 0;
        const next = Math.max(-ACTION_WIDTH - 20, Math.min(0, base + g.dx));
        translateX.setValue(next);
      },

      onPanResponderRelease: (_, g) => {
        onSwipeEnd?.();
        const base = isOpen.current ? -ACTION_WIDTH : 0;
        const x = base + g.dx;
        if (x < -SWIPE_THRESHOLD) {
          open();
        } else {
          close();
        }
      },

      onPanResponderTerminate: () => {
        onSwipeEnd?.();
        close();
      },

      // Critical: don't yield the gesture to the parent ScrollView mid-swipe
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={styles.wrapper}>
      {/* Action buttons sit behind the card on the right */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
          onPress={() => { close(); onEdit(); }}
        >
          <Text style={styles.actionIcon}>✏️</Text>
          <Text variant="tiny" weight="semibold" style={styles.actionLabel}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: Colors.danger }]}
          onPress={() => { close(); onDelete(); }}
        >
          <Text style={styles.actionIcon}>🗑</Text>
          <Text variant="tiny" weight="semibold" style={styles.actionLabel}>Delete</Text>
        </Pressable>
      </View>

      {/* Card slides left to reveal buttons */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={() => {
            if (isOpen.current) { close(); return; }
            onPress();
          }}
        >
          <ReminderCard reminder={reminder} noMargin />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  actions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionIcon: { fontSize: 18 },
  actionLabel: { color: '#fff' },
});
