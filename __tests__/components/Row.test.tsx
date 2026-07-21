/**
 * Tests for src/components/Row.tsx
 */
import React from "react";
import { Text } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Row } from "@/components/Row";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Row", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given no props", () => {
    it("then renders children without crash", () => {
      renderWithTheme(
        <Row>
          <Text testID="child">Hello</Text>
        </Row>,
      );
      expect(screen.getByTestId("child")).toBeTruthy();
    });

    it("then defaults to flexDirection row", () => {
      const { toJSON } = renderWithTheme(<Row />);
      expect(JSON.stringify(toJSON())).toContain('"flexDirection":"row"');
    });

    it("then defaults to alignItems center", () => {
      const { toJSON } = renderWithTheme(<Row />);
      expect(JSON.stringify(toJSON())).toContain('"alignItems":"center"');
    });
  });

  describe("given gap='lg'", () => {
    it("then applies the lg spacing value as gap", () => {
      const { toJSON } = renderWithTheme(<Row gap="lg" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.lg));
    });
  });

  describe("given justify='space-between'", () => {
    it("then sets justifyContent space-between", () => {
      const { toJSON } = renderWithTheme(<Row justify="space-between" />);
      expect(JSON.stringify(toJSON())).toContain('"justifyContent":"space-between"');
    });
  });

  describe("given wrap={true}", () => {
    it("then sets flexWrap to wrap", () => {
      const { toJSON } = renderWithTheme(<Row wrap />);
      expect(JSON.stringify(toJSON())).toContain('"flexWrap":"wrap"');
    });
  });

  describe("given flex={true}", () => {
    it("then includes flex: 1", () => {
      const { toJSON } = renderWithTheme(<Row flex />);
      expect(JSON.stringify(toJSON())).toContain('"flex":1');
    });
  });

  describe("given bg='muted'", () => {
    it("then applies muted background color", () => {
      const { toJSON } = renderWithTheme(<Row bg="muted" />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.muted);
    });
  });

  describe("given accessibilityLabel", () => {
    it("then the label is accessible", () => {
      renderWithTheme(
        <Row accessibilityLabel="row container">
          <Text>Item</Text>
        </Row>,
      );
      expect(screen.getByLabelText("row container")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders with dark bg.muted background", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Row bg="muted" />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.muted);
    });
  });
});
