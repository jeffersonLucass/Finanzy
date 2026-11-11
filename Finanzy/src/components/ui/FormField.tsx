import { TextInputProps, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';

type FormFieldProps = TextInputProps & { label: string; error?: string };

export function FormField({ label, error, style, ...props }: FormFieldProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: error ? theme.colors.dangerStrong : theme.colors.textSecondary }]}>{label}</Text>
      <TextInput placeholderTextColor={theme.colors.textMuted} style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: error ? theme.colors.danger : theme.colors.border, color: theme.colors.text }, style]} {...props} />
      {error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.colors.dangerStrong }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: { fontSize: 12, marginBottom: 6 },
  input: { borderRadius: 14, borderWidth: 1, fontSize: 15, minHeight: 52, paddingHorizontal: 14, paddingVertical: 12 },
  error: { fontSize: 12, marginTop: 5 },
});
