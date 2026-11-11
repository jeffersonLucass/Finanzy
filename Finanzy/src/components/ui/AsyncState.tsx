import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { errorMessage } from '../../domain/core';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from './Button';

export function LoadingState({ label = 'Carregando…' }: { label?: string }) {
  const { theme } = useTheme();
  return <View style={styles.state}><ActivityIndicator color={theme.colors.primary} /><Text style={[styles.text, { color: theme.colors.textSecondary }]}>{label}</Text></View>;
}

export function EmptyState({ title, text, actionLabel, onAction }: { title: string; text: string; actionLabel?: string; onAction?: () => void }) {
  const { theme } = useTheme();
  return <View style={[styles.state, styles.box, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}><Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text><Text style={[styles.text, { color: theme.colors.textSecondary }]}>{text}</Text>{actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}</View>;
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { theme } = useTheme();
  return <View style={[styles.state, styles.box, { backgroundColor: theme.colors.dangerSoft, borderColor: theme.colors.danger }]}><Text accessibilityLiveRegion="polite" style={[styles.title, { color: theme.colors.dangerStrong }]}>Não foi possível carregar</Text><Text style={[styles.text, { color: theme.colors.textSecondary }]}>{errorMessage(error)}</Text><Button label="Tentar novamente" onPress={onRetry} variant="secondary" /></View>;
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', gap: 12, justifyContent: 'center', padding: 24 },
  box: { borderRadius: 18, borderWidth: 1, marginVertical: 12 },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  text: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
