/**
 * Tests for src/components/Checkbox.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Checkbox } from "@/components/Checkbox";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Checkbox", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given checked={false}", () => {
    it("then renders with accessibilityRole checkbox", () => {
      renderWithTheme(
        <Checkbox
          checked={false}
          onToggle={() => {}}
          accessibilityLabel="Agree to terms"
        />,
      );
      expect(screen.getByRole("checkbox")).toBeTruthy();
    });

    it("then has accessibilityState checked=false", () => {
      renderWithTheme(
        <Checkbox
          checked={false}
          onToggle={() => {}}
          accessibilityLabel="Agree to terms"
        />,
      );
      expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(false);
    });

    it("then uses border.strong border color", () => {
      const { toJSON } = renderWithTheme(
        <Checkbox
          checked={false}
          onToggle={() => {}}
          accessibilityLabel="Terms"
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.border.strong);
    });
  });

  describe("given checked={true}", () => {
    it("then has accessibilityState checked=true", () => {
      renderWithTheme(
        <Checkbox
          checked={true}
          onToggle={() => {}}
          accessibilityLabel="Agree to terms"
        />,
      );
      expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(true);
    });

    it("then uses accent.primary fill color", () => {
      const { toJSON } = renderWithTheme(
        <Checkbox
          checked={true}
          onToggle={() => {}}
          accessibilityLabel="Terms"
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });
  });

  describe("given onChange interaction", () => {
    it("then fires onToggle with true when unchecked is pressed", () => {
      const onToggle = jest.fn();
      renderWithTheme(
        <Checkbox
          checked={false}
          onToggle={onToggle}
          accessibilityLabel="Terms"
        />,
      );
      fireEvent.press(screen.getByRole("checkbox"));
      expect(onToggle).toHaveBeenCalledWith(true);
    });

    it("then fires onToggle with false when checked is pressed", () => {
      const onToggle = jest.fn();
      renderWithTheme(
        <Checkbox
          checked={true}
          onToggle={onToggle}
          accessibilityLabel="Terms"
        />,
      );
      fireEvent.press(screen.getByRole("checkbox"));
      expect(onToggle).toHaveBeenCalledWith(false);
    });
  });

  describe("given disabled={true}", () => {
    it("then reduces opacity", () => {
      const { toJSON } = renderWithTheme(
        <Checkbox
          checked={false}
          onToggle={() => {}}
          accessibilityLabel="Terms"
          disabled
        />,
      );
      expect(JSON.stringify(toJSON())).toContain("0.5");
    });

    it("then has accessibilityState disabled=true", () => {
      renderWithTheme(
        <Checkbox
          checked={false}
          onToggle={() => {}}
          accessibilityLabel="Terms"
          disabled
        />,
      );
      expect(screen.getByRole("checkbox").props.accessibilityState.disabled).toBe(true);
    });

    it("then does not fire onToggle when pressed", () => {
      const onToggle = jest.fn();
      renderWithTheme(
        <Checkbox
          checked={false}
          onToggle={onToggle}
          accessibilityLabel="Terms"
          disabled
        />,
      );
      fireEvent.press(screen.getByRole("checkbox"));
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <Checkbox
          checked={false}
          onToggle={() => {}}
          accessibilityLabel="Accept privacy policy"
        />,
      );
      expect(screen.getByLabelText("Accept privacy policy")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders checked box with dark accent.primary", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Checkbox
            checked={true}
            onToggle={() => {}}
            accessibilityLabel="Terms"
          />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.accent.primary);
    });
  });
});
