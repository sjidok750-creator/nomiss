import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { Spacing } from '../../design/tokens';

interface Props {
  onAdd: () => void;
}

export function EmptyState({ onAdd }: Props) {
  return (
    <View style={styles.container}>
      <Text variant="display" style={styles.emoji}>🔔</Text>
      <Text variant="title" weight="semibold" style={styles.title}>
        No reminders yet
      </Text>
      <Text variant="body" color="secondary" style={styles.desc}>
        Add something you never want to miss
      </Text>
      <Button label="Add Reminder" onPress={onAdd} size="lg" style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.lg,
  },
  emoji: {
    fontSize: 64,
    lineHeight: 80,
  },
  title: {
    textAlign: 'center',
  },
  desc: {
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    marginTop: Spacing.md,
  },
});
