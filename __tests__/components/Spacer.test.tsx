/**
 * Tests for src/components/Spacer.tsx
 */
import React from "react";
import { render } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme } from "@/theme/theme";
import { Spacer } from "@/components/Spacer";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Spacer", () => {
  describe("given default props", () => {
    it("then renders without crash", () => {
      const { toJSON } = renderWithTheme(<Spacer />);
      expect(toJSON()).toBeTruthy();
    });

    it("then uses md spacing as height", () => {
      const { toJSON } = renderWithTheme(<Spacer />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.md));
    });
  });

  describe("given size='lg' axis='vertical'", () => {
    it("then applies lg height", () => {
      const { toJSON } = renderWithTheme(<Spacer size="lg" axis="vertical" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.lg));
    });
  });

  describe("given size='xxl' axis='horizontal'", () => {
    it("then applies xxl width instead of height", () => {
      const { toJSON } = renderWithTheme(<Spacer size="xxl" axis="horizontal" />);
      const json = JSON.stringify(toJSON());
      expect(json).toContain('"width"');
      expect(json).toContain(String(lightTheme.spacing.xxl));
    });
  });

  describe("given dark theme", () => {
    it("then renders without crash in dark mode", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Spacer size="lg" />
        </ThemeProvider>,
      );
      expect(toJSON()).toBeTruthy();
      jest.restoreAllMocks();
    });
  });
});
