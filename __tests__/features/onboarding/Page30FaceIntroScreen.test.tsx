/**
 * Wiring tests for Page30FaceIntroScreen (story 11.1).
 *
 * AC coverage:
 * (a) Initial render — "Verify photo" button visible, denied message NOT visible,
 *     Open Settings NOT visible.
 * (b) Grant → navigate to Page31FaceCaptureScreen.
 * (c) First-deny → inline "denied message" visible, Retry button visible,
 *     Open Settings NOT visible.
 * (d) Retry-then-grant → navigate to Page31FaceCaptureScreen.
 * (e) Permanent-deny → Open Settings visible AND Snackbar/toast message rendered;
 *     tapping Open Settings invokes Linking.openSettings.
 */

import React from 'react';
import { Linking } from 'react-native';
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

// ── requestCameraPermission mock ──────────────────────────────────────────────

const mockRequestCameraPermission = jest.fn();

jest.mock('@/services/permissions', () => ({
  requestCameraPermission: (...args: any[]) => mockRequestCameraPermission(...args),
  requestNotificationPermission: jest.fn(),
  requestLocationPermission: jest.fn(),
  requestMediaLibraryPermission: jest.fn(),
}));

// ── useOnboardingDraft mock ───────────────────────────────────────────────────

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  OnboardingDraftProvider: ({ children }: any) => children,
  useOnboardingDraft: () => ({
    update: jest.fn(),
    advance: jest.fn(),
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: jest.fn(() => ({
      schemaVersion: 4,
      lastCheckpoint: null,
      currentPage: 30,
      fields: {},
      siblings: [],
      photoPreviewUris: [],
      notificationPermissionStatus: null,
      locationPermissionStatus: null,
      phone_number: null,
      faceSelfieUri: null,
      timestamps: { createdAt: '', updatedAt: '' },
    })),
    setSiblings: jest.fn(),
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    setPhotoPreviewUris: jest.fn(),
    setFaceSelfieUri: jest.fn(),
    clear: jest.fn(),
    isLoading: false,
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { Page30FaceIntroScreen } from '@/features/onboarding/screens/Page30FaceIntroScreen';

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
    key: 'Page30FaceVerifyIntroScreen',
    name: 'Page30FaceVerifyIntroScreen' as const,
    params: undefined,
  };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page30FaceIntroScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const VERIFY_LABEL = t('onboarding.faceIntro.verifyButton');
const RETRY_LABEL = t('onboarding.faceIntro.retryButton');
const OPEN_SETTINGS_LABEL = t('onboarding.faceIntro.openSettings');
const DENIED_MESSAGE = t('onboarding.faceIntro.deniedMessage');
const PERMISSION_REQUIRED_MESSAGE = t('onboarding.faceIntro.permissionRequiredMessage');

// ── Setup ─────────────────────────────────────────────────────────────────────

let openSettingsSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  // Spy on Linking.openSettings. Set up fresh in each test so clearAllMocks
  // doesn't remove the spy (we restore the original, then re-spy).
  openSettingsSpy = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
});

