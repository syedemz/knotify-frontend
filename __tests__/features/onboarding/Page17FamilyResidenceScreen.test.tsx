/**
 * Tests for Page17FamilyResidenceScreen and the isValidFamilyResidenceAddress /
 * MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH helpers added to validationHelper.ts
 * (story 6.3).
 *
 * Part 1 — isValidFamilyResidenceAddress unit tests:
 *   - Boundary lengths (0, 1, 70, 71)
 *   - Special characters (/  #  ,  .  digits  apostrophes) are accepted
 *
 * Part 2 — Page17FamilyResidenceScreen wiring tests:
 *   (i)   Mount-write of "Srinagar" when draft district is null/undefined.
 *   (ii)  Mount-write is skipped when draft already has a district (back-nav case).
 *   (iii) Tapping a different district overwrites the draft.
 *   (iv)  family_residence_address validation gates Continue.
 *   (v)   Draft write + advance(18) + navigate on Continue.
 *
 * Test setup mirrors Page13EducationCredentialsScreen.test.tsx — the
 * `OnboardingDraftProvider: ({ children }) => children` passthrough MUST be
 * present inside the `useOnboardingDraft` mock (PR #92 context-refactor).
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
  isValidFamilyResidenceAddress,
  MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH,
} from '@/Helper/validationHelper';
import { Page17FamilyResidenceScreen } from '@/features/onboarding/screens/Page17FamilyResidenceScreen';

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
    key: 'Page17FamilyResidenceScreen',
    name: 'Page17FamilyResidenceScreen' as const,
    params: undefined,
  };
}

/**
 * Builds a minimal draft object for getDraft().
 *
 * @param districtValue - The `district` value in the draft's fields object, or
 *   `undefined` to simulate an empty draft (first visit).
 */
function makeDraft(districtValue?: string | null) {
  return {
    schemaVersion: 2 as const,
    lastCheckpoint: 'secondCheckpoint' as const,
    currentPage: 17,
    fields: districtValue !== undefined ? { district: districtValue } : {},
    siblings: [],
    photoPreviewUris: [],
    notificationPermissionStatus: null,
    locationPermissionStatus: null,
    timestamps: { createdAt: '', updatedAt: '' },
  };
}

function renderScreen(
  districtValue?: string | null,
  nav = mockNavigation(),
) {
  mockGetDraft.mockReturnValue(makeDraft(districtValue));
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page17FamilyResidenceScreen navigation={nav as any} route={mockRoute() as any} />
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
// Part 1 — isValidFamilyResidenceAddress unit tests
// ═════════════════════════════════════════════════════════════════════════════

describe('isValidFamilyResidenceAddress — boundary lengths', () => {
  it('given an empty string (length 0), then returns false', () => {
    expect(isValidFamilyResidenceAddress('')).toBe(false);
  });

  it('given a single character (length 1), then returns true', () => {
    expect(isValidFamilyResidenceAddress('A')).toBe(true);
  });

  it('given a string of exactly MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH (70) characters, then returns true', () => {
    expect(isValidFamilyResidenceAddress('A'.repeat(MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH))).toBe(true);
    expect(MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH).toBe(70);
  });

  it('given a string of MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH + 1 (71) characters, then returns false', () => {
    expect(isValidFamilyResidenceAddress('A'.repeat(MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH + 1))).toBe(false);
  });
});

describe('isValidFamilyResidenceAddress — special characters are accepted', () => {
  it('given a value containing forward-slash (/), then returns true', () => {
    expect(isValidFamilyResidenceAddress('House 5/A Street')).toBe(true);
  });

  it('given a value containing hash (#), then returns true', () => {
    expect(isValidFamilyResidenceAddress('House #5')).toBe(true);
  });

  it('given a value containing comma (,), then returns true', () => {
    expect(isValidFamilyResidenceAddress('Street 3, Srinagar')).toBe(true);
  });

  it('given a value containing period (.), then returns true', () => {
    expect(isValidFamilyResidenceAddress('St. 3')).toBe(true);
  });

  it('given a value containing digits, then returns true', () => {
    expect(isValidFamilyResidenceAddress('123 Main St')).toBe(true);
  });

  it("given a value containing apostrophe ('), then returns true", () => {
    expect(isValidFamilyResidenceAddress("O'Brien's Lane")).toBe(true);
  });

  it('given a realistic Kashmiri address with multiple special chars, then returns true', () => {
    expect(isValidFamilyResidenceAddress('House #5, Street 3, Srinagar 190001')).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Part 2 — Page17FamilyResidenceScreen wiring tests
// ═════════════════════════════════════════════════════════════════════════════

// ── Mount basics ──────────────────────────────────────────────────────────────

describe('Page17FamilyResidenceScreen — mount', () => {
  it('given the screen, when rendered, then it mounts without throwing', () => {
    expect(() => renderScreen()).not.toThrow();
  });

  it('given the screen renders, then the district picker title is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.kashmirDistrict.title'))).toBeTruthy();
  });

  it('given the screen renders, then the address field label is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.familyResidenceAddress.label'))).toBeTruthy();
  });

  it('given the screen renders, then the address text input is accessible by label', () => {
    renderScreen();
    expect(screen.getByLabelText(t('onboarding.familyResidenceAddress.label'))).toBeTruthy();
  });

  it('given the screen renders with no prior district, then "Srinagar" row is visible', () => {
    renderScreen();
    expect(screen.getByLabelText('Srinagar')).toBeTruthy();
  });
});

