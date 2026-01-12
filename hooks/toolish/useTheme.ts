/**
 * useTheme hook for managing theme throughout the application
 */
import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY, applyThemeToDocument, initializeTheme, setTheme, type Theme } from "../../lib/toolish/theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initialize theme from localStorage
    const initialTheme = initializeTheme();
    setThemeState(initialTheme);
    setIsLoaded(true);
  }, []);

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    setThemeState(newTheme);
  };

  return {
    theme: theme || "light",
    isLoaded,
    setTheme: updateTheme,
    isDark: theme === "dark",
    isLight: theme === "light",
  };
}
