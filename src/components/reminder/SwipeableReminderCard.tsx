import React, { useRef } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  Platform,
} from 'react-native';
import { PanResponder } from 'react-native';
import { lightTheme, darkTheme } from '../../design/theme';
import { Spacing, Radius, Colors } from '../../design/tokens';
import { Text } from '../ui/Text';
import { ReminderCard } from './ReminderCard';
import { Reminder } from '../../types/reminder';

const ACTION_WIDTH = 160; // 2 buttons × 80px
const SWIPE_THRESHOLD = 40;

interface Props {
  reminder: Reminder;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function SwipeableReminderCard({ reminder, onPress, onEdit, onDelete }: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const close = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: Platform.OS !== 'web',
      tension: 80,
      friction: 10,
    }).start();
    isOpen.current = false;
  };

  const open = () => {
    Animated.spring(translateX, {
      toValue: -ACTION_WIDTH,
      useNativeDriver: Platform.OS !== 'web',
      tension: 80,
      friction: 10,
    }).start();
    isOpen.current = true;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
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
      {/* Action buttons (revealed on swipe left) */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => { close(); onEdit(); }}
          style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>✏️</Text>
          <Text variant="tiny" weight="semibold" style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { close(); onDelete(); }}
          style={[styles.actionBtn, { backgroundColor: Colors.danger }]}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>🗑</Text>
          <Text variant="tiny" weight="semibold" style={styles.actionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding card */}
      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <ReminderCard reminder={reminder} onPress={handleCardPress} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderRadius: Radius.lg,
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
  card: {
    marginBottom: 0,
  },
});
