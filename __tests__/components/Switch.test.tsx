/**
 * Tests for src/components/Switch.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Switch } from "@/components/Switch";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Switch", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given value={false}", () => {
    it("then renders with accessibilityRole switch", () => {
      renderWithTheme(
        <Switch
          value={false}
          onValueChange={() => {}}
          accessibilityLabel="Notifications"
        />,
      );
      expect(screen.getByRole("switch")).toBeTruthy();
    });

    it("then has accessibilityState checked=false", () => {
      renderWithTheme(
        <Switch
          value={false}
          onValueChange={() => {}}
          accessibilityLabel="Notifications"
        />,
      );
      expect(screen.getByRole("switch").props.accessibilityState.checked).toBe(false);
    });
  });

  describe("given value={true}", () => {
    it("then has accessibilityState checked=true", () => {
      renderWithTheme(
        <Switch
          value={true}
          onValueChange={() => {}}
          accessibilityLabel="Notifications"
        />,
      );
      expect(screen.getByRole("switch").props.accessibilityState.checked).toBe(true);
    });

    it("then applies accent.primary track color", () => {
      const { toJSON } = renderWithTheme(
        <Switch
          value={true}
          onValueChange={() => {}}
          accessibilityLabel="Notifications"
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });
  });

  describe("given onChange interaction", () => {
    it("then fires onValueChange when toggled", () => {
      const onValueChange = jest.fn();
      renderWithTheme(
        <Switch
          value={false}
          onValueChange={onValueChange}
          accessibilityLabel="Notifications"
        />,
      );
      fireEvent(screen.getByRole("switch"), "valueChange", true);
      expect(onValueChange).toHaveBeenCalledWith(true);
    });
  });

  describe("given disabled={true}", () => {
    it("then reduces opacity", () => {
      const { toJSON } = renderWithTheme(
        <Switch
          value={false}
          onValueChange={() => {}}
          accessibilityLabel="Disabled switch"
          disabled
        />,
      );
      expect(JSON.stringify(toJSON())).toContain("0.5");
    });

    it("then has accessibilityState disabled=true", () => {
      renderWithTheme(
        <Switch
          value={false}
          onValueChange={() => {}}
          accessibilityLabel="Disabled"
          disabled
        />,
      );
      expect(screen.getByRole("switch").props.accessibilityState.disabled).toBe(true);
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <Switch
          value={false}
          onValueChange={() => {}}
          accessibilityLabel="Enable dark mode"
        />,
      );
      expect(screen.getByLabelText("Enable dark mode")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders active switch with dark accent.primary", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Switch
            value={true}
            onValueChange={() => {}}
            accessibilityLabel="Dark mode switch"
          />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.accent.primary);
    });
  });
});
