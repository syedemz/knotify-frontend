/**
 * Tests for Page18ParentsScreen and the two new validators added to
 * validationHelper.ts (story 7.1).
 *
 * Part 1 — isValidParentName unit tests:
 *   - Boundary lengths (0, 1, 40, 41)
 *   - Allowed character classes
 *   - Rejected character classes (digits, special chars)
 *   - Leading/trailing whitespace rejection
 *
 * Part 2 — isValidParentJob unit tests:
 *   - Boundary lengths (0, 1, 40, 41)
 *   - Allowed character classes (letters, digits, space, hyphen, apostrophe,
 *     ampersand, period)
 *   - Rejected character classes (comma, exclamation, etc.)
 *   - Leading/trailing whitespace rejection
 *
 * Part 3 — Page18ParentsScreen wiring tests:
 *   (i)   Mount renders without throwing; heading is visible.
 *   (ii)  Continue is disabled until all six fields are valid.
 *   (iii) fathers_name / mothers_name — validation gates.
 *   (iv)  fathers_job / mothers_job — validation gates.
 *   (v)   father_retired / mother_retired — pick-one toggling.
 *   (vi)  Single atomic update({...}) semantics on Continue tap.
 *   (vii) navigation.navigate('Page19SiblingsScreen') on Continue.
 *   (viii)Back-nav re-hydration from draft.fields.
 *
 * Test setup mirrors Page17FamilyResidenceScreen.test.tsx — the
 * `OnboardingDraftProvider: ({ children }) => children` passthrough MUST be
 * present inside the `useOnboardingDraft` mock (PR #92 context-refactor).
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import type { ReactTestInstance } from 'react-test-renderer';

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
import {
  isValidParentName,
  isValidParentJob,
  MAX_PARENT_NAME_LENGTH,
  MAX_PARENT_JOB_LENGTH,
} from '@/Helper/validationHelper';
import { Page18ParentsScreen } from '@/features/onboarding/screens/Page18ParentsScreen';

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
    key: 'Page18ParentsScreen',
    name: 'Page18ParentsScreen' as const,
    params: undefined,
  };
}

/**
 * Builds a minimal draft object for getDraft().
 *
 * @param fields - Optional partial fields to pre-populate (back-nav scenario).
 */