// ── AC (i): Mount-write of "Srinagar" when draft is empty ────────────────────

describe('Page17FamilyResidenceScreen — AC (i): mount-write Srinagar when draft is empty', () => {
  it('given draft has no district (undefined), when mounted, then update is called with district: "Srinagar"', () => {
    // districtValue = undefined means the fields object has no district key
    renderScreen(undefined);

    expect(mockUpdate).toHaveBeenCalledWith({ district: 'Srinagar' });
  });

  it('given draft district is null, when mounted, then update is called with district: "Srinagar"', () => {
    renderScreen(null);

    expect(mockUpdate).toHaveBeenCalledWith({ district: 'Srinagar' });
  });
});

// ── AC (ii): Mount-write skipped on back-nav ──────────────────────────────────

describe('Page17FamilyResidenceScreen — AC (ii): mount-write skipped when district already set', () => {
  it('given draft already has district "Anantnag", when mounted, then update is NOT called for the default write', () => {
    renderScreen('Anantnag');

    // update() must NOT be called on mount when a value already exists.
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given draft already has district "Jammu", when mounted, then "Jammu" row shows as selected', () => {
    renderScreen('Jammu');

    const jammuRow = screen.getByLabelText('Jammu');
    expect(jammuRow.props.accessibilityState.checked).toBe(true);
  });

  it('given draft already has district "Srinagar" (prior explicit choice), when mounted, then update is NOT called', () => {
    renderScreen('Srinagar');

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── AC (iii): Tapping a different district overwrites draft ────────────────────

describe('Page17FamilyResidenceScreen — AC (iii): tapping a district overwrites draft', () => {
  it('given the screen is mounted with default, when Anantnag is tapped, then update is called with district: "Anantnag"', () => {
    renderScreen(undefined);
    // Clear mount-write call first
    mockUpdate.mockClear();

    fireEvent.press(screen.getByLabelText('Anantnag'));

    expect(mockUpdate).toHaveBeenCalledWith({ district: 'Anantnag' });
  });

  it('given Anantnag is tapped, then Anantnag row becomes selected', () => {
    renderScreen(undefined);
    mockUpdate.mockClear();

    fireEvent.press(screen.getByLabelText('Anantnag'));

    const anantnagRow = screen.getByLabelText('Anantnag');
    expect(anantnagRow.props.accessibilityState.checked).toBe(true);
  });

  it('given Anantnag is tapped after Srinagar was default, then Srinagar row is no longer selected', () => {
    renderScreen(undefined);
    mockUpdate.mockClear();

    fireEvent.press(screen.getByLabelText('Anantnag'));

    const srinargarRow = screen.getByLabelText('Srinagar');
    expect(srinargarRow.props.accessibilityState.checked).toBe(false);
  });
});

// ── AC (iv): family_residence_address validation gates Continue ───────────────

describe('Page17FamilyResidenceScreen — AC (iv): address validation gates Continue', () => {
  it('given no address is entered, then Continue is disabled', () => {
    renderScreen(undefined);
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given a valid address is entered, then Continue becomes enabled', () => {
    renderScreen(undefined);
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.familyResidenceAddress.label')),
      'House #5, Street 3',
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);
  });

  it('given the address is cleared after being entered, then Continue becomes disabled again', () => {
    renderScreen(undefined);
    const input = screen.getByLabelText(t('onboarding.familyResidenceAddress.label'));
    fireEvent.changeText(input, 'House #5');
    fireEvent.changeText(input, '');
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given an address that is too long (71 chars), then Continue remains disabled', () => {
    renderScreen(undefined);
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.familyResidenceAddress.label')),
      'A'.repeat(71),
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given an address of exactly 70 chars, then Continue is enabled', () => {
    renderScreen(undefined);
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.familyResidenceAddress.label')),
      'A'.repeat(70),
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);
  });
});

// ── AC (v): Draft write + advance on Continue ─────────────────────────────────

describe('Page17FamilyResidenceScreen — AC (v): draft write and advance on Continue', () => {
  it('given a valid address, when Continue is pressed, then update is called with both district and address', () => {
    renderScreen(undefined);
    // Clear the mount-write before the Continue assertion.
    mockUpdate.mockClear();

    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.familyResidenceAddress.label')),
      'House #5, Street 3',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        district: 'Srinagar',
        family_residence_address: 'House #5, Street 3',
      }),
    );
  });

  it('given Anantnag is selected and valid address entered, when Continue is pressed, then update contains Anantnag', () => {
    renderScreen(undefined);
    mockUpdate.mockClear();

    fireEvent.press(screen.getByLabelText('Anantnag'));
    mockUpdate.mockClear(); // clear district tap write

    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.familyResidenceAddress.label')),
      '12 Main Road',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        district: 'Anantnag',
        family_residence_address: '12 Main Road',
      }),
    );
  });

  it('given a valid address, when Continue is pressed, then advance(18) is called', () => {
    renderScreen(undefined);

    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.familyResidenceAddress.label')),
      'House #5, Street 3',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(18);
  });

  it('given a valid address, when Continue is pressed, then navigation.navigate is called with Page18ParentsScreen', () => {
    const { nav } = renderScreen(undefined);

    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.familyResidenceAddress.label')),
      'House #5, Street 3',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('Page18ParentsScreen');
  });

  it('given Continue is pressed with no address, then update and advance are NOT called for the Continue handler', () => {
    renderScreen(undefined);
    mockUpdate.mockClear();
    mockAdvance.mockClear();

    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockAdvance).not.toHaveBeenCalled();
  });
});

