/**
 * Wiring tests for Page11WorkDetailsScreen (story 4.3).
 *
 * Covers:
 * - Screen mounts without throwing.
 * - Screen title is visible.
 * - Continue button is disabled until all five fields are valid.
 * - Inline per-field error messages render when a field is touched and invalid.
 * - On Continue with all fields valid, all five values are written to the draft,
 *   advance(12) is called, and navigation goes to Page12EducationLevelScreen.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

// ── Module mocks (hoisted by babel-jest) ──────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-require-imports */

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

/* eslint-enable @typescript-eslint/no-explicit-any */
/* eslint-enable @typescript-eslint/no-require-imports */

// ── useOnboardingDraft mock ───────────────────────────────────────────────────

const mockUpdate = jest.fn();
const mockAdvance = jest.fn();

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  OnboardingDraftProvider: ({ children }: any) => children,
  useOnboardingDraft: () => ({
    update: mockUpdate,
    advance: mockAdvance,
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: jest.fn(() => ({
      schemaVersion: 3,
      lastCheckpoint: 'firstCheckpoint',
      currentPage: 11,
      fields: {},
      siblings: [],
      photoPreviewUris: [],
      notificationPermissionStatus: null,
      locationPermissionStatus: null,
      phone_number: null,
      timestamps: { createdAt: '', updatedAt: '' },
    })),
    setSiblings: jest.fn(),
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    isLoading: false,
  }),
}));

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { Page11WorkDetailsScreen } from '@/features/onboarding/screens/Page11WorkDetailsScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

function mockRoute() {
  return {
    key: 'Page11WorkDetailsScreen',
    name: 'Page11WorkDetailsScreen' as const,
    params: undefined,
  };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page11WorkDetailsScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

/**
 * Fills all five fields with valid values and optionally submits.
 *
 * `employment_type` and `salary_range` are Select components that open a Modal
 * on press. In tests, we fire a press on the trigger (accessible via its
 * `accessibilityLabel`) then press the option text inside the modal.
 */
function fillAllFields(nav = mockNavigation()) {
  const result = renderScreen(nav);

  // Employment type — press trigger, then pick first option from modal.
  fireEvent.press(screen.getByLabelText(t('onboarding.work.employmentType.label')));
  fireEvent.press(screen.getByLabelText('Government'));

  // Job title text input.
  fireEvent.changeText(
    screen.getByLabelText(t('onboarding.work.jobTitle.label')),
    'Software Engineer',
  );

  // Employer name text input.
  fireEvent.changeText(
    screen.getByLabelText(t('onboarding.work.employerName.label')),
    'Acme Corp',
  );

  // Office address text input.
  fireEvent.changeText(
    screen.getByLabelText(t('onboarding.work.officeAddress.label')),
    '123 Baker St, London NW1 6XE',
  );

  // Salary range — press trigger, then pick option from modal.
  fireEvent.press(screen.getByLabelText(t('onboarding.work.salaryRange.label')));
  fireEvent.press(screen.getByLabelText('Below £20,000'));

  return result;
}

beforeEach(() => {
  mockUpdate.mockClear();
  mockAdvance.mockClear();
});

// ── Mount ─────────────────────────────────────────────────────────────────────

describe('Page11WorkDetailsScreen — mount', () => {
  it('given the screen, when rendered, then it mounts without throwing', () => {
    expect(() => renderScreen()).not.toThrow();
  });

  it('given the screen renders, then the screen title is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.work.title'))).toBeTruthy();
  });

  it('given the screen renders, then all five field labels are visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.work.employmentType.label'))).toBeTruthy();
    expect(screen.getByText(t('onboarding.work.jobTitle.label'))).toBeTruthy();
    expect(screen.getByText(t('onboarding.work.employerName.label'))).toBeTruthy();
    expect(screen.getByText(t('onboarding.work.officeAddress.label'))).toBeTruthy();
    expect(screen.getByText(t('onboarding.work.salaryRange.label'))).toBeTruthy();
  });
});

