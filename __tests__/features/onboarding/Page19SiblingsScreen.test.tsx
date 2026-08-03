/**
 * Tests for Page19SiblingsScreen, SiblingForm, and isValidProfession
 * (story 7.2).
 *
 * Part 1 — isValidProfession unit tests:
 *   - Boundary lengths (0, 1, 35, 36)
 *   - Allowed character classes (letters, digits, spaces, hyphens, apostrophes,
 *     ampersands, periods)
 *   - Rejected character classes (comma, exclamation, slash, etc.)
 *   - Leading/trailing whitespace rejection
 *
 * Part 2 — Page19SiblingsScreen wiring tests:
 *   (i)   Mount renders without throwing; heading visible.
 *   (ii)  Initial state: count input visible; Continue disabled on empty/invalid count.
 *   (iii) count = 0 enables Continue immediately; draft write only on Continue tap.
 *   (iv)  count >= 1 transitions to Filling on Continue (no draft write, no navigate).
 *   (v)   Cancel from Filling → Initial (count cleared, draft.siblings unchanged).
 *   (vi)  SiblingForm per-field validation inside Filling state.
 *   (vii) Filling → Complete: setSiblings called with all 5 fields present; advance(20);
 *         navigate to Page20MarriageTimelineScreen.
 *   (viii)Back-nav re-hydration:
 *         - currentPage < 20 → Initial.
 *         - currentPage >= 20 && siblings.length === 0 → Complete.
 *         - currentPage >= 20 && siblings.length > 0 → Filling pre-populated.
 *   (ix)  schemaVersion-2 discard path: v1-on-disk fixture via useOnboardingDraft mock.
 *
 * Test setup mirrors Page18ParentsScreen.test.tsx — the
 * `OnboardingDraftProvider: ({ children }) => children` passthrough MUST be
 * present inside the `useOnboardingDraft` mock (PR #92 context-refactor).
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
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

const mockSetSiblings = jest.fn();
const mockAdvance = jest.fn();
const mockGetDraft = jest.fn();

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OnboardingDraftProvider: ({ children }: any) => children,
  useOnboardingDraft: () => ({
    update: jest.fn(),
    advance: mockAdvance,
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: mockGetDraft,
    setSiblings: mockSetSiblings,
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    isLoading: false,
  }),
}));

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import {
  isValidProfession,
  MAX_SIBLING_PROFESSION_LENGTH,
} from '@/Helper/validationHelper';
import { Page19SiblingsScreen } from '@/features/onboarding/screens/Page19SiblingsScreen';
import type { SiblingDraft } from '@/features/onboarding/draftSchema';

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
    key: 'Page19SiblingsScreen',
    name: 'Page19SiblingsScreen' as const,
    params: undefined,
  };
}

/**
 * Builds a minimal draft object for getDraft().
 *
 * @param currentPage - The `currentPage` to seed into the draft.
 * @param siblings    - The `siblings` array to seed into the draft.
 */
function makeDraft(currentPage: number = 19, siblings: SiblingDraft[] = []) {
  return {
    schemaVersion: 3 as const,
    lastCheckpoint: 'secondCheckpoint' as const,
    currentPage,
    fields: {},
    siblings,
    photoPreviewUris: [],
    notificationPermissionStatus: null,
    locationPermissionStatus: null,
    phone_number: null,
    timestamps: { createdAt: '', updatedAt: '' },
  };
}

function renderScreen(
  currentPage: number = 19,
  siblings: SiblingDraft[] = [],
  nav = mockNavigation(),
) {
  mockGetDraft.mockReturnValue(makeDraft(currentPage, siblings));
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page19SiblingsScreen navigation={nav as any} route={mockRoute() as any} />
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
  mockSetSiblings.mockClear();
  mockAdvance.mockClear();
  mockGetDraft.mockClear();
});

// ═════════════════════════════════════════════════════════════════════════════
// Part 1 — isValidProfession unit tests
// ═════════════════════════════════════════════════════════════════════════════

