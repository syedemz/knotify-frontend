/**
 * Tests for src/components/Divider.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Divider } from "@/components/Divider";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Divider", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props", () => {
    it("then renders without crash", () => {
      const { toJSON } = renderWithTheme(<Divider />);
      expect(toJSON()).toBeTruthy();
    });

    it("then applies the default border color", () => {
      const { toJSON } = renderWithTheme(<Divider />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.border.default);
    });

    it("then renders with height 1", () => {
      const { toJSON } = renderWithTheme(<Divider />);
      expect(JSON.stringify(toJSON())).toContain('"height":1');
    });

    it("then has default accessibilityLabel Divider", () => {
      renderWithTheme(<Divider />);
      expect(screen.getByLabelText("Divider")).toBeTruthy();
    });
  });

  describe("given color='strong'", () => {
    it("then applies the strong border color", () => {
      const { toJSON } = renderWithTheme(<Divider color="strong" />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.border.strong);
    });
  });

  describe("given spacing='lg'", () => {
    it("then applies vertical margin of lg", () => {
      const { toJSON } = renderWithTheme(<Divider spacing="lg" />);
      const json = JSON.stringify(toJSON());
      expect(json).toContain('"marginVertical"');
      expect(json).toContain(String(lightTheme.spacing.lg));
    });
  });

  describe("given custom accessibilityLabel", () => {
    it("then renders with the custom label", () => {
      renderWithTheme(<Divider accessibilityLabel="section separator" />);
      expect(screen.getByLabelText("section separator")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders with dark border color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Divider />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.border.default);
    });
  });
});
