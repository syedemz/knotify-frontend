/**
 * Tests for src/components/BottomSheet.tsx
 *
 * @gorhom/bottom-sheet depends on react-native-reanimated and
 * react-native-gesture-handler which require native binaries not available in
 * Jest. The module is mocked at the module level so we can assert the
 * rendered output without the native bridge.
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";

// Mock @gorhom/bottom-sheet before importing the component
jest.mock("@gorhom/bottom-sheet", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockBottomSheet = React.forwardRef(
    (
      props: {
        children?: React.ReactNode;
        index: number;
        backgroundStyle?: object;
        handleIndicatorStyle?: object;
      },
      _ref: React.Ref<unknown>,
    ) => {
      return (
        <View testID="bottom-sheet" style={props.backgroundStyle}>
          {props.children}
        </View>
      );
    },
  );
  MockBottomSheet.displayName = "MockBottomSheet";

  const MockBottomSheetView = ({
    children,
    style,
    accessibilityLabel,
  }: {
    children?: React.ReactNode;
    style?: object;
    accessibilityLabel?: string;
  }) => (
    <View
      testID="bottom-sheet-view"
      style={style}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );

  return {
    __esModule: true,
    default: MockBottomSheet,
    BottomSheetView: MockBottomSheetView,
  };
});

import { BottomSheet } from "@/components/BottomSheet";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("BottomSheet", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given visible={true}", () => {
    it("then renders children", () => {
      renderWithTheme(
        <BottomSheet visible onDismiss={() => {}}>
          <Text>Sheet content</Text>
        </BottomSheet>,
      );
      expect(screen.getByText("Sheet content")).toBeTruthy();
    });

    it("then renders the gorhom sheet container", () => {
      renderWithTheme(
        <BottomSheet visible onDismiss={() => {}}>
          <Text>Content</Text>
        </BottomSheet>,
      );
      expect(screen.getByTestId("bottom-sheet")).toBeTruthy();
    });

    it("then applies bg.elevated background style to the sheet", () => {
      const { toJSON } = renderWithTheme(
        <BottomSheet visible onDismiss={() => {}}>
          <Text>Content</Text>
        </BottomSheet>,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.elevated);
    });

    it("then applies xl border radius to the top corners", () => {
      const { toJSON } = renderWithTheme(
        <BottomSheet visible onDismiss={() => {}}>
          <Text>Content</Text>
        </BottomSheet>,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.xl));
    });
  });

  describe("given visible={false}", () => {
    it("then does not render children", () => {
      renderWithTheme(
        <BottomSheet visible={false} onDismiss={() => {}}>
          <Text>Hidden</Text>
        </BottomSheet>,
      );
      expect(screen.queryByText("Hidden")).toBeNull();
    });
  });

  describe("given accessibilityLabel", () => {
    it("then includes the label in the rendered output JSON", () => {
      const { toJSON } = renderWithTheme(
        <BottomSheet
          visible
          onDismiss={() => {}}
          accessibilityLabel="Filter options sheet"
        >
          <Text>Filters</Text>
        </BottomSheet>,
      );
      expect(JSON.stringify(toJSON())).toContain("Filter options sheet");
    });
  });

  describe("given showHandle={false}", () => {
    it("then renders without crash", () => {
      const { toJSON } = renderWithTheme(
        <BottomSheet visible onDismiss={() => {}} showHandle={false}>
          <Text>No handle</Text>
        </BottomSheet>,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark bg.elevated background", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <BottomSheet visible onDismiss={() => {}}>
            <Text>Dark mode</Text>
          </BottomSheet>
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.elevated);
    });
  });
});
