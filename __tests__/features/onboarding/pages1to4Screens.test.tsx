/**
 * Wiring tests for Pages 1-4 screen components.
 *
 * Page01WelcomeScreen: real content (story 2.4) — checks globe icon, title,
 * and CTA buttons.
 * Page02EmailScreen: real content (story 2.5) — checks email + password labels.
 * Pages 3-4: still placeholder screens (story 2.3) — checks WizardHeader +
 * common.notImplemented text.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from "react";
import { render, screen } from "@testing-library/react-native";

// ── Module mocks ──────────────────────────────────────────────────────────────

jest.mock("react-native-safe-area-context", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function(props: any) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, Rct.createElement(RN.View, null, props.children));
    },
    SafeAreaConsumer: function(props: any) { return props.children(INSETS); },
    SafeAreaView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function() { return INSETS; },
    useSafeAreaFrame: function() { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

jest.mock("react-native-gesture-handler", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    GestureHandlerRootView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    Swipeable: RN.View, DrawerLayout: RN.View, State: {}, ScrollView: RN.ScrollView,
    Slider: RN.View, Switch: RN.View, TextInput: RN.View, PanGestureHandler: RN.View,
    TapGestureHandler: RN.View, RawButton: RN.View, BaseButton: RN.View, RectButton: RN.View,
    BorderlessButton: RN.View, LongPressGestureHandler: RN.View, FlatList: RN.FlatList,
    gestureHandlerRootHOC: function(C: any) { return C; }, Directions: {},
    Gesture: {
      Tap: jest.fn(), Pan: jest.fn(), Pinch: jest.fn(), Rotation: jest.fn(),
      Fling: jest.fn(), LongPress: jest.fn(), Exclusive: jest.fn(), Simultaneous: jest.fn(), Race: jest.fn(),
    },
    GestureDetector: RN.View, NativeViewGestureHandler: RN.View, FlingGestureHandler: RN.View,
    ForceTouchGestureHandler: RN.View, PinchGestureHandler: RN.View, RotationGestureHandler: RN.View,
  };
});

jest.mock("@gorhom/bottom-sheet", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    __esModule: true,
    default: Rct.forwardRef(function(props: any, _ref: any) { return Rct.createElement(RN.View, null, props.children); }),
    BottomSheetView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetScrollView: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetFlatList: RN.View, BottomSheetSectionList: RN.View, BottomSheetTextInput: RN.View,
    BottomSheetBackdrop: RN.View, useBottomSheet: jest.fn(), useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function(props: any, _ref: any) { return Rct.createElement(RN.View, null, props.children); }),
    BottomSheetModalProvider: function(props: any) { return Rct.createElement(RN.View, null, props.children); },
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
    Image: function(props: any) {
      return Rct.createElement(RN.Image, {
        source: props.source,
        accessibilityLabel: props.accessibilityLabel ?? "",
        testID: "expo-image",
      });
    },
  };
});

jest.mock("@/state/i18n/LanguageProvider", () => ({
  useLocale: () => ({ locale: "en", setLocale: jest.fn() }),
}));

// ── Mocks required by Page03ConfirmCodeScreen (story 2.6 real content) ───────
jest.mock("@/state/auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "unauthenticated",
    session: null,
    profileComplete: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// ── Mocks required by Page02EmailScreen (story 2.5 real content) ─────────────

jest.mock("@/services/auth/cognitoClient", () => ({
  cognitoClient: {
    signUp: jest.fn(),
    confirmSignUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  },
}));

jest.mock("@/services/auth/secureStorage", () => ({
  SecureStorageKey: {
    accessToken: "auth.accessToken",
    refreshToken: "auth.refreshToken",
    idToken: "auth.idToken",
    onboardingDraft: "onboarding.draft",
    OnboardingBootstrapPassword: "onboarding.bootstrapPassword",
  },
  secureStorage: {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    clearAuthTokens: jest.fn(),
    getAccessToken: jest.fn(),
    setAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setRefreshToken: jest.fn(),
    getIdToken: jest.fn(),
    setIdToken: jest.fn(),
    getOnboardingDraft: jest.fn().mockResolvedValue(null),
    setOnboardingDraft: jest.fn().mockResolvedValue(undefined),
    clearOnboardingDraft: jest.fn(),
  },
}));

jest.mock("@/features/onboarding/hooks/useOnboardingDraft", () => ({
  OnboardingDraftProvider: ({ children }: any) => children,
  useOnboardingDraft: () => ({
    update: jest.fn(),
    advance: jest.fn(),
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: jest.fn(() => ({ fields: {}, lastCheckpoint: null, currentPage: 2 })),
    setSiblings: jest.fn(),
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    isLoading: false,
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from "@/theme";
import { t } from "@/labels";
import { Page01WelcomeScreen } from "@/features/onboarding/screens/Page01WelcomeScreen";
import { Page02EmailScreen } from "@/features/onboarding/screens/Page02EmailScreen";
import { Page03ConfirmCodeScreen } from "@/features/onboarding/screens/Page03ConfirmCodeScreen";
import { Page04GetStartedScreen } from "@/features/onboarding/screens/Page04GetStartedScreen";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Minimal navigation mock — `goBack` and `navigate` used by screens. */
function mockNavigation() {
  return { goBack: jest.fn(), navigate: jest.fn() };
}

