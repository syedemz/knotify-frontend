/**
 * Tests for src/components/Text.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Text } from "@/components/Text";
import { fontFamily } from "@/theme/typography";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Text", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props", () => {
    it("then renders children without crash", () => {
      renderWithTheme(<Text>Hello</Text>);
      expect(screen.getByText("Hello")).toBeTruthy();
    });

    it("then applies body.md text style by default", () => {
      const { toJSON } = renderWithTheme(<Text>Hello</Text>);
      // body.md has fontSize 14
      expect(JSON.stringify(toJSON())).toContain('"fontSize":14');
    });

    it("then applies primary text color by default", () => {
      const { toJSON } = renderWithTheme(<Text>Hello</Text>);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.text.primary);
    });

    it("then defaults to left text alignment", () => {
      const { toJSON } = renderWithTheme(<Text>Hello</Text>);
      expect(JSON.stringify(toJSON())).toContain('"textAlign":"left"');
    });

    it("then uses Plus Jakarta Sans font family for English locale", () => {
      const { toJSON } = renderWithTheme(<Text>Hello</Text>);
      expect(JSON.stringify(toJSON())).toContain(fontFamily.primary.regular);
    });
  });

  describe("given variant='body.lg'", () => {
    it("then applies fontSize 16", () => {
      const { toJSON } = renderWithTheme(<Text variant="body.lg">Large body</Text>);
      expect(JSON.stringify(toJSON())).toContain('"fontSize":16');
    });
  });

  describe("given variant='body.sm'", () => {
    it("then applies fontSize 13", () => {
      const { toJSON } = renderWithTheme(<Text variant="body.sm">Small body</Text>);
      expect(JSON.stringify(toJSON())).toContain('"fontSize":13');
    });
  });

  describe("given variant='label.lg'", () => {
    it("then applies label.lg font style", () => {
      const { toJSON } = renderWithTheme(<Text variant="label.lg">Label</Text>);
      const json = JSON.stringify(toJSON());
      expect(json).toContain('"fontSize":16');
      expect(json).toContain(fontFamily.primary.semibold);
    });
  });

  describe("given variant='label.md'", () => {
    it("then applies label.md font style", () => {
      const { toJSON } = renderWithTheme(<Text variant="label.md">Label md</Text>);
      expect(JSON.stringify(toJSON())).toContain('"fontSize":14');
    });
  });

  describe("given variant='label.sm'", () => {
    it("then applies label.sm font style", () => {
      const { toJSON } = renderWithTheme(<Text variant="label.sm">Label sm</Text>);
      expect(JSON.stringify(toJSON())).toContain('"fontSize":12');
    });
  });

  describe("given variant='caption'", () => {
    it("then applies caption font style with fontSize 11", () => {
      const { toJSON } = renderWithTheme(<Text variant="caption">Caption</Text>);
      expect(JSON.stringify(toJSON())).toContain('"fontSize":11');
    });
  });

  describe("given color='secondary'", () => {
    it("then applies secondary text color", () => {
      const { toJSON } = renderWithTheme(
        <Text color="secondary">Secondary</Text>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.text.secondary);
    });
  });

  describe("given color='brand'", () => {
    it("then applies brand text color", () => {
      const { toJSON } = renderWithTheme(
        <Text color="brand">Brand</Text>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.text.brand);
    });
  });

  describe("given align='center'", () => {
    it("then sets textAlign center", () => {
      const { toJSON } = renderWithTheme(<Text align="center">Centered</Text>);
      expect(JSON.stringify(toJSON())).toContain('"textAlign":"center"');
    });
  });

  describe("given align='right'", () => {
    it("then sets textAlign right", () => {
      const { toJSON } = renderWithTheme(<Text align="right">Right</Text>);
      expect(JSON.stringify(toJSON())).toContain('"textAlign":"right"');
    });
  });

  describe("given numberOfLines={1}", () => {
    it("then passes numberOfLines to the native text element", () => {
      const { toJSON } = renderWithTheme(
        <Text numberOfLines={1}>Truncated</Text>,
      );
      expect(JSON.stringify(toJSON())).toContain('"numberOfLines":1');
    });
  });

  describe("given accessibilityLabel", () => {
    it("then the label is accessible", () => {
      renderWithTheme(
        <Text accessibilityLabel="greeting text">Hello</Text>,
      );
      expect(screen.getByLabelText("greeting text")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark primary text color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Text>Dark text</Text>
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.text.primary);
    });
  });

  describe("given useLocalizedFontFamily returns urdu font set", () => {
    it("then uses Noto Nastaliq Urdu font family", () => {
      // Simulate Urdu locale by mocking useLocalizedFontFamily directly
      jest
        .spyOn(
          require("@/theme/useLocalizedFontFamily"),
          "useLocalizedFontFamily",
        )
        .mockReturnValue(fontFamily.urdu);

      const { toJSON } = renderWithTheme(<Text>مرحبا</Text>);
      expect(JSON.stringify(toJSON())).toContain(fontFamily.urdu.regular);
    });
  });
});
