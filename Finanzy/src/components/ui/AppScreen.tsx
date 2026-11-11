import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

type AppScreenProps = PropsWithChildren<{ footer?: ReactNode; scroll?: boolean }>;

export function AppScreen({ children, footer, scroll = true }: AppScreenProps) {
  const { theme } = useTheme();
  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, { padding: theme.spacing.xl }]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : <View style={[styles.content, { padding: theme.spacing.xl }]}>{children}</View>;
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.colors.canvas }]}>
      <View style={styles.viewport}>{content}</View>
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  viewport: { alignSelf: 'center', flex: 1, maxWidth: 480, width: '100%' },
  content: { flexGrow: 1 },
});
