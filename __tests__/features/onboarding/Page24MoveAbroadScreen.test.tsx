/**
 * Wiring tests for Page24MoveAbroadScreen (story 8.5).
 *
 * AC coverage:
 * (i)   First visit (move_abroad=null in draft) → YES visually highlighted, no draft write on mount.
 * (ii)  Tap YES → writes move_abroad=true (boolean), advance(25), navigate to Page25.
 * (iii) Tap NO → writes move_abroad=false (boolean), advance(25), navigate to Page25.
 * (iv)  Re-visit with move_abroad=true in draft → YES highlighted, no auto-advance.
 * (v)   Re-visit with move_abroad=false in draft → NO highlighted, no auto-advance.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

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

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── useOnboardingDraft mock ───────────────────────────────────────────────────

const mockUpdate = jest.fn();
const mockAdvance = jest.fn();
const mockGetDraft = jest.fn();

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OnboardingDraftProvider: ({ children }: any) => children,
  useOnboardingDraft: () => ({
    update: mockUpdate,
    advance: mockAdvance,
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: mockGetDraft,
    setSiblings: jest.fn(),
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    isLoading: false,
  }),
}));

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { Page24MoveAbroadScreen } from '@/features/onboarding/screens/Page24MoveAbroadScreen';

// ── Constants ─────────────────────────────────────────────────────────────────

const YES = 'YES';
const NO = 'NO';

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
    key: 'Page24MoveAbroadScreen',
    name: 'Page24MoveAbroadScreen' as const,
    params: undefined,
  };
}

/**
 * Builds a minimal draft object for getDraft().
 *
 * @param fields - Optional partial fields to pre-populate (back-nav scenario).
 */
function makeDraft(fields: Record<string, unknown> = {}) {
  return {
    schemaVersion: 2 as const,
    lastCheckpoint: 'secondCheckpoint' as const,
    currentPage: 24,
    fields,
    siblings: [],
    photoPreviewUris: [],
    notificationPermissionStatus: null,
    locationPermissionStatus: null,
    timestamps: { createdAt: '', updatedAt: '' },
  };
}