// ── Inline error display ──────────────────────────────────────────────────────

describe('Page17FamilyResidenceScreen — inline error display', () => {
  it('given the screen first renders, then no address error is shown (untouched)', () => {
    renderScreen(undefined);
    expect(screen.queryByText(t('onboarding.familyResidenceAddress.errors.tooLong'))).toBeNull();
    expect(screen.queryByText(t('onboarding.familyResidenceAddress.errors.tooShort'))).toBeNull();
  });

  it('given the address field is filled with a too-long value (71 chars), then tooLong error shows', () => {
    renderScreen(undefined);
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.familyResidenceAddress.label')),
      'A'.repeat(71),
    );
    expect(screen.getByText(t('onboarding.familyResidenceAddress.errors.tooLong'))).toBeTruthy();
  });

  it('given the address field is filled with a valid value, then no error shows', () => {
    renderScreen(undefined);
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.familyResidenceAddress.label')),
      'House #5, Street 3',
    );
    expect(screen.queryByText(t('onboarding.familyResidenceAddress.errors.tooLong'))).toBeNull();
    expect(screen.queryByText(t('onboarding.familyResidenceAddress.errors.tooShort'))).toBeNull();
  });
});

// ── WizardHeader back navigation ──────────────────────────────────────────────

describe('Page17FamilyResidenceScreen — WizardHeader back navigation', () => {
  it('given the screen renders, then a back button is accessible', () => {
    renderScreen(undefined);
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    expect(backButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('given the back button is pressed, then navigation.goBack is called', () => {
    const { nav } = renderScreen(undefined);
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    const firstBack = backButtons[0];
    if (firstBack === undefined) throw new Error('No back button found');
    fireEvent.press(firstBack);
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });
});
