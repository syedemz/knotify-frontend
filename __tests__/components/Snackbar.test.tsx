/**
 * Tests for src/components/Snackbar.tsx
 */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Snackbar } from "@/components/Snackbar";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Snackbar", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe("given visible={true}", () => {
    it("then renders the message text", () => {
      renderWithTheme(
        <Snackbar visible message="Message deleted" onDismiss={() => {}} />,
      );
      expect(screen.getByText("Message deleted")).toBeTruthy();
    });

    it("then has accessibilityRole alert in the output JSON", () => {
      const { toJSON } = renderWithTheme(
        <Snackbar visible message="Done" onDismiss={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain("alert");
    });

    it("then applies bg.elevated background", () => {
      const { toJSON } = renderWithTheme(
        <Snackbar visible message="Done" onDismiss={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.elevated);
    });
  });

  describe("given visible={false}", () => {
    it("then does not render the message", () => {
      renderWithTheme(
        <Snackbar visible={false} message="Hidden" onDismiss={() => {}} />,
      );
      expect(screen.queryByText("Hidden")).toBeNull();
    });
  });

  describe("given actionLabel and onAction", () => {
    it("then renders the action button", () => {
      renderWithTheme(
        <Snackbar
          visible
          message="Message deleted"
          actionLabel="Undo"
          onAction={() => {}}
          onDismiss={() => {}}
        />,
      );
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("then fires onAction when the action is pressed", () => {
      const onAction = jest.fn();
      renderWithTheme(
        <Snackbar
          visible
          message="Deleted"
          actionLabel="Undo"
          onAction={onAction}
          onDismiss={() => {}}
        />,
      );
      fireEvent.press(screen.getByLabelText("Undo"));
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it("then uses accent.primary color for the action label", () => {
      const { toJSON } = renderWithTheme(
        <Snackbar
          visible
          message="Deleted"
          actionLabel="Undo"
          onAction={() => {}}
          onDismiss={() => {}}
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });
  });

  describe("given auto-dismiss via duration", () => {
    it("then calls onDismiss after the duration elapses", () => {
      const onDismiss = jest.fn();
      renderWithTheme(
        <Snackbar visible message="Done" duration={4000} onDismiss={onDismiss} />,
      );
      act(() => jest.advanceTimersByTime(4000));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("given duration={0}", () => {
    it("then does not auto-dismiss", () => {
      const onDismiss = jest.fn();
      renderWithTheme(
        <Snackbar visible message="Sticky" duration={0} onDismiss={onDismiss} />,
      );
      act(() => jest.advanceTimersByTime(10000));
      expect(onDismiss).not.toHaveBeenCalled();
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the custom label", () => {
      renderWithTheme(
        <Snackbar
          visible
          message="Done"
          onDismiss={() => {}}
          accessibilityLabel="Deletion notification"
        />,
      );
      expect(screen.getByLabelText("Deletion notification")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark bg.elevated background", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Snackbar visible message="Dark mode" onDismiss={() => {}} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.elevated);
    });
  });
});
