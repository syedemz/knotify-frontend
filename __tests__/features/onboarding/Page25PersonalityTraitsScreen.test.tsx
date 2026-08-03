/**
 * Wiring tests for Page25PersonalityTraitsScreen (story 9.1 + fix/page-25-personality-pill-layout).
 *
 * AC coverage:
 * (i)   Mount with empty preferences → no pills selected, Continue ENABLED with "Continue" label,
 *        no Skip button present.
 * (ii)  Tap 1 pill → Continue shows "Select (1)", still enabled.
 * (iii) Tap 5 pills → 6th tap rejected (cap-exceeded toast shown).
 * (iv)  Tap Continue with 3 traits → writes preferences: { personalityTraits: [...3 traits] },
 *        advances to Page27.
 * (v)   Tap Continue with 0 traits → does NOT write, advances to Page27.
 * (vi)  Re-visit with 3 traits in draft → 3 pills pre-selected, Continue "Select (3)",
 *        no auto-advance.
 * (vii) Re-visit and deselect all → Continue shows "Continue" and is still enabled.
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
import { Page25PersonalityTraitsScreen } from '@/features/onboarding/screens/Page25PersonalityTraitsScreen';

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
    key: 'Page25Preferences1Screen',
    name: 'Page25Preferences1Screen' as const,
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
    currentPage: 25,
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
        <Page25PersonalityTraitsScreen navigation={nav as any} route={mockRoute() as any} />
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
// AC (i): Mount with empty preferences → no pills selected, Continue ENABLED,
//          label "Continue", no Skip button present
// ═════════════════════════════════════════════════════════════════════════════

describe('Page25PersonalityTraitsScreen — AC (i): empty mount', () => {
  it('given a fresh mount, then renders the page title', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.personalityTraits.title'))).toBeTruthy();
  });

  it('given a fresh mount, then renders the subtitle', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.personalityTraits.subtitle'))).toBeTruthy();
  });

  it('given a fresh mount, then renders some pills (spot-check "Adventurous")', () => {
    renderScreen();
    expect(screen.getByLabelText('Adventurous')).toBeTruthy();
  });

  it('given a fresh mount, then renders the "Confident" pill', () => {
    renderScreen();
    expect(screen.getByLabelText('Confident')).toBeTruthy();
  });

  it('given a fresh mount, then no pill has accessibilityState.selected=true', () => {
    renderScreen();
    const pill = screen.getByLabelText('Adventurous');
    expect(pill.props.accessibilityState?.selected).not.toBe(true);
  });

  it('given a fresh mount, then the Continue button is enabled with label "Continue"', () => {
    renderScreen();
    const continueLabel = t('onboarding.personalityTraits.continueLabelEmpty');
    const continueBtn = screen.getByLabelText(continueLabel);
    expect(continueBtn.props.accessibilityState?.disabled).not.toBe(true);
  });

  it('given a fresh mount, then no Skip button is present', () => {
    renderScreen();
    // The skip label key no longer exists — querying by any skip-related text
    // should return nothing.
    expect(screen.queryByLabelText('Skip')).toBeNull();
    expect(screen.queryByLabelText('چھوڑ دیں')).toBeNull();
  });

  it('given a fresh mount, then update is NOT called on mount', () => {
    renderScreen();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given a fresh mount, then advance is NOT called on mount', () => {
    renderScreen();
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given a fresh mount, then navigate is NOT called on mount', () => {
    const { nav } = renderScreen();
    expect(nav.navigate).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (ii): Tap 1 pill → Continue shows "Select (1)", still enabled
// ═════════════════════════════════════════════════════════════════════════════

describe('Page25PersonalityTraitsScreen — AC (ii): tap 1 pill', () => {
  it('given a tap on "Adventurous", then that pill is selected', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    const pill = screen.getByLabelText('Adventurous');
    expect(pill.props.accessibilityState?.selected).toBe(true);
  });

  it('given a tap on "Adventurous", then Continue label reads "Select (1)"', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    expect(screen.getByLabelText('Select (1)')).toBeTruthy();
  });

  it('given a tap on "Adventurous", then Continue button is enabled', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    const continueBtn = screen.getByLabelText('Select (1)');
    expect(continueBtn.props.accessibilityState?.disabled).not.toBe(true);
  });

  it('given a tap on "Adventurous" then again to deselect, then pill is deselected', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    fireEvent.press(screen.getByLabelText('Adventurous'));
    const pill = screen.getByLabelText('Adventurous');
    expect(pill.props.accessibilityState?.selected).not.toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (iii): Tap 5 pills → 6th tap rejected with cap-exceeded toast
// ═════════════════════════════════════════════════════════════════════════════

describe('Page25PersonalityTraitsScreen — AC (iii): selection cap at 5', () => {
  it('given 5 traits selected, then Continue shows "Select (5)"', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    fireEvent.press(screen.getByLabelText('Ambitious'));
    fireEvent.press(screen.getByLabelText('Cheerful'));
    fireEvent.press(screen.getByLabelText('Creative'));
    fireEvent.press(screen.getByLabelText('Confident'));
    expect(screen.getByLabelText('Select (5)')).toBeTruthy();
  });

  it('given 5 traits selected, then tapping a 6th does NOT add it to selection', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    fireEvent.press(screen.getByLabelText('Ambitious'));
    fireEvent.press(screen.getByLabelText('Cheerful'));
    fireEvent.press(screen.getByLabelText('Creative'));
    fireEvent.press(screen.getByLabelText('Confident'));

    // Tap a 6th
    fireEvent.press(screen.getByLabelText('Funny'));
    const sixthPill = screen.getByLabelText('Funny');
    // Should not be selected
    expect(sixthPill.props.accessibilityState?.selected).not.toBe(true);
  });

  it('given 5 traits selected, then tapping a 6th shows the cap-exceeded toast', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    fireEvent.press(screen.getByLabelText('Ambitious'));
    fireEvent.press(screen.getByLabelText('Cheerful'));
    fireEvent.press(screen.getByLabelText('Creative'));
    fireEvent.press(screen.getByLabelText('Confident'));

    fireEvent.press(screen.getByLabelText('Funny'));
    expect(screen.getByLabelText(t('onboarding.personalityTraits.capExceededToast'))).toBeTruthy();
  });

  it('given 5 traits selected and 6th tap rejected, then count stays at 5', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    fireEvent.press(screen.getByLabelText('Ambitious'));
    fireEvent.press(screen.getByLabelText('Cheerful'));
    fireEvent.press(screen.getByLabelText('Creative'));
    fireEvent.press(screen.getByLabelText('Confident'));
    fireEvent.press(screen.getByLabelText('Funny'));

    // Continue still shows (5), not (6)
    expect(screen.getByLabelText('Select (5)')).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (iv): Tap Continue with 3 traits → writes preferences, advances to Page27
// ═════════════════════════════════════════════════════════════════════════════

describe('Page25PersonalityTraitsScreen — AC (iv): Continue tap with 3 traits', () => {
  it('given 3 traits selected, when Continue is tapped, then update is called once', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    fireEvent.press(screen.getByLabelText('Creative'));
    fireEvent.press(screen.getByLabelText('Funny'));
    fireEvent.press(screen.getByLabelText('Select (3)'));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('given 3 traits selected, when Continue is tapped, then update is called with preferences.personalityTraits containing those 3 traits', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    fireEvent.press(screen.getByLabelText('Creative'));
    fireEvent.press(screen.getByLabelText('Funny'));
    fireEvent.press(screen.getByLabelText('Select (3)'));

    const payload = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown>;
    const traits = (payload['preferences'] as { personalityTraits: string[] })?.personalityTraits;
    expect(Array.isArray(traits)).toBe(true);
    expect(traits).toHaveLength(3);
    expect(traits).toContain('Adventurous');
    expect(traits).toContain('Creative');
    expect(traits).toContain('Funny');
  });

  it('given 3 traits selected, when Continue is tapped, then advance(27) is called', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    fireEvent.press(screen.getByLabelText('Creative'));
    fireEvent.press(screen.getByLabelText('Funny'));
    fireEvent.press(screen.getByLabelText('Select (3)'));
    expect(mockAdvance).toHaveBeenCalledWith(27);
  });

  it('given 3 traits selected, when Continue is tapped, then navigate to Page27RelationScreen is called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText('Adventurous'));
    fireEvent.press(screen.getByLabelText('Creative'));
    fireEvent.press(screen.getByLabelText('Funny'));
    fireEvent.press(screen.getByLabelText('Select (3)'));
    expect(nav.navigate).toHaveBeenCalledWith('Page27RelationScreen');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (v): Tap Continue with 0 traits → does NOT write, still advances to Page27
// ═════════════════════════════════════════════════════════════════════════════

describe('Page25PersonalityTraitsScreen — AC (v): Continue tap with 0 traits', () => {
  it('given 0 traits selected, when Continue is tapped, then update is NOT called', () => {
    renderScreen();
    const continueLabel = t('onboarding.personalityTraits.continueLabelEmpty');
    fireEvent.press(screen.getByLabelText(continueLabel));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given 0 traits selected, when Continue is tapped, then advance(27) is called', () => {
    renderScreen();
    const continueLabel = t('onboarding.personalityTraits.continueLabelEmpty');
    fireEvent.press(screen.getByLabelText(continueLabel));
    expect(mockAdvance).toHaveBeenCalledWith(27);
  });

  it('given 0 traits selected, when Continue is tapped, then navigate to Page27RelationScreen is called', () => {
    const { nav } = renderScreen();
    const continueLabel = t('onboarding.personalityTraits.continueLabelEmpty');
    fireEvent.press(screen.getByLabelText(continueLabel));
    expect(nav.navigate).toHaveBeenCalledWith('Page27RelationScreen');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (vi): Re-visit with 3 traits in draft → pre-selected, no auto-advance
// ═════════════════════════════════════════════════════════════════════════════

describe('Page25PersonalityTraitsScreen — AC (vi): re-visit with saved traits', () => {
  const savedTraits = ['Adventurous', 'Creative', 'Funny'];

  it('given draft has 3 saved traits, then those pills are pre-selected on mount', () => {
    renderScreen({ preferences: { personalityTraits: savedTraits } });
    for (const trait of savedTraits) {
      const pill = screen.getByLabelText(trait);
      expect(pill.props.accessibilityState?.selected).toBe(true);
    }
  });

  it('given draft has 3 saved traits, then Continue shows "Select (3)"', () => {
    renderScreen({ preferences: { personalityTraits: savedTraits } });
    expect(screen.getByLabelText('Select (3)')).toBeTruthy();
  });

  it('given draft has 3 saved traits, then Continue is enabled', () => {
    renderScreen({ preferences: { personalityTraits: savedTraits } });
    const continueBtn = screen.getByLabelText('Select (3)');
    expect(continueBtn.props.accessibilityState?.disabled).not.toBe(true);
  });

  it('given draft has 3 saved traits, then advance is NOT called on mount', () => {
    renderScreen({ preferences: { personalityTraits: savedTraits } });
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given draft has 3 saved traits, then navigate is NOT called on mount (no auto-advance)', () => {
    const { nav } = renderScreen({ preferences: { personalityTraits: savedTraits } });
    expect(nav.navigate).not.toHaveBeenCalled();
  });

  it('given draft has 3 saved traits, then update is NOT called on mount', () => {
    renderScreen({ preferences: { personalityTraits: savedTraits } });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given draft has 3 saved traits, then unrelated pills are not pre-selected', () => {
    renderScreen({ preferences: { personalityTraits: savedTraits } });
    const unsaved = screen.getByLabelText('Ambitious');
    expect(unsaved.props.accessibilityState?.selected).not.toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (vii): Re-visit and deselect all → Continue shows "Continue" and is enabled
// ═════════════════════════════════════════════════════════════════════════════

describe('Page25PersonalityTraitsScreen — AC (vii): deselect all on re-visit', () => {
  it('given 1 saved trait, when that trait is deselected, then Continue label reverts to "Continue"', () => {
    renderScreen({ preferences: { personalityTraits: ['Adventurous'] } });
    fireEvent.press(screen.getByLabelText('Adventurous'));
    const continueLabel = t('onboarding.personalityTraits.continueLabelEmpty');
    expect(screen.getByLabelText(continueLabel)).toBeTruthy();
  });

  it('given 1 saved trait deselected, then Continue is still enabled', () => {
    renderScreen({ preferences: { personalityTraits: ['Adventurous'] } });
    fireEvent.press(screen.getByLabelText('Adventurous'));
    const continueLabel = t('onboarding.personalityTraits.continueLabelEmpty');
    const continueBtn = screen.getByLabelText(continueLabel);
    expect(continueBtn.props.accessibilityState?.disabled).not.toBe(true);
  });

  it('given all deselected, when Continue is tapped, then advance fires to page 27 without writing', () => {
    const { nav } = renderScreen({ preferences: { personalityTraits: ['Adventurous'] } });
    fireEvent.press(screen.getByLabelText('Adventurous'));
    const continueLabel = t('onboarding.personalityTraits.continueLabelEmpty');
    fireEvent.press(screen.getByLabelText(continueLabel));
    expect(mockAdvance).toHaveBeenCalledWith(27);
    expect(nav.navigate).toHaveBeenCalledWith('Page27RelationScreen');
    // update NOT called — 0 selections skips draft write
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
