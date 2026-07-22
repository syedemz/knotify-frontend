/**
 * Tests for src/components/Box.tsx
 */
import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Box } from "@/components/Box";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Box", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given no props", () => {
    it("then renders children without crash", () => {
      renderWithTheme(
        <Box>
          <Text testID="child">Hello</Text>
        </Box>,
      );
      expect(screen.getByTestId("child")).toBeTruthy();
    });
  });

  describe("given bg='surface'", () => {
    it("then applies the surface background color from the light theme", () => {
      const { toJSON } = renderWithTheme(<Box bg="surface" />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.surface);
    });
  });

  describe("given padding='lg'", () => {
    it("then applies the lg spacing value", () => {
      const { toJSON } = renderWithTheme(<Box padding="lg" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.lg));
    });
  });

  describe("given radius='lg'", () => {
    it("then applies the lg radius value", () => {
      const { toJSON } = renderWithTheme(<Box radius="lg" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.lg));
    });
  });

  describe("given border='default'", () => {
    it("then applies border width and default border color", () => {
      const { toJSON } = renderWithTheme(<Box border="default" />);
      const json = JSON.stringify(toJSON());
      expect(json).toContain(lightTheme.colors.border.default);
    });
  });

  describe("given shadow='md'", () => {
    it("then applies shadow token", () => {
      const { toJSON } = renderWithTheme(<Box shadow="md" />);
      expect(JSON.stringify(toJSON())).toBeTruthy();
    });
  });

  describe("given flex={true}", () => {
    it("then includes flex: 1 in the style", () => {
      const { toJSON } = renderWithTheme(<Box flex />);
      const json = JSON.stringify(toJSON());
      expect(json).toContain('"flex":1');
    });
  });

  describe("given accessibilityLabel", () => {
    it("then the label is accessible", () => {
      renderWithTheme(
        <Box accessibilityLabel="card container">
          <Text>Content</Text>
        </Box>,
      );
      expect(screen.getByLabelText("card container")).toBeTruthy();
    });
  });

  describe("given paddingX and paddingY overrides", () => {
    it("then applies horizontal and vertical padding separately", () => {
      const { toJSON } = renderWithTheme(
        <Box paddingX="lg" paddingY="sm" />,
      );
      const json = JSON.stringify(toJSON());
      expect(json).toContain(String(lightTheme.spacing.lg));
      expect(json).toContain(String(lightTheme.spacing.sm));
    });
  });

  describe("given individual padding overrides (paddingTop, paddingBottom, paddingLeft, paddingRight)", () => {
    it("then applies paddingTop", () => {
      const { toJSON } = renderWithTheme(<Box paddingTop="xl" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.xl));
    });

    it("then applies paddingBottom", () => {
      const { toJSON } = renderWithTheme(<Box paddingBottom="xxl" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.xxl));
    });

    it("then applies paddingLeft", () => {
      const { toJSON } = renderWithTheme(<Box paddingLeft="sm" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.sm));
    });

    it("then applies paddingRight", () => {
      const { toJSON } = renderWithTheme(<Box paddingRight="xs" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.xs));
    });
  });

  describe("given margin props", () => {
    it("then applies uniform margin", () => {
      const { toJSON } = renderWithTheme(<Box margin="md" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.md));
    });

    it("then applies marginX", () => {
      const { toJSON } = renderWithTheme(<Box marginX="lg" />);
      const json = JSON.stringify(toJSON());
      expect(json).toContain('"marginLeft"');
      expect(json).toContain('"marginRight"');
    });

    it("then applies marginY", () => {
      const { toJSON } = renderWithTheme(<Box marginY="sm" />);
      const json = JSON.stringify(toJSON());
      expect(json).toContain('"marginTop"');
      expect(json).toContain('"marginBottom"');
    });

    it("then applies marginTop", () => {
      const { toJSON } = renderWithTheme(<Box marginTop="xl" />);
      expect(JSON.stringify(toJSON())).toContain('"marginTop"');
    });

    it("then applies marginBottom", () => {
      const { toJSON } = renderWithTheme(<Box marginBottom="xxl" />);
      expect(JSON.stringify(toJSON())).toContain('"marginBottom"');
    });

    it("then applies marginLeft", () => {
      const { toJSON } = renderWithTheme(<Box marginLeft="xs" />);
      expect(JSON.stringify(toJSON())).toContain('"marginLeft"');
    });

    it("then applies marginRight", () => {
      const { toJSON } = renderWithTheme(<Box marginRight="xxs" />);
      expect(JSON.stringify(toJSON())).toContain('"marginRight"');
    });
  });

  describe("given dark theme", () => {
    it("then renders with dark surface background", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Box bg="surface" />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.surface);
    });
  });
});
