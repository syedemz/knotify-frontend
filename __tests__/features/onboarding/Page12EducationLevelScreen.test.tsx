/**
 * Wiring tests for Page12EducationLevelScreen (story 5.1).
 *
 * Covers all AC-enumerated cases:
 * (a) Auto-advance on tap: update({education_level}) + advance(13) +
 *     navigate('Page13EducationCredentialsScreen').
 * (b) education_level written to draft on tap.
 * (c) List length equals `options.educationLevel.length` (never hardcoded).
 * (d) Re-tap no-op: tapping the already-selected row fires neither update
 *     nor advance nor navigate.
 * (e) Back-navigation: prior selection is shown as selected on remount.
 * (f) WizardHeader back navigation calls navigation.goBack.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

// ── Module mocks (hoisted by babel-jest) ──────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(
        ctx.Provider,
        { value: INSETS },
        Rct.createElement(RN.View, null, props.children),
      );
    },
    SafeAreaConsumer: function (props: any) {
      return props.children(INSETS);
    },
    SafeAreaView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () {
      return INSETS;
    },
    useSafeAreaFrame: function () {
      return { x: 0, y: 0, width: 375, height: 812 };
    },
    initialWindowMetrics: {
      insets: INSETS,
      frame: { x: 0, y: 0, width: 375, height: 812 },
    },
  };
});

jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    GestureHandlerRootView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    Swipeable: RN.View,
    DrawerLayout: RN.View,
    State: {},
    ScrollView: RN.ScrollView,
    Slider: RN.View,
    Switch: RN.View,
    TextInput: RN.View,
    PanGestureHandler: RN.View,
    TapGestureHandler: RN.View,
    RawButton: RN.View,
    BaseButton: RN.View,
    RectButton: RN.View,
    BorderlessButton: RN.View,
    LongPressGestureHandler: RN.View,
    FlatList: RN.FlatList,
    gestureHandlerRootHOC: function (C: any) {
      return C;
    },
    Directions: {},
    Gesture: {
      Tap: jest.fn(),
      Pan: jest.fn(),
      Pinch: jest.fn(),
      Rotation: jest.fn(),
      Fling: jest.fn(),
      LongPress: jest.fn(),
      Exclusive: jest.fn(),
      Simultaneous: jest.fn(),
      Race: jest.fn(),
    },
    GestureDetector: RN.View,
    NativeViewGestureHandler: RN.View,
    FlingGestureHandler: RN.View,
    ForceTouchGestureHandler: RN.View,
    PinchGestureHandler: RN.View,
    RotationGestureHandler: RN.View,
  };
});

jest.mock('@gorhom/bottom-sheet', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    __esModule: true,
    default: Rct.forwardRef(function (props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    BottomSheetScrollView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    BottomSheetFlatList: RN.View,
    BottomSheetSectionList: RN.View,
    BottomSheetTextInput: RN.View,
    BottomSheetBackdrop: RN.View,
    useBottomSheet: jest.fn(),
    useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function (props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetModalProvider: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
  };
});

jest.mock('react-native-reanimated', () => {
  const m = require('react-native-reanimated/mock');
  m.default.call = jest.fn();
  return m;
});

jest.mock('expo-image', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    Image: function (props: any) {
      return Rct.createElement(RN.Image, {
        source: props.source,
        accessibilityLabel: props.accessibilityLabel ?? '',
        testID: 'expo-image',
      });
    },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── useOnboardingDraft mock ───────────────────────────────────────────────────

const mockUpdate = jest.fn();
const mockAdvance = jest.fn();
const mockGetDraft = jest.fn();

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  useOnboardingDraft: () => ({
    update: mockUpdate,
    advance: mockAdvance,
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: mockGetDraft,
    setSiblings: jest.fn(),
    isLoading: false,
  }),
}));

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { options } from '@/config/options';
import { Page12EducationLevelScreen } from '@/features/onboarding/screens/Page12EducationLevelScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns a fresh mock navigation object. */
function mockNavigation(canGoBack = true) {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(canGoBack),
  };
}

function mockRoute() {
  return {
    key: 'Page12EducationLevelScreen',
    name: 'Page12EducationLevelScreen' as const,
    params: undefined,
  };
}

/**
 * Builds a minimal draft object for getDraft().
 *
 * @param educationLevel - The prior selection to seed into the draft, or null
 *   for a fresh (unvisited) screen.
 */
function makeDraft(educationLevel: string | null = null) {
  return {
    schemaVersion: 1 as const,
    lastCheckpoint: 'firstCheckpoint' as const,
    currentPage: 12,
    fields: educationLevel !== null ? { education_level: educationLevel } : {},
    siblings: [],
    photoPreviewUris: [],
    notificationPermissionStatus: null,
    locationPermissionStatus: null,
    timestamps: { createdAt: '', updatedAt: '' },
  };
}

function renderScreen(
  nav = mockNavigation(),
  existingLevel: string | null = null,
) {
  mockGetDraft.mockReturnValue(makeDraft(existingLevel));
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page12EducationLevelScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

beforeEach(() => {
  mockUpdate.mockClear();
  mockAdvance.mockClear();
  mockGetDraft.mockClear();
});

// ── Mount ─────────────────────────────────────────────────────────────────────

describe('Page12EducationLevelScreen — mount', () => {
  it('given the screen, when rendered, then it mounts without throwing', () => {
    expect(() => renderScreen()).not.toThrow();
  });

  it('given the screen renders, then the screen title is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.education.title'))).toBeTruthy();
  });
});

