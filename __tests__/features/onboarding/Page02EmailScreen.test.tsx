/**
 * Wiring tests for Page02EmailScreen (story 2.5).
 *
 * Convention: mock the cognitoClient wrapper, not aws-amplify/auth (established in story 2.5).
 *
 * Covers:
 * - Continue disabled until BOTH email and password are valid.
 * - On tap, secure-store write is awaited BEFORE cognitoClient.signUp is called
 *   (assert call order via mock invocation order).
 * - Success path navigates to Page03ConfirmCodeScreen.
 * - Secure-store write failure renders secureStorageUnavailable and does NOT call signUp.
 * - UsernameExistsException renders the corresponding inline error label without navigating.
 * - signUp failure best-effort-deletes the bootstrap password from secure-store.
 * - Generic error path renders the generic label.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

// ── All jest.mock calls must appear before any imports of the module under test ──

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

// ── secureStorage mock — replaces set and del with jest.fn() ──────────────────
// We mock the whole module to intercept set/del calls in tests.

const mockSecureStorageSet = jest.fn<Promise<void>, [string, string]>();
const mockSecureStorageDel = jest.fn<Promise<void>, [string]>();

jest.mock("@/services/auth/secureStorage", () => {
  return {
    SecureStorageKey: {
      accessToken: "auth.accessToken",
      refreshToken: "auth.refreshToken",
      idToken: "auth.idToken",
      onboardingDraft: "onboarding.draft",
      OnboardingBootstrapPassword: "onboarding.bootstrapPassword",
    },
    secureStorage: {
      get: jest.fn(),
      set: (key: string, value: string) => mockSecureStorageSet(key, value),
      del: (key: string) => mockSecureStorageDel(key),
      clearAuthTokens: jest.fn(),
      getAccessToken: jest.fn(),
      setAccessToken: jest.fn(),
      getRefreshToken: jest.fn(),
      setRefreshToken: jest.fn(),
      getIdToken: jest.fn(),
      setIdToken: jest.fn(),
      getOnboardingDraft: jest.fn(),
      setOnboardingDraft: jest.fn(),
      clearOnboardingDraft: jest.fn(),
    },
  };
});

// ── cognitoClient mock — Convention: mock the wrapper, not aws-amplify/auth ───

const mockSignUp = jest.fn<Promise<any>, [any]>();

jest.mock("@/services/auth/cognitoClient", () => ({
  cognitoClient: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signUp: (input: any) => mockSignUp(input),
    confirmSignUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  },
}));

// ── useOnboardingDraft mock ────────────────────────────────────────────────────

const mockUpdate = jest.fn();

jest.mock("@/features/onboarding/hooks/useOnboardingDraft", () => ({
  useOnboardingDraft: () => ({
    update: mockUpdate,
    advance: jest.fn(),
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: jest.fn(() => ({ fields: {}, lastCheckpoint: null, currentPage: 2 })),
    setSiblings: jest.fn(),
    isLoading: false,
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ─────────────────────────────────────────────────────────

import { ThemeProvider } from "@/theme";
import { SecureStorageKey } from "@/services/auth/secureStorage";
import { Page02EmailScreen } from "@/features/onboarding/screens/Page02EmailScreen";

// ── Test helpers ───────────────────────────────────────────────────────────────

const VALID_EMAIL = "user@example.com";
const VALID_PASSWORD = "SecurePassword1!"; // 16 chars, upper + lower + digit + symbol

function mockNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

function mockRoute() {
  return {
    key: "Page02EmailScreen",
    name: "Page02EmailScreen" as const,
    params: undefined,
  };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        <Page02EmailScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

function getContinueButton() {
  return screen.getByText("Continue");
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockSecureStorageSet.mockResolvedValue(undefined);
  mockSecureStorageDel.mockResolvedValue(undefined);
  mockSignUp.mockResolvedValue({ isSignUpComplete: false, userId: "user-123", nextStep: {} });
});

// ── Continue button disabled state ─────────────────────────────────────────────

describe("Page02EmailScreen — Continue button disabled state", () => {
  it("given empty form, when rendered, then pressing Continue does not trigger signUp", () => {
    renderScreen();
    fireEvent.press(getContinueButton());
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("given valid email but empty password, then pressing Continue does not trigger signUp", async () => {
    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    fireEvent.press(getContinueButton());
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("given invalid email with valid password, then pressing Continue does not trigger signUp", async () => {
    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, "notanemail");
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });
    fireEvent.press(getContinueButton());
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it("given valid email and policy-failing password, then pressing Continue does not trigger signUp", async () => {
    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, "weakpassword");
    });
    fireEvent.press(getContinueButton());
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});

// ── Call order: secure-store write BEFORE signUp ───────────────────────────────

describe("Page02EmailScreen — call order: secure-store write before signUp", () => {
  it("given valid form tapped, then secureStorage.set is called BEFORE cognitoClient.signUp", async () => {
    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    // Track invocation order
    const callOrder: string[] = [];
    mockSecureStorageSet.mockImplementation(async () => {
      callOrder.push("secureStorageSet");
    });
    mockSignUp.mockImplementation(async () => {
      callOrder.push("signUp");
      return { isSignUpComplete: false, userId: "u1", nextStep: {} };
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(callOrder).toContain("secureStorageSet");
      expect(callOrder).toContain("signUp");
    });

    // Secure-store write must come first
    expect(callOrder.indexOf("secureStorageSet")).toBeLessThan(
      callOrder.indexOf("signUp"),
    );
  });

  it("given valid form tapped, then secureStorage.set is called with correct key and password", async () => {
    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(mockSecureStorageSet).toHaveBeenCalledWith(
        SecureStorageKey.OnboardingBootstrapPassword,
        VALID_PASSWORD,
      );
    });
  });
});

// ── Success path ───────────────────────────────────────────────────────────────

describe("Page02EmailScreen — success path", () => {
  it("given valid form and signUp succeeds, then navigates to Page03ConfirmCodeScreen", async () => {
    const { nav } = renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(nav.navigate).toHaveBeenCalledWith("Page03ConfirmCodeScreen");
    });
  });

  it("given valid form and signUp succeeds, then persists email into onboarding draft", async () => {
    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({ email: VALID_EMAIL });
    });
  });
});

// ── Secure-store write failure ─────────────────────────────────────────────────

describe("Page02EmailScreen — secure-store write failure", () => {
  it("given secure-store write fails, then renders secureStorageUnavailable error", async () => {
    mockSecureStorageSet.mockRejectedValue(new Error("Keychain unavailable"));

    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "We couldn't securely save your password on this device. Please try again or restart the app.",
        ),
      ).toBeTruthy();
    });
  });

  it("given secure-store write fails, then cognitoClient.signUp is NOT called", async () => {
    mockSecureStorageSet.mockRejectedValue(new Error("Keychain unavailable"));

    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    // Give async handlers time to settle
    await waitFor(() => {
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });
});

// ── UsernameExistsException ────────────────────────────────────────────────────

describe("Page02EmailScreen — UsernameExistsException", () => {
  it("given signUp throws UsernameExistsException, then renders usernameExists label", async () => {
    const err = new Error("User already exists");
    err.name = "UsernameExistsException";
    mockSignUp.mockRejectedValue(err);

    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(
        screen.getByText("An account with this email already exists."),
      ).toBeTruthy();
    });
  });

  it("given signUp throws UsernameExistsException, then does NOT navigate", async () => {
    const err = new Error("User already exists");
    err.name = "UsernameExistsException";
    mockSignUp.mockRejectedValue(err);

    const { nav } = renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(screen.getByText("An account with this email already exists.")).toBeTruthy();
    });
    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

// ── signUp failure best-effort deletes bootstrap password ─────────────────────

describe("Page02EmailScreen — signUp failure cleanup", () => {
  it("given signUp fails, then best-effort-deletes the bootstrap password from secure-store", async () => {
    const err = new Error("Service unavailable");
    err.name = "ServiceUnavailableException";
    mockSignUp.mockRejectedValue(err);

    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(mockSecureStorageDel).toHaveBeenCalledWith(
        SecureStorageKey.OnboardingBootstrapPassword,
      );
    });
  });

  it("given signUp fails and bootstrap password delete also fails, then no crash and error is rendered", async () => {
    const signUpErr = new Error("Service unavailable");
    signUpErr.name = "ServiceUnavailableException";
    mockSignUp.mockRejectedValue(signUpErr);
    mockSecureStorageDel.mockRejectedValue(new Error("Delete also failed"));

    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeTruthy();
    });
  });
});

// ── Generic error path ─────────────────────────────────────────────────────────

describe("Page02EmailScreen — generic error", () => {
  it("given signUp throws an unknown error, then renders the generic label", async () => {
    const err = new Error("Some unexpected error");
    err.name = "SomeUnknownException";
    mockSignUp.mockRejectedValue(err);

    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(screen.getByText("Something went wrong. Please try again.")).toBeTruthy();
    });
  });

  it("given signUp throws a network error, then renders the network label", async () => {
    const err = new Error("Network request failed");
    err.name = "NetworkError";
    mockSignUp.mockRejectedValue(err);

    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(emailInput, VALID_EMAIL);
    });
    await act(async () => {
      fireEvent.changeText(passwordInput, VALID_PASSWORD);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(
        screen.getByText("We couldn't reach the server. Please try again."),
      ).toBeTruthy();
    });
  });
});

// ── Inline field errors (don't show on untouched fields) ──────────────────────

describe("Page02EmailScreen — inline field errors", () => {
  it("given empty email field (untouched), then no email error is shown", () => {
    renderScreen();
    expect(screen.queryByText("Please enter a valid email address.")).toBeNull();
  });

  it("given empty password field (untouched), then no password error is shown", () => {
    renderScreen();
    expect(screen.queryByText("Password must be at least 12 characters.")).toBeNull();
  });

  it("given invalid email typed, then shows invalid email error", async () => {
    renderScreen();
    const emailInput = screen.getByLabelText("Email");
    await act(async () => {
      fireEvent.changeText(emailInput, "notanemail");
    });
    expect(screen.getByText("Please enter a valid email address.")).toBeTruthy();
  });

  it("given short password typed, then shows passwordTooShort error", async () => {
    renderScreen();
    const passwordInput = screen.getByLabelText("Password");
    await act(async () => {
      fireEvent.changeText(passwordInput, "short");
    });
    expect(screen.getByText("Password must be at least 12 characters.")).toBeTruthy();
  });
});
