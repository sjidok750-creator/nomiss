import React, { useRef } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { PanResponder } from 'react-native';
import { Colors, Radius, Spacing } from '../../design/tokens';
import { Text } from '../ui/Text';
import { ReminderCard } from './ReminderCard';
import { Reminder } from '../../types/reminder';

const ACTION_WIDTH = 160; // Edit 80 + Delete 80
const SWIPE_THRESHOLD = 40;

interface Props {
  reminder: Reminder;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SwipeableReminderCard({ reminder, onPress, onEdit, onDelete }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const close = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    isOpen.current = false;
  };

  const open = () => {
    Animated.spring(translateX, { toValue: -ACTION_WIDTH, useNativeDriver: true, tension: 80, friction: 10 }).start();
    isOpen.current = true;
  };

  const panResponder = useRef(
    PanResponder.create({
      // Capture phase: intercept the gesture before child TouchableOpacity claims it
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        const base = isOpen.current ? -ACTION_WIDTH : 0;
        const x = base + g.dx;
        if (x <= 0 && x >= -ACTION_WIDTH - 20) {
          translateX.setValue(x);
        }
      },
      onPanResponderRelease: (_, g) => {
        const base = isOpen.current ? -ACTION_WIDTH : 0;
        const x = base + g.dx;
        if (x < -SWIPE_THRESHOLD) {
          open();
        } else {
          close();
        }
      },
      onPanResponderTerminate: () => close(),
    }),
  ).current;

  const handleCardPress = () => {
    if (isOpen.current) {
      close();
    } else {
      onPress();
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Action buttons sit behind the card on the right side */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => { close(); onEdit(); }}
          style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
          activeOpacity={0.85}
        >
          <Text style={styles.actionIcon}>✏️</Text>
          <Text variant="tiny" weight="semibold" style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { close(); onDelete(); }}
          style={[styles.actionBtn, { backgroundColor: Colors.danger }]}
          activeOpacity={0.85}
        >
          <Text style={styles.actionIcon}>🗑</Text>
          <Text variant="tiny" weight="semibold" style={styles.actionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding card layer */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <ReminderCard reminder={reminder} onPress={handleCardPress} noMargin />
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