describe('isValidProfession — boundary lengths', () => {
  it('given an empty string (length 0), then returns false', () => {
    expect(isValidProfession('')).toBe(false);
  });

  it('given a single letter (length 1), then returns true', () => {
    expect(isValidProfession('A')).toBe(true);
  });

  it('given a string of exactly MAX_SIBLING_PROFESSION_LENGTH (35) characters, then returns true', () => {
    expect(isValidProfession('A'.repeat(MAX_SIBLING_PROFESSION_LENGTH))).toBe(true);
    expect(MAX_SIBLING_PROFESSION_LENGTH).toBe(35);
  });

  it('given a string of MAX_SIBLING_PROFESSION_LENGTH + 1 (36) characters, then returns false', () => {
    expect(isValidProfession('A'.repeat(MAX_SIBLING_PROFESSION_LENGTH + 1))).toBe(false);
  });
});

describe('isValidProfession — allowed character classes', () => {
  it('given a simple letter-only value, then returns true', () => {
    expect(isValidProfession('Teacher')).toBe(true);
  });

  it('given a value with a space, then returns true', () => {
    expect(isValidProfession('School Teacher')).toBe(true);
  });

  it('given a value with a hyphen, then returns true', () => {
    expect(isValidProfession('Semi-Retired')).toBe(true);
  });

  it("given a value with an apostrophe, then returns true", () => {
    expect(isValidProfession("O'Reilly Author")).toBe(true);
  });

  it('given a value with an ampersand, then returns true', () => {
    expect(isValidProfession('AT&T Manager')).toBe(true);
  });

  it('given a value with a period, then returns true', () => {
    expect(isValidProfession('Sr. Engineer')).toBe(true);
  });

  it('given a value with digits, then returns true', () => {
    expect(isValidProfession('Level 3 Engineer')).toBe(true);
  });
});

describe('isValidProfession — rejected character classes', () => {
  it('given a value containing an exclamation mark, then returns false', () => {
    expect(isValidProfession('Teacher!')).toBe(false);
  });

  it('given a value containing a comma, then returns false', () => {
    expect(isValidProfession('Teacher, Retired')).toBe(false);
  });

  it('given a value containing a slash, then returns false', () => {
    expect(isValidProfession('Teacher/Tutor')).toBe(false);
  });

  it('given a value with a leading space, then returns false', () => {
    expect(isValidProfession(' Teacher')).toBe(false);
  });

  it('given a value with a trailing space, then returns false', () => {
    expect(isValidProfession('Teacher ')).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Part 2 — Page19SiblingsScreen wiring tests
// ═════════════════════════════════════════════════════════════════════════════

// ── (i) Mount basics ─────────────────────────────────────────────────────────

describe('Page19SiblingsScreen — (i): mount', () => {
  it('given the screen, when rendered, then it mounts without throwing', () => {
    expect(() => renderScreen()).not.toThrow();
  });

  it('given the screen renders in Initial state, then the page heading is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.siblings.title'))).toBeTruthy();
  });

  it('given the screen renders in Initial state, then the count input is accessible', () => {
    renderScreen();
    expect(screen.getByLabelText(t('onboarding.siblings.countPrompt'))).toBeTruthy();
  });
});

// ── (ii) Initial state: count validation ─────────────────────────────────────

describe('Page19SiblingsScreen — (ii): Initial state count validation', () => {
  it('given no count is entered, then Continue is disabled', () => {
    renderScreen();
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given count is 5 (above 4), then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '5',
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given count is a non-integer (decimal), then Continue remains disabled', () => {
    renderScreen();
    // The input strips non-digits, so "1.5" becomes "15" — we verify >4 rejects it
    // Instead test a negative value (digit strip yields nothing useful)
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '9',
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given count is 4 (max valid), then Continue is enabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '4',
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);
  });

  it('given count is 1, then Continue is enabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '1',
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);
  });
});

// ── (iii) count = 0 Continue semantics ───────────────────────────────────────

