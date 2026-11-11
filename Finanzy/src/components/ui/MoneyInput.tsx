import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { formatMoneyInput, inputError, inputLimits, sanitizeInput } from '../../presentation/input';

export function MoneyInput({ value, onChangeText, label = 'Valor' }: { value: string; onChangeText: (value: string) => void; label?: string }) {
  const { theme } = useTheme();
  const [touched, setTouched] = useState(false);
  const displayed = value ? formatMoneyInput(value) : '';
  const error = touched ? inputError(displayed, { kind: 'money', required: true }) : '';
  return <View><View style={[styles.card, { backgroundColor: theme.colors.surface }]}><View style={styles.row}><Text style={[styles.currency, { color: theme.colors.text }]}>R$</Text><TextInput accessibilityLabel={label} autoCorrect={false} inputMode="decimal" keyboardType="decimal-pad" maxLength={inputLimits.moneyLength} onBlur={() => setTouched(true)} onChangeText={next => onChangeText(sanitizeInput(next, { kind: 'money' }, displayed))} placeholder="0,00" placeholderTextColor={theme.colors.text} style={[styles.input, { color: theme.colors.text }]} value={displayed} /></View></View>{error ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.colors.dangerStrong }]}>{error}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, justifyContent: 'center', marginBottom: 10, minHeight: 80, paddingHorizontal: 18, paddingVertical: 12 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  currency: { fontSize: 34, fontWeight: '700' },
  input: { flex: 1, fontFamily: 'System', fontSize: 34, fontWeight: '700', minWidth: 0, padding: 0 },
  error: { fontSize: 12, marginBottom: 10 },
});
