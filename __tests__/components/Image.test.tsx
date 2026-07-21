/**
 * Tests for src/components/Image.tsx
 *
 * expo-image renders natively; mocked with a plain View for test assertions.
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";

jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: ({
      style,
      accessibilityLabel,
    }: {
      style?: object;
      accessibilityLabel?: string;
    }) => (
      <View
        testID="expo-image"
        style={style}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="image"
      />
    ),
  };
});

import { Image } from "@/components/Image";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Image", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props", () => {
    it("then renders the expo-image element", () => {
      renderWithTheme(
        <Image
          source={{ uri: "https://example.com/photo.jpg" }}
          width={320}
          height={200}
          accessibilityLabel="Profile banner"
        />,
      );
      expect(screen.getByTestId("expo-image")).toBeTruthy();
    });

    it("then applies none border radius by default", () => {
      const { toJSON } = renderWithTheme(
        <Image
          source={{ uri: "https://example.com/photo.jpg" }}
          width={320}
          height={200}
          accessibilityLabel="Banner"
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.none));
    });
  });

  describe("given radius='lg'", () => {
    it("then applies lg border radius to the container", () => {
      const { toJSON } = renderWithTheme(
        <Image
          source={{ uri: "https://example.com/photo.jpg" }}
          width={320}
          height={200}
          radius="lg"
          accessibilityLabel="Rounded image"
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.lg));
    });
  });

  describe("given marginBottom='xxl'", () => {
    it("then applies bottom margin from the spacing token", () => {
      const { toJSON } = renderWithTheme(
        <Image
          source={{ uri: "https://example.com/photo.jpg" }}
          width={320}
          height={200}
          marginBottom="xxl"
          accessibilityLabel="Image with margin"
        />,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.spacing.xxl));
    });
  });

  describe("given local require() source", () => {
    it("then renders without crash", () => {
      const { toJSON } = renderWithTheme(
        <Image
          source={1}
          width={100}
          height={100}
          accessibilityLabel="Local image"
        />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <Image
          source={{ uri: "https://example.com/photo.jpg" }}
          width={320}
          height={200}
          accessibilityLabel="Profile banner photo"
        />,
      );
      expect(screen.getByLabelText("Profile banner photo")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders without crash in dark mode", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Image
            source={{ uri: "https://example.com/photo.jpg" }}
            width={320}
            height={200}
            radius="lg"
            accessibilityLabel="Dark mode image"
          />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(String(darkTheme.radii.lg));
    });
  });
});
