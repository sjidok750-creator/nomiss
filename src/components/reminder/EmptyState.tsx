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
        알림이 없어요
      </Text>
      <Text variant="body" color="secondary" style={styles.desc}>
        잊고 싶지 않은 일을{'\n'}지금 바로 등록해보세요
      </Text>
      <Button label="첫 알림 만들기" onPress={onAdd} size="lg" style={styles.button} />
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
