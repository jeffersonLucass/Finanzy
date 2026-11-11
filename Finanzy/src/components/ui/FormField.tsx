import { Platform, TextInputProps, StyleSheet, Text, TextInput, View } from 'react-native';
import { useState } from 'react';
import { useTheme } from '../../theme/ThemeProvider';
import { InputKind, formatMoneyInput, inputError, inputLimits, sanitizeInput } from '../../presentation/input';

type FormFieldProps = TextInputProps & { label: string; error?: string; inputKind?: InputKind; required?: boolean; allowZero?: boolean; min?: number; max?: number };

export function FormField({ label, error, style, inputKind = 'text', required = false, allowZero = false, min, max, maxLength, value, defaultValue, onChangeText, onBlur, onEndEditing, ...props }: FormFieldProps) {
  const { theme } = useTheme();
  const [draft, setDraft] = useState(defaultValue ?? '');
  const [touched, setTouched] = useState(false);
  const limit = maxLength ?? (inputKind === 'date' ? 10 : inputKind === 'integer' ? 4 : inputKind === 'money' ? inputLimits.moneyLength : props.multiline ? inputLimits.observation : inputLimits.text);
  const rules = { kind: inputKind, required, allowZero, min, max, maxLength: limit };
  const raw = value ?? draft;
  const displayed = inputKind === 'money' && raw ? formatMoneyInput(raw) : raw;
  const feedback = error || (touched ? inputError(displayed, rules) : '');
  const numeric = inputKind === 'money' || inputKind === 'integer' || inputKind === 'date';
  const commit: NonNullable<TextInputProps['onEndEditing']> = event => {
    setTouched(true);
    if (!inputError(displayed, rules)) onEndEditing?.(event);
  };
  return (
    <View style={styles.wrap}>
      <View style={[styles.field, { backgroundColor: theme.colors.surface, borderColor: feedback ? theme.colors.danger : theme.colors.border }]}>
        <Text style={[styles.label, { color: feedback ? theme.colors.dangerStrong : theme.colors.textSecondary }]}>{label}{required ? ' *' : ''}</Text>
        <TextInput
          {...props}
          accessibilityLabel={label}
          autoCorrect={numeric ? false : props.autoCorrect}
          inputMode={numeric ? inputKind === 'money' ? 'decimal' : 'numeric' : props.inputMode}
          keyboardType={numeric ? inputKind === 'money' ? 'decimal-pad' : 'number-pad' : props.keyboardType}
          maxLength={limit}
          onBlur={event => {
            setTouched(true);
            onBlur?.(event);
            if (Platform.OS === 'web') commit({ ...event, nativeEvent: { ...event.nativeEvent, text: displayed, eventCount: 0 } });
          }}
          onChangeText={next => {
            const sanitized = sanitizeInput(next, rules, displayed);
            setDraft(sanitized);
            onChangeText?.(sanitized);
          }}
          onEndEditing={Platform.OS === 'web' ? undefined : commit}
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, { color: theme.colors.text }, style]}
          value={displayed}
        />
      </View>
      {feedback ? <Text accessibilityLiveRegion="polite" style={[styles.error, { color: theme.colors.dangerStrong }]}>{feedback}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 10 },
  field: { borderRadius: 14, borderWidth: 1, minHeight: 64, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  label: { fontSize: 11, marginBottom: 3 },
  input: { fontFamily: 'System', fontSize: 16, minHeight: 24, padding: 0 },
  error: { fontSize: 12, marginTop: 5 },
});
