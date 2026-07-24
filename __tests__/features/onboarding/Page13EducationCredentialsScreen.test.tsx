/**
 * Wiring tests for Page13EducationCredentialsScreen (story 5.2).
 *
 * Three required AC `it()` blocks per spec:
 * 1. Branch-matrix rendering + auto-defaults on mount.
 * 2. Back-nav downgrade reset: now-irrelevant fields force-reset to sentinels.
 * 3. Continue navigation to Page14SecondCheckpointScreen.
 *
 * Plus supporting tests for: Continue disabled gate, inline error appearance,
 * WizardHeader back, and the elementary-level no-fields case.
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
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    isLoading: false,
  }),
}));

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import {
  Page13EducationCredentialsScreen,
  EDUCATION_TEXT_SENTINEL,
  EDUCATION_YEAR_SENTINEL,
} from '@/features/onboarding/screens/Page13EducationCredentialsScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockNavigation(canGoBack = true) {
  return {
    navigate: jest.fn(),
    goBack: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(canGoBack),
  };
}

function mockRoute() {
  return {
    key: 'Page13EducationCredentialsScreen',
    name: 'Page13EducationCredentialsScreen' as const,
    params: undefined,
  };
}

/**
 * Builds a minimal draft object for getDraft().
 *
 * @param educationLevel - The education_level value in the draft.
 */
function makeDraft(educationLevel: string | null) {
  return {
    schemaVersion: 1 as const,
    lastCheckpoint: 'firstCheckpoint' as const,
    currentPage: 13,
    fields: educationLevel !== null ? { education_level: educationLevel } : {},
    siblings: [],
    photoPreviewUris: [],
    notificationPermissionStatus: null,
    locationPermissionStatus: null,
    timestamps: { createdAt: '', updatedAt: '' },
  };
}

/**
 * Renders the screen synchronously.
 * useEffect-triggered calls to mockUpdate fire synchronously in the test
 * environment (React test renderer runs effects eagerly).
 */
