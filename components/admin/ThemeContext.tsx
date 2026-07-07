/**
 * ThemeContext.tsx
 * App-wide dark mode for the admin dashboard. Provides a `ColorPalette`
 * (same shape as dashboard/theme.ts's `C`) that swaps between LIGHT and DARK
 * values, plus a toggle. Screens read colors via `useAppTheme()` instead of
 * importing the static `C` so their styles react to the toggle.
 */

import React, { createContext, useContext, useMemo, useState } from 'react';

export type ColorPalette = {
  bg:        string;
  brown:     string;
  brownMid:  string;
  amber:     string;
  border:    string;
  white:     string;
  cardBg:    string;
  lightBg:   string;
  divider:   string;
  success:   string;
  warning:   string;
  danger:    string;
  info:      string;
  purple:    string;
};

export const LIGHT_COLORS: ColorPalette = {
  bg:        '#F8E4D5',
  brown:     '#3B1A0C',
  brownMid:  '#6B3318',
  amber:     '#C46B1A',
  border:    '#C86820',
  white:     '#FFFFFF',
  cardBg:    '#FFFFFF',
  lightBg:   '#FDF0E6',
  divider:   '#E8C4A0',
  success:   '#4CAF50',
  warning:   '#FF9800',
  danger:    '#F44336',
  info:      '#2196F3',
  purple:    '#9C27B0',
};

export const DARK_COLORS: ColorPalette = {
  bg:        '#17110B',
  brown:     '#F3E4D2',
  brownMid:  '#C9A98A',
  amber:     '#E08A3E',
  border:    '#4A3018',
  white:     '#FFFFFF',
  cardBg:    '#241A12',
  lightBg:   '#1E1610',
  divider:   '#3A2A1A',
  success:   '#5FCB6B',
  warning:   '#FFB74D',
  danger:    '#F4685C',
  info:      '#4FA8E8',
  purple:    '#B379E8',
};

type ThemeContextValue = {
  C:       ColorPalette;
  isDark:  boolean;
  toggleDarkMode: (value?: boolean) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  const value = useMemo<ThemeContextValue>(() => ({
    C: isDark ? DARK_COLORS : LIGHT_COLORS,
    isDark,
    toggleDarkMode: (next) => setIsDark((prev) => (typeof next === 'boolean' ? next : !prev)),
  }), [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within a ThemeProvider');
  return ctx;
}
