/**
 * Wiring tests for Page31FaceCaptureScreen (capture-only).
 *
 * Page 31 is now capture-only: it renders the camera preview + oval overlay
 * and a shutter button. On capture it writes the URI to the onboarding draft
 * and navigates to Page32ConfirmSelfieScreen with `{ faceSelfieUri }`. The
 * PATCH submit sequence lives on Page 32 and is tested there.
 *
 * AC coverage:
 * (a) Initial render — camera preview and shutter button visible.
 * (b) Shutter tap → setFaceSelfieUri is called with a `file://` URI.
 * (c) Shutter tap → navigation.navigate('Page32ConfirmSelfieScreen', { faceSelfieUri }).
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

// useFocusEffect requires a NavigationContainer at runtime. Stub it to call
// the effect callback once on mount — mirrors the "focused" behavior for the
// initial render.
jest.mock('@react-navigation/native', () => {
  const Rct = require('react') as typeof import('react');
  return {
    useFocusEffect: (cb: () => void | (() => void)) => {
      Rct.useEffect(() => cb(), [cb]);
    },
  };
});

// ── useOnboardingDraft mock ───────────────────────────────────────────────────

const mockSetFaceSelfieUri = jest.fn();

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  OnboardingDraftProvider: ({ children }: any) => children,
  useOnboardingDraft: () => ({
    update: jest.fn(),
    advance: jest.fn(),
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: jest.fn(),
    setSiblings: jest.fn(),
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    setPhotoPreviewUris: jest.fn(),
    setFaceSelfieUri: mockSetFaceSelfieUri,
    clear: jest.fn(),
    isLoading: false,
  }),
}));

// ── useAutoCaptureController mock ─────────────────────────────────────────────

const mockAutoCaptureReset = jest.fn();
const mockAutoCaptureOnFrame = jest.fn();

jest.mock('@/features/onboarding/hooks/useAutoCaptureController', () => ({
  useAutoCaptureController: () => ({
    shouldCapture: false,
    onFrame: mockAutoCaptureOnFrame,
    reset: mockAutoCaptureReset,
  }),
  CONSECUTIVE_FRAMES_REQUIRED: 150,
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { useCameraDevice } from 'react-native-vision-camera';
import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { Page31FaceCaptureScreen } from '@/features/onboarding/screens/Page31FaceCaptureScreen';

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

function renderScreen(nav = mockNavigation()) {
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
  // The __mocks__/react-native-vision-camera.ts auto-mock returns `undefined`
  // from useCameraDevice by default; override so <Camera> mounts.
  (useCameraDevice as unknown as jest.Mock).mockReturnValue({
    id: 'mock-front',
    position: 'front',
  });
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

  it('given fresh mount, then camera preview is visible', () => {
    renderScreen();
    expect(screen.getByTestId('camera-preview')).toBeTruthy();
  });
});

// ── AC (b): shutter tap → setFaceSelfieUri ────────────────────────────────────

describe('Page31FaceCaptureScreen — AC (b): shutter tap writes URI to draft', () => {
  it('given shutter button tapped, then setFaceSelfieUri is called with file:// URI', async () => {
    renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });

    await waitFor(() => {
      expect(mockSetFaceSelfieUri).toHaveBeenCalledWith(expect.stringMatching(/^file:\/\//));
    });
  });
});

// ── AC (c): shutter tap → navigate to Page 32 ────────────────────────────────

describe('Page31FaceCaptureScreen — AC (c): navigates to Page 32 with URI', () => {
  it('given shutter button tapped, then navigation.navigate is called with Page32 + URI param', async () => {
    const { nav } = renderScreen();

    await act(async () => {
      fireEvent.press(screen.getByTestId('shutter-button'));
    });

    await waitFor(() => {
      expect(nav.navigate).toHaveBeenCalledWith(
        'Page32ConfirmSelfieScreen',
        expect.objectContaining({ faceSelfieUri: expect.stringMatching(/^file:\/\//) }),
      );
    });
  });
});