function renderScreen(
  educationLevel: string | null,
  nav = mockNavigation(),
) {
  mockGetDraft.mockReturnValue(makeDraft(educationLevel));
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page13EducationCredentialsScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

beforeEach(() => {
  mockUpdate.mockClear();
  mockAdvance.mockClear();
  mockGetDraft.mockClear();
});

// ═══════════════════════════════════════════════════════════════════════════════
// AC IT-BLOCK 1: Branch-matrix rendering + auto-defaults on mount
// ═══════════════════════════════════════════════════════════════════════════════

describe('Page13EducationCredentialsScreen — branch-matrix rendering and auto-defaults (AC it-block 1)', () => {
  it('given education_level = Elementary School Level, when mounted, then no visible fields render and all 7 fields are sentinel-defaulted in the draft', () => {
    renderScreen('Elementary School Level');

    // No visible fields — page title still shows.
    expect(screen.getByText(t('onboarding.education.credentials.title'))).toBeTruthy();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.highSchool.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.highSchoolYear.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.higherSecondary.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.higherSecondaryYear.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.highestDegree.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.graduationYear.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.collegeName.label'))).toBeNull();

    // All 7 sentinel writes must have been dispatched by the reconciliation useEffect.
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        high_school: EDUCATION_TEXT_SENTINEL,
        high_school_passing_year: EDUCATION_YEAR_SENTINEL,
        higher_secondary: EDUCATION_TEXT_SENTINEL,
        higher_secondary_passing_year: EDUCATION_YEAR_SENTINEL,
        highest_degree: EDUCATION_TEXT_SENTINEL,
        graduation_year: EDUCATION_YEAR_SENTINEL,
        college_name: EDUCATION_TEXT_SENTINEL,
      }),
    );
  });

  it('given education_level = High School (10th), when mounted, then only high_school and high_school_passing_year fields render', () => {
    renderScreen('High School (10th)');

    expect(screen.getByLabelText(t('onboarding.education.credentials.highSchool.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.highSchoolYear.label'))).toBeTruthy();

    // These fields must NOT render.
    expect(screen.queryByLabelText(t('onboarding.education.credentials.higherSecondary.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.higherSecondaryYear.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.highestDegree.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.graduationYear.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.collegeName.label'))).toBeNull();

    // 5 hidden fields are sentinel-defaulted.
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        higher_secondary: EDUCATION_TEXT_SENTINEL,
        higher_secondary_passing_year: EDUCATION_YEAR_SENTINEL,
        highest_degree: EDUCATION_TEXT_SENTINEL,
        graduation_year: EDUCATION_YEAR_SENTINEL,
        college_name: EDUCATION_TEXT_SENTINEL,
      }),
    );
  });

  it('given education_level = Higher Secondary School (12th), when mounted, then 4 fields render and 3 are sentinel-defaulted', () => {
    renderScreen('Higher Secondary School (12th)');

    expect(screen.getByLabelText(t('onboarding.education.credentials.highSchool.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.highSchoolYear.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.higherSecondary.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.higherSecondaryYear.label'))).toBeTruthy();

    expect(screen.queryByLabelText(t('onboarding.education.credentials.highestDegree.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.graduationYear.label'))).toBeNull();
    expect(screen.queryByLabelText(t('onboarding.education.credentials.collegeName.label'))).toBeNull();

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        highest_degree: EDUCATION_TEXT_SENTINEL,
        graduation_year: EDUCATION_YEAR_SENTINEL,
        college_name: EDUCATION_TEXT_SENTINEL,
      }),
    );
  });

  it('given education_level = Graduate And Above, when mounted, then all 7 fields render and no sentinel writes occur', () => {
    renderScreen('Graduate And Above');

    expect(screen.getByLabelText(t('onboarding.education.credentials.highSchool.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.highSchoolYear.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.higherSecondary.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.higherSecondaryYear.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.highestDegree.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.graduationYear.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.collegeName.label'))).toBeTruthy();

    // All 7 fields are visible — no sentinel writes.
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given education_level = Medical Doctor / PHD, when mounted, then all 7 fields render and no sentinel writes occur', () => {
    renderScreen('Medical Doctor / PHD');

    expect(screen.getByLabelText(t('onboarding.education.credentials.highSchool.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.highSchoolYear.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.higherSecondary.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.higherSecondaryYear.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.highestDegree.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.graduationYear.label'))).toBeTruthy();
    expect(screen.getByLabelText(t('onboarding.education.credentials.collegeName.label'))).toBeTruthy();

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AC IT-BLOCK 2: Back-nav downgrade reconciliation
// ═══════════════════════════════════════════════════════════════════════════════

describe('Page13EducationCredentialsScreen — back-nav downgrade reset (AC it-block 2)', () => {
  it('given education_level downgraded from Graduate to High School (10th), when mounted, then 5 now-irrelevant fields are force-reset to sentinels', () => {
    // Simulates: user was at Graduate And Above (all fields filled), went back to
    // page 12, picked "High School (10th)", and re-mounted page 13.
    // The draft now has education_level = "High School (10th)".
    renderScreen('High School (10th)');

    // Sentinel writes must cover the 5 now-irrelevant fields.
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        higher_secondary: EDUCATION_TEXT_SENTINEL,
        higher_secondary_passing_year: EDUCATION_YEAR_SENTINEL,
        highest_degree: EDUCATION_TEXT_SENTINEL,
        graduation_year: EDUCATION_YEAR_SENTINEL,
        college_name: EDUCATION_TEXT_SENTINEL,
      }),
    );

    // The still-visible fields must NOT be in the sentinel patch.
    const call = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(call).toBeDefined();
    expect(call).not.toHaveProperty('high_school');
    expect(call).not.toHaveProperty('high_school_passing_year');
  });

  it('given education_level downgraded to Elementary, when mounted, then all 7 fields are force-reset to sentinels', () => {
    renderScreen('Elementary School Level');

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        high_school: EDUCATION_TEXT_SENTINEL,
        high_school_passing_year: EDUCATION_YEAR_SENTINEL,
        higher_secondary: EDUCATION_TEXT_SENTINEL,
        higher_secondary_passing_year: EDUCATION_YEAR_SENTINEL,
        highest_degree: EDUCATION_TEXT_SENTINEL,
        graduation_year: EDUCATION_YEAR_SENTINEL,
        college_name: EDUCATION_TEXT_SENTINEL,
      }),
    );
  });

  it('given education_level downgraded from Graduate to Higher Secondary, when mounted, then only highest_degree, graduation_year, college_name are reset', () => {
    renderScreen('Higher Secondary School (12th)');

    // Only 3 fields should be sentinel-defaulted.
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        highest_degree: EDUCATION_TEXT_SENTINEL,
        graduation_year: EDUCATION_YEAR_SENTINEL,
        college_name: EDUCATION_TEXT_SENTINEL,
      }),
    );

    // The 4 still-visible fields must NOT be in the sentinel patch.
    const call = mockUpdate.mock.calls[0]?.[0] as Record<string, unknown> | undefined;
    expect(call).toBeDefined();
    expect(call).not.toHaveProperty('high_school');
    expect(call).not.toHaveProperty('high_school_passing_year');
    expect(call).not.toHaveProperty('higher_secondary');
    expect(call).not.toHaveProperty('higher_secondary_passing_year');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AC IT-BLOCK 3: Continue navigation
// ═══════════════════════════════════════════════════════════════════════════════

