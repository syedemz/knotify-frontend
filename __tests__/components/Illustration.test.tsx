/**
 * Tests for src/components/Illustration.tsx
 *
 * expo-image renders natively; mocked for pure JS assertions.
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { View } from "react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";

jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: ({
      style,
      accessibilityLabel,
    }: {
      style?: object;
      accessibilityLabel?: string;
    }) => (
      <View
        testID="expo-image"
        style={style}
        accessibilityLabel={accessibilityLabel}
      />
    ),
  };
});

import { Illustration } from "@/components/Illustration";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Illustration", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props (size='md')", () => {
    it("then renders the expo-image element", () => {
      renderWithTheme(
        <Illustration
          source={1}
          accessibilityLabel="No matches illustration"
        />,
      );
      expect(screen.getByTestId("expo-image")).toBeTruthy();
    });
  });

  describe("given size='sm'", () => {
    it("then renders without crash", () => {
      const { toJSON } = renderWithTheme(
        <Illustration
          source={1}
          size="sm"
          accessibilityLabel="Small illustration"
        />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("given size='lg'", () => {
    it("then renders without crash", () => {
      const { toJSON } = renderWithTheme(
        <Illustration
          source={1}
          size="lg"
          accessibilityLabel="Large illustration"
        />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("given marginBottom='xxl'", () => {
    it("then applies spacing.xxl as marginBottom", () => {
      const { toJSON } = renderWithTheme(
        <Illustration
          source={1}
          marginBottom="xxl"
          accessibilityLabel="Illustration with margin"
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.xxl));
    });
  });

  describe("given decorative (accessibilityLabel='')", () => {
    it("then renders without crash", () => {
      const { toJSON } = renderWithTheme(
        <Illustration source={1} accessibilityLabel="" />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("given non-empty accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <Illustration
          source={1}
          accessibilityLabel="No matches illustration"
        />,
      );
      expect(screen.getAllByLabelText("No matches illustration").length).toBeGreaterThan(0);
    });
  });

  describe("given dark theme", () => {
    it("then renders without crash in dark mode", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Illustration source={1} accessibilityLabel="Dark illustration" />
        </ThemeProvider>,
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});
