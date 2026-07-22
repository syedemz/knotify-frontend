/**
 * Tests for src/components/Heading.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Heading } from "@/components/Heading";
import { fontFamily } from "@/theme/typography";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Heading", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props", () => {
    it("then renders children without crash", () => {
      renderWithTheme(<Heading>Welcome</Heading>);
      expect(screen.getByText("Welcome")).toBeTruthy();
    });

    it("then defaults to heading.xl variant with fontSize 24", () => {
      const { toJSON } = renderWithTheme(<Heading>Title</Heading>);
      expect(JSON.stringify(toJSON())).toContain('"fontSize":24');
    });

    it("then applies primary text color by default", () => {
      const { toJSON } = renderWithTheme(<Heading>Title</Heading>);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.text.primary);
    });

    it("then defaults to left alignment", () => {
      const { toJSON } = renderWithTheme(<Heading>Title</Heading>);
      expect(JSON.stringify(toJSON())).toContain('"textAlign":"left"');
    });

    it("then uses Plus Jakarta Sans font family for English locale", () => {
      const { toJSON } = renderWithTheme(<Heading>Title</Heading>);
      expect(JSON.stringify(toJSON())).toContain(fontFamily.primary.bold);
    });

    it("then has accessibilityRole header", () => {
      const { toJSON } = renderWithTheme(<Heading>Title</Heading>);
      expect(JSON.stringify(toJSON())).toContain('"accessibilityRole":"header"');
    });
  });

  describe("given variant='display.lg'", () => {
    it("then applies fontSize 32", () => {
      const { toJSON } = renderWithTheme(
        <Heading variant="display.lg">Hero</Heading>,
      );
      expect(JSON.stringify(toJSON())).toContain('"fontSize":32');
    });
  });

  describe("given variant='display.md'", () => {
    it("then applies fontSize 28", () => {
      const { toJSON } = renderWithTheme(
        <Heading variant="display.md">Sub-hero</Heading>,
      );
      expect(JSON.stringify(toJSON())).toContain('"fontSize":28');
    });
  });

  describe("given variant='heading.lg'", () => {
    it("then applies fontSize 20", () => {
      const { toJSON } = renderWithTheme(
        <Heading variant="heading.lg">Section</Heading>,
      );
      expect(JSON.stringify(toJSON())).toContain('"fontSize":20');
    });
  });

  describe("given variant='heading.md'", () => {
    it("then applies fontSize 18", () => {
      const { toJSON } = renderWithTheme(
        <Heading variant="heading.md">Card title</Heading>,
      );
      expect(JSON.stringify(toJSON())).toContain('"fontSize":18');
    });
  });

  describe("given variant='heading.sm'", () => {
    it("then applies fontSize 16", () => {
      const { toJSON } = renderWithTheme(
        <Heading variant="heading.sm">Small heading</Heading>,
      );
      expect(JSON.stringify(toJSON())).toContain('"fontSize":16');
    });
  });

  describe("given color='brand'", () => {
    it("then applies brand text color", () => {
      const { toJSON } = renderWithTheme(
        <Heading color="brand">Brand heading</Heading>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.text.brand);
    });
  });

  describe("given align='center'", () => {
    it("then sets textAlign center", () => {
      const { toJSON } = renderWithTheme(
        <Heading align="center">Centered</Heading>,
      );
      expect(JSON.stringify(toJSON())).toContain('"textAlign":"center"');
    });
  });

  describe("given numberOfLines={2}", () => {
    it("then passes numberOfLines to the native text element", () => {
      const { toJSON } = renderWithTheme(
        <Heading numberOfLines={2}>Long heading that might wrap</Heading>,
      );
      expect(JSON.stringify(toJSON())).toContain('"numberOfLines":2');
    });
  });

  describe("given accessibilityLabel", () => {
    it("then the label is accessible", () => {
      renderWithTheme(
        <Heading accessibilityLabel="screen title">Welcome</Heading>,
      );
      expect(screen.getByLabelText("screen title")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark primary text color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Heading>Dark heading</Heading>
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.text.primary);
    });
  });

  describe("given useLocalizedFontFamily returns urdu font set", () => {
    it("then uses Noto Nastaliq Urdu bold font", () => {
      jest
        .spyOn(
          require("@/theme/useLocalizedFontFamily"),
          "useLocalizedFontFamily",
        )
        .mockReturnValue(fontFamily.urdu);

      const { toJSON } = renderWithTheme(<Heading>عنوان</Heading>);
      expect(JSON.stringify(toJSON())).toContain(fontFamily.urdu.bold);
    });
  });
});
