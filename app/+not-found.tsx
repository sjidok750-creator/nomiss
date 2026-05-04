import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from '../src/components/ui/Text';
import { Spacing } from '../src/design/tokens';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text variant="title" weight="bold">화면을 찾을 수 없어요</Text>
        <Link href="/" style={styles.link}>
          <Text variant="body" color="accent">홈으로 돌아가기</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  link: {
    marginTop: Spacing.md,
  },
});