afterEach(() => {
  openSettingsSpy.mockRestore();
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (a): Initial render
// ═════════════════════════════════════════════════════════════════════════════

describe('Page30FaceIntroScreen — AC (a): initial render', () => {
  it('given a fresh mount, then renders the page title', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.faceIntro.title'))).toBeTruthy();
  });

  it('given a fresh mount, then "Verify photo" button is visible', () => {
    renderScreen();
    expect(screen.getByText(VERIFY_LABEL)).toBeTruthy();
  });

  it('given a fresh mount, then denied message is NOT visible', () => {
    renderScreen();
    expect(screen.queryByText(DENIED_MESSAGE)).toBeNull();
  });

  it('given a fresh mount, then Open Settings button is NOT visible', () => {
    renderScreen();
    expect(screen.queryByText(OPEN_SETTINGS_LABEL)).toBeNull();
  });

  it('given a fresh mount, then navigate is NOT called', () => {
    const { nav } = renderScreen();
    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (b): Grant → navigate
// ═════════════════════════════════════════════════════════════════════════════

describe('Page30FaceIntroScreen — AC (b): grant → navigate', () => {
  it('given permission is granted, when "Verify photo" is tapped, then navigates to Page31FaceCaptureScreen', async () => {
    mockRequestCameraPermission.mockResolvedValueOnce('granted');
    const { nav } = renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByText(VERIFY_LABEL));
    });

    expect(nav.navigate).toHaveBeenCalledWith('Page31FaceCaptureScreen');
  });

  it('given permission is granted, when "Verify photo" is tapped, then denied message remains hidden', async () => {
    mockRequestCameraPermission.mockResolvedValueOnce('granted');
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByText(VERIFY_LABEL));
    });

    expect(screen.queryByText(DENIED_MESSAGE)).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (c): First-deny → inline retry surface, Open Settings NOT visible
// ═════════════════════════════════════════════════════════════════════════════

describe('Page30FaceIntroScreen — AC (c): first-deny → retry surface', () => {
  it('given first-time denied, when "Verify photo" is tapped, then denied message appears', async () => {
    mockRequestCameraPermission.mockResolvedValueOnce('denied');
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByText(VERIFY_LABEL));
    });

    await waitFor(() => {
      expect(screen.getByText(DENIED_MESSAGE)).toBeTruthy();
    });
  });

  it('given first-time denied, then Retry button is visible', async () => {
    mockRequestCameraPermission.mockResolvedValueOnce('denied');
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByText(VERIFY_LABEL));
    });

    await waitFor(() => {
      expect(screen.getByText(RETRY_LABEL)).toBeTruthy();
    });
  });

  it('given first-time denied, then Open Settings button is NOT visible', async () => {
    mockRequestCameraPermission.mockResolvedValueOnce('denied');
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByText(VERIFY_LABEL));
    });

    await waitFor(() => {
      expect(screen.queryByText(OPEN_SETTINGS_LABEL)).toBeNull();
    });
  });

  it('given first-time denied, then navigate is NOT called', async () => {
    mockRequestCameraPermission.mockResolvedValueOnce('denied');
    const { nav } = renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByText(VERIFY_LABEL));
    });

    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (d): Retry-then-grant → navigate
// ═════════════════════════════════════════════════════════════════════════════

describe('Page30FaceIntroScreen — AC (d): retry-then-grant → navigate', () => {
  it('given first-deny then grant on retry, then navigates to Page31FaceCaptureScreen', async () => {
    mockRequestCameraPermission
      .mockResolvedValueOnce('denied')   // first tap
      .mockResolvedValueOnce('granted'); // retry tap
    const { nav } = renderScreen();

    // First tap — deny
    await act(async () => {
      fireEvent.press(screen.getByText(VERIFY_LABEL));
    });

    // Retry tap — grant
    await act(async () => {
      fireEvent.press(screen.getByText(RETRY_LABEL));
    });

    expect(nav.navigate).toHaveBeenCalledWith('Page31FaceCaptureScreen');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (e): Permanent-deny → Open Settings + Snackbar
// ═════════════════════════════════════════════════════════════════════════════

describe('Page30FaceIntroScreen — AC (e): permanent-deny → Open Settings + Snackbar', () => {
  async function reachPermanentDeny() {
    mockRequestCameraPermission
      .mockResolvedValueOnce('denied')  // first tap
      .mockResolvedValueOnce('denied'); // retry tap (permanent)
    const result = renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByText(VERIFY_LABEL));
    });

    await act(async () => {
      fireEvent.press(screen.getByText(RETRY_LABEL));
    });

    return result;
  }

  it('given two consecutive denials, then Open Settings button becomes visible', async () => {
    await reachPermanentDeny();

    await waitFor(() => {
      expect(screen.getByText(OPEN_SETTINGS_LABEL)).toBeTruthy();
    });
  });

  it('given permanent deny, then Snackbar toast message is rendered', async () => {
    await reachPermanentDeny();

    await waitFor(() => {
      expect(screen.getByText(PERMISSION_REQUIRED_MESSAGE)).toBeTruthy();
    });
  });

  it('given permanent deny, when Open Settings is tapped, then Linking.openSettings is called', async () => {
    await reachPermanentDeny();

    await waitFor(() => {
      expect(screen.getByText(OPEN_SETTINGS_LABEL)).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText(OPEN_SETTINGS_LABEL));
    });

    expect(openSettingsSpy).toHaveBeenCalledTimes(1);
  });

  it('given permanent deny via "restricted" status (already denied at OS), then Open Settings button becomes visible', async () => {
    // 'restricted' is mapped to 'denied' by requestCameraPermission service.
    // Simulate two 'denied' returns at the service layer to reach permanent deny.
    mockRequestCameraPermission
      .mockResolvedValueOnce('denied')
      .mockResolvedValueOnce('denied');
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByText(VERIFY_LABEL));
    });

    await act(async () => {
      fireEvent.press(screen.getByText(RETRY_LABEL));
    });

    await waitFor(() => {
      expect(screen.getByText(OPEN_SETTINGS_LABEL)).toBeTruthy();
    });
  });
});
