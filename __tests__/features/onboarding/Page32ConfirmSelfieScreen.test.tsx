/**
 * Wiring tests for Page32ConfirmSelfieScreen.
 *
 * Page 32 owns the confirm + submit flow after Page 31 captures a selfie.
 *
 * AC coverage:
 * (a) Initial render — image (with URI from route params), Continue, Retake all visible.
 * (b) Continue success → PATCH called, dummy.profile written, markComplete called,
 *     draft cleared, navigation.navigate NOT called (state-driven transition).
 * (c) Continue with dummy.profile write failure → clear() NOT called, retry visible.
 * (d) 409 collision → update() called with new username, retry submits, on second-success draft cleared.
 * (e) 409 twice → error surface visible, draft NOT cleared.
 * (f) 500 error → error surface visible, draft NOT cleared.
 * (g) Retake tap → navigation.goBack called.
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Standard native module mocks ──────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
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

jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
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

jest.mock('@gorhom/bottom-sheet', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
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

jest.mock('react-native-reanimated', () => {
  const m = require('react-native-reanimated/mock');
  m.default.call = jest.fn();
  return m;
});

// ── expo-secure-store mock ────────────────────────────────────────────────────

const mockSetItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: (...args: any[]) => mockSetItemAsync(...args),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// ── HTTP client mock ──────────────────────────────────────────────────────────

const mockRequest = jest.fn();

jest.mock('@/services/api/httpClient', () => ({
  request: (...args: any[]) => mockRequest(...args),
}));

// ── OnboardingCompletionProvider mock ─────────────────────────────────────────

const mockMarkComplete = jest.fn();
const mockOnboardingCompletionReset = jest.fn();

jest.mock('@/state/onboardingCompletion/OnboardingCompletionProvider', () => ({
  OnboardingCompletionProvider: ({ children }: any) => children,
  useOnboardingCompletion: () => ({
    loading: false,
    complete: false,
    markComplete: mockMarkComplete,
    reset: mockOnboardingCompletionReset,
  }),
}));

// ── useOnboardingDraft mock ───────────────────────────────────────────────────

const mockGetDraft = jest.fn();
const mockClear = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  OnboardingDraftProvider: ({ children }: any) => children,
  useOnboardingDraft: () => ({
    update: mockUpdate,
    advance: jest.fn(),
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: mockGetDraft,
    setSiblings: jest.fn(),
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    setPhotoPreviewUris: jest.fn(),
    setFaceSelfieUri: jest.fn(),
    clear: mockClear,
    isLoading: false,
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { Page32ConfirmSelfieScreen } from '@/features/onboarding/screens/Page32ConfirmSelfieScreen';
import { createEmptyDraft } from '@/features/onboarding/draftSchema';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_URI = 'file:///mock/face-selfie.jpg';

function mockNavigation() {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(true),
  };
}

function mockRoute() {
  return {
    key: 'Page32ConfirmSelfieScreen',
    name: 'Page32ConfirmSelfieScreen' as const,
    params: { faceSelfieUri: MOCK_URI },
  };
}

function makeDraft(fields: Record<string, unknown> = {}) {
  return {
    ...createEmptyDraft(),
    phone_number: '+919812345678',
    fields: {
      first_name: 'Sara',
      last_name: 'Khan',
      ...fields,
    },
  };
}

function renderScreen(nav = mockNavigation()) {
  mockGetDraft.mockReturnValue(makeDraft());
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page32ConfirmSelfieScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockGetDraft.mockReturnValue(makeDraft());
  mockRequest.mockResolvedValue({ success: true });
  mockMarkComplete.mockResolvedValue(undefined);
  mockSetItemAsync.mockResolvedValue(undefined);
  mockClear.mockReturnValue(undefined);
});

// ── AC (a): initial render ────────────────────────────────────────────────────

describe('Page32ConfirmSelfieScreen — AC (a): initial render', () => {
  it('given fresh mount, then title is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.confirmSelfie.title'))).toBeTruthy();
  });

  it('given fresh mount, then selfie image is rendered with the URI param', () => {
    renderScreen();
    const img = screen.getByTestId('confirm-selfie-image');
    expect(img).toBeTruthy();
    expect(img.props.source).toEqual({ uri: MOCK_URI });
  });

  it('given fresh mount, then Continue and Retake buttons are visible', () => {
    renderScreen();
    expect(screen.getByTestId('continue-button')).toBeTruthy();
    expect(screen.getByTestId('retake-button')).toBeTruthy();
  });
});

// ── AC (b): Continue success ─────────────────────────────────────────────────

describe('Page32ConfirmSelfieScreen — AC (b): Continue success runs full submit sequence', () => {
  it('given Continue tap, then PATCH /profile/me is called via request()', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('continue-button'));
    });

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'PATCH', path: '/profile/me' }),
      );
    });
  });

  it('given Continue success, then dummy.profile is written to secure-store', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('continue-button'));
    });

    await waitFor(() => {
      expect(mockSetItemAsync).toHaveBeenCalledWith('dummy.profile', expect.any(String));
    });
  });

  it('given Continue success, then markComplete() is called', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('continue-button'));
    });

    await waitFor(() => {
      expect(mockMarkComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('given Continue success, then clear() is called to wipe the onboarding draft', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('continue-button'));
    });

    await waitFor(() => {
      expect(mockClear).toHaveBeenCalledTimes(1);
    });
  });

  it('given Continue success, then navigation.navigate is NOT called (state-driven transition)', async () => {
    const { nav } = renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('continue-button'));
    });

    await waitFor(() => {
      expect(mockMarkComplete).toHaveBeenCalled();
    });

    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

// ── AC (c): dummy.profile write failure preserves draft ──────────────────────

describe('Page32ConfirmSelfieScreen — AC (c): step 3 failure preserves draft', () => {
  it('given dummy.profile write throws, then clear() is NOT called and retry is shown', async () => {
    mockRequest.mockResolvedValueOnce({ success: true });
    mockSetItemAsync.mockRejectedValueOnce(new Error('SecureStore write failed'));

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('continue-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('retry-submit-button')).toBeTruthy();
    });

    expect(mockClear).not.toHaveBeenCalled();
  });
});

// ── AC (d): 409 collision retry ──────────────────────────────────────────────

describe('Page32ConfirmSelfieScreen — AC (d): 409 collision retry', () => {
  it('given 409 then 200, then update() is called with a new username', async () => {
    const collision409 = Object.assign(new Error('Username taken'), { status: 409 });
    mockRequest
      .mockRejectedValueOnce(collision409)
      .mockResolvedValueOnce({ success: true });

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('continue-button'));
    });

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ username: expect.any(String) }),
      );
    });
  });

  it('given 409 then 200, then clear() is eventually called on retry success', async () => {
    const collision409 = Object.assign(new Error('Username taken'), { status: 409 });
    mockRequest
      .mockRejectedValueOnce(collision409)
      .mockResolvedValueOnce({ success: true });

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('continue-button'));
    });

    await waitFor(() => {
      expect(mockClear).toHaveBeenCalledTimes(1);
    });
  });
});

// ── AC (e): 409 twice → error surface ────────────────────────────────────────

describe('Page32ConfirmSelfieScreen — AC (e): second 409 surfaces error, draft preserved', () => {
  it('given 409 twice, then error surface visible and clear() NOT called', async () => {
    const collision409 = Object.assign(new Error('Username taken'), { status: 409 });
    mockRequest
      .mockRejectedValueOnce(collision409)
      .mockRejectedValueOnce(collision409);

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('continue-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('retry-submit-button')).toBeTruthy();
    });

    expect(mockClear).not.toHaveBeenCalled();
  });
});

// ── AC (f): 500 error ────────────────────────────────────────────────────────

describe('Page32ConfirmSelfieScreen — AC (f): 500 error preserves draft', () => {
  it('given PATCH returns 500, then error surface is shown and clear() NOT called', async () => {
    const serverError = Object.assign(new Error('Internal server error'), { status: 500 });
    mockRequest.mockRejectedValueOnce(serverError);

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('continue-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('retry-submit-button')).toBeTruthy();
    });

    expect(mockClear).not.toHaveBeenCalled();
  });
});

// ── AC (g): Retake → goBack ──────────────────────────────────────────────────

describe('Page32ConfirmSelfieScreen — AC (g): Retake calls goBack', () => {
  it('given Retake tap, then navigation.goBack is called', () => {
    const { nav } = renderScreen();

    fireEvent.press(screen.getByTestId('retake-button'));

    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });
});
