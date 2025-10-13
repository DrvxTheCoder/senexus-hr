'use client';

import { useEffect } from 'react';

interface ThemeColorProviderProps {
  themeColor?: string | null;
}

export function ThemeColorProvider({ themeColor }: ThemeColorProviderProps) {
  useEffect(() => {
    // Apply theme color from firm or cookie
    const firmThemeColor = themeColor;
    const cookieThemeColor = document.cookie
      .split('; ')
      .find((row) => row.startsWith('firm_theme_color='))
      ?.split('=')[1];

    const colorToApply = firmThemeColor || cookieThemeColor;

    if (colorToApply) {
      document.documentElement.style.setProperty('--primary', colorToApply);
    }
  }, [themeColor]);

  return null;
}
