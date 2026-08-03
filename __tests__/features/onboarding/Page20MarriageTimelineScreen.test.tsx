/**
 * Tests for Page20MarriageTimelineScreen and PillPickOneGroup (story 8.1).
 *
 * Part 1 — PillPickOneGroup component tests:
 *   (i)   Renders subheader label and all option pills.
 *   (ii)  Tapping an option fires onSelect with that option.
 *   (iii) Selected option has accessibilityState.selected=true; others do not.
 *   (iv)  accessibilityPrefix namespaces each pill's accessible label.
 *   (v)   Default prefix falls back to the label prop.
 *
 * Part 2 — Page20MarriageTimelineScreen wiring tests (story 8.1 AC):
 *   (i)   Both selections tapped → update() + advance(21) + navigate to Page21.
 *   (ii)  Only first (primary) selection tapped → no update, no advance, no navigate.
 *   (iii) Only second (secondary) selection tapped → no update, no advance, no navigate.
 *   (iv)  Re-visit with marriage_time set in draft → second pick-one highlighted,
 *         no auto-advance on mount.
 *   (v)   Re-visit: first pick-one starts empty (local state discarded).
 *   (vi)  Primary then secondary: advance fires on the second tap with correct value.
 *   (vii) Secondary then primary: advance fires on the primary tap.
 *   (viii)Mount renders without crash; header text visible.
 *   (ix)  Re-visit with marriage_time: tapping primary completes both → advance fires.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

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

// ── useOnboardingDraft mock (PR #92 pattern) ──────────────────────────────────

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
import { PillPickOneGroup } from '@/components';
import { Page20MarriageTimelineScreen } from '@/features/onboarding/screens/Page20MarriageTimelineScreen';

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
    key: 'Page20MarriageTimelineScreen',
    name: 'Page20MarriageTimelineScreen' as const,
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
    currentPage: 20,
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
        <Page20MarriageTimelineScreen navigation={nav as any} route={mockRoute() as any} />
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
// Part 1 — PillPickOneGroup component tests
// ═════════════════════════════════════════════════════════════════════════════

describe('PillPickOneGroup — renders', () => {
  const testOptions = ['Option A', 'Option B', 'Option C'];
  const onSelect = jest.fn();

  beforeEach(() => onSelect.mockClear());

  it('given a label, then renders the subheader text', () => {
    render(
      <ThemeProvider>
        <PillPickOneGroup
          label="Choose one"
          options={testOptions}
          selected={null}
          onSelect={onSelect}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText('Choose one')).toBeTruthy();
  });

  it('given an options array, then renders a pill for each option', () => {
    render(
      <ThemeProvider>
        <PillPickOneGroup
          label="Choose one"
          options={testOptions}
          selected={null}
          onSelect={onSelect}
        />
      </ThemeProvider>,
    );
    for (const opt of testOptions) {
      expect(screen.getByText(opt)).toBeTruthy();
    }
  });

  it('given selected=null, then no pill has accessibilityState.selected=true', () => {
    render(
      <ThemeProvider>
        <PillPickOneGroup
          label="Choose one"
          options={testOptions}
          selected={null}
          onSelect={onSelect}
          accessibilityPrefix="grp"
        />
      </ThemeProvider>,
    );
    for (const opt of testOptions) {
      const pill = screen.getByLabelText(`grp ${opt}`);
      expect(pill.props.accessibilityState?.selected).not.toBe(true);
    }
  });

  it('given selected="Option B", then that pill has accessibilityState.selected=true', () => {
    render(
      <ThemeProvider>
        <PillPickOneGroup
          label="Choose one"
          options={testOptions}
          selected="Option B"
          onSelect={onSelect}
          accessibilityPrefix="grp"
        />
      </ThemeProvider>,
    );
    const selectedPill = screen.getByLabelText('grp Option B');
    expect(selectedPill.props.accessibilityState?.selected).toBe(true);
  });

  it('given selected="Option B", then other pills do NOT have selected=true', () => {
    render(
      <ThemeProvider>
        <PillPickOneGroup
          label="Choose one"
          options={testOptions}
          selected="Option B"
          onSelect={onSelect}
          accessibilityPrefix="grp"
        />
      </ThemeProvider>,
    );
    const notSelectedA = screen.getByLabelText('grp Option A');
    const notSelectedC = screen.getByLabelText('grp Option C');
    expect(notSelectedA.props.accessibilityState?.selected).not.toBe(true);
    expect(notSelectedC.props.accessibilityState?.selected).not.toBe(true);
  });

  it('given a tap on an option pill, then onSelect is called with that option string', () => {
    render(
      <ThemeProvider>
        <PillPickOneGroup
          label="Choose one"
          options={testOptions}
          selected={null}
          onSelect={onSelect}
          accessibilityPrefix="grp"
        />
      </ThemeProvider>,
    );
    fireEvent.press(screen.getByLabelText('grp Option A'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('Option A');
  });

  it('given accessibilityPrefix prop, then pills use that prefix in their accessible label', () => {
    render(
      <ThemeProvider>
        <PillPickOneGroup
          label="Choose one"
          options={['X', 'Y']}
          selected={null}
          onSelect={onSelect}
          accessibilityPrefix="group1"
        />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('group1 X')).toBeTruthy();
    expect(screen.getByLabelText('group1 Y')).toBeTruthy();
  });

  it('given no accessibilityPrefix, then pills use the label text as prefix', () => {
    render(
      <ThemeProvider>
        <PillPickOneGroup
          label="My Label"
          options={['Alpha']}
          selected={null}
          onSelect={onSelect}
        />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('My Label Alpha')).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Part 2 — Page20MarriageTimelineScreen wiring tests
// ═════════════════════════════════════════════════════════════════════════════

describe('Page20MarriageTimelineScreen — mount', () => {
  it('given a fresh mount, then renders without crashing and shows the header', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.marriageTimeline.title'))).toBeTruthy();
  });

  it('given a fresh mount, then renders both group subheaders', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.marriageTimeline.primary.label'))).toBeTruthy();
    expect(screen.getByText(t('onboarding.marriageTimeline.secondary.label'))).toBeTruthy();
  });

  it('given a fresh mount, then advance is NOT called (no auto-advance on mount)', () => {
    renderScreen();
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given a fresh mount, then update is NOT called (no side effects on mount)', () => {
    renderScreen();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── (i) Both selections tapped → advance ─────────────────────────────────────

describe('Page20MarriageTimelineScreen — wiring (i): primary then secondary → advance', () => {
  it('given primary tapped then secondary tapped, then update called with marriage_time', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('primary 1-2 months'));
    expect(mockUpdate).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('secondary 3-4 years'));
    expect(mockUpdate).toHaveBeenCalledWith({ marriage_time: '3-4 years' });
  });

  it('given primary tapped then secondary tapped, then advance(21) is called', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('primary 1-2 months'));
    fireEvent.press(screen.getByLabelText('secondary 3-4 years'));
    expect(mockAdvance).toHaveBeenCalledWith(21);
  });

  it('given primary tapped then secondary tapped, then navigate to Page21 is called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText('primary 1-2 months'));
    fireEvent.press(screen.getByLabelText('secondary 3-4 years'));
    expect(nav.navigate).toHaveBeenCalledWith('Page21OwnReligiousLevelScreen');
  });
});

describe('Page20MarriageTimelineScreen — wiring (i): secondary then primary → advance', () => {
  it('given secondary tapped then primary tapped, then advance(21) is called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText('secondary 1-2 years'));
    expect(mockAdvance).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText('primary 3-4 months'));
    expect(mockUpdate).toHaveBeenCalledWith({ marriage_time: '1-2 years' });
    expect(mockAdvance).toHaveBeenCalledWith(21);
    expect(nav.navigate).toHaveBeenCalledWith('Page21OwnReligiousLevelScreen');
  });
});

// ── (ii) Only first tapped → no advance ──────────────────────────────────────

describe('Page20MarriageTimelineScreen — wiring (ii): only first tapped → no advance', () => {
  it('given only the primary pick-one is tapped, then advance is NOT called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText('primary 1-2 months'));
    expect(mockAdvance).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

// ── (iii) Only second tapped → no advance ────────────────────────────────────

describe('Page20MarriageTimelineScreen — wiring (iii): only second tapped → no advance', () => {
  it('given only the secondary pick-one is tapped, then advance is NOT called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText('secondary Agree together'));
    expect(mockAdvance).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

// ── (iv) Re-visit with marriage_time set ─────────────────────────────────────

describe('Page20MarriageTimelineScreen — wiring (iv): re-visit with marriage_time in draft', () => {
  it('given draft has marriage_time, then that secondary pill is highlighted (selected)', () => {
    renderScreen({ marriage_time: '3-4 years' });
    const pill = screen.getByLabelText('secondary 3-4 years');
    expect(pill.props.accessibilityState?.selected).toBe(true);
  });

  it('given draft has marriage_time on re-visit, then advance is NOT fired on mount', () => {
    renderScreen({ marriage_time: '1-2 years' });
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given draft has marriage_time on re-visit, then update is NOT called on mount', () => {
    renderScreen({ marriage_time: '4+ years' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given draft has marriage_time on re-visit, then the primary pick-one starts empty', () => {
    renderScreen({ marriage_time: '4+ years' });
    // None of the primary pills should be selected
    const primaryOptions = ['1-2 months', '3-4 months', '4-12 months', '1-2 years'];
    for (const opt of primaryOptions) {
      const pill = screen.getByLabelText(`primary ${opt}`);
      expect(pill.props.accessibilityState?.selected).not.toBe(true);
    }
  });

  it('given draft has marriage_time and primary is tapped, then advance fires with the draft value', () => {
    const nav = mockNavigation();
    mockGetDraft.mockReturnValue(makeDraft({ marriage_time: '4+ years' }));
    render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page20MarriageTimelineScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    );

    // Tap the primary to complete both selections
    fireEvent.press(screen.getByLabelText('primary 1-2 years'));

    expect(mockUpdate).toHaveBeenCalledWith({ marriage_time: '4+ years' });
    expect(mockAdvance).toHaveBeenCalledWith(21);
    expect(nav.navigate).toHaveBeenCalledWith('Page21OwnReligiousLevelScreen');
  });
});
