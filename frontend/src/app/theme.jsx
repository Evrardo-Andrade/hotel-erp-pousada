import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "hotel-erp-theme";

export const themeOptions = [
  { value: "dark-premium", label: "Escuro Premium" },
  { value: "green-professional", label: "Verde Profissional" },
  { value: "classic-light", label: "Classico Claro" }
];

const ThemeContext = createContext(null);

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (themeOptions.some((item) => item.value === savedTheme)) {
    return savedTheme;
  }

  return "classic-light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    themeOptions
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider.");
  }

  return context;
}
