/**
 * Tests for src/components/LoadingState.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { LoadingState } from "@/components/LoadingState";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("LoadingState", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props", () => {
    it("then renders without crash", () => {
      const { toJSON } = renderWithTheme(<LoadingState />);
      expect(toJSON()).toBeTruthy();
    });

    it("then has accessibilityRole progressbar in the output JSON", () => {
      const { toJSON } = renderWithTheme(<LoadingState />);
      expect(JSON.stringify(toJSON())).toContain("progressbar");
    });

    it("then uses default accessibilityLabel Loading", () => {
      renderWithTheme(<LoadingState />);
      expect(screen.getByLabelText("Loading")).toBeTruthy();
    });

    it("then applies accent.primary to the activity indicator", () => {
      const { toJSON } = renderWithTheme(<LoadingState />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });
  });

  describe("given message prop", () => {
    it("then renders the message text", () => {
      renderWithTheme(<LoadingState message="Finding your matches…" />);
      expect(screen.getByText("Finding your matches…")).toBeTruthy();
    });
  });

  describe("given custom accessibilityLabel", () => {
    it("then uses the custom label", () => {
      renderWithTheme(<LoadingState accessibilityLabel="Fetching profiles" />);
      expect(screen.getByLabelText("Fetching profiles")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark accent.primary to the indicator", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <LoadingState />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.accent.primary);
    });
  });
});
