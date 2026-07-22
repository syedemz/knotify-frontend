/**
 * Tests for src/components/Column.tsx
 */
import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Column } from "@/components/Column";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Column", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given no props", () => {
    it("then renders children without crash", () => {
      renderWithTheme(
        <Column>
          <Text testID="child">Hello</Text>
        </Column>,
      );
      expect(screen.getByTestId("child")).toBeTruthy();
    });

    it("then defaults to flexDirection column", () => {
      const { toJSON } = renderWithTheme(<Column />);
      expect(JSON.stringify(toJSON())).toContain('"flexDirection":"column"');
    });

    it("then defaults to alignItems stretch", () => {
      const { toJSON } = renderWithTheme(<Column />);
      expect(JSON.stringify(toJSON())).toContain('"alignItems":"stretch"');
    });
  });

  describe("given gap='md'", () => {
    it("then applies the md spacing value as gap", () => {
      const { toJSON } = renderWithTheme(<Column gap="md" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.md));
    });
  });

  describe("given align='center'", () => {
    it("then sets alignItems center", () => {
      const { toJSON } = renderWithTheme(<Column align="center" />);
      expect(JSON.stringify(toJSON())).toContain('"alignItems":"center"');
    });
  });

  describe("given justify='center'", () => {
    it("then sets justifyContent center", () => {
      const { toJSON } = renderWithTheme(<Column justify="center" />);
      expect(JSON.stringify(toJSON())).toContain('"justifyContent":"center"');
    });
  });

  describe("given flex={true}", () => {
    it("then includes flex: 1", () => {
      const { toJSON } = renderWithTheme(<Column flex />);
      expect(JSON.stringify(toJSON())).toContain('"flex":1');
    });
  });

  describe("given padding='xxl'", () => {
    it("then applies xxl padding value", () => {
      const { toJSON } = renderWithTheme(<Column padding="xxl" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.xxl));
    });
  });

  describe("given accessibilityLabel", () => {
    it("then the label is accessible", () => {
      renderWithTheme(
        <Column accessibilityLabel="column container">
          <Text>Item</Text>
        </Column>,
      );
      expect(screen.getByLabelText("column container")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders with dark surface background", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Column bg="surface" />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.surface);
    });
  });
});
