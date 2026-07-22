/**
 * Tests for src/components/Modal.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Modal } from "@/components/Modal";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Modal", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given visible={true}", () => {
    it("then renders children", () => {
      renderWithTheme(
        <Modal visible onDismiss={() => {}}>
          <Text>Modal content</Text>
        </Modal>,
      );
      expect(screen.getByText("Modal content")).toBeTruthy();
    });

    it("then applies bg.elevated to the surface", () => {
      const { toJSON } = renderWithTheme(
        <Modal visible onDismiss={() => {}}>
          <Text>Content</Text>
        </Modal>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.elevated);
    });

    it("then applies xl border radius to the surface", () => {
      const { toJSON } = renderWithTheme(
        <Modal visible onDismiss={() => {}}>
          <Text>Content</Text>
        </Modal>,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.xl));
    });
  });

  describe("given visible={false}", () => {
    it("then does not render children", () => {
      renderWithTheme(
        <Modal visible={false} onDismiss={() => {}}>
          <Text>Hidden content</Text>
        </Modal>,
      );
      expect(screen.queryByText("Hidden content")).toBeNull();
    });
  });

  describe("given onDismiss callback", () => {
    it("then fires when backdrop Close dialog is pressed", () => {
      const onDismiss = jest.fn();
      renderWithTheme(
        <Modal visible onDismiss={onDismiss}>
          <Text>Content</Text>
        </Modal>,
      );
      fireEvent.press(screen.getByLabelText("Close dialog"));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the custom label", () => {
      renderWithTheme(
        <Modal visible onDismiss={() => {}} accessibilityLabel="Confirm modal">
          <Text>Content</Text>
        </Modal>,
      );
      // Multiple elements may have the label; verify at least one exists
      expect(screen.getAllByLabelText("Confirm modal").length).toBeGreaterThan(0);
    });
  });

  describe("given dark theme", () => {
    it("then applies dark bg.elevated color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Modal visible onDismiss={() => {}}>
            <Text>Dark mode</Text>
          </Modal>
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.elevated);
    });
  });
});
