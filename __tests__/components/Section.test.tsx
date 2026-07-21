/**
 * Tests for src/components/Section.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Section } from "@/components/Section";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Section", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props", () => {
    it("then renders children", () => {
      renderWithTheme(
        <Section>
          <Text>Section content</Text>
        </Section>,
      );
      expect(screen.getByText("Section content")).toBeTruthy();
    });

    it("then applies bg.muted background in light theme", () => {
      const { toJSON } = renderWithTheme(
        <Section>
          <Text>Content</Text>
        </Section>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.muted);
    });
  });

  describe("given title prop", () => {
    it("then renders the title text", () => {
      renderWithTheme(
        <Section title="About me">
          <Text>Content</Text>
        </Section>,
      );
      expect(screen.getByText("About me")).toBeTruthy();
    });

    it("then applies primary text color to the title", () => {
      const { toJSON } = renderWithTheme(
        <Section title="About me">
          <Text>Content</Text>
        </Section>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.text.primary);
    });
  });

  describe("given bg='premium'", () => {
    it("then applies premium background color", () => {
      const { toJSON } = renderWithTheme(
        <Section bg="premium">
          <Text>Premium</Text>
        </Section>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.premium);
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <Section accessibilityLabel="Profile section">
          <Text>Content</Text>
        </Section>,
      );
      expect(screen.getByLabelText("Profile section")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark bg.muted color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Section>
            <Text>Dark</Text>
          </Section>
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.muted);
    });
  });
});
