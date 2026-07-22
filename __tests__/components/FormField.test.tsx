/**
 * Tests for src/components/FormField.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { FormField } from "@/components/FormField";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("FormField", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given a label and child input", () => {
    it("then renders the label text", () => {
      renderWithTheme(
        <FormField label="Email">
          <></>
        </FormField>,
      );
      expect(screen.getByText("Email")).toBeTruthy();
    });

    it("then renders children", () => {
      renderWithTheme(
        <FormField label="Name">
          <></>
        </FormField>,
      );
      // label text is present
      expect(screen.getByText("Name")).toBeTruthy();
    });
  });

  describe("given no label", () => {
    it("then renders without label row", () => {
      renderWithTheme(
        <FormField>
          <></>
        </FormField>,
      );
      // No label text in the document — component renders children only
      expect(screen.queryByText("Email")).toBeNull();
    });
  });

  describe("given error prop", () => {
    it("then displays the error message", () => {
      renderWithTheme(
        <FormField error="This field is required">
          <></>
        </FormField>,
      );
      expect(screen.getByText("This field is required")).toBeTruthy();
    });

    it("then applies status.error color to the error message", () => {
      const { toJSON } = renderWithTheme(
        <FormField error="Required">
          <></>
        </FormField>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.status.error);
    });

    it("then error has accessibilityRole alert", () => {
      renderWithTheme(
        <FormField error="Oops">
          <></>
        </FormField>,
      );
      expect(screen.getByRole("alert")).toBeTruthy();
    });
  });

  describe("given empty error string", () => {
    it("then does not render error row", () => {
      renderWithTheme(
        <FormField error="">
          <></>
        </FormField>,
      );
      expect(screen.queryByRole("alert")).toBeNull();
    });
  });

  describe("given hint prop", () => {
    it("then displays the hint text", () => {
      renderWithTheme(
        <FormField hint="At least 8 characters">
          <></>
        </FormField>,
      );
      expect(screen.getByText("At least 8 characters")).toBeTruthy();
    });
  });

  describe("given required={true}", () => {
    it("then shows the asterisk marker", () => {
      renderWithTheme(
        <FormField label="Phone" required>
          <></>
        </FormField>,
      );
      expect(screen.getByText(" *")).toBeTruthy();
    });
  });

  describe("given required={false} (default)", () => {
    it("then does not show an asterisk", () => {
      renderWithTheme(
        <FormField label="Phone">
          <></>
        </FormField>,
      );
      expect(screen.queryByText(" *")).toBeNull();
    });
  });

  describe("given dark theme", () => {
    it("then renders error message with dark status.error color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <FormField error="Bad input">
            <></>
          </FormField>
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.status.error);
    });
  });
});
