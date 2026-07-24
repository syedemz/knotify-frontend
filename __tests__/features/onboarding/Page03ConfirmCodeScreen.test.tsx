/**
 * Wiring tests for Page03ConfirmCodeScreen (story 2.6).
 *
 * Convention: mock the cognitoClient wrapper, not aws-amplify/auth (established in story 2.5).
 *
 * Covers:
 * - Continue disabled below 6 digits.
 * - Continue is `disabled` and `loading` while the confirmSignUp+signIn chain is in flight
 *   (asserted with a promise held pending by the mock).
 * - On tap, `cognitoClient.confirmSignUp` is called with the correct `{ username, code }`.
 * - Success path calls `authSignIn` with the stored password, then deletes the bootstrap
 *   password from secure-store, then navigates to `Page04GetStartedScreen`.
 * - `CodeMismatchException` renders the invalid-code label, does not navigate, and
 *   re-enables the button.
 * - Missing bootstrap password renders the `bootstrapMissing` label.
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

// ── secureStorage mock ────────────────────────────────────────────────────────────

const mockSecureStorageGet = jest.fn<Promise<string | null>, [string]>();
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
      get: (key: string) => mockSecureStorageGet(key),
      set: jest.fn<Promise<void>, [string, string]>(),
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

const mockConfirmSignUp = jest.fn<Promise<any>, [any]>();

jest.mock("@/services/auth/cognitoClient", () => ({
  cognitoClient: {
    signUp: jest.fn(),
    confirmSignUp: (input: any) => mockConfirmSignUp(input),
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  },
}));

// ── useAuth mock ────────────────────────────────────────────────────────────────

const mockAuthSignIn = jest.fn<Promise<any>, [any]>();

jest.mock("@/state/auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "unauthenticated",
    session: null,
    profileComplete: false,
    signIn: (input: any) => mockAuthSignIn(input),
    signOut: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// ── useOnboardingDraft mock ───────────────────────────────────────────────────────

jest.mock("@/features/onboarding/hooks/useOnboardingDraft", () => ({
  useOnboardingDraft: () => ({
    update: jest.fn(),
    advance: jest.fn(),
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: jest.fn(() => ({
      fields: { email: "user@example.com" },
      lastCheckpoint: null,
      currentPage: 3,
    })),
    setSiblings: jest.fn(),
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    isLoading: false,
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ─────────────────────────────────────────────────────────────

import { ThemeProvider } from "@/theme";
import { SecureStorageKey } from "@/services/auth/secureStorage";
import { Page03ConfirmCodeScreen } from "@/features/onboarding/screens/Page03ConfirmCodeScreen";

// ── Test helpers ───────────────────────────────────────────────────────────────────

const VALID_CODE = "123456";
const STORED_PASSWORD = "SecurePassword1!";
const TEST_EMAIL = "user@example.com";

function mockNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

function mockRoute() {
  return {
    key: "Page03ConfirmCodeScreen",
    name: "Page03ConfirmCodeScreen" as const,
    params: undefined,
  };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        <Page03ConfirmCodeScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

function getContinueButton() {
  return screen.getByText("Continue");
}

function getCodeInput() {
  return screen.getByLabelText("Enter the code");
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockSecureStorageGet.mockResolvedValue(STORED_PASSWORD);
  mockSecureStorageDel.mockResolvedValue(undefined);
  mockConfirmSignUp.mockResolvedValue({ isSignUpComplete: true, userId: "user-123", nextStep: {} });
  mockAuthSignIn.mockResolvedValue({ isSignedIn: true, nextStep: {} });
});

// ── Continue button disabled state ─────────────────────────────────────────────

describe("Page03ConfirmCodeScreen — Continue button disabled state", () => {
  it("given empty code, when rendered, then pressing Continue does not call confirmSignUp", () => {
    renderScreen();
    fireEvent.press(getContinueButton());
    expect(mockConfirmSignUp).not.toHaveBeenCalled();
  });

  it("given 5-digit code (below 6), then pressing Continue does not call confirmSignUp", async () => {
    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), "12345");
    });
    fireEvent.press(getContinueButton());
    expect(mockConfirmSignUp).not.toHaveBeenCalled();
  });

  it("given 7-digit code (above 6), then pressing Continue does not call confirmSignUp", async () => {
    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), "1234567");
    });
    fireEvent.press(getContinueButton());
    expect(mockConfirmSignUp).not.toHaveBeenCalled();
  });

  it("given code with non-digit characters, then pressing Continue does not call confirmSignUp", async () => {
    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), "12345a");
    });
    fireEvent.press(getContinueButton());
    expect(mockConfirmSignUp).not.toHaveBeenCalled();
  });
});

// ── Loading state during in-flight chain ──────────────────────────────────────

describe("Page03ConfirmCodeScreen — loading state during in-flight chain", () => {
  it("given valid code tapped, then Continue button is disabled while confirmSignUp is pending", async () => {
    // Hold confirmSignUp pending so we can assert the loading state mid-flight.
    let resolveConfirm!: () => void;
    const pendingConfirm = new Promise<any>((resolve) => {
      resolveConfirm = () => resolve({ isSignUpComplete: true, nextStep: {} });
    });
    mockConfirmSignUp.mockReturnValue(pendingConfirm);

    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    // Tap Continue — chain is now in flight, button should be loading/disabled.
    act(() => {
      // The button text "Continue" is visible before loading.
      fireEvent.press(getContinueButton());
    });

    // While in flight the button is disabled (loading=true renders ActivityIndicator).
    // Query by accessibilityLabel since text "Continue" is replaced by spinner.
    await waitFor(() => {
      const btn = screen.getByLabelText("Continue");
      // accessibilityState.disabled should be true when loading
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    });

    // Resolve the pending promise to let the handler finish
    await act(async () => {
      resolveConfirm();
      await pendingConfirm;
    });

    // confirmSignUp should only have been called once (double-tap protection)
    expect(mockConfirmSignUp).toHaveBeenCalledTimes(1);
  });
});

// ── confirmSignUp called with correct args ─────────────────────────────────────

describe("Page03ConfirmCodeScreen — confirmSignUp args", () => {
  it("given valid 6-digit code tapped, then confirmSignUp is called with { username: email, code }", async () => {
    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(mockConfirmSignUp).toHaveBeenCalledWith({
        username: TEST_EMAIL,
        code: VALID_CODE,
      });
    });
  });
});

// ── Success path ───────────────────────────────────────────────────────────────

describe("Page03ConfirmCodeScreen — success path", () => {
  it("given confirmSignUp succeeds, then authSignIn is called with { username: email, password }", async () => {
    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(mockAuthSignIn).toHaveBeenCalledWith({
        username: TEST_EMAIL,
        password: STORED_PASSWORD,
      });
    });
  });

  it("given signIn succeeds, then deletes the bootstrap password from secure-store", async () => {
    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
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

  it("given the full chain succeeds, then navigates to Page04GetStartedScreen", async () => {
    const { nav } = renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(nav.navigate).toHaveBeenCalledWith("Page04GetStartedScreen");
    });
  });

  it("given the full chain succeeds, then secureStorage.get is called for the bootstrap password key", async () => {
    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(mockSecureStorageGet).toHaveBeenCalledWith(
        SecureStorageKey.OnboardingBootstrapPassword,
      );
    });
  });
});

// ── CodeMismatchException ─────────────────────────────────────────────────────

describe("Page03ConfirmCodeScreen — CodeMismatchException", () => {
  it("given confirmSignUp throws CodeMismatchException, then renders invalidCode label", async () => {
    const err = new Error("Code mismatch");
    err.name = "CodeMismatchException";
    mockConfirmSignUp.mockRejectedValue(err);

    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(
        screen.getByText("That code isn't right. Try again."),
      ).toBeTruthy();
    });
  });

  it("given confirmSignUp throws CodeMismatchException, then does NOT navigate", async () => {
    const err = new Error("Code mismatch");
    err.name = "CodeMismatchException";
    mockConfirmSignUp.mockRejectedValue(err);

    const { nav } = renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(screen.getByText("That code isn't right. Try again.")).toBeTruthy();
    });
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it("given CodeMismatchException shown, then the button re-enables (user can retry with a new tap)", async () => {
    const err = new Error("Code mismatch");
    err.name = "CodeMismatchException";
    mockConfirmSignUp.mockRejectedValue(err);

    const { nav } = renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(screen.getByText("That code isn't right. Try again.")).toBeTruthy();
    });

    // Button should be re-enabled after error (loading goes back to false).
    // Switch the mock to succeed for the retry.
    mockConfirmSignUp.mockResolvedValue({ isSignUpComplete: true, nextStep: {} });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    // The second tap should have triggered a new confirmSignUp call (2 total).
    await waitFor(() => {
      expect(mockConfirmSignUp).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(nav.navigate).toHaveBeenCalledWith("Page04GetStartedScreen");
    });
  });
});

// ── ExpiredCodeException ───────────────────────────────────────────────────────

describe("Page03ConfirmCodeScreen — ExpiredCodeException", () => {
  it("given confirmSignUp throws ExpiredCodeException, then renders codeExpired label", async () => {
    const err = new Error("Code expired");
    err.name = "ExpiredCodeException";
    mockConfirmSignUp.mockRejectedValue(err);

    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(screen.getByText("Your code has expired.")).toBeTruthy();
    });
  });
});

// ── LimitExceededException ─────────────────────────────────────────────────────

describe("Page03ConfirmCodeScreen — LimitExceededException", () => {
  it("given confirmSignUp throws LimitExceededException, then renders limitExceeded label", async () => {
    const err = new Error("Too many attempts");
    err.name = "LimitExceededException";
    mockConfirmSignUp.mockRejectedValue(err);

    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(
        screen.getByText("Too many attempts. Please wait a moment and try again."),
      ).toBeTruthy();
    });
  });
});

// ── Missing bootstrap password ─────────────────────────────────────────────────

describe("Page03ConfirmCodeScreen — missing bootstrap password", () => {
  it("given confirmSignUp succeeds but secure-store returns null, then renders bootstrapMissing label", async () => {
    mockSecureStorageGet.mockResolvedValue(null);

    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(
        screen.getByText("We lost track of your signup. Please restart from the beginning."),
      ).toBeTruthy();
    });
  });

  it("given bootstrap password is missing, then does NOT navigate", async () => {
    mockSecureStorageGet.mockResolvedValue(null);

    const { nav } = renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(
        screen.getByText("We lost track of your signup. Please restart from the beginning."),
      ).toBeTruthy();
    });
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it("given bootstrap password is missing, then authSignIn is NOT called", async () => {
    mockSecureStorageGet.mockResolvedValue(null);

    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(
        screen.getByText("We lost track of your signup. Please restart from the beginning."),
      ).toBeTruthy();
    });
    expect(mockAuthSignIn).not.toHaveBeenCalled();
  });
});

// ── signIn failure after successful confirm ────────────────────────────────────

describe("Page03ConfirmCodeScreen — signIn failure after successful confirmSignUp", () => {
  it("given signIn throws after confirmSignUp succeeds, then renders signInAfterConfirm label", async () => {
    const err = new Error("Not authorized");
    err.name = "NotAuthorizedException";
    mockAuthSignIn.mockRejectedValue(err);

    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "We verified your email but couldn't sign you in. Please restart signup.",
        ),
      ).toBeTruthy();
    });
  });

  it("given signIn fails, then does NOT delete the bootstrap password (user may retry)", async () => {
    const err = new Error("Not authorized");
    err.name = "NotAuthorizedException";
    mockAuthSignIn.mockRejectedValue(err);

    renderScreen();
    await act(async () => {
      fireEvent.changeText(getCodeInput(), VALID_CODE);
    });

    await act(async () => {
      fireEvent.press(getContinueButton());
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          "We verified your email but couldn't sign you in. Please restart signup.",
        ),
      ).toBeTruthy();
    });
    expect(mockSecureStorageDel).not.toHaveBeenCalled();
  });
});

// ── Email display ──────────────────────────────────────────────────────────────

describe("Page03ConfirmCodeScreen — email display in subtitle", () => {
  it("given draft has email, then subtitle contains the email address", () => {
    renderScreen();
    expect(
      screen.getByText("We sent a 6-digit code to user@example.com"),
    ).toBeTruthy();
  });
});

// ── No countdown timer ─────────────────────────────────────────────────────────

describe("Page03ConfirmCodeScreen — no countdown timer (per architecture §11.2.1 row 3)", () => {
  it("given the screen renders, then no countdown / timer text is shown", () => {
    renderScreen();
    // Per architecture §11.2.1 row 3, no timer should be rendered.
    expect(screen.queryByText(/seconds/i)).toBeNull();
    expect(screen.queryByText(/timer/i)).toBeNull();
    expect(screen.queryByText(/resend in/i)).toBeNull();
  });
});