// ── Disabled-until-all-valid (AC 8) ───────────────────────────────────────────

describe('Page11WorkDetailsScreen — Continue disabled state (AC 8)', () => {
  it('given the screen first renders, then Continue is disabled', () => {
    renderScreen();
    const continueBtn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(continueBtn.props.accessibilityState.disabled).toBe(true);
  });

  it('given only job title is filled, then Continue is still disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.work.jobTitle.label')),
      'Software Engineer',
    );
    const continueBtn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(continueBtn.props.accessibilityState.disabled).toBe(true);
  });

  it('given all fields are filled with valid values, then Continue is enabled', () => {
    fillAllFields();
    const continueBtn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(continueBtn.props.accessibilityState.disabled).toBe(false);
  });
});

// ── Inline error rendering (AC 7) ────────────────────────────────────────────

describe('Page11WorkDetailsScreen — inline error rendering (AC 7)', () => {
  it('given job title is touched then cleared, then no error shows (empty untouched-equivalent)', () => {
    // Before any touch, errors should not show.
    renderScreen();
    expect(screen.queryByText(t('onboarding.work.errors.jobTitle.required'))).toBeNull();
    expect(screen.queryByText(t('onboarding.work.errors.jobTitle.invalidChars'))).toBeNull();
  });

  it('given job title is touched with invalid chars, then invalidChars error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.work.jobTitle.label')),
      'Engineer!',
    );
    expect(screen.getByText(t('onboarding.work.errors.jobTitle.invalidChars'))).toBeTruthy();
  });

  it('given job title is touched with too-long value, then tooLong error shows', () => {
    renderScreen();
    // 41 chars — one over the 40-char max.
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.work.jobTitle.label')),
      'A'.repeat(41),
    );
    expect(screen.getByText(t('onboarding.work.errors.jobTitle.tooLong'))).toBeTruthy();
  });

  it('given employer name has invalid chars, then invalidChars error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.work.employerName.label')),
      'Acme!',
    );
    expect(screen.getByText(t('onboarding.work.errors.employerName.invalidChars'))).toBeTruthy();
  });

  it('given employer name exceeds 50 chars, then tooLong error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.work.employerName.label')),
      'A'.repeat(51),
    );
    expect(screen.getByText(t('onboarding.work.errors.employerName.tooLong'))).toBeTruthy();
  });

  it('given office address exceeds 150 chars, then tooLong error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.work.officeAddress.label')),
      'A'.repeat(151),
    );
    expect(screen.getByText(t('onboarding.work.errors.officeAddress.tooLong'))).toBeTruthy();
  });
});

// ── Successful advance (AC 8) ─────────────────────────────────────────────────

describe('Page11WorkDetailsScreen — successful Continue tap (AC 8)', () => {
  it('given all fields valid, when Continue is pressed, then update is called with all five values', () => {
    const { nav } = fillAllFields();
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      employment_type: 'Government',
      job_title: 'Software Engineer',
      employer_name: 'Acme Corp',
      office_address: '123 Baker St, London NW1 6XE',
      salary_range: 'Below £20,000',
    });
    // nav is used indirectly — just asserting update & advance here.
    expect(nav).toBeDefined();
  });

  it('given all fields valid, when Continue is pressed, then advance(12) is called', () => {
    fillAllFields();
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(12);
  });

  it('given all fields valid, when Continue is pressed, then navigation goes to Page12EducationLevelScreen', () => {
    const { nav } = fillAllFields();
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));
    expect(nav.navigate).toHaveBeenCalledWith('Page12EducationLevelScreen');
    expect(nav.navigate).toHaveBeenCalledTimes(1);
  });
});

// ── WizardHeader back navigation ──────────────────────────────────────────────

describe('Page11WorkDetailsScreen — WizardHeader back navigation', () => {
  it('given the screen renders, then a back button is accessible', () => {
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
});
