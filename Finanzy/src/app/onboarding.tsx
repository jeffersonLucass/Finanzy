import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '../components/BrandMark';
import { getRuntime } from '../application/runtime';
import { useSession } from '../features/session/use-session';
import { useAsyncAction } from '../hooks/use-async-action';
import { errorMessage } from '../domain/core';
import { useTheme } from '../theme/ThemeProvider';
import { inputLimits, sanitizeInput } from '../presentation/input';

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const [name, setName] = useState<string | null>(null);
  const session = useSession();
  const displayedName = name ?? session.data?.profile?.name ?? '';
  const signIn = useCallback((profileName: string) => getRuntime().then(runtime => runtime.session.signIn(profileName)), []);
  const afterSignIn = useCallback(() => { router.replace('/home'); }, []);
  const action = useAsyncAction(signIn, afterSignIn);

  async function continueToApp() {
    if (!displayedName.trim()) return;
    try { await action.execute(displayedName); } catch {}
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.canvas }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View style={styles.brand}>
          <BrandMark />
          <Text style={[styles.title, { color: theme.colors.text }]}>Bem-vindo ao Finanzy</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Como podemos chamar você?</Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Seu nome</Text>
          <TextInput
            autoCapitalize="words"
            maxLength={inputLimits.text}
            onChangeText={value => setName(sanitizeInput(value))}
            placeholder="Ex: Gustavo"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, color: theme.colors.text }]}
            value={displayedName}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!displayedName.trim() || action.loading}
            onPress={continueToApp}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: theme.colors.primary },
              (!displayedName.trim() || pressed) && styles.buttonDisabled,
            ]}
          >
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Começar</Text>
          </Pressable>
          {action.error ? <Text style={[styles.error, { color: theme.colors.dangerStrong }]}>{errorMessage(action.error)}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, justifyContent: 'space-between', padding: 24, paddingBottom: 32 },
  brand: { alignItems: 'center', marginTop: 80 },
  title: { fontSize: 26, fontWeight: '700', marginTop: 18 },
  subtitle: { fontSize: 16, marginTop: 8 },
  form: { gap: 10 },
  label: { fontSize: 13 },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    height: 58,
    paddingHorizontal: 16,
  },
  button: {
    alignItems: 'center',
    borderRadius: 14,
    height: 58,
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { fontSize: 16, fontWeight: '700' },
  error: { fontSize: 12, textAlign: 'center' },
});