describe('Page13EducationCredentialsScreen — Continue navigation (AC it-block 3)', () => {
  it('given education_level = Elementary (no visible fields), when Continue is pressed, then advance(14) and navigate to Page14SecondCheckpointScreen', () => {
    const nav = mockNavigation();
    renderScreen('Elementary School Level', nav);

    // Elementary has no visible fields so Continue is immediately enabled.
    const continueBtn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(continueBtn.props.accessibilityState.disabled).toBe(false);

    fireEvent.press(continueBtn);

    expect(mockAdvance).toHaveBeenCalledWith(14);
    expect(nav.navigate).toHaveBeenCalledWith('Page14SecondCheckpointScreen');
  });

  it('given education_level = High School and both fields filled with valid values, when Continue is pressed, then advance(14) and navigate to Page14SecondCheckpointScreen', () => {
    const nav = mockNavigation();
    renderScreen('High School (10th)', nav);

    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.education.credentials.highSchool.label')),
      "St. Mary's High School",
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.education.credentials.highSchoolYear.label')),
      '2012',
    );

    const continueBtn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(continueBtn.props.accessibilityState.disabled).toBe(false);

    fireEvent.press(continueBtn);

    expect(mockAdvance).toHaveBeenCalledWith(14);
    expect(nav.navigate).toHaveBeenCalledWith('Page14SecondCheckpointScreen');
  });

  it('given Continue is pressed with High School level, then update is called with visible field values', () => {
    const nav = mockNavigation();

    // Clear the mock first so we can isolate the Continue-tap call from
    // the mount-time sentinel patch call.
    renderScreen('High School (10th)', nav);
    mockUpdate.mockClear();

    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.education.credentials.highSchool.label')),
      'City High School',
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.education.credentials.highSchoolYear.label')),
      '2010',
    );

    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    // The Continue handler writes only the visible fields.
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        high_school: 'City High School',
        high_school_passing_year: 2010,
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Supporting tests
// ═══════════════════════════════════════════════════════════════════════════════

describe('Page13EducationCredentialsScreen — mount basics', () => {
  it('given any education_level, when rendered, then screen mounts without throwing', () => {
    mockGetDraft.mockReturnValue(makeDraft('Graduate And Above'));
    expect(() =>
      render(
        <ThemeProvider>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <Page13EducationCredentialsScreen navigation={mockNavigation() as any} route={mockRoute() as any} />
        </ThemeProvider>,
      ),
    ).not.toThrow();
  });

  it('given the screen renders, then the title is visible', () => {
    renderScreen('Graduate And Above');
    expect(screen.getByText(t('onboarding.education.credentials.title'))).toBeTruthy();
  });
});

describe('Page13EducationCredentialsScreen — Continue disabled gate', () => {
  it('given education_level = High School and no fields filled, then Continue is disabled', () => {
    renderScreen('High School (10th)');
    const continueBtn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(continueBtn.props.accessibilityState.disabled).toBe(true);
  });

  it('given education_level = High School and only name filled (year missing), then Continue is disabled', () => {
    renderScreen('High School (10th)');
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.education.credentials.highSchool.label')),
      'City High School',
    );
    const continueBtn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(continueBtn.props.accessibilityState.disabled).toBe(true);
  });

  it('given education_level = High School and year is future (invalid), then Continue is disabled', () => {
    renderScreen('High School (10th)');
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.education.credentials.highSchool.label')),
      'City High School',
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.education.credentials.highSchoolYear.label')),
      '2099',
    );
    const continueBtn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(continueBtn.props.accessibilityState.disabled).toBe(true);
  });
});

describe('Page13EducationCredentialsScreen — inline error rendering', () => {
  it('given high school name is touched with an invalid character (!), then the text error renders', () => {
    renderScreen('High School (10th)');
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.education.credentials.highSchool.label')),
      'School!',
    );
    expect(
      screen.getByText(t('onboarding.education.credentials.highSchool.error')),
    ).toBeTruthy();
  });

  it('given year field is touched with only 2 digits (invalid), then the year error renders', () => {
    renderScreen('High School (10th)');
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.education.credentials.highSchoolYear.label')),
      '99',
    );
    expect(
      screen.getByText(t('onboarding.education.credentials.highSchoolYear.error')),
    ).toBeTruthy();
  });

  it('given all fields are untouched, then no inline errors render', () => {
    renderScreen('High School (10th)');
    expect(
      screen.queryByText(t('onboarding.education.credentials.highSchool.error')),
    ).toBeNull();
    expect(
      screen.queryByText(t('onboarding.education.credentials.highSchoolYear.error')),
    ).toBeNull();
  });
});

describe('Page13EducationCredentialsScreen — WizardHeader back', () => {
  it('given the screen renders, then at least one back element is accessible', () => {
    renderScreen('High School (10th)');
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    expect(backButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('given WizardHeader back is pressed, then navigation.goBack is called', () => {
    const nav = mockNavigation();
    renderScreen('High School (10th)', nav);
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    const firstBack = backButtons[0];
    if (firstBack === undefined) throw new Error('No back button found');
    fireEvent.press(firstBack);
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });
});
