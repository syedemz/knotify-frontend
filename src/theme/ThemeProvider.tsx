import React, { createContext, useContext, useState, useMemo } from "react";
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme, Theme } from "./theme";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setMode: (mode: "light" | "dark" | "system") => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<"light" | "dark" | "system">(
    "system",
  );
  const mode = override === "system" ? (systemScheme ?? "light") : override;
  const theme = mode === "dark" ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setOverride(theme.mode === "dark" ? "light" : "dark"),
      setMode: setOverride,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/**
 * Returns the current theme object. Must be called within a `ThemeProvider`.
 *
 * @throws {Error} When called outside a `ThemeProvider`.
 * @returns The active {@link Theme} (light or dark).
 */
export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx.theme;
}

/**
 * Returns theme control functions for toggling or setting the color mode.
 * Must be called within a `ThemeProvider`.
 *
 * @throws {Error} When called outside a `ThemeProvider`.
 * @returns `{ toggleTheme, setMode }` — control functions for the active theme.
 */
export function useThemeControls() {
  const ctx = useContext(ThemeContext);
  if (!ctx)
    throw new Error("useThemeControls must be used within ThemeProvider");
  return { toggleTheme: ctx.toggleTheme, setMode: ctx.setMode };
}