function makeDraft(fields: Record<string, string> = {}) {
  return {
    schemaVersion: 3 as const,
    lastCheckpoint: 'secondCheckpoint' as const,
    currentPage: 18,
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
  draftFields: Record<string, string> = {},
  nav = mockNavigation(),
) {
  mockGetDraft.mockReturnValue(makeDraft(draftFields));
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page18ParentsScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

/**
 * Retrieves the element at `index` from `getAllByLabelText`, throwing a
 * descriptive error when the array is shorter than expected.
 *
 * Required because `noUncheckedIndexedAccess` makes array indexing return
 * `T | undefined`, so TypeScript requires a null-guard before using the value.
 */
function getByLabelTextAt(label: string, index: number): ReactTestInstance {
  const rows = screen.getAllByLabelText(label);
  const row = rows[index];
  if (row === undefined) {
    throw new Error(`getAllByLabelText('${label}')[${index}] is undefined — only ${rows.length} elements found`);
  }
  return row;
}

beforeEach(() => {
  mockUpdate.mockClear();
  mockAdvance.mockClear();
  mockGetDraft.mockClear();
});

// ═════════════════════════════════════════════════════════════════════════════
// Part 1 — isValidParentName unit tests
// ═════════════════════════════════════════════════════════════════════════════

describe('isValidParentName — boundary lengths', () => {
  it('given an empty string (length 0), then returns false', () => {
    expect(isValidParentName('')).toBe(false);
  });

  it('given a single letter (length 1), then returns true', () => {
    expect(isValidParentName('A')).toBe(true);
  });

  it('given a string of exactly MAX_PARENT_NAME_LENGTH (40) characters, then returns true', () => {
    expect(isValidParentName('A'.repeat(MAX_PARENT_NAME_LENGTH))).toBe(true);
    expect(MAX_PARENT_NAME_LENGTH).toBe(40);
  });

  it('given a string of MAX_PARENT_NAME_LENGTH + 1 (41) characters, then returns false', () => {
    expect(isValidParentName('A'.repeat(MAX_PARENT_NAME_LENGTH + 1))).toBe(false);
  });
});

describe('isValidParentName — allowed character classes', () => {
  it('given a simple letter-only name, then returns true', () => {
    expect(isValidParentName('Muhammad')).toBe(true);
  });

  it('given a name with an internal space, then returns true', () => {
    expect(isValidParentName('Muhammad Ali')).toBe(true);
  });

  it('given a name with a hyphen, then returns true', () => {
    expect(isValidParentName('Marie-Claire')).toBe(true);
  });

  it("given a name with an apostrophe, then returns true", () => {
    expect(isValidParentName("O'Brien")).toBe(true);
  });

  it('given a mixed-case name, then returns true', () => {
    expect(isValidParentName('Fatima Begum')).toBe(true);
  });
});

describe('isValidParentName — rejected character classes', () => {
  it('given a name containing a digit, then returns false', () => {
    expect(isValidParentName('Ali1')).toBe(false);
  });

  it('given a name containing an ampersand, then returns false', () => {
    expect(isValidParentName('Ali&Shah')).toBe(false);
  });

  it('given a name containing a period, then returns false', () => {
    expect(isValidParentName('Dr.Ali')).toBe(false);
  });

  it('given a name containing a comma, then returns false', () => {
    expect(isValidParentName('Ali,Shah')).toBe(false);
  });

  it('given a name with a leading space, then returns false', () => {
    expect(isValidParentName(' Ali')).toBe(false);
  });

  it('given a name with a trailing space, then returns false', () => {
    expect(isValidParentName('Ali ')).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Part 2 — isValidParentJob unit tests
// ═════════════════════════════════════════════════════════════════════════════

describe('isValidParentJob — boundary lengths', () => {
  it('given an empty string (length 0), then returns false', () => {
    expect(isValidParentJob('')).toBe(false);
  });

  it('given a single letter (length 1), then returns true', () => {
    expect(isValidParentJob('A')).toBe(true);
  });

  it('given a string of exactly MAX_PARENT_JOB_LENGTH (40) characters, then returns true', () => {
    expect(isValidParentJob('A'.repeat(MAX_PARENT_JOB_LENGTH))).toBe(true);
    expect(MAX_PARENT_JOB_LENGTH).toBe(40);
  });

  it('given a string of MAX_PARENT_JOB_LENGTH + 1 (41) characters, then returns false', () => {
    expect(isValidParentJob('A'.repeat(MAX_PARENT_JOB_LENGTH + 1))).toBe(false);
  });
});

describe('isValidParentJob — allowed character classes', () => {
  it('given a simple letter-only value, then returns true', () => {
    expect(isValidParentJob('Farmer')).toBe(true);
  });

  it('given a value with a space, then returns true', () => {
    expect(isValidParentJob('Retired Farmer')).toBe(true);
  });

  it('given a value with a hyphen, then returns true', () => {
    expect(isValidParentJob('Semi-Retired')).toBe(true);
  });

  it("given a value with an apostrophe, then returns true", () => {
    expect(isValidParentJob("O'Reilly Author")).toBe(true);
  });

  it('given a value with an ampersand, then returns true', () => {
    expect(isValidParentJob('AT&T Manager')).toBe(true);
  });

  it('given a value with a period, then returns true', () => {
    expect(isValidParentJob('Sr. Engineer')).toBe(true);
  });

  it('given a value with digits, then returns true', () => {
    expect(isValidParentJob('Level 3 Engineer')).toBe(true);
  });
});

describe('isValidParentJob — rejected character classes', () => {
  it('given a value containing an exclamation mark, then returns false', () => {
    expect(isValidParentJob('Farmer!')).toBe(false);
  });

  it('given a value containing a comma, then returns false', () => {
    expect(isValidParentJob('Farmer, Retired')).toBe(false);
  });

  it('given a value containing a slash, then returns false', () => {
    expect(isValidParentJob('Farmer/Retired')).toBe(false);
  });

  it('given a value with a leading space, then returns false', () => {
    expect(isValidParentJob(' Farmer')).toBe(false);
  });

  it('given a value with a trailing space, then returns false', () => {
    expect(isValidParentJob('Farmer ')).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Part 3 — Page18ParentsScreen wiring tests
// ═════════════════════════════════════════════════════════════════════════════

// ── (i) Mount basics ─────────────────────────────────────────────────────────

describe('Page18ParentsScreen — mount', () => {
  it('given the screen, when rendered, then it mounts without throwing', () => {
    expect(() => renderScreen()).not.toThrow();
  });

  it('given the screen renders, then the page heading is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.parents.title'))).toBeTruthy();
  });

  it('given the screen renders, then the fathers name input is accessible by label', () => {
    renderScreen();
    expect(screen.getByLabelText(t('onboarding.parents.fathersName.label'))).toBeTruthy();
  });

  it('given the screen renders, then the fathers job input is accessible by label', () => {
    renderScreen();
    expect(screen.getByLabelText(t('onboarding.parents.fathersJob.label'))).toBeTruthy();
  });

  it('given the screen renders, then the mothers name input is accessible by label', () => {
    renderScreen();
    expect(screen.getByLabelText(t('onboarding.parents.mothersName.label'))).toBeTruthy();
  });

  it('given the screen renders, then the mothers job input is accessible by label', () => {
    renderScreen();
    expect(screen.getByLabelText(t('onboarding.parents.mothersJob.label'))).toBeTruthy();
  });
});

// ── (ii) Aggregate Continue gate ─────────────────────────────────────────────

describe('Page18ParentsScreen — (ii): Continue gate is aggregate', () => {
  it('given no fields are filled, then Continue is disabled', () => {
    renderScreen();
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given only fathers_name is filled, then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.fathersName.label')),
      'Muhammad Ali',
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given all four text fields are filled but neither pick-one is set, then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersName.label')), 'Muhammad Ali');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersJob.label')), 'Farmer');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersName.label')), 'Fatima Begum');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersJob.label')), 'Homemaker');
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given all four text fields are filled and father_retired is set but mother_retired is not, then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersName.label')), 'Muhammad Ali');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersJob.label')), 'Farmer');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersName.label')), 'Fatima Begum');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersJob.label')), 'Homemaker');
    // Select father_retired = YES (first YES row)
    fireEvent.press(getByLabelTextAt('YES', 0));
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given all six fields are valid, then Continue is enabled', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersName.label')), 'Muhammad Ali');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersJob.label')), 'Farmer');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersName.label')), 'Fatima Begum');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersJob.label')), 'Homemaker');
    fireEvent.press(getByLabelTextAt('YES', 0)); // father_retired
    fireEvent.press(getByLabelTextAt('YES', 1)); // mother_retired
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);
  });
});

