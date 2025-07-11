// Enhanced theme management hook
import { useState, useEffect, useCallback } from "react";
import { THEME_CONFIG, LOCAL_STORAGE_KEYS } from "@/constants";
import { getStorageItem, setStorageItem } from "@/lib/utils";
import type { Theme } from "@/types";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from localStorage or use system preference
    const savedTheme = getStorageItem(LOCAL_STORAGE_KEYS.THEME, THEME_CONFIG.DEFAULT as Theme);
    return savedTheme;
  });

  // Get system theme preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }, []);

  // Get resolved theme (handles 'system' preference)
  const resolvedTheme = theme === 'system' ? getSystemTheme() : theme;

  // Apply theme to document
  const applyTheme = useCallback((themeToApply: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(themeToApply);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        themeToApply === 'dark' ? '#0f172a' : '#ffffff'
      );
    }
  }, []);

  // Set theme and persist to localStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setStorageItem(LOCAL_STORAGE_KEYS.THEME, newTheme);
    
    // Apply the resolved theme immediately
    const resolvedNewTheme = newTheme === 'system' ? getSystemTheme() : newTheme;
    applyTheme(resolvedNewTheme);
  }, [getSystemTheme, applyTheme]);

  // Toggle between light and dark (skips system)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, applyTheme]);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme, applyTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    themes: THEME_CONFIG.THEMES,
    isSystemPreference: theme === 'system',
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  };
}

// Hook for theme-aware styling
export function useThemeAwareStyles() {
  const { resolvedTheme } = useTheme();

  const getThemeStyles = useCallback((lightStyles: any, darkStyles: any) => {
    return resolvedTheme === 'dark' ? darkStyles : lightStyles;
  }, [resolvedTheme]);

  const getThemeValue = useCallback((lightValue: any, darkValue: any) => {
    return resolvedTheme === 'dark' ? darkValue : lightValue;
  }, [resolvedTheme]);

  return {
    resolvedTheme,
    getThemeStyles,
    getThemeValue,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  };
}

// Hook for theme-aware animations
export function useThemeTransition() {
  const { setTheme } = useTheme();

  const setThemeWithTransition = useCallback((newTheme: Theme) => {
    // Add transition class to body
    document.body.classList.add('theme-transition');
    
    // Set the new theme
    setTheme(newTheme);
    
    // Remove transition class after animation
    setTimeout(() => {
      document.body.classList.remove('theme-transition');
    }, 300);
  }, [setTheme]);

  return {
    setThemeWithTransition,
  };
}
