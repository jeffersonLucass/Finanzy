import { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';

type AppScreenProps = PropsWithChildren<{ scroll?: boolean; action?: ReactNode }>;

export function AppScreen({ children, action, scroll = true }: AppScreenProps) {
  const { theme } = useTheme();
  const content = scroll ? (
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.lg }]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : <View style={[styles.fixed, { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg }]}>{children}</View>;
  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: theme.colors.canvas }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.viewport, { backgroundColor: theme.colors.canvas }]}>
        {content}
        {action ? <View style={styles.action}>{action}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  viewport: { alignSelf: 'center', flex: 1, maxWidth: 480, width: '100%' },
  content: { flexGrow: 1 },
  fixed: { flex: 1, minHeight: 0 },
  scroll: { flex: 1, minHeight: 0 },
  action: { paddingHorizontal: 20, paddingBottom: 14, paddingTop: 10 },
});
