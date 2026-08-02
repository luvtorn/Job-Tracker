'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import {
  parseThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from '@/features/theme/theme';

type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_CHANGE_EVENT = 'jobtracker-theme-change';

const systemPrefersDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyTheme = (preference: ThemePreference) => {
  const resolved = resolveTheme(preference, systemPrefersDark());
  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  return resolved;
};

const getThemeSnapshot = () => {
  const preference = parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY));
  return `${preference}:${resolveTheme(preference, systemPrefersDark())}`;
};

const subscribeToTheme = (onStoreChange: () => void) => {
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const synchronize = () => {
    applyTheme(parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY)));
    onStoreChange();
  };
  media.addEventListener('change', synchronize);
  window.addEventListener('storage', synchronize);
  window.addEventListener(THEME_CHANGE_EVENT, synchronize);
  return () => {
    media.removeEventListener('change', synchronize);
    window.removeEventListener('storage', synchronize);
    window.removeEventListener(THEME_CHANGE_EVENT, synchronize);
  };
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => 'system:light');
  const [preferenceValue, resolvedThemeValue] = snapshot.split(':');
  const preference = parseThemePreference(preferenceValue);
  const resolvedTheme: ResolvedTheme = resolvedThemeValue === 'dark' ? 'dark' : 'light';

  const setTheme = useCallback((nextPreference: ThemePreference) => {
    localStorage.setItem(THEME_STORAGE_KEY, nextPreference);
    applyTheme(nextPreference);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setTheme }),
    [preference, resolvedTheme, setTheme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
