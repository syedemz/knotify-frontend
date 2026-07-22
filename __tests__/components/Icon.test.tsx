/**
 * Tests for src/components/Icon.tsx
 *
 * lucide-react-native renders via react-native-svg which requires native
 * binaries. We mock it with a plain View so assertions stay in pure JS.
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { View } from "react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import type { LucideIcon } from "lucide-react-native";
import { Icon } from "@/components/Icon";

// Jest mock function that acts as a LucideIcon render function.
// Kept as a plain jest.fn() so we can inspect `.mock.calls`.
// Cast through unknown → LucideIcon so the Icon component accepts it.
const mockHeartFn = jest.fn(
  ({
    size,
    color,
    strokeWidth,
  }: {
    size: number;
    color: string;
    strokeWidth: number;
  }) => (
    <View
      testID="lucide-icon"
      accessibilityLabel={`icon-${size}-${color}-${strokeWidth}`}
    />
  ),
);
const MockHeart = (mockHeartFn as unknown) as LucideIcon;

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Icon", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockHeartFn.mockClear();
  });

  describe("given default props", () => {
    it("then renders the icon element", () => {
      renderWithTheme(
        <Icon icon={MockHeart} accessibilityLabel="Heart icon" />,
      );
      expect(screen.getByTestId("lucide-icon")).toBeTruthy();
    });

    it("then passes size=24 (lg preset) to the icon", () => {
      renderWithTheme(
        <Icon icon={MockHeart} accessibilityLabel="Heart" />,
      );
      expect(mockHeartFn.mock.calls[0]?.[0].size).toBe(24);
    });

    it("then passes text.primary color to the icon in light theme", () => {
      renderWithTheme(
        <Icon icon={MockHeart} color="primary" accessibilityLabel="Heart" />,
      );
      expect(mockHeartFn.mock.calls[0]?.[0].color).toBe(
        lightTheme.colors.text.primary,
      );
    });

    it("then passes strokeWidth=1.5 by default", () => {
      renderWithTheme(
        <Icon icon={MockHeart} accessibilityLabel="Heart" />,
      );
      expect(mockHeartFn.mock.calls[0]?.[0].strokeWidth).toBe(1.5);
    });
  });

  describe("given size='sm'", () => {
    it("then passes size=16 to the icon", () => {
      renderWithTheme(
        <Icon icon={MockHeart} size="sm" accessibilityLabel="Small heart" />,
      );
      expect(mockHeartFn.mock.calls[0]?.[0].size).toBe(16);
    });
  });

  describe("given size='md'", () => {
    it("then passes size=20 to the icon", () => {
      renderWithTheme(
        <Icon icon={MockHeart} size="md" accessibilityLabel="Medium heart" />,
      );
      expect(mockHeartFn.mock.calls[0]?.[0].size).toBe(20);
    });
  });

  describe("given size='xl'", () => {
    it("then passes size=32 to the icon", () => {
      renderWithTheme(
        <Icon icon={MockHeart} size="xl" accessibilityLabel="Large heart" />,
      );
      expect(mockHeartFn.mock.calls[0]?.[0].size).toBe(32);
    });
  });

  describe("given color='tertiary' (text color)", () => {
    it("then resolves to text.tertiary from the theme", () => {
      renderWithTheme(
        <Icon icon={MockHeart} color="tertiary" accessibilityLabel="Tertiary icon" />,
      );
      expect(mockHeartFn.mock.calls[0]?.[0].color).toBe(
        lightTheme.colors.text.tertiary,
      );
    });
  });

  describe("given custom strokeWidth", () => {
    it("then passes the custom strokeWidth to the icon", () => {
      renderWithTheme(
        <Icon icon={MockHeart} strokeWidth={2} accessibilityLabel="Bold icon" />,
      );
      expect(mockHeartFn.mock.calls[0]?.[0].strokeWidth).toBe(2);
    });
  });

  describe("given no accessibilityLabel (decorative)", () => {
    it("then renders without crash", () => {
      const { toJSON } = renderWithTheme(
        <Icon icon={MockHeart} />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <Icon icon={MockHeart} accessibilityLabel="Liked" />,
      );
      expect(screen.getByLabelText("Liked")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then passes dark text.primary color to the icon", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      render(
        <ThemeProvider>
          <Icon icon={MockHeart} color="primary" accessibilityLabel="Heart" />
        </ThemeProvider>,
      );
      expect(mockHeartFn.mock.calls[0]?.[0].color).toBe(
        darkTheme.colors.text.primary,
      );
    });
  });
});