// ── (iii) fathers_name / mothers_name validation gates ───────────────────────

describe('Page18ParentsScreen — (iii): fathers_name validation gate', () => {
  it('given an invalid fathers_name (too long), then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.fathersName.label')),
      'A'.repeat(41),
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given fathers_name contains a digit, then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.fathersName.label')),
      'Ali1',
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given a valid fathers_name is entered, then no name error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.fathersName.label')),
      'Muhammad Ali',
    );
    expect(screen.queryByText(t('onboarding.parents.fathersName.errors.tooLong'))).toBeNull();
    expect(screen.queryByText(t('onboarding.parents.fathersName.errors.invalidCharacters'))).toBeNull();
  });

  it('given a too-long fathers_name is entered, then tooLong error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.fathersName.label')),
      'A'.repeat(41),
    );
    expect(screen.getByText(t('onboarding.parents.fathersName.errors.tooLong'))).toBeTruthy();
  });

  it('given an invalid-char fathers_name is entered, then invalidCharacters error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.fathersName.label')),
      'Ali1',
    );
    expect(screen.getByText(t('onboarding.parents.fathersName.errors.invalidCharacters'))).toBeTruthy();
  });

  it('given mothers_name is invalid (too long), then Continue remains disabled regardless of other fields', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersName.label')), 'Muhammad Ali');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersJob.label')), 'Farmer');
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.mothersName.label')),
      'A'.repeat(41),
    );
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersJob.label')), 'Homemaker');
    fireEvent.press(getByLabelTextAt('YES', 0));
    fireEvent.press(getByLabelTextAt('YES', 1));
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });
});

// ── (iv) fathers_job / mothers_job validation gates ──────────────────────────

describe('Page18ParentsScreen — (iv): job field validation gates', () => {
  it('given an invalid fathers_job (too long), then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.fathersJob.label')),
      'A'.repeat(41),
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given fathers_job contains an invalid character, then invalidCharacters error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.fathersJob.label')),
      'Farmer!',
    );
    expect(screen.getByText(t('onboarding.parents.fathersJob.errors.invalidCharacters'))).toBeTruthy();
  });

  it('given a too-long fathers_job, then tooLong error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.fathersJob.label')),
      'A'.repeat(41),
    );
    expect(screen.getByText(t('onboarding.parents.fathersJob.errors.tooLong'))).toBeTruthy();
  });

  it('given a valid fathers_job with ampersand, then no error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.fathersJob.label')),
      'AT&T Manager',
    );
    expect(screen.queryByText(t('onboarding.parents.fathersJob.errors.tooLong'))).toBeNull();
    expect(screen.queryByText(t('onboarding.parents.fathersJob.errors.invalidCharacters'))).toBeNull();
  });

  it('given a too-long mothers_job, then tooLong error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.mothersJob.label')),
      'A'.repeat(41),
    );
    expect(screen.getByText(t('onboarding.parents.mothersJob.errors.tooLong'))).toBeTruthy();
  });

  it('given an invalid-char mothers_job, then invalidCharacters error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.parents.mothersJob.label')),
      'Homemaker!',
    );
    expect(screen.getByText(t('onboarding.parents.mothersJob.errors.invalidCharacters'))).toBeTruthy();
  });
});

