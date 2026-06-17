import { useEffect, useState } from 'react';

const storageKey = 'react-grids-playground-theme';
const colorThemeClass = 'theme-ocean-green';

function getInitialTheme() {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const savedTheme = window.localStorage.getItem(storageKey);

  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useThemeMode() {
  const [themeMode, setThemeMode] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    document.documentElement.classList.add(colorThemeClass);
    window.localStorage.setItem(storageKey, themeMode);
  }, [themeMode]);

  return {
    themeMode,
    toggleTheme: () => {
      setThemeMode((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
    },
  };
}
