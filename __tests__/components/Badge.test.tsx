/**
 * Tests for src/components/Badge.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Badge } from "@/components/Badge";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Badge", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props (primary, md)", () => {
    it("then renders the label text", () => {
      renderWithTheme(<Badge label="3" />);
      expect(screen.getByText("3")).toBeTruthy();
    });

    it("then applies accent.primary background in light theme", () => {
      const { toJSON } = renderWithTheme(<Badge label="3" />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });

    it("then applies text.inverse color for the label", () => {
      const { toJSON } = renderWithTheme(<Badge label="3" />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.text.inverse);
    });

    it("then applies pill border radius", () => {
      const { toJSON } = renderWithTheme(<Badge label="3" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.pill));
    });
  });

  describe("given variant='secondary'", () => {
    it("then applies accent.secondary background", () => {
      const { toJSON } = renderWithTheme(
        <Badge label="New" variant="secondary" />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.secondary);
    });
  });

  describe("given variant='muted'", () => {
    it("then applies bg.muted background", () => {
      const { toJSON } = renderWithTheme(
        <Badge label="Hidden" variant="muted" />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.muted);
    });
  });

  describe("given variant='premium'", () => {
    it("then applies bg.premium background", () => {
      const { toJSON } = renderWithTheme(
        <Badge label="Premium" variant="premium" />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.premium);
    });

    it("then applies text.premium color", () => {
      const { toJSON } = renderWithTheme(
        <Badge label="Premium" variant="premium" />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.text.premium);
    });
  });

  describe("given size='sm'", () => {
    it("then renders without crash at sm size", () => {
      const { toJSON } = renderWithTheme(
        <Badge label="New" size="sm" />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <Badge label="3" accessibilityLabel="3 unread messages" />,
      );
      expect(screen.getByLabelText("3 unread messages")).toBeTruthy();
    });

    it("then defaults accessibilityLabel to label prop", () => {
      renderWithTheme(<Badge label="5" />);
      expect(screen.getByLabelText("5")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark accent.primary background", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Badge label="3" />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.accent.primary);
    });
  });
});
