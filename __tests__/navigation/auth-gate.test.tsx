/**
 * Auth-gate tests for `RootNavigator` (story 1.9, acceptance criterion §6.2).
 *
 * Strategy: mock the three sub-navigators (AuthStack, OnboardingStack, AppTabs)
 * so they render identifiable text nodes. `RootNavigator` itself is NOT mocked —
 * the tests verify its auth-gate branching logic (§6.2) by inspecting which
 * sub-navigator the component mounts based on the `useAuth()` state.
 *
 * Covered cases:
 * (a) `status === 'unauthenticated'` → `AuthStack` rendered; `AppTabs` absent.
 * (b) `status === 'authenticated'` + `profileComplete === false` →
 *     `OnboardingStack` rendered; `AuthStack` and `AppTabs` absent.
 * (c) `status === 'authenticated'` + `profileComplete === true` →
 *     `AppTabs` rendered; `AuthStack` absent.
 * (d) `status === 'loading'` → loading splash; neither sub-navigator visible.
 */

import React from "react";
import { render } from "@testing-library/react-native";

// ── Module mocks ─────────────────────────────────────────────────────────────
// NOTE: All jest.mock() calls are hoisted by Jest. No TypeScript type
// annotations inside factory bodies (Babel rejects out-of-scope identifiers).

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// Mock the three sub-navigators with minimal stub components that render
// identifiable text. This avoids pulling in react-native-screens,
// react-native-safe-area-context, and the gesture-handler native chain.
jest.mock("@/navigation/AuthStack", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    AuthStack: function MockAuthStack() {
      return Rct.createElement(RN.Text, { testID: "auth-stack" }, "AUTH_STACK");
    },
  };
});

jest.mock("@/navigation/OnboardingStack", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    OnboardingStack: function MockOnboardingStack() {
      return Rct.createElement(RN.Text, { testID: "onboarding-stack" }, "Page01");
    },
  };
});

jest.mock("@/navigation/AppTabs", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    AppTabs: function MockAppTabs() {
      return Rct.createElement(RN.Text, { testID: "app-tabs" }, "Discover");
    },
  };
});

// Mock react-native-gesture-handler and @gorhom/bottom-sheet to prevent the
// react-native-renderer version mismatch when the components barrel is
// transitively imported (via LoadingState in RootNavigator).
jest.mock("react-native-gesture-handler", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    GestureHandlerRootView: function(props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    Swipeable: RN.View,
    DrawerLayout: RN.View,
    State: {},
    ScrollView: RN.ScrollView,
    Slider: RN.View,
    Switch: RN.View,
    TextInput: RN.View,
    ToolbarAndroid: RN.View,
    ViewPagerAndroid: RN.View,
    DrawerLayoutAndroid: RN.View,
    WebView: RN.View,
    NativeViewGestureHandler: RN.View,
    TapGestureHandler: RN.View,
    FlingGestureHandler: RN.View,
    ForceTouchGestureHandler: RN.View,
    LongPressGestureHandler: RN.View,
    PanGestureHandler: RN.View,
    PinchGestureHandler: RN.View,
    RotationGestureHandler: RN.View,
    RawButton: RN.View,
    BaseButton: RN.View,
    RectButton: RN.View,
    BorderlessButton: RN.View,
    FlatList: RN.FlatList,
    gestureHandlerRootHOC: function(Component: any) { return Component; },
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
  };
});

