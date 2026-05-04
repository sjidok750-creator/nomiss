import React, { useRef } from 'react';
import {
  Animated,
  View,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { PanResponder } from 'react-native';
import { lightTheme, darkTheme } from '../../design/theme';
import { Spacing, Radius } from '../../design/tokens';
import { Text } from '../ui/Text';
import { ReminderCard } from './ReminderCard';
import { Reminder } from '../../types/reminder';

const SWIPE_THRESHOLD = 80;
const DELETE_WIDTH = 80;

interface Props {
  reminder: Reminder;
  onPress: () => void;
  onDelete: () => void;
  selected?: boolean;
}

export function SwipeableReminderCard({ reminder, onPress, onDelete, selected }: Props) {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? darkTheme : lightTheme;
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const close = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start();
    isOpen.current = false;
  };

  const open = () => {
    Animated.spring(translateX, { toValue: -DELETE_WIDTH, useNativeDriver: true, tension: 80, friction: 10 }).start();
    isOpen.current = true;
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 8 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderMove: (_, gestureState) => {
        const x = isOpen.current ? -DELETE_WIDTH + gestureState.dx : gestureState.dx;
        if (x <= 0 && x >= -DELETE_WIDTH - 20) {
          translateX.setValue(x);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentX = isOpen.current
          ? -DELETE_WIDTH + gestureState.dx
          : gestureState.dx;
        if (currentX < -SWIPE_THRESHOLD) {
          open();
        } else {
          close();
        }
      },
    }),
  ).current;

  const handlePress = () => {
    if (isOpen.current) {
      close();
    } else {
      onPress();
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Delete action revealed on swipe */}
      <View style={[styles.deleteAction, { backgroundColor: theme.dangerLight }]}>
        <TouchableOpacity
          onPress={() => { close(); onDelete(); }}
          style={styles.deleteButton}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteIcon}>🗑</Text>
          <Text variant="tiny" weight="semibold" color="danger">삭제</Text>
        </TouchableOpacity>
      </View>

      {/* Card */}
      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <ReminderCard
          reminder={reminder}
          onPress={handlePress}
          selected={selected}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: Spacing.md,
    width: DELETE_WIDTH,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    alignItems: 'center',
    gap: 2,
    padding: Spacing.sm,
  },
  deleteIcon: { fontSize: 20 },
  card: {
    marginBottom: 0,
  },
});
