/**
 * Wiring tests for Page31FaceCaptureScreen (story 11.2).
 *
 * The state machine (useAutoCaptureController) is mocked — tests do not wait
 * for real camera frames. This keeps tests synchronous and deterministic.
 *
 * AC coverage:
 * (a) Initial render — camera preview and shutter button visible; no post-capture UI.
 * (b) Manual shutter tap → captured state; submit + retake buttons appear.
 * (c) Submit success → markComplete() called, clear() called.
 * (d) Submit step 3 throws (dummy.profile write fails) → draft NOT cleared, retry visible.
 * (e) 409 collision → username regenerated, retry called, second success clears draft.
 * (f) 500 error → error surface visible, draft not cleared.
 * (g) Retake → back to initial capture state.
 * (h) mockOnboardingComplete triggers do NOT call navigation.navigate directly.
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
  // TODO(mock-only): remove when real backend + JWT claim decode ship
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
const mockSetFaceSelfieUri = jest.fn();
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
    setFaceSelfieUri: mockSetFaceSelfieUri,
    clear: mockClear,
    isLoading: false,
  }),
}));

// ── useAutoCaptureController mock ─────────────────────────────────────────────
// Mock so tests don't depend on real frame-counting logic.

const mockAutoCaptureReset = jest.fn();
const mockAutoCaptureOnFrame = jest.fn();

jest.mock('@/features/onboarding/hooks/useAutoCaptureController', () => ({
  useAutoCaptureController: () => ({
    shouldCapture: false,
    onFrame: mockAutoCaptureOnFrame,
    reset: mockAutoCaptureReset,
  }),
  CONSECUTIVE_FRAMES_REQUIRED: 15,
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { Page31FaceCaptureScreen } from '@/features/onboarding/screens/Page31FaceCaptureScreen';
import { createEmptyDraft } from '@/features/onboarding/draftSchema';

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
    key: 'Page31FaceCaptureScreen',
    name: 'Page31FaceCaptureScreen' as const,
    params: undefined,
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
        <Page31FaceCaptureScreen navigation={nav as any} route={mockRoute() as any} />
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

describe('Page31FaceCaptureScreen — AC (a): initial render', () => {
  it('given fresh mount, then page title is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.faceCapture.title'))).toBeTruthy();
  });

  it('given fresh mount, then shutter button is visible', () => {
    renderScreen();
    expect(screen.getByTestId('shutter-button')).toBeTruthy();
  });

  it('given fresh mount, then submit button is NOT visible', () => {
    renderScreen();
    expect(screen.queryByTestId('submit-button')).toBeNull();
  });

  it('given fresh mount, then retake button is NOT visible', () => {
    renderScreen();
    expect(screen.queryByTestId('retake-button')).toBeNull();
  });
});

// ── AC (b): manual shutter tap → captured state ───────────────────────────────

describe('Page31FaceCaptureScreen — AC (b): manual shutter tap', () => {
  it('given shutter button tapped, then submit and retake buttons appear', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeTruthy();
      expect(screen.getByTestId('retake-button')).toBeTruthy();
    });
  });

  it('given shutter button tapped, then setFaceSelfieUri is called', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });

    expect(mockSetFaceSelfieUri).toHaveBeenCalledWith(expect.stringContaining('mock://face-selfie-'));
  });

  it('given shutter button tapped, then shutter button is no longer visible', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('shutter-button')).toBeNull();
    });
  });
});

// ── AC (c): submit success ────────────────────────────────────────────────────

describe('Page31FaceCaptureScreen — AC (c): submit success', () => {
  it('given submit tap, then PATCH /profile/me is called via request()', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'PATCH', path: '/profile/me' }),
      );
    });
  });

  it('given submit success, then dummy.profile is written to secure-store', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('submit-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(mockSetItemAsync).toHaveBeenCalledWith(
        'dummy.profile',
        expect.any(String),
      );
    });
  });

  it('given submit success, then markComplete() is called', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('submit-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(mockMarkComplete).toHaveBeenCalledTimes(1);
    });
  });

  it('given submit success, then clear() is called to wipe the onboarding draft', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('submit-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(mockClear).toHaveBeenCalledTimes(1);
    });
  });

  it('given submit success, then navigation.navigate is NOT called (state-driven transition)', async () => {
    const { nav } = renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('submit-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(mockMarkComplete).toHaveBeenCalled();
    });

    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

// ── AC (d): step 3 throws → draft preserved ──────────────────────────────────

describe('Page31FaceCaptureScreen — AC (d): step 3 failure preserves draft', () => {
  it('given dummy.profile write throws, then clear() is NOT called', async () => {
    // Step 2 succeeds, step 3 (SecureStore write) throws.
    mockRequest.mockResolvedValueOnce({ success: true });
    mockSetItemAsync.mockRejectedValueOnce(new Error('SecureStore write failed'));

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('submit-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('retry-submit-button')).toBeTruthy();
    });

    expect(mockClear).not.toHaveBeenCalled();
  });

  it('given step 3 throws, then error surface is shown with retry action', async () => {
    mockRequest.mockResolvedValueOnce({ success: true });
    mockSetItemAsync.mockRejectedValueOnce(new Error('SecureStore write failed'));

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('submit-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('retry-submit-button')).toBeTruthy();
    });
  });
});

// ── AC (e): 409 collision → username regenerated → retry ────────────────────

describe('Page31FaceCaptureScreen — AC (e): 409 collision retry', () => {
  it('given 409 then 200, then update() is called with a new username', async () => {
    const collision409 = Object.assign(new Error('Username taken'), { status: 409 });
    mockRequest
      .mockRejectedValueOnce(collision409)
      .mockResolvedValueOnce({ success: true });

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('submit-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
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
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('submit-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(mockClear).toHaveBeenCalledTimes(1);
    });
  });

  it('given 409 twice, then error surface is shown and clear() is NOT called', async () => {
    const collision409 = Object.assign(new Error('Username taken'), { status: 409 });
    mockRequest
      .mockRejectedValueOnce(collision409)
      .mockRejectedValueOnce(collision409);

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('submit-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('retry-submit-button')).toBeTruthy();
    });

    expect(mockClear).not.toHaveBeenCalled();
  });
});

// ── AC (f): 500 error → error surface ────────────────────────────────────────

describe('Page31FaceCaptureScreen — AC (f): 500 error', () => {
  it('given PATCH returns 500, then error surface is shown', async () => {
    const serverError = Object.assign(new Error('Internal server error'), { status: 500 });
    mockRequest.mockRejectedValueOnce(serverError);

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('submit-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('retry-submit-button')).toBeTruthy();
    });
  });

  it('given PATCH returns 500, then clear() is NOT called', async () => {
    const serverError = Object.assign(new Error('Internal server error'), { status: 500 });
    mockRequest.mockRejectedValueOnce(serverError);

    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('submit-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('submit-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('retry-submit-button')).toBeTruthy();
    });

    expect(mockClear).not.toHaveBeenCalled();
  });
});

// ── AC (g): retake ────────────────────────────────────────────────────────────

describe('Page31FaceCaptureScreen — AC (g): retake', () => {
  it('given retake tapped after capture, then shutter button is visible again', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('retake-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('retake-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('shutter-button')).toBeTruthy();
    });
  });

  it('given retake tapped, then submit button is hidden again', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });
    await waitFor(() => expect(screen.getByTestId('retake-button')).toBeTruthy());

    await act(async () => {
      fireEvent.press(screen.getByTestId('retake-button'));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('submit-button')).toBeNull();
    });
  });
});