// ── AC: List length equals options.educationLevel.length ─────────────────────

describe('Page12EducationLevelScreen — list length (AC)', () => {
  it('given the screen renders, then every education level option appears as an accessible row', () => {
    renderScreen();
    for (const level of options.educationLevel) {
      expect(screen.getByLabelText(level)).toBeTruthy();
    }
  });

  it('given the screen renders, then the row count equals options.educationLevel.length (never hardcoded)', () => {
    renderScreen();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(options.educationLevel.length);
  });

  it('given the screen renders with no prior selection, then no row is checked initially', () => {
    renderScreen();
    const checkboxes = screen.getAllByRole('checkbox');
    for (const cb of checkboxes) {
      expect(cb.props.accessibilityState.checked).toBe(false);
    }
  });
});

// ── AC: Auto-advance on tap — update, advance, navigate ──────────────────────

describe('Page12EducationLevelScreen — auto-advance on tap (AC)', () => {
  const firstLevel = options.educationLevel[0];
  if (firstLevel === undefined) throw new Error('options.educationLevel is empty');

  it('given a level is tapped, then update is called with education_level', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(firstLevel));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ education_level: firstLevel });
  });

  it('given a level is tapped, then advance is called with 13', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(firstLevel));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(13);
  });

  it('given a level is tapped, then navigation goes to Page13EducationCredentialsScreen', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText(firstLevel));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('Page13EducationCredentialsScreen');
  });

  it('given any level is tapped, then the row becomes selected', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(firstLevel));
    const row = screen.getByLabelText(firstLevel);
    expect(row.props.accessibilityState.checked).toBe(true);
  });
});

// ── AC: education_level written to draft ─────────────────────────────────────

describe('Page12EducationLevelScreen — education_level written to draft (AC)', () => {
  it('given "Graduate And Above" is tapped, then update receives education_level="Graduate And Above"', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Graduate And Above'));
    expect(mockUpdate).toHaveBeenCalledWith({ education_level: 'Graduate And Above' });
  });

  it('given "Medical Doctor / PHD" is tapped, then update receives education_level="Medical Doctor / PHD"', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Medical Doctor / PHD'));
    expect(mockUpdate).toHaveBeenCalledWith({ education_level: 'Medical Doctor / PHD' });
  });
});

// ── AC: Re-tap no-op ──────────────────────────────────────────────────────────

describe('Page12EducationLevelScreen — re-tap no-op (AC)', () => {
  const firstLevel = options.educationLevel[0];
  if (firstLevel === undefined) throw new Error('options.educationLevel is empty');

  it('given a level is tapped twice, then update is called only once', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(firstLevel));
    fireEvent.press(screen.getByLabelText(firstLevel));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('given a level is tapped twice, then advance is called only once', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(firstLevel));
    fireEvent.press(screen.getByLabelText(firstLevel));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
  });

  it('given a level is tapped twice, then navigate fires only once', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText(firstLevel));
    fireEvent.press(screen.getByLabelText(firstLevel));
    expect(nav.navigate).toHaveBeenCalledTimes(1);
  });
});

// ── AC: Back-navigation — prior selection shown as selected ──────────────────

describe('Page12EducationLevelScreen — back-navigation shows prior selection (AC)', () => {
  it('given the draft already has education_level set, then that row is shown as selected on mount', () => {
    renderScreen(mockNavigation(), 'Graduate And Above');
    const row = screen.getByLabelText('Graduate And Above');
    expect(row.props.accessibilityState.checked).toBe(true);
  });

  it('given the draft has education_level="High School (10th)", then that row is checked and others are not', () => {
    renderScreen(mockNavigation(), 'High School (10th)');
    const selectedRow = screen.getByLabelText('High School (10th)');
    expect(selectedRow.props.accessibilityState.checked).toBe(true);

    // All other rows should be unchecked.
    const otherLevels = options.educationLevel.filter(
      (l) => l !== 'High School (10th)',
    );
    for (const level of otherLevels) {
      const row = screen.getByLabelText(level);
      expect(row.props.accessibilityState.checked).toBe(false);
    }
  });

  it('given back-nav with prior selection, then tapping a different level overwrites the draft', () => {
    renderScreen(mockNavigation(), 'Graduate And Above');
    fireEvent.press(screen.getByLabelText('Medical Doctor / PHD'));
    expect(mockUpdate).toHaveBeenCalledWith({ education_level: 'Medical Doctor / PHD' });
  });
});

// ── WizardHeader back ─────────────────────────────────────────────────────────

describe('Page12EducationLevelScreen — WizardHeader', () => {
  it('given the screen renders, then at least one back element is accessible', () => {
    renderScreen();
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    expect(backButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('given WizardHeader back is pressed, then navigation.goBack is called', () => {
    const { nav } = renderScreen();
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    const firstBack = backButtons[0];
    if (firstBack === undefined) throw new Error('No back button found');
    fireEvent.press(firstBack);
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });

  it('given the screen is the stack root (canGoBack=false), then the WizardHeader back button is hidden', () => {
    renderScreen(mockNavigation(false));
    expect(screen.queryByLabelText(t('wizard.header.back'))).toBeNull();
  });
});
