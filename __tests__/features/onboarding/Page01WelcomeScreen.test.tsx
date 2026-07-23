/**
 * Wiring tests for Page01WelcomeScreen (story 2.4).
 *
 * Covers:
 * - Correct label rendering under both 'en' and 'ur' locales.
 * - Tapping "English" and "Urdu" rows dispatch `setLocale` with the correct arg.
 * - The language sheet does NOT render its own Alert/confirmation UI — the RTL-reload
 *   flow is delegated to LanguageProvider via the mocked `useLocale` hook.
 * - Tapping "Continue with email" invokes `navigation.navigate('Page02EmailScreen')`.
 * - Tapping "Continue with Google" does not invoke navigation or any side effect.
 *
 * LanguageProvider is NOT mounted — `useLocale` is a jest mock per the AC.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";
import { Alert } from "react-native";

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("react-native-safe-area-context", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(
        ctx.Provider,
        { value: INSETS },
        Rct.createElement(RN.View, null, props.children),
      );
    },
    SafeAreaConsumer: function (props: any) {
      return props.children(INSETS);
    },
    SafeAreaView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () {
      return INSETS;
    },
    useSafeAreaFrame: function () {
      return { x: 0, y: 0, width: 375, height: 812 };
    },
    initialWindowMetrics: {
      insets: INSETS,
      frame: { x: 0, y: 0, width: 375, height: 812 },
    },
  };
});

jest.mock("react-native-gesture-handler", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    GestureHandlerRootView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    Swipeable: RN.View,
    DrawerLayout: RN.View,
    State: {},
    ScrollView: RN.ScrollView,
    Slider: RN.View,
    Switch: RN.View,
    TextInput: RN.View,
    PanGestureHandler: RN.View,
    TapGestureHandler: RN.View,
    RawButton: RN.View,
    BaseButton: RN.View,
    RectButton: RN.View,
    BorderlessButton: RN.View,
    LongPressGestureHandler: RN.View,
    FlatList: RN.FlatList,
    gestureHandlerRootHOC: function (C: any) {
      return C;
    },
    Directions: {},
    Gesture: {
      Tap: jest.fn(),
      Pan: jest.fn(),
      Pinch: jest.fn(),
      Rotation: jest.fn(),
      Fling: jest.fn(),
      LongPress: jest.fn(),
      Exclusive: jest.fn(),
      Simultaneous: jest.fn(),
      Race: jest.fn(),
    },
    GestureDetector: RN.View,
    NativeViewGestureHandler: RN.View,
    FlingGestureHandler: RN.View,
    ForceTouchGestureHandler: RN.View,
    PinchGestureHandler: RN.View,
    RotationGestureHandler: RN.View,
  };
});

jest.mock("@gorhom/bottom-sheet", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    __esModule: true,
    default: Rct.forwardRef(function (props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    BottomSheetScrollView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    BottomSheetFlatList: RN.View,
    BottomSheetSectionList: RN.View,
    BottomSheetTextInput: RN.View,
    BottomSheetBackdrop: RN.View,
    useBottomSheet: jest.fn(),
    useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function (props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetModalProvider: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
  };
});

jest.mock("react-native-reanimated", () => {
  const m = require("react-native-reanimated/mock");
  m.default.call = jest.fn();
  return m;
});

jest.mock("expo-image", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    Image: function (props: any) {
      return Rct.createElement(RN.Image, {
        source: props.source,
        testID: props.testID ?? "expo-image",
        accessibilityLabel: props.accessibilityLabel,
      });
    },
  };
});

// ── useLocale mock — DO NOT mount LanguageProvider under test ─────────────────

const mockSetLocale = jest.fn();

jest.mock("@/state/i18n/LanguageProvider", () => ({
  useLocale: () => ({
    locale: "en",
    setLocale: mockSetLocale,
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from "@/theme";
import { setActiveLocale } from "@/labels";
import { Page01WelcomeScreen } from "@/features/onboarding/screens/Page01WelcomeScreen";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

function mockRoute() {
  return { key: "Page01WelcomeScreen", name: "Page01WelcomeScreen", params: undefined };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        <Page01WelcomeScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Reset to English for each test.
  setActiveLocale("en");
});

// ── Label rendering (English) ─────────────────────────────────────────────────

describe("Page01WelcomeScreen — English locale", () => {
  it("given English locale, then renders 'Knotify' title", () => {
    renderScreen();
    expect(screen.getByText("Knotify")).toBeTruthy();
  });

  it("given English locale, then renders 'Continue with email' button", () => {
    renderScreen();
    expect(screen.getByText("Continue with email")).toBeTruthy();
  });

  it("given English locale, then renders 'Continue with Google' button", () => {
    renderScreen();
    expect(screen.getByText("Continue with Google")).toBeTruthy();
  });

  it("given English locale, then renders globe icon button for language toggle", () => {
    renderScreen();
    expect(screen.getByLabelText("Language")).toBeTruthy();
  });
});

// ── Label rendering (Urdu) ────────────────────────────────────────────────────

describe("Page01WelcomeScreen — Urdu locale", () => {
  beforeEach(() => {
    setActiveLocale("ur");
  });

  afterEach(() => {
    setActiveLocale("en");
  });

  it("given Urdu locale, then 'Continue with email' renders in Urdu", () => {
    renderScreen();
    expect(screen.getByText("ای میل سے جاری رکھیں")).toBeTruthy();
  });

  it("given Urdu locale, then 'Continue with Google' renders in Urdu", () => {
    renderScreen();
    expect(screen.getByText("گوگل سے جاری رکھیں")).toBeTruthy();
  });
});

// ── Language sheet behaviour ──────────────────────────────────────────────────

describe("Page01WelcomeScreen — language sheet", () => {
  it("given globe icon tapped, then language sheet opens showing 'English' and 'Urdu' rows", async () => {
    renderScreen();
    const globeButton = screen.getByLabelText("Language");
    await act(async () => {
      fireEvent.press(globeButton);
    });
    expect(screen.getByText("English")).toBeTruthy();
    expect(screen.getByText("Urdu")).toBeTruthy();
  });

  it("given 'English' row tapped, then setLocale('en') is called", async () => {
    renderScreen();
    const globeButton = screen.getByLabelText("Language");
    await act(async () => {
      fireEvent.press(globeButton);
    });
    const englishRow = screen.getByText("English");
    await act(async () => {
      fireEvent.press(englishRow);
    });
    expect(mockSetLocale).toHaveBeenCalledTimes(1);
    expect(mockSetLocale).toHaveBeenCalledWith("en");
  });

  it("given 'Urdu' row tapped, then setLocale('ur') is called", async () => {
    renderScreen();
    const globeButton = screen.getByLabelText("Language");
    await act(async () => {
      fireEvent.press(globeButton);
    });
    const urduRow = screen.getByText("Urdu");
    await act(async () => {
      fireEvent.press(urduRow);
    });
    expect(mockSetLocale).toHaveBeenCalledTimes(1);
    expect(mockSetLocale).toHaveBeenCalledWith("ur");
  });

  it("given language row tapped, then the sheet closes (no duplicate options visible)", async () => {
    renderScreen();
    const globeButton = screen.getByLabelText("Language");
    await act(async () => {
      fireEvent.press(globeButton);
    });
    const englishRow = screen.getByText("English");
    await act(async () => {
      fireEvent.press(englishRow);
    });
    // After closing the sheet, the option rows are no longer rendered.
    expect(screen.queryByText("English")).toBeNull();
    expect(screen.queryByText("Urdu")).toBeNull();
  });

  it("given language sheet, then the sheet itself renders no Alert or confirmation dialog", async () => {
    // Assert that Alert.alert is NOT called by the sheet — the RTL-reload
    // flow belongs exclusively to LanguageProvider.setLocale(). The sheet
    // delegates entirely to the mocked setLocale.
    const alertSpy = jest.spyOn(Alert, "alert");
    renderScreen();
    const globeButton = screen.getByLabelText("Language");
    await act(async () => {
      fireEvent.press(globeButton);
    });
    const urduRow = screen.getByText("Urdu");
    await act(async () => {
      fireEvent.press(urduRow);
    });
    expect(alertSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("given language sheet title shown, then it reads 'Language'", async () => {
    renderScreen();
    const globeButton = screen.getByLabelText("Language");
    await act(async () => {
      fireEvent.press(globeButton);
    });
    expect(screen.getByText("Language")).toBeTruthy();
  });
});

// ── Navigation ────────────────────────────────────────────────────────────────

describe("Page01WelcomeScreen — navigation", () => {
  it("given 'Continue with email' tapped, then navigate('Page02EmailScreen') is called", async () => {
    const nav = mockNavigation();
    renderScreen(nav);
    const emailBtn = screen.getByText("Continue with email");
    await act(async () => {
      fireEvent.press(emailBtn);
    });
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith("Page02EmailScreen");
  });

  it("given 'Continue with Google' tapped, then navigate is NOT called", async () => {
    const nav = mockNavigation();
    renderScreen(nav);
    const googleBtn = screen.getByText("Continue with Google");
    await act(async () => {
      fireEvent.press(googleBtn);
    });
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it("given 'Continue with Google' tapped, then no side effects occur (no throw)", async () => {
    const nav = mockNavigation();
    expect(() => {
      renderScreen(nav);
      const googleBtn = screen.getByText("Continue with Google");
      fireEvent.press(googleBtn);
    }).not.toThrow();
  });
});