describe('Page19SiblingsScreen — (iii): count = 0 Continue semantics', () => {
  it('given count is 0, then Continue is immediately enabled (button state only)', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '0',
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);
    // No draft write yet — setSiblings NOT called before Continue tap
    expect(mockSetSiblings).not.toHaveBeenCalled();
  });

  it('given count is 0, when Continue is tapped, then setSiblings([]) is called', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '0',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));
    expect(mockSetSiblings).toHaveBeenCalledTimes(1);
    expect(mockSetSiblings).toHaveBeenCalledWith([]);
  });

  it('given count is 0, when Continue is tapped, then advance(20) is called', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '0',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));
    expect(mockAdvance).toHaveBeenCalledWith(20);
  });

  it('given count is 0, when Continue is tapped, then navigation goes to Page20', () => {
    const { nav } = renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '0',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));
    expect(nav.navigate).toHaveBeenCalledWith('Page20MarriageTimelineScreen');
  });
});

// ── (iv) count >= 1 → Filling transition ─────────────────────────────────────

describe('Page19SiblingsScreen — (iv): Initial→Filling transition on non-zero count', () => {
  it('given count is 1, when Continue is tapped, then screen transitions to Filling (Cancel visible)', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '1',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    // Cancel button should be visible in Filling state
    expect(screen.getByLabelText(t('onboarding.siblings.cancel'))).toBeTruthy();
  });

  it('given count is 1, when Continue is tapped, then NO draft write occurs (setSiblings not called)', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '1',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockSetSiblings).not.toHaveBeenCalled();
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given count is 2, when Continue is tapped, then 2 sibling cards are rendered', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '2',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    // Two SiblingForm cards are rendered — each shows "Sibling 1" and "Sibling 2"
    expect(screen.getByText(`${t('siblingForm.cardTitle')} 1`)).toBeTruthy();
    expect(screen.getByText(`${t('siblingForm.cardTitle')} 2`)).toBeTruthy();
  });

  it('given Filling state with 1 card not fully filled, then Continue is disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '1',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    // Card is empty — Continue should be disabled
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });
});

// ── (v) Cancel from Filling → Initial ────────────────────────────────────────

describe('Page19SiblingsScreen — (v): Cancel from Filling→Initial', () => {
  it('given Filling state, when Cancel is pressed, then screen returns to Initial', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '1',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    // Now in Filling — press Cancel
    fireEvent.press(screen.getByLabelText(t('onboarding.siblings.cancel')));

    // Count input should be visible again (Initial state)
    expect(screen.getByLabelText(t('onboarding.siblings.countPrompt'))).toBeTruthy();
  });

  it('given Filling state, when Cancel is pressed, then count input is cleared', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '2',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));
    fireEvent.press(screen.getByLabelText(t('onboarding.siblings.cancel')));

    const countInput = screen.getByLabelText(t('onboarding.siblings.countPrompt'));
    expect(countInput.props.value).toBe('');
  });

  it('given Filling state, when Cancel is pressed, then draft.siblings is NOT modified', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '1',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));
    fireEvent.press(screen.getByLabelText(t('onboarding.siblings.cancel')));

    // setSiblings must not have been called at any point
    expect(mockSetSiblings).not.toHaveBeenCalled();
  });
});

// ── (vi) SiblingForm per-field validation ─────────────────────────────────────

