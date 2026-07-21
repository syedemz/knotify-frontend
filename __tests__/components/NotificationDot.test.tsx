/**
 * Tests for src/components/NotificationDot.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { NotificationDot } from "@/components/NotificationDot";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("NotificationDot", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props (visible=true, size=sm)", () => {
    it("then renders without crash", () => {
      const { toJSON } = renderWithTheme(<NotificationDot />);
      expect(toJSON()).toBeTruthy();
    });

    it("then applies notification.dot background color in light theme", () => {
      const { toJSON } = renderWithTheme(<NotificationDot />);
      expect(JSON.stringify(toJSON())).toContain(
        lightTheme.colors.notification.dot,
      );
    });
  });

  describe("given visible={false}", () => {
    it("then renders nothing", () => {
      const { toJSON } = renderWithTheme(<NotificationDot visible={false} />);
      expect(toJSON()).toBeNull();
    });
  });

  describe("given size='md'", () => {
    it("then renders without crash at md size", () => {
      const { toJSON } = renderWithTheme(<NotificationDot size="md" />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <NotificationDot accessibilityLabel="3 unread messages" />,
      );
      expect(screen.getByLabelText("3 unread messages")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark notification.dot color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <NotificationDot />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(
        darkTheme.colors.notification.dot,
      );
    });
  });
});
