import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemePalette = {
  bg: string;
  card: string;
  text: string;
  muted: string;
  line: string;
  input: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  palette: ThemePalette;
  toggleTheme: () => Promise<void>;
};

const lightPalette: ThemePalette = {
  bg: "#F6F8FC",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#64748B",
  line: "#E2E8F0",
  input: "#FFFFFF"
};

const darkPalette: ThemePalette = {
  bg: "#08111F",
  card: "#111827",
  text: "#F8FAFC",
  muted: "#94A3B8",
  line: "#243244",
  input: "#0F172A"
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    AsyncStorage.getItem("themeMode").then((stored) => {
      if (stored === "dark" || stored === "light") {
        setMode(stored);
      }
    });
  }, []);

  const toggleTheme = async () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    await AsyncStorage.setItem("themeMode", next);
  };

  const value = useMemo(
    () => ({ mode, palette: mode === "dark" ? darkPalette : lightPalette, toggleTheme }),
    [mode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
