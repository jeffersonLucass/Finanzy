import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getRuntime } from '../application/runtime';
import { Settings, defaultSettings } from '../features/settings/settings-service';
import { AppTheme } from './tokens';
import { darkTheme, lightTheme } from './themes';

type ThemeContextValue = { theme: AppTheme; settings: Settings; reload: () => void };

const ThemeContext = createContext<ThemeContextValue>({ theme: lightTheme, settings: defaultSettings, reload: () => undefined });

export function ThemeProvider({ children }: PropsWithChildren) {
  const scheme = useColorScheme();
  const [settings, setSettings] = useState(defaultSettings);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    let current = true;
    let unsubscribe: () => void = () => undefined;
    void getRuntime().then(async runtime => {
      if (current) setSettings(await runtime.settings.get());
      unsubscribe = runtime.settings.subscribe(reload);
    });
    return () => {
      current = false;
      unsubscribe();
    };
  }, [reload, revision]);

  const dark = settings.theme === 'dark' || (settings.theme === 'system' && scheme === 'dark');
  const value = useMemo(() => ({ theme: dark ? darkTheme : lightTheme, settings, reload }), [dark, reload, settings]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
