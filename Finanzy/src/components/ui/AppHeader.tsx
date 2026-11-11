import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type AppHeaderProps = { title: string; subtitle?: string; back?: boolean; actionLabel?: string; onAction?: () => void };

export function AppHeader({ title, subtitle, back = false, actionLabel, onAction }: AppHeaderProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      {back ? (
        <Pressable accessibilityLabel="Voltar" accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.colors.primarySoft }]}>
          <Text style={[styles.backText, { color: theme.colors.primaryStrong }]}>‹</Text>
        </Pressable>
      ) : null}
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={[styles.action, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', marginBottom: 20, minHeight: 48 },
  back: { alignItems: 'center', borderRadius: 20, height: 40, justifyContent: 'center', marginRight: 12, width: 40 },
  backText: { fontSize: 30, lineHeight: 32, marginTop: -3 },
  copy: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  action: { borderRadius: 18, paddingHorizontal: 15, paddingVertical: 10 },
  actionText: { fontSize: 13, fontWeight: '700' },
});
