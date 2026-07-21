/**
 * Tests for src/components/Card.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Card } from "@/components/Card";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Card", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props", () => {
    it("then renders children", () => {
      renderWithTheme(
        <Card>
          <Text>Card content</Text>
        </Card>,
      );
      expect(screen.getByText("Card content")).toBeTruthy();
    });

    it("then applies bg.surface background in light theme", () => {
      const { toJSON } = renderWithTheme(
        <Card>
          <Text>Content</Text>
        </Card>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.surface);
    });

    it("then applies lg border radius", () => {
      const { toJSON } = renderWithTheme(
        <Card>
          <Text>Content</Text>
        </Card>,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.lg));
    });

    it("then applies border color when bordered=true", () => {
      const { toJSON } = renderWithTheme(
        <Card>
          <Text>Content</Text>
        </Card>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.border.default);
    });
  });

  describe("given bordered={false}", () => {
    it("then does not apply border width", () => {
      const { toJSON } = renderWithTheme(
        <Card bordered={false}>
          <Text>Content</Text>
        </Card>,
      );
      const json = JSON.stringify(toJSON());
      // border.default color should not appear when bordered=false
      expect(json).not.toContain(lightTheme.colors.border.default);
    });
  });

  describe("given bg='premium'", () => {
    it("then applies premium background color", () => {
      const { toJSON } = renderWithTheme(
        <Card bg="premium">
          <Text>Premium</Text>
        </Card>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.premium);
    });
  });

  describe("given radius='xl'", () => {
    it("then applies xl border radius", () => {
      const { toJSON } = renderWithTheme(
        <Card radius="xl">
          <Text>Content</Text>
        </Card>,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.xl));
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <Card accessibilityLabel="Profile card">
          <Text>Content</Text>
        </Card>,
      );
      expect(screen.getByLabelText("Profile card")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark bg.surface color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Card>
            <Text>Dark mode</Text>
          </Card>
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.surface);
    });
  });
});
