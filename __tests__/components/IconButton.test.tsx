/**
 * Tests for src/components/IconButton.tsx
 */
import React from "react";
import { Text } from "react-native";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { IconButton } from "@/components/IconButton";

const MockIcon = <Text testID="icon">X</Text>;

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("IconButton", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given required props", () => {
    it("then renders the icon and is accessible", () => {
      renderWithTheme(
        <IconButton
          icon={MockIcon}
          onPress={() => {}}
          accessibilityLabel="Go back"
        />,
      );
      expect(screen.getByLabelText("Go back")).toBeTruthy();
      expect(screen.getByTestId("icon")).toBeTruthy();
    });

    it("then has accessibilityRole button", () => {
      renderWithTheme(
        <IconButton
          icon={MockIcon}
          onPress={() => {}}
          accessibilityLabel="Close"
        />,
      );
      expect(screen.getByRole("button")).toBeTruthy();
    });
  });

  describe("given size='sm'", () => {
    it("then renders with 32px touch target", () => {
      const { toJSON } = renderWithTheme(
        <IconButton
          icon={MockIcon}
          onPress={() => {}}
          accessibilityLabel="Small"
          size="sm"
        />,
      );
      expect(JSON.stringify(toJSON())).toContain('"width":32');
    });
  });

  describe("given size='md'", () => {
    it("then renders with 40px touch target", () => {
      const { toJSON } = renderWithTheme(
        <IconButton
          icon={MockIcon}
          onPress={() => {}}
          accessibilityLabel="Medium"
          size="md"
        />,
      );
      expect(JSON.stringify(toJSON())).toContain('"width":40');
    });
  });

  describe("given size='lg' (default)", () => {
    it("then renders with 48px touch target", () => {
      const { toJSON } = renderWithTheme(
        <IconButton
          icon={MockIcon}
          onPress={() => {}}
          accessibilityLabel="Large"
        />,
      );
      expect(JSON.stringify(toJSON())).toContain('"width":48');
    });
  });

  describe("given bg='surface'", () => {
    it("then applies surface background color", () => {
      const { toJSON } = renderWithTheme(
        <IconButton
          icon={MockIcon}
          onPress={() => {}}
          accessibilityLabel="With bg"
          bg="surface"
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.surface);
    });
  });

  describe("given disabled={true}", () => {
    it("then does not fire onPress", () => {
      const onPress = jest.fn();
      renderWithTheme(
        <IconButton
          icon={MockIcon}
          onPress={onPress}
          accessibilityLabel="Disabled icon"
          disabled
        />,
      );
      fireEvent.press(screen.getByRole("button"));
      expect(onPress).not.toHaveBeenCalled();
    });

    it("then has accessibilityState disabled=true", () => {
      renderWithTheme(
        <IconButton
          icon={MockIcon}
          onPress={() => {}}
          accessibilityLabel="Disabled"
          disabled
        />,
      );
      const btn = screen.getByRole("button");
      expect(btn.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe("given onPress callback", () => {
    it("then fires when pressed", () => {
      const onPress = jest.fn();
      renderWithTheme(
        <IconButton
          icon={MockIcon}
          onPress={onPress}
          accessibilityLabel="Press icon"
        />,
      );
      fireEvent.press(screen.getByRole("button"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("given dark theme", () => {
    it("then renders with dark bg.surface when bg is set", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <IconButton
            icon={MockIcon}
            onPress={() => {}}
            accessibilityLabel="Dark icon"
            bg="surface"
          />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.surface);
    });
  });
});
