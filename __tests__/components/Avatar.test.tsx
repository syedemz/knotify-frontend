/**
 * Tests for src/components/Avatar.tsx
 *
 * expo-image renders natively; we mock it with a plain View + testID so
 * assertions remain in pure JS.
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";

jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: ({
      source,
      style,
      accessibilityLabel,
    }: {
      source: unknown;
      style?: object;
      accessibilityLabel?: string;
    }) => (
      <View
        testID="expo-image"
        style={style}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="image"
      />
    ),
  };
});

import { Avatar } from "@/components/Avatar";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Avatar", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given uri prop", () => {
    it("then renders the expo-image element", () => {
      renderWithTheme(
        <Avatar
          uri="https://example.com/photo.jpg"
          accessibilityLabel="Aisha's photo"
        />,
      );
      expect(screen.getByTestId("expo-image")).toBeTruthy();
    });

    it("then does not render initials text", () => {
      renderWithTheme(
        <Avatar
          uri="https://example.com/photo.jpg"
          initials="AK"
          accessibilityLabel="Aisha"
        />,
      );
      expect(screen.queryByText("AK")).toBeNull();
    });
  });

  describe("given no uri (initials fallback)", () => {
    it("then renders the initials text", () => {
      renderWithTheme(
        <Avatar initials="AK" accessibilityLabel="Aisha Khan" />,
      );
      expect(screen.getByText("AK")).toBeTruthy();
    });

    it("then truncates initials to 2 uppercase characters", () => {
      renderWithTheme(
        <Avatar initials="abc" accessibilityLabel="Full name" />,
      );
      expect(screen.getByText("AB")).toBeTruthy();
    });

    it("then renders default '?' when no initials supplied", () => {
      renderWithTheme(
        <Avatar accessibilityLabel="Unknown user" />,
      );
      expect(screen.getByText("?")).toBeTruthy();
    });

    it("then applies accent.tertiary background for initials fallback", () => {
      const { toJSON } = renderWithTheme(
        <Avatar initials="AK" accessibilityLabel="Aisha" />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.tertiary);
    });
  });

  describe("given size='sm'", () => {
    it("then renders without crash at sm size", () => {
      const { toJSON } = renderWithTheme(
        <Avatar initials="AK" size="sm" accessibilityLabel="Small avatar" />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("given size='xl'", () => {
    it("then renders without crash at xl size", () => {
      const { toJSON } = renderWithTheme(
        <Avatar initials="AK" size="xl" accessibilityLabel="XL avatar" />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <Avatar initials="AK" accessibilityLabel="Aisha Khan" />,
      );
      expect(screen.getByLabelText("Aisha Khan")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders initials fallback with dark accent.tertiary", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Avatar initials="AK" accessibilityLabel="Aisha" />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.accent.tertiary);
    });
  });
});