function renderScreen(
  draftFields: Record<string, unknown> = {},
  nav = mockNavigation(),
) {
  mockGetDraft.mockReturnValue(makeDraft(draftFields));
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page24MoveAbroadScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

beforeEach(() => {
  mockUpdate.mockClear();
  mockAdvance.mockClear();
  mockGetDraft.mockClear();
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (i): First visit — YES pre-selected visually, no draft write on mount
// ═════════════════════════════════════════════════════════════════════════════

describe('Page24MoveAbroadScreen — AC (i): first visit (move_abroad=null)', () => {
  it('given a fresh mount with no prior value, then renders the header title', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.moveAbroad.title'))).toBeTruthy();
  });

  it('given a fresh mount with no prior value, then YES row is visible', () => {
    renderScreen();
    expect(screen.getByLabelText(YES)).toBeTruthy();
  });

  it('given a fresh mount with no prior value, then NO row is visible', () => {
    renderScreen();
    expect(screen.getByLabelText(NO)).toBeTruthy();
  });

  it('given a fresh mount with no prior value, then YES row is highlighted (default pre-select)', () => {
    renderScreen();
    const yesRow = screen.getByLabelText(YES);
    expect(yesRow.props.accessibilityState?.checked).toBe(true);
  });

  it('given a fresh mount with no prior value, then NO row is NOT highlighted', () => {
    renderScreen();
    const noRow = screen.getByLabelText(NO);
    expect(noRow.props.accessibilityState?.checked).not.toBe(true);
  });

  it('given a fresh mount with no prior value, then update is NOT called (pre-select is visual only)', () => {
    renderScreen();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given a fresh mount with no prior value, then advance is NOT called on mount', () => {
    renderScreen();
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given a fresh mount with no prior value, then navigate is NOT called on mount', () => {
    const { nav } = renderScreen();
    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (ii): Tap YES → writes move_abroad=true (boolean), advance, navigate
// ═════════════════════════════════════════════════════════════════════════════

describe('Page24MoveAbroadScreen — AC (ii): tap YES', () => {
  it('given a tap on YES, then update is called once with move_abroad=true', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(YES));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ move_abroad: true });
  });

  it('given a tap on YES, then move_abroad written is a boolean true (not a string)', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(YES));
    const payload = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(typeof payload['move_abroad']).toBe('boolean');
    expect(payload['move_abroad']).toBe(true);
  });

  it('given a tap on YES, then advance(25) is called', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(YES));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(25);
  });

  it('given a tap on YES, then navigate to Page25Preferences1Screen is called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText(YES));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('Page25Preferences1Screen');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (iii): Tap NO → writes move_abroad=false (boolean), advance, navigate
// ═════════════════════════════════════════════════════════════════════════════

describe('Page24MoveAbroadScreen — AC (iii): tap NO', () => {
  it('given a tap on NO, then update is called once with move_abroad=false', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(NO));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ move_abroad: false });
  });

  it('given a tap on NO, then move_abroad written is a boolean false (not a string)', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(NO));
    const payload = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(typeof payload['move_abroad']).toBe('boolean');
    expect(payload['move_abroad']).toBe(false);
  });

  it('given a tap on NO, then advance(25) is called', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(NO));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(25);
  });

  it('given a tap on NO, then navigate to Page25Preferences1Screen is called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText(NO));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('Page25Preferences1Screen');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (iv): Re-visit with move_abroad=true → YES highlighted, no auto-advance
// ═════════════════════════════════════════════════════════════════════════════

describe('Page24MoveAbroadScreen — AC (iv): re-visit with move_abroad=true', () => {
  it('given draft has move_abroad=true, then YES row is highlighted', () => {
    renderScreen({ move_abroad: true });
    const yesRow = screen.getByLabelText(YES);
    expect(yesRow.props.accessibilityState?.checked).toBe(true);
  });

  it('given draft has move_abroad=true, then NO row is NOT highlighted', () => {
    renderScreen({ move_abroad: true });
    const noRow = screen.getByLabelText(NO);
    expect(noRow.props.accessibilityState?.checked).not.toBe(true);
  });

  it('given draft has move_abroad=true, then advance is NOT called on mount (no rubber-band)', () => {
    renderScreen({ move_abroad: true });
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given draft has move_abroad=true, then navigate is NOT called on mount (no rubber-band)', () => {
    const { nav } = renderScreen({ move_abroad: true });
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('given draft has move_abroad=true, then update is NOT called on mount', () => {
    renderScreen({ move_abroad: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (v): Re-visit with move_abroad=false → NO highlighted, no auto-advance
// ═════════════════════════════════════════════════════════════════════════════

describe('Page24MoveAbroadScreen — AC (v): re-visit with move_abroad=false', () => {
  it('given draft has move_abroad=false, then NO row is highlighted', () => {
    renderScreen({ move_abroad: false });
    const noRow = screen.getByLabelText(NO);
    expect(noRow.props.accessibilityState?.checked).toBe(true);
  });

  it('given draft has move_abroad=false, then YES row is NOT highlighted', () => {
    renderScreen({ move_abroad: false });
    const yesRow = screen.getByLabelText(YES);
    expect(yesRow.props.accessibilityState?.checked).not.toBe(true);
  });

  it('given draft has move_abroad=false, then advance is NOT called on mount (no rubber-band)', () => {
    renderScreen({ move_abroad: false });
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given draft has move_abroad=false, then navigate is NOT called on mount (no rubber-band)', () => {
    const { nav } = renderScreen({ move_abroad: false });
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('given draft has move_abroad=false, then update is NOT called on mount', () => {
    renderScreen({ move_abroad: false });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
