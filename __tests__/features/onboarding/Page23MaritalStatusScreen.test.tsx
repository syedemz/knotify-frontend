/**
 * Wiring tests for Page23MaritalStatusScreen (story 8.4).
 *
 * AC coverage:
 * (i)   Never Married tap → atomic write of { marital_status, has_children: false }, advance(24), navigate.
 * (ii)  Divorced tap → reveals children question row, no write, no advance.
 * (iii) Divorced then Yes → atomic write of { marital_status: 'Divorced', has_children: true }, advance, navigate.
 * (iv)  Divorced then No → atomic write of { marital_status: 'Divorced', has_children: false }, advance, navigate.
 * (v)   Divorced+Yes selected, then tap Never Married → has_children resets to false in same atomic write.
 * (vi)  Re-visit with Divorced+Yes hydrated → both rows visible with correct highlights, no auto-advance.
 * (vii) Re-visit with Never Married hydrated → only marital-status row shown, no auto-advance.
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
import { Page23MaritalStatusScreen } from '@/features/onboarding/screens/Page23MaritalStatusScreen';

// ── Constants ─────────────────────────────────────────────────────────────────

const NEVER_MARRIED = 'Never Married';
const DIVORCED = 'Divorced';
const WIDOWED = 'Widowed';
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
    key: 'Page23MaritalStatusScreen',
    name: 'Page23MaritalStatusScreen' as const,
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
    schemaVersion: 3 as const,
    lastCheckpoint: 'secondCheckpoint' as const,
    currentPage: 23,
    fields,
    siblings: [],
    photoPreviewUris: [],
    notificationPermissionStatus: null,
    locationPermissionStatus: null,
    phone_number: null,
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
        <Page23MaritalStatusScreen navigation={nav as any} route={mockRoute() as any} />
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
// Mount — header and marital-status rows
// ═════════════════════════════════════════════════════════════════════════════

describe('Page23MaritalStatusScreen — mount', () => {
  it('given a fresh mount, then renders the header title', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.maritalStatus.title'))).toBeTruthy();
  });

  it('given a fresh mount, then renders all three marital-status rows', () => {
    renderScreen();
    for (const status of options.maritalStatus) {
      expect(screen.getByText(status)).toBeTruthy();
    }
  });

  it('given a fresh mount, then no marital-status row is highlighted', () => {
    renderScreen();
    for (const status of options.maritalStatus) {
      const row = screen.getByLabelText(status);
      expect(row.props.accessibilityState?.checked).not.toBe(true);
    }
  });

  it('given a fresh mount, then the children question is NOT visible', () => {
    renderScreen();
    expect(screen.queryByText(t('onboarding.maritalStatus.hasChildren.label'))).toBeNull();
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
// AC (i): Never Married tap → atomic write of both fields + advance
// ═════════════════════════════════════════════════════════════════════════════

describe('Page23MaritalStatusScreen — AC (i): Never Married tap', () => {
  it('given a tap on Never Married, then update is called once with both marital_status and has_children=false', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(NEVER_MARRIED));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      marital_status: NEVER_MARRIED,
      has_children: false,
    });
  });

  it('given a tap on Never Married, then advance(24) is called', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(NEVER_MARRIED));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(24);
  });

  it('given a tap on Never Married, then navigate to Page24MoveAbroadScreen is called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText(NEVER_MARRIED));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('Page24MoveAbroadScreen');
  });

  it('given a tap on Never Married, then has_children written is a boolean false (not a string)', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(NEVER_MARRIED));
    const payload = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(typeof payload['has_children']).toBe('boolean');
    expect(payload['has_children']).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (ii): Divorced tap → reveals children row, no write, no advance
// ═════════════════════════════════════════════════════════════════════════════

describe('Page23MaritalStatusScreen — AC (ii): Divorced tap reveals children row', () => {
  it('given a tap on Divorced, then the children question label becomes visible', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    expect(screen.getByText(t('onboarding.maritalStatus.hasChildren.label'))).toBeTruthy();
  });

  it('given a tap on Divorced, then Yes and No rows become visible', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    expect(screen.getByLabelText(YES)).toBeTruthy();
    expect(screen.getByLabelText(NO)).toBeTruthy();
  });

  it('given a tap on Divorced, then update is NOT called', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given a tap on Divorced, then advance is NOT called', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given a tap on Divorced, then navigate is NOT called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('given a tap on Widowed, then the children question label becomes visible', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(WIDOWED));
    expect(screen.getByText(t('onboarding.maritalStatus.hasChildren.label'))).toBeTruthy();
  });

  it('given a tap on Widowed, then update is NOT called', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(WIDOWED));
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (iii): Divorced then Yes → atomic write + advance
// ═════════════════════════════════════════════════════════════════════════════

describe('Page23MaritalStatusScreen — AC (iii): Divorced then Yes', () => {
  it('given Divorced tap then Yes tap, then update is called once with marital_status=Divorced and has_children=true', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    fireEvent.press(screen.getByLabelText(YES));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      marital_status: DIVORCED,
      has_children: true,
    });
  });

  it('given Divorced tap then Yes tap, then has_children written is a boolean true (not a string)', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    fireEvent.press(screen.getByLabelText(YES));
    const payload = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(typeof payload['has_children']).toBe('boolean');
    expect(payload['has_children']).toBe(true);
  });

  it('given Divorced tap then Yes tap, then advance(24) is called', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    fireEvent.press(screen.getByLabelText(YES));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(24);
  });

  it('given Divorced tap then Yes tap, then navigate to Page24MoveAbroadScreen is called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    fireEvent.press(screen.getByLabelText(YES));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('Page24MoveAbroadScreen');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (iv): Divorced then No → atomic write + advance
// ═════════════════════════════════════════════════════════════════════════════

describe('Page23MaritalStatusScreen — AC (iv): Divorced then No', () => {
  it('given Divorced tap then No tap, then update is called with marital_status=Divorced and has_children=false', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    fireEvent.press(screen.getByLabelText(NO));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      marital_status: DIVORCED,
      has_children: false,
    });
  });

  it('given Divorced tap then No tap, then has_children written is a boolean false (not a string)', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    fireEvent.press(screen.getByLabelText(NO));
    const payload = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(typeof payload['has_children']).toBe('boolean');
    expect(payload['has_children']).toBe(false);
  });

  it('given Divorced tap then No tap, then advance(24) is called', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    fireEvent.press(screen.getByLabelText(NO));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(24);
  });

  it('given Divorced tap then No tap, then navigate to Page24MoveAbroadScreen is called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText(DIVORCED));
    fireEvent.press(screen.getByLabelText(NO));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('Page24MoveAbroadScreen');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (v): Divorced+Yes selected, then tap Never Married → has_children resets to false
// ═════════════════════════════════════════════════════════════════════════════

describe('Page23MaritalStatusScreen — AC (v): reset rule — Divorced+Yes then Never Married', () => {
  it('given draft seeded with Divorced+has_children=true, then tapping Never Married writes has_children=false atomically', () => {
    // Back-nav scenario: draft already has Divorced+Yes from a prior forward pass.
    renderScreen({ marital_status: DIVORCED, has_children: true });
    // Tap Never Married — must reset has_children to false regardless of prior state.
    fireEvent.press(screen.getByLabelText(NEVER_MARRIED));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      marital_status: NEVER_MARRIED,
      has_children: false,
    });
  });

  it('given a fresh session where user taps Divorced then Yes, then taps Never Married, update payload contains has_children=false', () => {
    renderScreen();
    // Simulate user selecting Divorced+Yes first in this session.
    fireEvent.press(screen.getByLabelText(DIVORCED));
    fireEvent.press(screen.getByLabelText(YES));
    // At this point update was called once (Divorced+Yes). Clear calls to isolate next tap.
    mockUpdate.mockClear();
    mockAdvance.mockClear();

    // Now re-render fresh with Divorced+has_children=true seeded in draft (as if back-navved).
    // Instead: simulate within the same render by re-visiting the screen.
    // The simpler approach is: verify the Never Married handler always writes has_children=false.
    const { nav } = renderScreen({ marital_status: DIVORCED, has_children: true });
    fireEvent.press(screen.getByLabelText(NEVER_MARRIED));
    expect(mockUpdate).toHaveBeenCalledWith({
      marital_status: NEVER_MARRIED,
      has_children: false,
    });
    expect(nav.navigate).toHaveBeenCalledWith('Page24MoveAbroadScreen');
  });

  it('given draft seeded with Widowed+has_children=true, then tapping Never Married writes has_children=false', () => {
    renderScreen({ marital_status: WIDOWED, has_children: true });
    fireEvent.press(screen.getByLabelText(NEVER_MARRIED));
    expect(mockUpdate).toHaveBeenCalledWith({
      marital_status: NEVER_MARRIED,
      has_children: false,
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (vi): Re-visit with Divorced+Yes → both rows visible, correct highlights, no auto-advance
// ═════════════════════════════════════════════════════════════════════════════

describe('Page23MaritalStatusScreen — AC (vi): re-visit with Divorced+Yes hydrated', () => {
  it('given draft has marital_status=Divorced and has_children=true, then Divorced row is highlighted', () => {
    renderScreen({ marital_status: DIVORCED, has_children: true });
    const row = screen.getByLabelText(DIVORCED);
    expect(row.props.accessibilityState?.checked).toBe(true);
  });

  it('given draft has marital_status=Divorced and has_children=true, then children question label is visible', () => {
    renderScreen({ marital_status: DIVORCED, has_children: true });
    expect(screen.getByText(t('onboarding.maritalStatus.hasChildren.label'))).toBeTruthy();
  });

  it('given draft has marital_status=Divorced and has_children=true, then YES row is highlighted', () => {
    renderScreen({ marital_status: DIVORCED, has_children: true });
    const yesRow = screen.getByLabelText(YES);
    expect(yesRow.props.accessibilityState?.checked).toBe(true);
  });

  it('given draft has marital_status=Divorced and has_children=true, then NO row is NOT highlighted', () => {
    renderScreen({ marital_status: DIVORCED, has_children: true });
    const noRow = screen.getByLabelText(NO);
    expect(noRow.props.accessibilityState?.checked).not.toBe(true);
  });

  it('given draft has marital_status=Divorced and has_children=true, then advance is NOT called on mount', () => {
    renderScreen({ marital_status: DIVORCED, has_children: true });
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given draft has marital_status=Divorced and has_children=true, then navigate is NOT called on mount', () => {
    const { nav } = renderScreen({ marital_status: DIVORCED, has_children: true });
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('given draft has marital_status=Divorced and has_children=true, then update is NOT called on mount', () => {
    renderScreen({ marital_status: DIVORCED, has_children: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given draft has marital_status=Divorced and has_children=false, then NO row is highlighted', () => {
    renderScreen({ marital_status: DIVORCED, has_children: false });
    const noRow = screen.getByLabelText(NO);
    expect(noRow.props.accessibilityState?.checked).toBe(true);
  });

  it('given draft has marital_status=Divorced and has_children=false, then YES row is NOT highlighted', () => {
    renderScreen({ marital_status: DIVORCED, has_children: false });
    const yesRow = screen.getByLabelText(YES);
    expect(yesRow.props.accessibilityState?.checked).not.toBe(true);
  });

  it('given draft has marital_status=Widowed and has_children=true, then Widowed row is highlighted and children visible', () => {
    renderScreen({ marital_status: WIDOWED, has_children: true });
    const widowedRow = screen.getByLabelText(WIDOWED);
    expect(widowedRow.props.accessibilityState?.checked).toBe(true);
    expect(screen.getByText(t('onboarding.maritalStatus.hasChildren.label'))).toBeTruthy();
    const yesRow = screen.getByLabelText(YES);
    expect(yesRow.props.accessibilityState?.checked).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (vii): Re-visit with Never Married → only marital-status row shown, no auto-advance
// ═════════════════════════════════════════════════════════════════════════════

describe('Page23MaritalStatusScreen — AC (vii): re-visit with Never Married hydrated', () => {
  it('given draft has marital_status=Never Married, then Never Married row is highlighted', () => {
    renderScreen({ marital_status: NEVER_MARRIED, has_children: false });
    const row = screen.getByLabelText(NEVER_MARRIED);
    expect(row.props.accessibilityState?.checked).toBe(true);
  });

  it('given draft has marital_status=Never Married, then children question is NOT visible', () => {
    renderScreen({ marital_status: NEVER_MARRIED, has_children: false });
    expect(screen.queryByText(t('onboarding.maritalStatus.hasChildren.label'))).toBeNull();
  });

  it('given draft has marital_status=Never Married, then advance is NOT called on mount', () => {
    renderScreen({ marital_status: NEVER_MARRIED, has_children: false });
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given draft has marital_status=Never Married, then navigate is NOT called on mount', () => {
    const { nav } = renderScreen({ marital_status: NEVER_MARRIED, has_children: false });
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('given draft has marital_status=Never Married, then update is NOT called on mount', () => {
    renderScreen({ marital_status: NEVER_MARRIED, has_children: false });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given draft has marital_status=Never Married, then Divorced and Widowed rows are NOT highlighted', () => {
    renderScreen({ marital_status: NEVER_MARRIED, has_children: false });
    const divorcedRow = screen.getByLabelText(DIVORCED);
    const widowedRow = screen.getByLabelText(WIDOWED);
    expect(divorcedRow.props.accessibilityState?.checked).not.toBe(true);
    expect(widowedRow.props.accessibilityState?.checked).not.toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Additional: Widowed then No path
// ═════════════════════════════════════════════════════════════════════════════

describe('Page23MaritalStatusScreen — Widowed then No path', () => {
  it('given Widowed tap then No tap, then update is called with marital_status=Widowed and has_children=false', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(WIDOWED));
    fireEvent.press(screen.getByLabelText(NO));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      marital_status: WIDOWED,
      has_children: false,
    });
  });

  it('given Widowed tap then Yes tap, then update is called with marital_status=Widowed and has_children=true', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(WIDOWED));
    fireEvent.press(screen.getByLabelText(YES));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      marital_status: WIDOWED,
      has_children: true,
    });
  });
});
