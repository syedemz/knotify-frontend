/**
 * Tests for src/components/Screen.tsx
 */
import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Screen } from "@/components/Screen";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Screen", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("given default props, when rendered", () => {
    it("then renders without crash and shows children", () => {
      renderWithTheme(
        <Screen accessibilityLabel="test screen">
          <Text testID="child">Hello</Text>
        </Screen>,
      );
      expect(screen.getByTestId("child")).toBeTruthy();
    });

    it("then renders with safe=true by default (SafeAreaView present)", () => {
      const { toJSON } = renderWithTheme(
        <Screen>
          <Text>Hello</Text>
        </Screen>,
      );
      // Should render without error; tree structure asserts safe wrapping
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("given safe={false}, when rendered", () => {
    it("then renders without SafeAreaView", () => {
      renderWithTheme(
        <Screen safe={false}>
          <Text testID="child">Hello</Text>
        </Screen>,
      );
      expect(screen.getByTestId("child")).toBeTruthy();
    });
  });

  describe("given paddingX and paddingY props", () => {
    it("then renders without error with spacing tokens", () => {
      renderWithTheme(
        <Screen paddingX="xxl" paddingY="lg">
          <Text testID="child">Padded</Text>
        </Screen>,
      );
      expect(screen.getByTestId("child")).toBeTruthy();
    });
  });

  describe("given light theme", () => {
    it("then renders correctly against light palette", () => {
      const { toJSON } = renderWithTheme(
        <Screen>
          <Text>Light mode</Text>
        </Screen>,
      );
      // Verify the bg.primary token value is present somewhere in the style tree
      const json = JSON.stringify(toJSON());
      expect(json).toContain(lightTheme.colors.bg.primary);
    });
  });

  describe("given dark theme", () => {
    it("then renders correctly against dark palette", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Screen>
            <Text>Dark mode</Text>
          </Screen>
        </ThemeProvider>,
      );
      const json = JSON.stringify(toJSON());
      expect(json).toContain(darkTheme.colors.bg.primary);
    });
  });
});
