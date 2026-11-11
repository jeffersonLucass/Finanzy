import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type ButtonProps = { label: string; onPress: () => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'secondary' | 'danger' | 'ghost' };

export function Button({ label, onPress, loading = false, disabled = false, variant = 'primary' }: ButtonProps) {
  const { theme } = useTheme();
  const blocked = loading || disabled;
  const backgroundColor = variant === 'primary' ? theme.colors.primary : variant === 'danger' ? theme.colors.dangerSoft : variant === 'secondary' ? theme.colors.surface : 'transparent';
  const color = variant === 'primary' ? theme.colors.onPrimary : variant === 'danger' ? theme.colors.dangerStrong : variant === 'ghost' ? theme.colors.primaryStrong : theme.colors.textSecondary;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ busy: loading, disabled: blocked }} disabled={blocked} onPress={onPress} style={[styles.button, { backgroundColor, borderColor: variant === 'secondary' ? theme.colors.border : backgroundColor, opacity: blocked ? 0.6 : 1 }]}>
      <Text style={[styles.label, { color }]}>{loading ? 'Aguarde…' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: 16 },
  label: { fontSize: 14, fontWeight: '700' },
});