// ── (v) pick-one toggling ─────────────────────────────────────────────────────

describe('Page18ParentsScreen — (v): pick-one toggling', () => {
  it('given YES is pressed for father_retired, then the first YES row is selected', () => {
    renderScreen();
    const yesRow0 = getByLabelTextAt('YES', 0);
    fireEvent.press(yesRow0);
    // After pressing, the row should be selected (checked). Re-fetch after state update.
    expect(getByLabelTextAt('YES', 0).props.accessibilityState.checked).toBe(true);
  });

  it('given NO is pressed for father_retired, then the first NO row is selected', () => {
    renderScreen();
    const noRow0 = getByLabelTextAt('NO', 0);
    fireEvent.press(noRow0);
    expect(getByLabelTextAt('NO', 0).props.accessibilityState.checked).toBe(true);
  });

  it('given YES is pressed for mother_retired (second YES), then the second YES row is selected', () => {
    renderScreen();
    const yesRow1 = getByLabelTextAt('YES', 1);
    fireEvent.press(yesRow1);
    expect(getByLabelTextAt('YES', 1).props.accessibilityState.checked).toBe(true);
  });

  it('given NO is pressed for mother_retired (second NO), then the second NO row is selected', () => {
    renderScreen();
    const noRow1 = getByLabelTextAt('NO', 1);
    fireEvent.press(noRow1);
    expect(getByLabelTextAt('NO', 1).props.accessibilityState.checked).toBe(true);
  });

  it('given YES then NO pressed for father_retired, then NO is selected and YES is not', () => {
    renderScreen();
    fireEvent.press(getByLabelTextAt('YES', 0));
    fireEvent.press(getByLabelTextAt('NO', 0));
    expect(getByLabelTextAt('NO', 0).props.accessibilityState.checked).toBe(true);
    expect(getByLabelTextAt('YES', 0).props.accessibilityState.checked).toBe(false);
  });
});

// ── (vi) Single atomic update on Continue ────────────────────────────────────

describe('Page18ParentsScreen — (vi): single atomic update on Continue', () => {
  it('given all six fields valid, when Continue is pressed, then update is called exactly once', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersName.label')), 'Muhammad Ali');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersJob.label')), 'Farmer');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersName.label')), 'Fatima Begum');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersJob.label')), 'Homemaker');
    fireEvent.press(getByLabelTextAt('YES', 0));
    fireEvent.press(getByLabelTextAt('YES', 1));

    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it('given all six fields valid, when Continue is pressed, then update contains all six fields', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersName.label')), 'Muhammad Ali');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersJob.label')), 'Farmer');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersName.label')), 'Fatima Begum');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersJob.label')), 'Homemaker');
    fireEvent.press(getByLabelTextAt('YES', 0)); // father_retired = YES
    fireEvent.press(getByLabelTextAt('NO', 1));  // mother_retired = NO

    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        fathers_name: 'Muhammad Ali',
        fathers_job: 'Farmer',
        father_retired: 'YES',
        mothers_name: 'Fatima Begum',
        mothers_job: 'Homemaker',
        mother_retired: 'NO',
      }),
    );
  });

  it('given all six fields valid, when Continue is pressed, then advance(19) is called', () => {
    renderScreen();
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersName.label')), 'Muhammad Ali');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersJob.label')), 'Farmer');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersName.label')), 'Fatima Begum');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersJob.label')), 'Homemaker');
    fireEvent.press(getByLabelTextAt('YES', 0));
    fireEvent.press(getByLabelTextAt('YES', 1));

    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(19);
  });

  it('given Continue is pressed with fields invalid, then update and advance are NOT called', () => {
    renderScreen();
    // Don't fill any fields — Continue is disabled
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockAdvance).not.toHaveBeenCalled();
  });
});

// ── (vii) navigation.navigate on Continue ────────────────────────────────────

describe('Page18ParentsScreen — (vii): navigation on Continue', () => {
  it('given all six fields valid, when Continue is pressed, then navigate is called with Page19SiblingsScreen', () => {
    const { nav } = renderScreen();
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersName.label')), 'Muhammad Ali');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.fathersJob.label')), 'Farmer');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersName.label')), 'Fatima Begum');
    fireEvent.changeText(screen.getByLabelText(t('onboarding.parents.mothersJob.label')), 'Homemaker');
    fireEvent.press(getByLabelTextAt('YES', 0));
    fireEvent.press(getByLabelTextAt('YES', 1));

    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('Page19SiblingsScreen');
  });
});

