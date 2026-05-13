import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'pp_theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  return 'dark';
}

function applyTheme(theme: Theme) {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
}

// Module-level state so all hook instances share one value
let currentTheme: Theme = getInitialTheme();
applyTheme(currentTheme);
const listeners = new Set<() => void>();

function setGlobalTheme(theme: Theme) {
  currentTheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  applyTheme(theme);
  listeners.forEach(fn => fn());
}

export function useTheme() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    setGlobalTheme(theme);
  }, []);

  const toggle = useCallback(() => {
    setGlobalTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }, []);

  return { theme: currentTheme, setTheme, toggle };
}
