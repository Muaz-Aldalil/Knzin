'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'knzin_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Read stored preference
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const initialTheme: Theme = stored && ['light', 'dark', 'system'].includes(stored) ? stored : 'system';
    setThemeState(initialTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (targetTheme: Theme) => {
      let resolved: ResolvedTheme = 'light';
      if (targetTheme === 'dark') {
        resolved = 'dark';
      } else if (targetTheme === 'light') {
        resolved = 'light';
      } else {
        resolved = mediaQuery.matches ? 'dark' : 'light';
      }

      setResolvedTheme(resolved);

      const root = document.documentElement;
      if (resolved === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme(initialTheme);
    setMounted(true);

    // 2. Listen to system preference change if in 'system' mode
    const handleSystemChange = () => {
      const currentStored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (!currentStored || currentStored === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    let resolved: ResolvedTheme = 'light';
    if (newTheme === 'dark') {
      resolved = 'dark';
    } else if (newTheme === 'light') {
      resolved = 'light';
    } else {
      resolved = mediaQuery.matches ? 'dark' : 'light';
    }

    setResolvedTheme(resolved);

    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
