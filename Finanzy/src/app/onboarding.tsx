import { router } from 'expo-router';
import { useState } from 'react';
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
import { saveProfileName } from '../database';

export default function OnboardingScreen() {
  const [name, setName] = useState('');

  async function continueToApp() {
    if (!name.trim()) return;
    await saveProfileName(name);
    router.replace('/home');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View style={styles.brand}>
          <BrandMark />
          <Text style={styles.title}>Bem-vindo ao Finanzy</Text>
          <Text style={styles.subtitle}>Como podemos chamar você?</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Seu nome</Text>
          <TextInput
            autoCapitalize="words"
            onChangeText={setName}
            placeholder="Ex: Gustavo"
            placeholderTextColor="#94A3B8"
            style={styles.input}
            value={name}
          />
          <Pressable
            accessibilityRole="button"
            disabled={!name.trim()}
            onPress={continueToApp}
            style={({ pressed }) => [
              styles.button,
              (!name.trim() || pressed) && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>Começar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { flex: 1, justifyContent: 'space-between', padding: 24, paddingBottom: 32 },
  brand: { alignItems: 'center', marginTop: 80 },
  title: { color: '#111827', fontSize: 26, fontWeight: '700', marginTop: 18 },
  subtitle: { color: '#64748B', fontSize: 16, marginTop: 8 },
  form: { gap: 10 },
  label: { color: '#64748B', fontSize: 13 },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    color: '#111827',
    height: 58,
    paddingHorizontal: 16,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 14,
    height: 58,
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
