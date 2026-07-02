import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
}

const Ctx = createContext<ThemeCtx | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('ce-theme') as Theme) || 'system');
  const [highContrast, setHC] = useState<boolean>(() => localStorage.getItem('ce-hc') === '1');
  const [largeText, setLT] = useState<boolean>(() => localStorage.getItem('ce-lt') === '1');

  useEffect(() => {
    const apply = () => {
      const root = document.documentElement;
      const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = theme === 'dark' || (theme === 'system' && sysDark);
      root.classList.toggle('dark', dark);
      root.classList.toggle('contrast-high', highContrast);
      root.classList.toggle('font-large', largeText);
    };
    apply();
    localStorage.setItem('ce-theme', theme);
    localStorage.setItem('ce-hc', highContrast ? '1' : '0');
    localStorage.setItem('ce-lt', largeText ? '1' : '0');
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => theme === 'system' && apply();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme, highContrast, largeText]);

  return (
    <Ctx.Provider value={{ theme, setTheme: setThemeState, highContrast, setHighContrast: setHC, largeText, setLargeText: setLT }}>
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useTheme requires ThemeProvider');
  return c;
};
