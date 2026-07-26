/**
 * Wiring tests for Page22PartnersReligiousLevelScreen (story 8.3).
 *
 * AC coverage:
 * (i)   Mount renders header "How Religious would you like your partner to be?"
 *       and all rows from options.religiousLevel.
 * (ii)  Tap on a row writes `partners_religious_level`, calls advance(23), and
 *       navigates to Page23MaritalStatusScreen.
 * (iii) Re-visit (draft has partners_religious_level): the previously-selected
 *       row is highlighted (accessibilityState.checked=true) but advance is NOT
 *       called on mount.
 * (iv)  Re-visit: update is NOT called on mount (no side-effect write).
 * (v)   Fresh mount: no row is highlighted (all checked=false).
 * (vi)  Fresh mount: advance is NOT called, navigate is NOT called.
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
import { options } from '@/config/options';
import { Page22PartnersReligiousLevelScreen } from '@/features/onboarding/screens/Page22PartnersReligiousLevelScreen';

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
    key: 'Page22PartnersReligiousLevelScreen',
    name: 'Page22PartnersReligiousLevelScreen' as const,
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
    currentPage: 22,
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
        <Page22PartnersReligiousLevelScreen navigation={nav as any} route={mockRoute() as any} />
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
// (i) Mount — header and rows render
// ═════════════════════════════════════════════════════════════════════════════

describe('Page22PartnersReligiousLevelScreen — mount', () => {
  it('given a fresh mount, then renders the header "How Religious would you like your partner to be?"', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.partnersReligiousLevel.title'))).toBeTruthy();
  });

  it('given a fresh mount, then renders a row for each option in options.religiousLevel', () => {
    renderScreen();
    for (const level of options.religiousLevel) {
      expect(screen.getByText(level)).toBeTruthy();
    }
  });

  it('given a fresh mount (no draft value), then no row is highlighted', () => {
    renderScreen();
    for (const level of options.religiousLevel) {
      const row = screen.getByLabelText(level);
      expect(row.props.accessibilityState?.checked).not.toBe(true);
    }
  });

  it('given a fresh mount, then advance is NOT called', () => {
    renderScreen();
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given a fresh mount, then navigate is NOT called', () => {
    const { nav } = renderScreen();
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('given a fresh mount, then update is NOT called', () => {
    renderScreen();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (ii) Tap on a row — writes draft + advances
// ═════════════════════════════════════════════════════════════════════════════

describe('Page22PartnersReligiousLevelScreen — wiring: tap writes + advances', () => {
  it('given a tap on a row, then update is called with { partners_religious_level: <tapped> }', () => {
    const firstOption = options.religiousLevel[0];
    if (firstOption === undefined) throw new Error('options.religiousLevel is empty');
    renderScreen();
    fireEvent.press(screen.getByLabelText(firstOption));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ partners_religious_level: firstOption });
  });

  it('given a tap on a row, then advance(23) is called', () => {
    const firstOption = options.religiousLevel[0];
    if (firstOption === undefined) throw new Error('options.religiousLevel is empty');
    renderScreen();
    fireEvent.press(screen.getByLabelText(firstOption));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(23);
  });

  it('given a tap on a row, then navigate to Page23MaritalStatusScreen is called', () => {
    const firstOption = options.religiousLevel[0];
    if (firstOption === undefined) throw new Error('options.religiousLevel is empty');
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText(firstOption));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('Page23MaritalStatusScreen');
  });

  it('given a tap on the last option row, then update is called with that option', () => {
    const lastOption = options.religiousLevel[options.religiousLevel.length - 1];
    if (lastOption === undefined) throw new Error('options.religiousLevel is empty');
    renderScreen();
    fireEvent.press(screen.getByLabelText(lastOption));
    expect(mockUpdate).toHaveBeenCalledWith({ partners_religious_level: lastOption });
    expect(mockAdvance).toHaveBeenCalledWith(23);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// (iii) Re-visit — highlight restored, auto-advance NOT re-fired
// ═════════════════════════════════════════════════════════════════════════════

describe('Page22PartnersReligiousLevelScreen — wiring: re-visit', () => {
  it('given draft has partners_religious_level, then that row is highlighted on mount', () => {
    const savedLevel = options.religiousLevel[0];
    if (savedLevel === undefined) throw new Error('options.religiousLevel is empty');
    renderScreen({ partners_religious_level: savedLevel });
    const row = screen.getByLabelText(savedLevel);
    // ListRowSelectable uses accessibilityState.checked (not .selected) because
    // it uses accessibilityRole="radio".
    expect(row.props.accessibilityState?.checked).toBe(true);
  });

  it('given draft has partners_religious_level, then other rows are NOT highlighted', () => {
    const savedLevel = options.religiousLevel[0];
    if (savedLevel === undefined) throw new Error('options.religiousLevel is empty');
    renderScreen({ partners_religious_level: savedLevel });
    for (const level of options.religiousLevel) {
      if (level === savedLevel) continue;
      const row = screen.getByLabelText(level);
      expect(row.props.accessibilityState?.checked).not.toBe(true);
    }
  });

  it('given draft has partners_religious_level on re-visit, then advance is NOT called on mount', () => {
    const savedLevel = options.religiousLevel[0];
    if (savedLevel === undefined) throw new Error('options.religiousLevel is empty');
    renderScreen({ partners_religious_level: savedLevel });
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given draft has partners_religious_level on re-visit, then navigate is NOT called on mount', () => {
    const savedLevel = options.religiousLevel[0];
    if (savedLevel === undefined) throw new Error('options.religiousLevel is empty');
    const { nav } = renderScreen({ partners_religious_level: savedLevel });
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('given draft has partners_religious_level on re-visit, then update is NOT called on mount', () => {
    const savedLevel = options.religiousLevel[0];
    if (savedLevel === undefined) throw new Error('options.religiousLevel is empty');
    renderScreen({ partners_religious_level: savedLevel });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given draft has partners_religious_level on re-visit and user taps a new row, then advance fires', () => {
    const savedLevel = options.religiousLevel[0];
    const newLevel = options.religiousLevel[1];
    if (savedLevel === undefined || newLevel === undefined) throw new Error('options.religiousLevel too short');
    const { nav } = renderScreen({ partners_religious_level: savedLevel });
    fireEvent.press(screen.getByLabelText(newLevel));
    expect(mockUpdate).toHaveBeenCalledWith({ partners_religious_level: newLevel });
    expect(mockAdvance).toHaveBeenCalledWith(23);
    expect(nav.navigate).toHaveBeenCalledWith('Page23MaritalStatusScreen');
  });
});