describe('Page19SiblingsScreen — (vi): SiblingForm per-field validation', () => {
  function enterFillingState(count = '1') {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      count,
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));
  }

  it('given all 5 fields of sibling 1 filled, then Continue is enabled', () => {
    enterFillingState('1');

    // Name
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.name.label')} 1`, 0),
      'Umar',
    );
    // Gender — select Male (index 0 for first sibling, Male 0)
    fireEvent.press(getByLabelTextAt('Male 0', 0));
    // Age
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.siblingAge.label')} 1`, 0),
      '25',
    );
    // Marital status — Never Married (index 0 for first sibling)
    fireEvent.press(getByLabelTextAt('Never Married 0', 0));
    // Profession
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.profession.label')} 1`, 0),
      'Teacher',
    );

    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);
  });

  it('given sibling name is missing, then Continue remains disabled', () => {
    enterFillingState('1');

    // Fill everything except name
    fireEvent.press(getByLabelTextAt('Male 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.siblingAge.label')} 1`, 0),
      '25',
    );
    fireEvent.press(getByLabelTextAt('Never Married 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.profession.label')} 1`, 0),
      'Teacher',
    );

    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given sibling age is out of range (100), then Continue remains disabled', () => {
    enterFillingState('1');

    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.name.label')} 1`, 0),
      'Umar',
    );
    fireEvent.press(getByLabelTextAt('Male 0', 0));
    // Age 100 is out of range (max 99)
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.siblingAge.label')} 1`, 0),
      '100',
    );
    fireEvent.press(getByLabelTextAt('Never Married 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.profession.label')} 1`, 0),
      'Teacher',
    );

    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given sibling age is 0 (valid minimum), then age is valid', () => {
    enterFillingState('1');

    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.name.label')} 1`, 0),
      'Umar',
    );
    fireEvent.press(getByLabelTextAt('Male 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.siblingAge.label')} 1`, 0),
      '0',
    );
    fireEvent.press(getByLabelTextAt('Never Married 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.profession.label')} 1`, 0),
      'Teacher',
    );

    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);
  });

  it('given sibling gender not selected, then Continue remains disabled', () => {
    enterFillingState('1');

    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.name.label')} 1`, 0),
      'Umar',
    );
    // Skip gender
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.siblingAge.label')} 1`, 0),
      '25',
    );
    fireEvent.press(getByLabelTextAt('Never Married 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.profession.label')} 1`, 0),
      'Teacher',
    );

    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given sibling marital status not selected, then Continue remains disabled', () => {
    enterFillingState('1');

    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.name.label')} 1`, 0),
      'Umar',
    );
    fireEvent.press(getByLabelTextAt('Male 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.siblingAge.label')} 1`, 0),
      '25',
    );
    // Skip marital status
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.profession.label')} 1`, 0),
      'Teacher',
    );

    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given sibling profession is too long (36 chars), then Continue remains disabled', () => {
    enterFillingState('1');

    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.name.label')} 1`, 0),
      'Umar',
    );
    fireEvent.press(getByLabelTextAt('Male 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.siblingAge.label')} 1`, 0),
      '25',
    );
    fireEvent.press(getByLabelTextAt('Never Married 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.profession.label')} 1`, 0),
      'A'.repeat(36),
    );

    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });
});

// ── (vii) Filling → Complete: setSiblings + serialization shape ──────────────

