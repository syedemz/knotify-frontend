/**
 * Tests for src/components/TouchableArea.tsx
 */
import React from "react";
import { Text } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme } from "@/theme/theme";
import { TouchableArea } from "@/components/TouchableArea";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("TouchableArea", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given required props", () => {
    it("then renders children without crash", () => {
      renderWithTheme(
        <TouchableArea onPress={() => {}} accessibilityLabel="View profile">
          <Text testID="child">Content</Text>
        </TouchableArea>,
      );
      expect(screen.getByTestId("child")).toBeTruthy();
    });

    it("then is accessible with the provided label", () => {
      renderWithTheme(
        <TouchableArea onPress={() => {}} accessibilityLabel="View profile">
          <Text>Content</Text>
        </TouchableArea>,
      );
      expect(screen.getByLabelText("View profile")).toBeTruthy();
    });

    it("then has accessibilityRole button", () => {
      renderWithTheme(
        <TouchableArea onPress={() => {}} accessibilityLabel="View profile">
          <Text>Content</Text>
        </TouchableArea>,
      );
      expect(screen.getByRole("button")).toBeTruthy();
    });
  });

  describe("given onPress callback", () => {
    it("then fires when pressed and not disabled", () => {
      const onPress = jest.fn();
      renderWithTheme(
        <TouchableArea onPress={onPress} accessibilityLabel="Tap me">
          <Text>Tap</Text>
        </TouchableArea>,
      );
      fireEvent.press(screen.getByRole("button"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("given disabled={true}", () => {
    it("then does not fire onPress", () => {
      const onPress = jest.fn();
      renderWithTheme(
        <TouchableArea onPress={onPress} accessibilityLabel="Disabled" disabled>
          <Text>Disabled</Text>
        </TouchableArea>,
      );
      fireEvent.press(screen.getByRole("button"));
      expect(onPress).not.toHaveBeenCalled();
    });

    it("then has accessibilityState disabled=true", () => {
      renderWithTheme(
        <TouchableArea onPress={() => {}} accessibilityLabel="Disabled" disabled>
          <Text>Content</Text>
        </TouchableArea>,
      );
      const area = screen.getByRole("button");
      expect(area.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe("given padding='lg'", () => {
    it("then applies lg padding from theme", () => {
      const { toJSON } = renderWithTheme(
        <TouchableArea
          onPress={() => {}}
          accessibilityLabel="Padded"
          padding="lg"
        >
          <Text>Content</Text>
        </TouchableArea>,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.lg));
    });
  });

  describe("given accessibilityHint", () => {
    it("then passes the hint to the pressable", () => {
      renderWithTheme(
        <TouchableArea
          onPress={() => {}}
          accessibilityLabel="Profile"
          accessibilityHint="Opens user profile"
        >
          <Text>Content</Text>
        </TouchableArea>,
      );
      const area = screen.getByRole("button");
      expect(area.props.accessibilityHint).toBe("Opens user profile");
    });
  });

  describe("given dark theme", () => {
    it("then renders without crash in dark mode", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <TouchableArea onPress={() => {}} accessibilityLabel="Dark area">
            <Text>Dark</Text>
          </TouchableArea>
        </ThemeProvider>,
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});