/** Minimal route mock — no route params on placeholder screens. */
function mockRoute(name: string) {
  return { key: name, name, params: undefined };
}

function renderScreen(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Component: React.ComponentType<any>,
  routeName: string,
) {
  return render(
    <ThemeProvider>
      <Component
        navigation={mockNavigation()}
        route={mockRoute(routeName)}
      />
    </ThemeProvider>,
  );
}

// ── Page01WelcomeScreen ───────────────────────────────────────────────────────
// Real content shipped in story 2.4. Full wiring tests are in
// Page01WelcomeScreen.test.tsx. These smoke-test the screen in this
// multi-screen fixture.

describe("Page01WelcomeScreen (story 2.4 real content)", () => {
  it("given Page01WelcomeScreen, then it mounts without throwing", () => {
    expect(() => renderScreen(Page01WelcomeScreen, "Page01WelcomeScreen")).not.toThrow();
  });

  it("given Page01WelcomeScreen, then 'Knotify' title is visible", () => {
    renderScreen(Page01WelcomeScreen, "Page01WelcomeScreen");
    expect(screen.getByText(t("onboarding.welcome.title"))).toBeTruthy();
  });

  it("given Page01WelcomeScreen, then globe icon for language toggle is accessible", () => {
    renderScreen(Page01WelcomeScreen, "Page01WelcomeScreen");
    expect(screen.getByLabelText(t("onboarding.language.sheetTitle"))).toBeTruthy();
  });
});

// ── Page02EmailScreen ─────────────────────────────────────────────────────────
// Real content shipped in story 2.5. Full wiring tests are in
// Page02EmailScreen.test.tsx. These smoke-test the screen in this
// multi-screen fixture.

describe("Page02EmailScreen (story 2.5 real content)", () => {
  it("given Page02EmailScreen, then it mounts without throwing", () => {
    expect(() => renderScreen(Page02EmailScreen, "Page02EmailScreen")).not.toThrow();
  });

  it("given Page02EmailScreen, then WizardHeader back button is accessible (hideProgress)", () => {
    renderScreen(Page02EmailScreen, "Page02EmailScreen");
    expect(screen.getByLabelText(t("wizard.header.back"))).toBeTruthy();
  });

  it("given Page02EmailScreen, then Email label is visible", () => {
    renderScreen(Page02EmailScreen, "Page02EmailScreen");
    expect(screen.getByText(t("onboarding.email.emailLabel"))).toBeTruthy();
  });

  it("given Page02EmailScreen, then Password label is visible", () => {
    renderScreen(Page02EmailScreen, "Page02EmailScreen");
    expect(screen.getByText(t("onboarding.email.passwordLabel"))).toBeTruthy();
  });
});

// ── Page03ConfirmCodeScreen ───────────────────────────────────────────────────
// Real content shipped in story 2.6. Full wiring tests are in
// Page03ConfirmCodeScreen.test.tsx. These smoke-test the screen in this
// multi-screen fixture.

describe("Page03ConfirmCodeScreen (story 2.6 real content)", () => {
  it("given Page03ConfirmCodeScreen, then it mounts without throwing", () => {
    expect(() => renderScreen(Page03ConfirmCodeScreen, "Page03ConfirmCodeScreen")).not.toThrow();
  });

  it("given Page03ConfirmCodeScreen, then WizardHeader back button is accessible (hideProgress)", () => {
    renderScreen(Page03ConfirmCodeScreen, "Page03ConfirmCodeScreen");
    expect(screen.getByLabelText(t("wizard.header.back"))).toBeTruthy();
  });

  it("given Page03ConfirmCodeScreen, then confirmCode title is visible", () => {
    renderScreen(Page03ConfirmCodeScreen, "Page03ConfirmCodeScreen");
    expect(screen.getByText(t("onboarding.confirmCode.title"))).toBeTruthy();
  });
});

// ── Page04GetStartedScreen ────────────────────────────────────────────────────
// Real content shipped in story 2.7. Full wiring tests are in
// Page04GetStartedScreen.test.tsx. These smoke-test the screen in this
// multi-screen fixture.

describe("Page04GetStartedScreen (story 2.7 real content)", () => {
  it("given Page04GetStartedScreen, then it mounts without throwing", () => {
    expect(() => renderScreen(Page04GetStartedScreen, "Page04GetStartedScreen")).not.toThrow();
  });

  it("given Page04GetStartedScreen, then WizardHeader back button is accessible (hideProgress)", () => {
    renderScreen(Page04GetStartedScreen, "Page04GetStartedScreen");
    expect(screen.getByLabelText(t("wizard.header.back"))).toBeTruthy();
  });

  it("given Page04GetStartedScreen, then 'Get started' button is visible", () => {
    renderScreen(Page04GetStartedScreen, "Page04GetStartedScreen");
    expect(screen.getByText(t("onboarding.getStarted.button"))).toBeTruthy();
  });

  it("given Page04GetStartedScreen, then banner image is rendered", () => {
    renderScreen(Page04GetStartedScreen, "Page04GetStartedScreen");
    expect(screen.getByTestId("expo-image")).toBeTruthy();
  });
});
