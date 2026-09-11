/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'eaios-theme';

const getInitialTheme = (): ThemePreference => {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as string;
  if (stored === 'dark' || stored === 'light' || stored === 'system') {
    return stored as ThemePreference;
  }
  if (stored === 'corporate-white') return 'light';

  try {
    const prefRaw = localStorage.getItem('eaios_preferences');
    if (prefRaw) {
      const parsed = JSON.parse(prefRaw);
      const prefTheme = parsed?.appearance?.theme;
      if (prefTheme === 'dark' || prefTheme === 'light' || prefTheme === 'system') {
        return prefTheme;
      }
      if (prefTheme === 'corporate-white') return 'light';
    }
  } catch {
    // ignore
  }

  return 'system';
};

const resolveTheme = (pref: ThemePreference): ResolvedTheme => {
  if (pref === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return pref;
};

// Immediate execution to prevent flash before React mounts
if (typeof window !== 'undefined') {
  const initialPref = getInitialTheme();
  const initialResolved = resolveTheme(initialPref);
  document.documentElement.setAttribute('data-theme', initialResolved);
  document.documentElement.classList.toggle('dark', initialResolved === 'dark');
  document.documentElement.classList.toggle('light', initialResolved === 'light');
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemePreference>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(getInitialTheme()));

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Sync with eaios_preferences if present
    try {
      const stored = localStorage.getItem('eaios_preferences');
      const prefs = stored ? JSON.parse(stored) : {};
      if (!prefs.appearance) prefs.appearance = {};
      prefs.appearance.theme = theme;
      localStorage.setItem('eaios_preferences', JSON.stringify(prefs));
    } catch {
      // ignore
    }

    if (theme === 'system') {
      const matcher = window.matchMedia('(prefers-color-scheme: dark)');
      const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
        const sysTheme: ResolvedTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(sysTheme);
        document.documentElement.setAttribute('data-theme', sysTheme);
        document.documentElement.classList.toggle('dark', sysTheme === 'dark');
        document.documentElement.classList.toggle('light', sysTheme === 'light');
      };

      updateSystemTheme(matcher);
      matcher.addEventListener('change', updateSystemTheme);

      return () => {
        matcher.removeEventListener('change', updateSystemTheme);
      };
    } else {
      setResolvedTheme(theme);
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.classList.toggle('light', theme === 'light');
    }
  }, [theme]);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const currentResolved = prev === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : prev;
      return currentResolved === 'dark' ? 'light' : 'dark';
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

