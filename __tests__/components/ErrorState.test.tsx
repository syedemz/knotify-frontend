/**
 * Tests for src/components/ErrorState.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { ErrorState } from "@/components/ErrorState";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("ErrorState", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props", () => {
    it("then renders default title text", () => {
      renderWithTheme(<ErrorState />);
      expect(screen.getByText("Something went wrong")).toBeTruthy();
    });

    it("then applies status.error color to the title", () => {
      const { toJSON } = renderWithTheme(<ErrorState />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.status.error);
    });
  });

  describe("given custom title", () => {
    it("then renders the custom title", () => {
      renderWithTheme(<ErrorState title="Connection lost" />);
      expect(screen.getByText("Connection lost")).toBeTruthy();
    });
  });

  describe("given description prop", () => {
    it("then renders the description text", () => {
      renderWithTheme(
        <ErrorState description="Check your internet connection." />,
      );
      expect(screen.getByText("Check your internet connection.")).toBeTruthy();
    });
  });

  describe("given onRetry callback", () => {
    it("then renders the retry button", () => {
      renderWithTheme(<ErrorState onRetry={() => {}} />);
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("then uses default retryLabel 'Try again'", () => {
      renderWithTheme(<ErrorState onRetry={() => {}} />);
      expect(screen.getByLabelText("Try again")).toBeTruthy();
    });

    it("then fires onRetry when pressed", () => {
      const onRetry = jest.fn();
      renderWithTheme(<ErrorState onRetry={onRetry} />);
      fireEvent.press(screen.getByLabelText("Try again"));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("then applies accent.primary to the retry button", () => {
      const { toJSON } = renderWithTheme(<ErrorState onRetry={() => {}} />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });
  });

  describe("given custom retryLabel", () => {
    it("then renders the custom label", () => {
      renderWithTheme(
        <ErrorState retryLabel="Reload" onRetry={() => {}} />,
      );
      expect(screen.getByLabelText("Reload")).toBeTruthy();
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <ErrorState accessibilityLabel="Error container" />,
      );
      expect(screen.getByLabelText("Error container")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark status.error color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <ErrorState />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.status.error);
    });
  });
});
