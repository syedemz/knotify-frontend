/**
 * Tests for src/components/Toast.tsx
 */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Toast } from "@/components/Toast";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Toast", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("given visible={true} and default tone", () => {
    it("then renders the message text", () => {
      renderWithTheme(
        <Toast visible message="Profile updated!" onDismiss={() => {}} />,
      );
      expect(screen.getByText("Profile updated!")).toBeTruthy();
    });

    it("then has accessibilityRole alert in the output JSON", () => {
      const { toJSON } = renderWithTheme(
        <Toast visible message="Done" onDismiss={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain("alert");
    });

    it("then uses default accessibilityLabel equal to message", () => {
      renderWithTheme(
        <Toast visible message="Saved!" onDismiss={() => {}} />,
      );
      expect(screen.getByLabelText("Saved!")).toBeTruthy();
    });
  });

  describe("given visible={false}", () => {
    it("then does not render the message", () => {
      renderWithTheme(
        <Toast visible={false} message="Hidden message" onDismiss={() => {}} />,
      );
      expect(screen.queryByText("Hidden message")).toBeNull();
    });
  });

  describe("given tone='success'", () => {
    it("then applies success background color", () => {
      const { toJSON } = renderWithTheme(
        <Toast visible message="Done" tone="success" onDismiss={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.status.success);
    });
  });

  describe("given tone='error'", () => {
    it("then applies error background color", () => {
      const { toJSON } = renderWithTheme(
        <Toast visible message="Error!" tone="error" onDismiss={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.status.error);
    });
  });

  describe("given tone='info'", () => {
    it("then applies info background color", () => {
      const { toJSON } = renderWithTheme(
        <Toast visible message="Info" tone="info" onDismiss={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.status.info);
    });
  });

  describe("given auto-dismiss via duration", () => {
    it("then calls onDismiss after the duration elapses", () => {
      const onDismiss = jest.fn();
      renderWithTheme(
        <Toast visible message="Quick" duration={2000} onDismiss={onDismiss} />,
      );
      act(() => jest.advanceTimersByTime(2000));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("then does not call onDismiss before the duration elapses", () => {
      const onDismiss = jest.fn();
      renderWithTheme(
        <Toast visible message="Quick" duration={2000} onDismiss={onDismiss} />,
      );
      act(() => jest.advanceTimersByTime(1999));
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe("given duration={0} (disabled auto-dismiss)", () => {
    it("then does not call onDismiss automatically", () => {
      const onDismiss = jest.fn();
      renderWithTheme(
        <Toast visible message="Sticky" duration={0} onDismiss={onDismiss} />,
      );
      act(() => jest.advanceTimersByTime(10000));
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe("given manual dismiss by tap", () => {
    it("then calls onDismiss when pressed", () => {
      const onDismiss = jest.fn();
      renderWithTheme(
        <Toast visible message="Tap me" onDismiss={onDismiss} />,
      );
      fireEvent.press(screen.getByLabelText("Tap me"));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("given dark theme", () => {
    it("then renders the toast content", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Toast visible message="Dark toast" onDismiss={() => {}} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.elevated);
    });
  });
});
