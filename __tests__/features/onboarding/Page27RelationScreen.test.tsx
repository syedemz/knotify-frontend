/**
 * Wiring tests for Page27RelationScreen (story 9.2).
 *
 * AC coverage:
 * (i)   Mount with empty draft → no row highlighted, advance NOT called.
 * (ii)  Tap "Myself" → writes `relation='Myself'`, calls advance(28), and
 *       navigates to Page28PhotosScreen.
 * (iii) Re-visit with `relation='Son'` in draft → Son row highlighted,
 *       advance NOT called on mount, navigate NOT called on mount.
 *
 * Additional coverage:
 * (iv)  Tap any row → update called with { relation: <tapped value> }.
 * (v)   Tap any row → navigate called with 'Page28PhotosScreen'.
 * (vi)  Fresh mount: update NOT called on mount.
 * (vii) All six relation options render as rows.
 * (viii) Re-visit: update NOT called on mount.
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
import { Page27RelationScreen } from '@/features/onboarding/screens/Page27RelationScreen';

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
    key: 'Page27RelationScreen',
    name: 'Page27RelationScreen' as const,
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
    currentPage: 27,
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
        <Page27RelationScreen navigation={nav as any} route={mockRoute() as any} />
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
// AC (i): Mount with empty draft → header renders, no row highlighted,
//          advance NOT called
// ═════════════════════════════════════════════════════════════════════════════

describe('Page27RelationScreen — AC (i): empty mount', () => {
  it('given a fresh mount, then renders the header "Who are you creating this profile for?"', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.relation.title'))).toBeTruthy();
  });

  it('given a fresh mount, then renders a row for each option in options.relation', () => {
    renderScreen();
    for (const value of options.relation) {
      expect(screen.getByText(value)).toBeTruthy();
    }
  });

  it('given a fresh mount, then all six relation rows render', () => {
    renderScreen();
    expect(options.relation).toHaveLength(6);
    for (const value of options.relation) {
      expect(screen.getByLabelText(value)).toBeTruthy();
    }
  });

  it('given a fresh mount (no draft value), then no row is highlighted', () => {
    renderScreen();
    for (const value of options.relation) {
      const row = screen.getByLabelText(value);
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
// AC (ii): Tap "Myself" → writes relation='Myself', advances to Page28
// ═════════════════════════════════════════════════════════════════════════════

describe('Page27RelationScreen — AC (ii): tap "Myself" writes + advances', () => {
  it('given a tap on "Myself", then update is called with { relation: "Myself" }', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Myself'));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ relation: 'Myself' });
  });

  it('given a tap on "Myself", then advance(28) is called', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Myself'));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(28);
  });

  it('given a tap on "Myself", then navigate to Page28PhotosScreen is called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText('Myself'));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('Page28PhotosScreen');
  });

  it('given a tap on the last option "Ward", then update is called with { relation: "Ward" }', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Ward'));
    expect(mockUpdate).toHaveBeenCalledWith({ relation: 'Ward' });
    expect(mockAdvance).toHaveBeenCalledWith(28);
  });

  it('given a tap on any row, then only that row becomes highlighted', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Daughter'));
    const selectedRow = screen.getByLabelText('Daughter');
    expect(selectedRow.props.accessibilityState?.checked).toBe(true);
    // Other rows should not be highlighted
    for (const value of options.relation) {
      if (value === 'Daughter') continue;
      const otherRow = screen.getByLabelText(value);
      expect(otherRow.props.accessibilityState?.checked).not.toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (iii): Re-visit with relation='Son' → Son row highlighted, no auto-advance
// ═════════════════════════════════════════════════════════════════════════════

describe('Page27RelationScreen — AC (iii): re-visit with saved relation', () => {
  it('given draft has relation="Son", then the Son row is highlighted on mount', () => {
    renderScreen({ relation: 'Son' });
    const row = screen.getByLabelText('Son');
    // ListRowSelectable uses accessibilityState.checked (not .selected) per
    // the component implementation (accessibilityRole="radio").
    expect(row.props.accessibilityState?.checked).toBe(true);
  });

  it('given draft has relation="Son", then other rows are NOT highlighted', () => {
    renderScreen({ relation: 'Son' });
    for (const value of options.relation) {
      if (value === 'Son') continue;
      const row = screen.getByLabelText(value);
      expect(row.props.accessibilityState?.checked).not.toBe(true);
    }
  });

  it('given draft has relation="Son" on re-visit, then advance is NOT called on mount', () => {
    renderScreen({ relation: 'Son' });
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given draft has relation="Son" on re-visit, then navigate is NOT called on mount', () => {
    const { nav } = renderScreen({ relation: 'Son' });
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('given draft has relation="Son" on re-visit, then update is NOT called on mount', () => {
    renderScreen({ relation: 'Son' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given draft has relation="Son" on re-visit and user taps "Friend", then advance fires', () => {
    const { nav } = renderScreen({ relation: 'Son' });
    fireEvent.press(screen.getByLabelText('Friend'));
    expect(mockUpdate).toHaveBeenCalledWith({ relation: 'Friend' });
    expect(mockAdvance).toHaveBeenCalledWith(28);
    expect(nav.navigate).toHaveBeenCalledWith('Page28PhotosScreen');
  });
});
