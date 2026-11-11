import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type AppHeaderProps = { title: string; subtitle?: string; back?: boolean; actionLabel?: string; onAction?: () => void };

export function AppHeader({ title, subtitle, back = false, actionLabel, onAction }: AppHeaderProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      <Pressable accessibilityLabel={back ? `Voltar, ${title}` : undefined} accessibilityRole={back ? 'button' : undefined} disabled={!back} onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/more'); }} style={styles.copy}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>{subtitle}</Text> : null}
      </Pressable>
      {actionLabel && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction} style={[styles.action, { backgroundColor: theme.colors.primary }]}>
          <Text style={[styles.actionText, { color: theme.colors.onPrimary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'flex-start', flexDirection: 'row', marginBottom: 28, minHeight: 38, paddingTop: 0, gap: 10 },
  copy: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  subtitle: { fontSize: 12, marginTop: 4 },
  action: { borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  actionText: { fontSize: 13, fontWeight: '700' },
});
