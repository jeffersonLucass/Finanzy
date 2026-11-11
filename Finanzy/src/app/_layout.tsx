import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { initializeRuntime } from '../application/runtime';
import { useRuntimeLifecycle } from '../hooks/use-runtime-lifecycle';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';
import { SplashScreen } from '../screens/SplashScreen';
import { lightTheme } from '../theme/themes';

function Navigation() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ contentStyle: { backgroundColor: theme.colors.canvas }, headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setReady(false);
    setError(false);
    setAttempt(value => value + 1);
  }, []);

  useEffect(() => {
    let current = true;
    void initializeRuntime().then(() => {
      if (current) setReady(true);
    }).catch(() => {
      if (current) setError(true);
    });
    return () => { current = false; };
  }, [attempt]);

  useRuntimeLifecycle(ready);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightTheme.colors.canvas }}>
        <StatusBar style="dark" />
        {error ? (
          <>
            <Text style={{ color: lightTheme.colors.textSecondary, marginBottom: 16, textAlign: 'center' }}>Não foi possível abrir seus dados.</Text>
            <Pressable accessibilityRole="button" onPress={retry} style={{ backgroundColor: lightTheme.colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12 }}>
              <Text style={{ color: lightTheme.colors.onPrimary, fontWeight: '700' }}>Tentar novamente</Text>
            </Pressable>
          </>
        ) : <SplashScreen />}
      </View>
    );
  }

  return (
    <ThemeProvider>
      <Navigation />
    </ThemeProvider>
  );
}