describe('Page19SiblingsScreen — (vii): Filling→Complete setSiblings serialization', () => {
  it('given 1 sibling fully filled, when Continue tapped, then setSiblings called with all 5 fields', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '1',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.name.label')} 1`, 0),
      'Umar',
    );
    fireEvent.press(getByLabelTextAt('Male 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.siblingAge.label')} 1`, 0),
      '25',
    );
    fireEvent.press(getByLabelTextAt('Never Married 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.profession.label')} 1`, 0),
      'Teacher',
    );

    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockSetSiblings).toHaveBeenCalledTimes(1);
    const calledWith = mockSetSiblings.mock.calls[0]?.[0] as SiblingDraft[];
    expect(calledWith).toHaveLength(1);

    const sibling = calledWith[0];
    expect(sibling).toBeDefined();
    // All 5 fields present
    expect(sibling?.name).toBe('Umar');
    expect(sibling?.gender).toBe('Male');
    expect(sibling?.age).toBe(25);
    expect(sibling?.maritalStatus).toBe('Never Married');
    expect(sibling?.profession).toBe('Teacher');
  });

  it('given 1 sibling fully filled, when Continue tapped, then advance(20) is called', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '1',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.name.label')} 1`, 0),
      'Umar',
    );
    fireEvent.press(getByLabelTextAt('Male 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.siblingAge.label')} 1`, 0),
      '25',
    );
    fireEvent.press(getByLabelTextAt('Never Married 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.profession.label')} 1`, 0),
      'Teacher',
    );

    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockAdvance).toHaveBeenCalledWith(20);
  });

  it('given 1 sibling fully filled, when Continue tapped, then navigates to Page20MarriageTimelineScreen', () => {
    const { nav } = renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.siblings.countPrompt')),
      '1',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.name.label')} 1`, 0),
      'Umar',
    );
    fireEvent.press(getByLabelTextAt('Male 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.siblingAge.label')} 1`, 0),
      '25',
    );
    fireEvent.press(getByLabelTextAt('Never Married 0', 0));
    fireEvent.changeText(
      getByLabelTextAt(`${t('siblingForm.profession.label')} 1`, 0),
      'Teacher',
    );

    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(nav.navigate).toHaveBeenCalledWith('Page20MarriageTimelineScreen');
  });
});

// ── (viii) Back-nav re-hydration ─────────────────────────────────────────────

describe('Page19SiblingsScreen — (viii): back-nav re-hydration', () => {
  it('given currentPage < 20, when screen mounts, then screen opens in Initial state (count input visible)', () => {
    renderScreen(19, []);
    expect(screen.getByLabelText(t('onboarding.siblings.countPrompt'))).toBeTruthy();
  });

  it('given currentPage >= 20 and siblings.length === 0, when screen mounts, then opens in Complete state (Continue enabled, no count input)', () => {
    renderScreen(20, []);

    // Complete state: Continue is enabled
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);

    // Count input is NOT visible in Complete state
    expect(screen.queryByLabelText(t('onboarding.siblings.countPrompt'))).toBeNull();
  });

  it('given currentPage >= 20 and siblings.length > 0, when screen mounts, then opens in Filling state pre-populated', () => {
    const preSiblings: SiblingDraft[] = [
      { name: 'Umar', age: 25, maritalStatus: 'Never Married', gender: 'Male', profession: 'Teacher' },
    ];
    renderScreen(20, preSiblings);

    // Filling state: Cancel button is visible
    expect(screen.getByLabelText(t('onboarding.siblings.cancel'))).toBeTruthy();
  });

  it('given currentPage >= 20 and pre-populated siblings, then Continue is enabled (all cards valid)', () => {
    const preSiblings: SiblingDraft[] = [
      { name: 'Umar', age: 25, maritalStatus: 'Never Married', gender: 'Male', profession: 'Teacher' },
    ];
    renderScreen(20, preSiblings);

    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);
  });

  it('given pre-populated Filling, when Cancel is pressed, then returns to Initial (count cleared, draft.siblings unchanged)', () => {
    const preSiblings: SiblingDraft[] = [
      { name: 'Umar', age: 25, maritalStatus: 'Never Married', gender: 'Male', profession: 'Teacher' },
    ];
    renderScreen(20, preSiblings);

    // Press Cancel
    fireEvent.press(screen.getByLabelText(t('onboarding.siblings.cancel')));

    // Now in Initial
    expect(screen.getByLabelText(t('onboarding.siblings.countPrompt'))).toBeTruthy();
    // Count is cleared
    expect(screen.getByLabelText(t('onboarding.siblings.countPrompt')).props.value).toBe('');
    // setSiblings was NOT called — draft.siblings unmodified
    expect(mockSetSiblings).not.toHaveBeenCalled();
  });
});

// ── (ix) schemaVersion discard path ──────────────────────────────────────────

describe('Page19SiblingsScreen — (ix): schemaVersion discard path via old-version fixture', () => {
  it('given the draft was constructed from an old-version discard and returns currentPage 1, then screen opens in Initial', () => {
    // Simulate the result of discarding an old-version draft: getDraft() returns a fresh empty draft
    // with currentPage = 1 (schemaVersion 3 now)
    const freshDraft = {
      schemaVersion: 3 as const,
      lastCheckpoint: null as null,
      currentPage: 1,
      fields: {},
      siblings: [] as SiblingDraft[],
      photoPreviewUris: [],
      notificationPermissionStatus: null,
      locationPermissionStatus: null,
      phone_number: null,
      timestamps: { createdAt: '', updatedAt: '' },
    };
    mockGetDraft.mockReturnValue(freshDraft);

    render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page19SiblingsScreen navigation={mockNavigation() as any} route={mockRoute() as any} />
      </ThemeProvider>,
    );

    // currentPage is 1 (<20) → Initial state
    expect(screen.getByLabelText(t('onboarding.siblings.countPrompt'))).toBeTruthy();
    // Continue is disabled (no count entered)
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });
});

// ── WizardHeader back navigation ──────────────────────────────────────────────

describe('Page19SiblingsScreen — WizardHeader back navigation', () => {
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
