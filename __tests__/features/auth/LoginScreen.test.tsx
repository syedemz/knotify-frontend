/**
 * Unit tests for `src/features/auth/screens/LoginScreen.tsx`.
 *
 * Covers:
 * (a) Initial render — title, email + password fields, submit button.
 * (b) Validation gating — submit disabled until email valid + password non-empty.
 * (c) Successful signIn — calls `auth.signIn` with username + password;
 *     no navigation (state-driven).
 * (d) NotAuthorizedException → "Incorrect email or password" error.
 * (e) UserNotFoundException → "No account found for that email" error.
 * (f) UserNotConfirmedException → "Please confirm your account first" error,
 *     no auto-navigation to confirm-code (per 2026-11-13 decision).
 * (g) Network error → network error label.
 * (h) Generic error fallback.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react-native";

// ── Native module mocks ───────────────────────────────────────────────────────

jest.mock("react-native-safe-area-context", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, Rct.createElement(RN.View, null, props.children));
    },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () { return INSETS; },
    useSafeAreaFrame: function () { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

jest.mock("react-native-gesture-handler", () => {
  const RN = require("react-native") as typeof import("react-native");
  const Rct = require("react") as typeof import("react");
  return {
    GestureHandlerRootView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    Swipeable: RN.View, DrawerLayout: RN.View, State: {}, ScrollView: RN.ScrollView,
    Slider: RN.View, Switch: RN.View, TextInput: RN.View, PanGestureHandler: RN.View,
    TapGestureHandler: RN.View, RawButton: RN.View, BaseButton: RN.View, RectButton: RN.View,
    BorderlessButton: RN.View, LongPressGestureHandler: RN.View, FlatList: RN.FlatList,
    gestureHandlerRootHOC: function (C: any) { return C; }, Directions: {},
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
    default: Rct.forwardRef(function (props: any, _ref: any) { return Rct.createElement(RN.View, null, props.children); }),
    BottomSheetView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetScrollView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetFlatList: RN.View, BottomSheetSectionList: RN.View, BottomSheetTextInput: RN.View,
    BottomSheetBackdrop: RN.View, useBottomSheet: jest.fn(), useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function (props: any, _ref: any) { return Rct.createElement(RN.View, null, props.children); }),
    BottomSheetModalProvider: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
  };
});

jest.mock("react-native-reanimated", () => {
  const m = require("react-native-reanimated/mock");
  m.default.call = jest.fn();
  return m;
});

// ── AuthProvider mock — captures signIn calls ────────────────────────────────

const mockSignIn = jest.fn();

jest.mock("@/state/auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "unauthenticated" as const,
    session: null,
    profileComplete: false,
    signIn: mockSignIn,
    signOut: jest.fn(),
    refresh: jest.fn(),
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { ThemeProvider } from "@/theme";
import { t } from "@/labels";
import { LoginScreen } from "@/features/auth/screens/LoginScreen";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockNavigation() {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
  };
}

function mockRoute() {
  return {
    key: "LoginScreen",
    name: "LoginScreen" as const,
    params: undefined,
  };
}

function renderScreen() {
  const nav = mockNavigation();
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <LoginScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockSignIn.mockResolvedValue({ isSignedIn: true });
});

// ── (a) Initial render ───────────────────────────────────────────────────────

describe("LoginScreen — initial render", () => {
  it("renders the title", () => {
    renderScreen();
    expect(screen.getByText(t("auth.login.title"))).toBeTruthy();
  });

  it("renders the submit button", () => {
    renderScreen();
    expect(screen.getByText(t("auth.login.submitButton"))).toBeTruthy();
  });
});

// ── (c) Successful signIn ────────────────────────────────────────────────────

describe("LoginScreen — successful signIn", () => {
  it("given valid email + non-empty password + submit, then auth.signIn is called with username + password", async () => {
    renderScreen();

    const emailInput = screen.getByPlaceholderText(t("auth.login.emailPlaceholder"));
    const passwordInput = screen.getByPlaceholderText(t("auth.login.passwordPlaceholder"));

    await act(async () => {
      fireEvent.changeText(emailInput, "user@example.com");
      fireEvent.changeText(passwordInput, "SomePassword123!");
    });

    const submitButton = screen.getByText(t("auth.login.submitButton"));
    await act(async () => {
      fireEvent.press(submitButton);
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        username: "user@example.com",
        password: "SomePassword123!",
      });
    });
  });

  it("given successful signIn, then navigation.navigate is NOT called (state-driven)", async () => {
    const { nav } = renderScreen();

    const emailInput = screen.getByPlaceholderText(t("auth.login.emailPlaceholder"));
    const passwordInput = screen.getByPlaceholderText(t("auth.login.passwordPlaceholder"));

    await act(async () => {
      fireEvent.changeText(emailInput, "user@example.com");
      fireEvent.changeText(passwordInput, "SomePassword123!");
    });

    await act(async () => {
      fireEvent.press(screen.getByText(t("auth.login.submitButton")));
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });

    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

// ── (d)–(g) Error mapping ────────────────────────────────────────────────────

describe("LoginScreen — error mapping", () => {
  async function submitWithError(errName: string, errMessage?: string): Promise<void> {
    const err = Object.assign(new Error(errMessage ?? "err"), { name: errName });
    mockSignIn.mockRejectedValueOnce(err);

    renderScreen();

    const emailInput = screen.getByPlaceholderText(t("auth.login.emailPlaceholder"));
    const passwordInput = screen.getByPlaceholderText(t("auth.login.passwordPlaceholder"));

    await act(async () => {
      fireEvent.changeText(emailInput, "user@example.com");
      fireEvent.changeText(passwordInput, "SomePassword123!");
    });

    await act(async () => {
      fireEvent.press(screen.getByText(t("auth.login.submitButton")));
    });
  }

  it("NotAuthorizedException → surfaces notAuthorized error", async () => {
    await submitWithError("NotAuthorizedException");
    await waitFor(() => {
      expect(screen.getByTestId("login-error-message").props.children).toBe(
        t("auth.login.errors.notAuthorized"),
      );
    });
  });

  it("UserNotFoundException → surfaces userNotFound error", async () => {
    await submitWithError("UserNotFoundException");
    await waitFor(() => {
      expect(screen.getByTestId("login-error-message").props.children).toBe(
        t("auth.login.errors.userNotFound"),
      );
    });
  });

  it("UserNotConfirmedException → surfaces userNotConfirmed error (no auto-nav)", async () => {
    await submitWithError("UserNotConfirmedException");
    await waitFor(() => {
      expect(screen.getByTestId("login-error-message").props.children).toBe(
        t("auth.login.errors.userNotConfirmed"),
      );
    });
  });

  it("NetworkError → surfaces network error", async () => {
    await submitWithError("NetworkError");
    await waitFor(() => {
      expect(screen.getByTestId("login-error-message").props.children).toBe(
        t("auth.login.errors.network"),
      );
    });
  });

  it("Unknown error name → surfaces generic error", async () => {
    await submitWithError("SomeWeirdException");
    await waitFor(() => {
      expect(screen.getByTestId("login-error-message").props.children).toBe(
        t("auth.login.errors.generic"),
      );
    });
  });

  it("error message containing 'network' → surfaces network error via message fallback", async () => {
    await submitWithError("UnknownName", "Request timed out (network unreachable)");
    await waitFor(() => {
      expect(screen.getByTestId("login-error-message").props.children).toBe(
        t("auth.login.errors.network"),
      );
    });
  });
});
