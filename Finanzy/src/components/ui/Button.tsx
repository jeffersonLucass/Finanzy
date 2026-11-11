import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type ButtonProps = { label: string; onPress: () => void; loading?: boolean; disabled?: boolean; compact?: boolean; variant?: 'primary' | 'secondary' | 'danger' | 'destructive' | 'ghost' };

export function Button({ label, onPress, loading = false, disabled = false, compact = false, variant = 'primary' }: ButtonProps) {
  const { theme } = useTheme();
  const blocked = loading || disabled;
  const backgroundColor = variant === 'primary' ? theme.colors.primary : variant === 'destructive' ? theme.colors.danger : variant === 'danger' ? theme.colors.dangerSoft : variant === 'secondary' ? theme.colors.chip : 'transparent';
  const color = variant === 'primary' || variant === 'destructive' ? theme.colors.onPrimary : variant === 'danger' ? theme.colors.dangerStrong : variant === 'ghost' ? theme.colors.primaryStrong : theme.colors.textSecondary;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ busy: loading, disabled: blocked }} disabled={blocked} hitSlop={compact ? 6 : undefined} onPress={onPress} style={[styles.button, compact && styles.compact, { backgroundColor, borderColor: variant === 'secondary' ? theme.colors.border : backgroundColor, opacity: blocked ? 0.6 : 1 }]}>
      <Text style={[styles.label, compact && styles.compactLabel, { color }]}>{loading ? 'Aguarde…' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 50, paddingHorizontal: 16 },
  label: { fontSize: 14, fontWeight: '700' },
  compact: { minHeight: 32, borderRadius: 18, paddingHorizontal: 13 },
  compactLabel: { fontSize: 12 },
});
