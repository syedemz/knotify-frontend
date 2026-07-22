/**
 * Tests for src/components/ListRow.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { ListRow } from "@/components/ListRow";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("ListRow", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given label only", () => {
    it("then renders the label text", () => {
      renderWithTheme(<ListRow label="Profile visibility" />);
      expect(screen.getByText("Profile visibility")).toBeTruthy();
    });

    it("then applies bg.surface background", () => {
      const { toJSON } = renderWithTheme(<ListRow label="Name" />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.surface);
    });

    it("then applies lg border radius", () => {
      const { toJSON } = renderWithTheme(<ListRow label="Name" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.lg));
    });

    it("then renders as a non-interactive View when onPress is undefined", () => {
      renderWithTheme(<ListRow label="Name" accessibilityLabel="Name row" />);
      expect(screen.getByLabelText("Name row")).toBeTruthy();
      // No button role when non-interactive
      expect(screen.queryByRole("button")).toBeNull();
    });
  });

  describe("given description prop", () => {
    it("then renders description text", () => {
      renderWithTheme(
        <ListRow label="Nationality" description="Pakistani" />,
      );
      expect(screen.getByText("Pakistani")).toBeTruthy();
    });
  });

  describe("given leading slot", () => {
    it("then renders the leading element", () => {
      renderWithTheme(
        <ListRow label="Name" leading={<Text>L</Text>} />,
      );
      expect(screen.getByText("L")).toBeTruthy();
    });
  });

  describe("given trailing slot", () => {
    it("then renders the trailing element", () => {
      renderWithTheme(
        <ListRow label="Name" trailing={<Text>›</Text>} />,
      );
      expect(screen.getByText("›")).toBeTruthy();
    });
  });

  describe("given onPress callback", () => {
    it("then has accessibilityRole button", () => {
      renderWithTheme(<ListRow label="Settings" onPress={() => {}} />);
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("then fires onPress when pressed", () => {
      const onPress = jest.fn();
      renderWithTheme(
        <ListRow label="Settings" onPress={onPress} accessibilityLabel="Settings row" />,
      );
      fireEvent.press(screen.getByLabelText("Settings row"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("given disabled={true}", () => {
    it("then does not fire onPress", () => {
      const onPress = jest.fn();
      renderWithTheme(
        <ListRow
          label="Disabled"
          onPress={onPress}
          disabled
          accessibilityLabel="Disabled row"
        />,
      );
      fireEvent.press(screen.getByLabelText("Disabled row"));
      expect(onPress).not.toHaveBeenCalled();
    });

    it("then has accessibilityState disabled=true", () => {
      renderWithTheme(
        <ListRow
          label="Disabled"
          onPress={() => {}}
          disabled
          accessibilityLabel="Disabled row"
        />,
      );
      expect(screen.getByLabelText("Disabled row").props.accessibilityState.disabled).toBe(true);
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <ListRow
          label="Name"
          accessibilityLabel="Full name row"
        />,
      );
      expect(screen.getByLabelText("Full name row")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark bg.surface color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <ListRow label="Dark mode" />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.surface);
    });
  });
});
