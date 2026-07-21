/**
 * Tests for src/theme/ThemeProvider.tsx — context, useTheme, useThemeControls.
 */

import React from "react";
import { Text } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider, useTheme, useThemeControls } from "@/theme/ThemeProvider";

/** Helper component that renders the current theme mode. */
function ThemeConsumer() {
  const theme = useTheme();
  return <Text testID="mode">{theme.mode}</Text>;
}

/** Helper component that renders a color token for verification. */
function ColorConsumer() {
  const theme = useTheme();
  return <Text testID="bgPrimary">{theme.colors.bg.primary}</Text>;
}

/** Helper component for testing the error throw when no provider is present. */
function OrphanConsumer() {
  const theme = useTheme();
  return <Text>{theme.mode}</Text>;
}

describe("given ThemeProvider, when rendering children", () => {
  it("then children can access the theme via useTheme", () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    // In the test environment, useColorScheme typically returns 'light' or null.
    const mode = screen.getByTestId("mode").props.children as string;
    expect(["light", "dark"]).toContain(mode);
  });

  it("then the active theme exposes colors.bg.primary as a non-empty string", () => {
    render(
      <ThemeProvider>
        <ColorConsumer />
      </ThemeProvider>,
    );
    const value = screen.getByTestId("bgPrimary").props.children;
    expect(typeof value).toBe("string");
    expect(value.length).toBeGreaterThan(0);
  });

  it("then spacing tokens are accessible from the theme", () => {
    function SpacingConsumer() {
      const theme = useTheme();
      return <Text testID="lg">{theme.spacing.lg}</Text>;
    }

    render(
      <ThemeProvider>
        <SpacingConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("lg").props.children).toBe(16);
  });
});

describe("given useTheme called outside ThemeProvider, when rendering", () => {
  it("then it throws an error with a descriptive message", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<OrphanConsumer />)).toThrow(
      "useTheme must be used within ThemeProvider",
    );
    spy.mockRestore();
  });
});

describe("given useThemeControls called outside ThemeProvider, when rendering", () => {
  function OrphanControls() {
    useThemeControls();
    return null;
  }

  it("then it throws an error with a descriptive message", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<OrphanControls />)).toThrow(
      "useThemeControls must be used within ThemeProvider",
    );
    spy.mockRestore();
  });
});

describe("given ThemeProvider, when toggleTheme is called", () => {
  function ToggleButton() {
    const theme = useTheme();
    const { toggleTheme } = useThemeControls();
    return (
      <>
        <Text testID="mode">{theme.mode}</Text>
        <Text testID="toggle" onPress={toggleTheme}>
          toggle
        </Text>
      </>
    );
  }

  it("then the theme mode changes on toggle", () => {
    render(
      <ThemeProvider>
        <ToggleButton />
      </ThemeProvider>,
    );
    const beforeMode = screen.getByTestId("mode").props.children as string;
    fireEvent.press(screen.getByTestId("toggle"));
    const afterMode = screen.getByTestId("mode").props.children as string;
    // Mode must have changed
    expect(afterMode).not.toBe(beforeMode);
    expect(["light", "dark"]).toContain(afterMode);
  });

  it("then the theme mode returns to the original after two toggles", () => {
    render(
      <ThemeProvider>
        <ToggleButton />
      </ThemeProvider>,
    );
    const beforeMode = screen.getByTestId("mode").props.children as string;
    fireEvent.press(screen.getByTestId("toggle"));
    fireEvent.press(screen.getByTestId("toggle"));
    const afterMode = screen.getByTestId("mode").props.children as string;
    expect(afterMode).toBe(beforeMode);
  });
});

describe("given ThemeProvider, when setMode is called with explicit value", () => {
  function ModeSelector() {
    const theme = useTheme();
    const { setMode } = useThemeControls();
    return (
      <>
        <Text testID="mode">{theme.mode}</Text>
        <Text testID="setDark" onPress={() => setMode("dark")}>
          dark
        </Text>
        <Text testID="setLight" onPress={() => setMode("light")}>
          light
        </Text>
        <Text testID="setSystem" onPress={() => setMode("system")}>
          system
        </Text>
      </>
    );
  }

  it("then setMode('dark') always produces dark mode", () => {
    render(
      <ThemeProvider>
        <ModeSelector />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByTestId("setDark"));
    expect(screen.getByTestId("mode").props.children).toBe("dark");
  });

  it("then setMode('light') always produces light mode", () => {
    render(
      <ThemeProvider>
        <ModeSelector />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByTestId("setLight"));
    expect(screen.getByTestId("mode").props.children).toBe("light");
  });

  it("then setMode('system') returns to the system-determined mode", () => {
    render(
      <ThemeProvider>
        <ModeSelector />
      </ThemeProvider>,
    );
    // Force to a known state then switch back to system
    fireEvent.press(screen.getByTestId("setDark"));
    fireEvent.press(screen.getByTestId("setSystem"));
    const mode = screen.getByTestId("mode").props.children as string;
    // System mode in the test env is light or dark; must be a valid value
    expect(["light", "dark"]).toContain(mode);
  });
});
