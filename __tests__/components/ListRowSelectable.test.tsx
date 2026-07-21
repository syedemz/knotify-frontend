/**
 * Tests for src/components/ListRowSelectable.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { ListRowSelectable } from "@/components/ListRowSelectable";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("ListRowSelectable", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given selected={false} and control='checkbox'", () => {
    it("then renders with accessibilityRole checkbox", () => {
      renderWithTheme(
        <ListRowSelectable
          label="Pakistani"
          selected={false}
          onToggle={() => {}}
        />,
      );
      expect(screen.getByRole("checkbox")).toBeTruthy();
    });

    it("then has accessibilityState checked=false", () => {
      renderWithTheme(
        <ListRowSelectable
          label="Pakistani"
          selected={false}
          onToggle={() => {}}
        />,
      );
      expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(false);
    });

    it("then uses border.default border color", () => {
      const { toJSON } = renderWithTheme(
        <ListRowSelectable
          label="Pakistani"
          selected={false}
          onToggle={() => {}}
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.border.default);
    });
  });

  describe("given selected={true}", () => {
    it("then has accessibilityState checked=true", () => {
      renderWithTheme(
        <ListRowSelectable
          label="Pakistani"
          selected={true}
          onToggle={() => {}}
        />,
      );
      expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(true);
    });

    it("then uses accent.primary border and label color", () => {
      const { toJSON } = renderWithTheme(
        <ListRowSelectable
          label="Pakistani"
          selected={true}
          onToggle={() => {}}
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });
  });

  describe("given control='radio'", () => {
    it("then has accessibilityRole radio", () => {
      renderWithTheme(
        <ListRowSelectable
          label="No preference"
          selected={false}
          onToggle={() => {}}
          control="radio"
        />,
      );
      expect(screen.getByRole("radio")).toBeTruthy();
    });
  });

  describe("given description prop", () => {
    it("then renders description text", () => {
      renderWithTheme(
        <ListRowSelectable
          label="Option"
          description="Option description"
          selected={false}
          onToggle={() => {}}
        />,
      );
      expect(screen.getByText("Option description")).toBeTruthy();
    });
  });

  describe("given onToggle interaction", () => {
    it("then fires onToggle when pressed", () => {
      const onToggle = jest.fn();
      renderWithTheme(
        <ListRowSelectable
          label="Pakistani"
          selected={false}
          onToggle={onToggle}
        />,
      );
      fireEvent.press(screen.getByRole("checkbox"));
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the custom label", () => {
      renderWithTheme(
        <ListRowSelectable
          label="Pakistani"
          selected={false}
          onToggle={() => {}}
          accessibilityLabel="Pakistani nationality"
        />,
      );
      expect(screen.getByLabelText("Pakistani nationality")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders with dark accent.primary when selected", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <ListRowSelectable
            label="Pakistani"
            selected={true}
            onToggle={() => {}}
          />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.accent.primary);
    });
  });
});