jest.mock("@gorhom/bottom-sheet", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    __esModule: true,
    default: Rct.forwardRef(function MockBottomSheet(props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetView: function(props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    BottomSheetScrollView: function(props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    BottomSheetFlatList: RN.View,
    BottomSheetSectionList: RN.View,
    BottomSheetTextInput: RN.View,
    BottomSheetBackdrop: RN.View,
    useBottomSheet: jest.fn(),
    useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function MockBottomSheetModal(props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetModalProvider: function(props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
  };
});

jest.mock("react-native-reanimated", () => {
  const mockReanimated = require("react-native-reanimated/mock");
  mockReanimated.default.call = jest.fn();
  return mockReanimated;
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// Control auth state — mutated per test in beforeEach.
const mockAuthState = {
  status: "unauthenticated" as "loading" | "unauthenticated" | "authenticated",
  profileComplete: false,
  session: null as object | null,
};

jest.mock("@/state/auth/AuthProvider", () => ({
  useAuth: () => ({
    status: mockAuthState.status,
    profileComplete: mockAuthState.profileComplete,
    session: mockAuthState.session,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// ── Imports under test (after mocks) ─────────────────────────────────────────

import { RootNavigator } from "@/navigation/RootNavigator";
import { t } from "@/labels";
import { ThemeProvider } from "@/theme";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Renders `RootNavigator` inside `ThemeProvider`.
 *
 * The sub-navigators are mocked above; `RootNavigator`'s branching logic is
 * what is under test. No `NavigationContainer` is needed because the mocked
 * sub-navigators contain no real React Navigation code.
 * `ThemeProvider` is real because `LoadingState` (rendered on 'loading')
 * calls `useTheme()`.
 */
function renderRoot() {
  return render(
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>,
  );
}

// ── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  mockAuthState.status = "unauthenticated";
  mockAuthState.profileComplete = false;
  mockAuthState.session = null;
});

// ── (a) unauthenticated → AuthStack ──────────────────────────────────────────

describe("given status === 'unauthenticated'", () => {
  it("when RootNavigator renders, then auth.login.title label key maps to a string that can be queried", () => {
    // Sanity-check: t('auth.login.title') returns a non-empty string.
    expect(t("auth.login.title")).toBeTruthy();
  });

  it("when RootNavigator renders, then AuthStack is mounted (queryByText AUTH_STACK returns a node)", () => {
    const { queryByText } = renderRoot();

    // The MockAuthStack stub renders the text 'AUTH_STACK'.
    expect(queryByText("AUTH_STACK")).not.toBeNull();
  });

  it("when RootNavigator renders, then AppTabs is absent (Discover tab text not present)", () => {
    const { queryByText } = renderRoot();

    // The MockAppTabs stub renders 'Discover'; it must not appear.
    expect(queryByText(t("nav.tabs.discover"))).toBeNull();
  });

  it("when RootNavigator renders, then OnboardingStack is absent", () => {
    const { queryByText } = renderRoot();

    expect(queryByText("Page01")).toBeNull();
  });
});

// ── (b) authenticated + !profileComplete → OnboardingStack ───────────────────

describe("given status === 'authenticated' and profileComplete === false", () => {
  beforeEach(() => {
    mockAuthState.status = "authenticated";
    mockAuthState.profileComplete = false;
  });

  it("when RootNavigator renders, then OnboardingStack is mounted (Page01 text visible)", () => {
    const { queryByText } = renderRoot();

    // The MockOnboardingStack stub renders 'Page01'.
    expect(queryByText("Page01")).not.toBeNull();
  });

  it("when RootNavigator renders, then AuthStack is absent (AUTH_STACK text not present)", () => {
    const { queryByText } = renderRoot();

    expect(queryByText("AUTH_STACK")).toBeNull();
  });

  it("when RootNavigator renders, then AppTabs is absent (nav.tabs.discover not present)", () => {
    const { queryByText } = renderRoot();

    // The MockAppTabs stub renders 'Discover' (the value of t('nav.tabs.discover')).
    expect(queryByText(t("nav.tabs.discover"))).toBeNull();
  });
});

// ── (c) authenticated + profileComplete → AppTabs ────────────────────────────

describe("given status === 'authenticated' and profileComplete === true", () => {
  beforeEach(() => {
    mockAuthState.status = "authenticated";
    mockAuthState.profileComplete = true;
  });

  it("when RootNavigator renders, then AppTabs is mounted (nav.tabs.discover text visible)", () => {
    const { queryByText } = renderRoot();

    // The MockAppTabs stub renders 'Discover' which equals t('nav.tabs.discover').
    expect(queryByText(t("nav.tabs.discover"))).not.toBeNull();
  });

  it("when RootNavigator renders, then AuthStack is absent", () => {
    const { queryByText } = renderRoot();

    expect(queryByText("AUTH_STACK")).toBeNull();
  });

  it("when RootNavigator renders, then OnboardingStack is absent", () => {
    const { queryByText } = renderRoot();

    expect(queryByText("Page01")).toBeNull();
  });
});

// ── (d) loading → splash ──────────────────────────────────────────────────────

describe("given status === 'loading'", () => {
  beforeEach(() => {
    mockAuthState.status = "loading";
  });

  it("when RootNavigator renders, then no sub-navigator is mounted", () => {
    const { queryByText } = renderRoot();

    expect(queryByText("AUTH_STACK")).toBeNull();
    expect(queryByText("Page01")).toBeNull();
    expect(queryByText(t("nav.tabs.discover"))).toBeNull();
  });

  it("when RootNavigator renders, then the loading label is visible", () => {
    const { queryByText } = renderRoot();

    // LoadingState renders the common.loading label.
    expect(queryByText(t("common.loading"))).not.toBeNull();
  });
});
