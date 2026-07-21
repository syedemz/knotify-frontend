/**
 * Tests for src/components/EmptyState.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { EmptyState } from "@/components/EmptyState";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("EmptyState", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given title only", () => {
    it("then renders the title text", () => {
      renderWithTheme(<EmptyState title="No matches yet" />);
      expect(screen.getByText("No matches yet")).toBeTruthy();
    });

    it("then applies primary text color to the title", () => {
      const { toJSON } = renderWithTheme(
        <EmptyState title="No matches yet" />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.text.primary);
    });
  });

  describe("given description prop", () => {
    it("then renders the description text", () => {
      renderWithTheme(
        <EmptyState title="No matches yet" description="Keep swiping!" />,
      );
      expect(screen.getByText("Keep swiping!")).toBeTruthy();
    });
  });

  describe("given illustration slot", () => {
    it("then renders the illustration node", () => {
      renderWithTheme(
        <EmptyState title="Empty" illustration={<Text>Illustration</Text>} />,
      );
      expect(screen.getByText("Illustration")).toBeTruthy();
    });
  });

  describe("given actionLabel and onAction", () => {
    it("then renders the action button", () => {
      renderWithTheme(
        <EmptyState
          title="No matches"
          actionLabel="Explore profiles"
          onAction={() => {}}
        />,
      );
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("then fires onAction when the button is pressed", () => {
      const onAction = jest.fn();
      renderWithTheme(
        <EmptyState
          title="No matches"
          actionLabel="Explore"
          onAction={onAction}
        />,
      );
      fireEvent.press(screen.getByLabelText("Explore"));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it("then applies primary background to the action button", () => {
      const { toJSON } = renderWithTheme(
        <EmptyState
          title="No matches"
          actionLabel="Explore"
          onAction={() => {}}
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <EmptyState title="No matches" accessibilityLabel="Empty list" />,
      );
      expect(screen.getByLabelText("Empty list")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark primary text color to title", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <EmptyState title="No matches yet" />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.text.primary);
    });
  });
});