// ── (viii) Back-nav re-hydration ─────────────────────────────────────────────

describe('Page18ParentsScreen — (viii): back-nav re-hydration from draft.fields', () => {
  it('given draft.fields has all six fields, when screen mounts, then all text inputs are pre-filled', () => {
    renderScreen({
      fathers_name: 'Muhammad Ali',
      fathers_job: 'Farmer',
      father_retired: 'YES',
      mothers_name: 'Fatima Begum',
      mothers_job: 'Homemaker',
      mother_retired: 'NO',
    });

    const fNameInput = screen.getByLabelText(t('onboarding.parents.fathersName.label'));
    expect(fNameInput.props.value).toBe('Muhammad Ali');

    const fJobInput = screen.getByLabelText(t('onboarding.parents.fathersJob.label'));
    expect(fJobInput.props.value).toBe('Farmer');

    const mNameInput = screen.getByLabelText(t('onboarding.parents.mothersName.label'));
    expect(mNameInput.props.value).toBe('Fatima Begum');

    const mJobInput = screen.getByLabelText(t('onboarding.parents.mothersJob.label'));
    expect(mJobInput.props.value).toBe('Homemaker');
  });

  it('given draft.fields has father_retired = YES, when mounted, then the first YES row is selected', () => {
    renderScreen({
      fathers_name: 'Muhammad Ali',
      fathers_job: 'Farmer',
      father_retired: 'YES',
      mothers_name: 'Fatima Begum',
      mothers_job: 'Homemaker',
      mother_retired: 'NO',
    });

    expect(getByLabelTextAt('YES', 0).props.accessibilityState.checked).toBe(true);
  });

  it('given draft.fields has mother_retired = NO, when mounted, then the second NO row is selected', () => {
    renderScreen({
      fathers_name: 'Muhammad Ali',
      fathers_job: 'Farmer',
      father_retired: 'YES',
      mothers_name: 'Fatima Begum',
      mothers_job: 'Homemaker',
      mother_retired: 'NO',
    });

    expect(getByLabelTextAt('NO', 1).props.accessibilityState.checked).toBe(true);
  });

  it('given all six draft fields pre-populated, when mounted, then Continue is immediately enabled', () => {
    renderScreen({
      fathers_name: 'Muhammad Ali',
      fathers_job: 'Farmer',
      father_retired: 'YES',
      mothers_name: 'Fatima Begum',
      mothers_job: 'Homemaker',
      mother_retired: 'NO',
    });

    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);
  });

  it('given a fresh draft (no fields), when mounted, then text inputs are empty and Continue is disabled', () => {
    renderScreen({});

    const fNameInput = screen.getByLabelText(t('onboarding.parents.fathersName.label'));
    expect(fNameInput.props.value).toBe('');

    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });
});

// ── WizardHeader back navigation ──────────────────────────────────────────────

describe('Page18ParentsScreen — WizardHeader back navigation', () => {
  it('given the screen renders, then a back button is accessible', () => {
    renderScreen();
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    expect(backButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('given the back button is pressed, then navigation.goBack is called', () => {
    const { nav } = renderScreen();
    const firstBack = getByLabelTextAt(t('wizard.header.back'), 0);
    fireEvent.press(firstBack);
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });
});

// ── No errors shown on untouched fields ──────────────────────────────────────

describe('Page18ParentsScreen — inline errors only after touch', () => {
  it('given the screen first renders, then no error messages are visible', () => {
    renderScreen();
    expect(screen.queryByText(t('onboarding.parents.fathersName.errors.tooLong'))).toBeNull();
    expect(screen.queryByText(t('onboarding.parents.fathersName.errors.invalidCharacters'))).toBeNull();
    expect(screen.queryByText(t('onboarding.parents.fathersJob.errors.tooLong'))).toBeNull();
    expect(screen.queryByText(t('onboarding.parents.fathersJob.errors.invalidCharacters'))).toBeNull();
    expect(screen.queryByText(t('onboarding.parents.mothersName.errors.tooLong'))).toBeNull();
    expect(screen.queryByText(t('onboarding.parents.mothersName.errors.invalidCharacters'))).toBeNull();
    expect(screen.queryByText(t('onboarding.parents.mothersJob.errors.tooLong'))).toBeNull();
    expect(screen.queryByText(t('onboarding.parents.mothersJob.errors.invalidCharacters'))).toBeNull();
  });
});
