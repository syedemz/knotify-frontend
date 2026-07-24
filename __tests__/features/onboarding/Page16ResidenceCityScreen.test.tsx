/**
 * Tests for Page16ResidenceCityScreen and the isValidCity / MAX_CITY_NAME_LENGTH
 * helpers added to validationHelper.ts (story 6.2).
 *
 * Part 1 — isValidCity unit tests:
 *   - Boundary lengths (0, 1, 40, 41)
 *   - Leading / trailing whitespace rejection
 *   - Allowed character set (letters, spaces, hyphens, apostrophes)
 *   - Rejected characters (digits, punctuation other than hyphen/apostrophe)
 *
 * Part 2 — Page16ResidenceCityScreen wiring tests:
 *   - Valid + each invalid case drives the error display
 *   - Disabled / enabled Continue transition
 *   - Draft write (update call with correct key)
 *   - Auto-advance (advance(17) + navigation.navigate('Page17FamilyResidenceScreen'))
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

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  OnboardingDraftProvider: ({ children }: any) => children,
  useOnboardingDraft: () => ({
    update: mockUpdate,
    advance: mockAdvance,
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: jest.fn(),
    setSiblings: jest.fn(),
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    isLoading: false,
  }),
}));

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { isValidCity, MAX_CITY_NAME_LENGTH } from '@/Helper/validationHelper';
import { Page16ResidenceCityScreen } from '@/features/onboarding/screens/Page16ResidenceCityScreen';

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
    key: 'Page16ResidenceCityScreen',
    name: 'Page16ResidenceCityScreen' as const,
    params: undefined,
  };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page16ResidenceCityScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

beforeEach(() => {
  mockUpdate.mockClear();
  mockAdvance.mockClear();
});

// ═════════════════════════════════════════════════════════════════════════════
// Part 1 — isValidCity unit tests
// ═════════════════════════════════════════════════════════════════════════════

describe('isValidCity — boundary lengths', () => {
  it('given an empty string (length 0), then isValidCity returns false', () => {
    expect(isValidCity('')).toBe(false);
  });

  it('given a single letter (length 1), then isValidCity returns true', () => {
    expect(isValidCity('A')).toBe(true);
  });

  it('given a string of exactly MAX_CITY_NAME_LENGTH (40) letters, then isValidCity returns true', () => {
    expect(isValidCity('A'.repeat(MAX_CITY_NAME_LENGTH))).toBe(true);
    expect(MAX_CITY_NAME_LENGTH).toBe(40);
  });

  it('given a string of MAX_CITY_NAME_LENGTH + 1 (41) letters, then isValidCity returns false', () => {
    expect(isValidCity('A'.repeat(MAX_CITY_NAME_LENGTH + 1))).toBe(false);
  });
});

describe('isValidCity — leading / trailing whitespace rejection', () => {
  it('given a city name with a leading space, then isValidCity returns false', () => {
    expect(isValidCity(' London')).toBe(false);
  });

  it('given a city name with a trailing space, then isValidCity returns false', () => {
    expect(isValidCity('London ')).toBe(false);
  });

  it('given a city name with both leading and trailing spaces, then isValidCity returns false', () => {
    expect(isValidCity(' London ')).toBe(false);
  });

  it('given a city name with only spaces, then isValidCity returns false', () => {
    expect(isValidCity('   ')).toBe(false);
  });
});

describe('isValidCity — allowed character set', () => {
  it('given a simple city name with only letters, then isValidCity returns true', () => {
    expect(isValidCity('London')).toBe(true);
  });

  it('given a city name with a space (two-word name), then isValidCity returns true', () => {
    expect(isValidCity('New York')).toBe(true);
  });

  it('given a city name with a hyphen, then isValidCity returns true', () => {
    expect(isValidCity('Clermont-Ferrand')).toBe(true);
  });

  it('given a city name with an apostrophe, then isValidCity returns true', () => {
    expect(isValidCity("Coeur d'Alene")).toBe(true);
  });

  it('given a mixed valid city name with letters, hyphens, and spaces, then isValidCity returns true', () => {
    expect(isValidCity('Saint-Genis-de-Saintonge')).toBe(true);
  });

  it('given a city name with both apostrophe and hyphen, then isValidCity returns true', () => {
    expect(isValidCity("L'Hay-les-Roses")).toBe(true);
  });

  it('given a city name with mixed case letters, then isValidCity returns true', () => {
    expect(isValidCity('Islamabad')).toBe(true);
  });
});

describe('isValidCity — rejected characters', () => {
  it('given a city name containing a digit, then isValidCity returns false', () => {
    expect(isValidCity('London1')).toBe(false);
  });

  it('given a city name containing only digits, then isValidCity returns false', () => {
    expect(isValidCity('12345')).toBe(false);
  });

  it('given a city name with a period, then isValidCity returns false', () => {
    expect(isValidCity('St. Louis')).toBe(false);
  });

  it('given a city name with a comma, then isValidCity returns false', () => {
    expect(isValidCity('London, UK')).toBe(false);
  });

  it('given a city name with an exclamation mark, then isValidCity returns false', () => {
    expect(isValidCity('London!')).toBe(false);
  });

  it('given a city name with an at-sign, then isValidCity returns false', () => {
    expect(isValidCity('city@town')).toBe(false);
  });

  it('given a city name with an ampersand, then isValidCity returns false', () => {
    expect(isValidCity('Town & Country')).toBe(false);
  });

  it('given a city name with a slash, then isValidCity returns false', () => {
    expect(isValidCity('New/York')).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Part 2 — Page16ResidenceCityScreen wiring tests
// ═════════════════════════════════════════════════════════════════════════════

// ── Mount ─────────────────────────────────────────────────────────────────────

describe('Page16ResidenceCityScreen — mount', () => {
  it('given the screen, when rendered, then it mounts without throwing', () => {
    expect(() => renderScreen()).not.toThrow();
  });

  it('given the screen renders, then the title is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.residenceCity.title'))).toBeTruthy();
  });

  it('given the screen renders, then the field label is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.residenceCity.label'))).toBeTruthy();
  });

  it('given the screen renders, then the city text input is accessible by label', () => {
    renderScreen();
    expect(screen.getByLabelText(t('onboarding.residenceCity.label'))).toBeTruthy();
  });
});

// ── Disabled / enabled Continue transition ────────────────────────────────────

describe('Page16ResidenceCityScreen — Continue disabled/enabled transition', () => {
  it('given the screen first renders with no input, then Continue is disabled', () => {
    renderScreen();
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given the user enters a valid city name, then Continue becomes enabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'London',
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(false);
  });

  it('given the user enters an invalid city name (digit), then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'London1',
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });

  it('given the user enters a city name that is too long (41 chars), then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'A'.repeat(41),
    );
    const btn = screen.getByLabelText(t('wizard.footer.continue'));
    expect(btn.props.accessibilityState.disabled).toBe(true);
  });
});

// ── Inline error display (touched-flag guard) ─────────────────────────────────

describe('Page16ResidenceCityScreen — inline error display', () => {
  it('given the screen first renders, then no error is shown (untouched)', () => {
    renderScreen();
    expect(screen.queryByText(t('onboarding.residenceCity.errors.tooShort'))).toBeNull();
    expect(screen.queryByText(t('onboarding.residenceCity.errors.tooLong'))).toBeNull();
    expect(screen.queryByText(t('onboarding.residenceCity.errors.invalidCharacters'))).toBeNull();
  });

  it('given the field is touched with an invalid-character value, then invalidCharacters error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'London1',
    );
    expect(screen.getByText(t('onboarding.residenceCity.errors.invalidCharacters'))).toBeTruthy();
  });

  it('given the field is touched with a too-long value (41 chars), then tooLong error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'A'.repeat(41),
    );
    expect(screen.getByText(t('onboarding.residenceCity.errors.tooLong'))).toBeTruthy();
  });

  it('given the field is touched with a valid value, then no error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'London',
    );
    expect(screen.queryByText(t('onboarding.residenceCity.errors.tooShort'))).toBeNull();
    expect(screen.queryByText(t('onboarding.residenceCity.errors.tooLong'))).toBeNull();
    expect(screen.queryByText(t('onboarding.residenceCity.errors.invalidCharacters'))).toBeNull();
  });

  it('given the field is touched with a value containing a leading space, then invalidCharacters error shows', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      ' London',
    );
    expect(screen.getByText(t('onboarding.residenceCity.errors.invalidCharacters'))).toBeTruthy();
  });
});

// ── Draft write on Continue ───────────────────────────────────────────────────

describe('Page16ResidenceCityScreen — draft write on Continue', () => {
  it('given a valid city, when Continue is pressed, then update is called with current_residence_city', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'London',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ current_residence_city: 'London' });
  });

  it('given a city with hyphens and spaces, when Continue is pressed, then the exact value is written', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'Clermont-Ferrand',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockUpdate).toHaveBeenCalledWith({ current_residence_city: 'Clermont-Ferrand' });
  });

  it('given Continue is pressed with an invalid value, then update is NOT called', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'London1',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── Auto-advance on Continue ──────────────────────────────────────────────────

describe('Page16ResidenceCityScreen — auto-advance on Continue', () => {
  it('given a valid city, when Continue is pressed, then advance(17) is called', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'London',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(17);
  });

  it('given a valid city, when Continue is pressed, then navigation.navigate is called with Page17FamilyResidenceScreen', () => {
    const { nav } = renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'London',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(nav.navigate).toHaveBeenCalledTimes(1);
    expect(nav.navigate).toHaveBeenCalledWith('Page17FamilyResidenceScreen');
  });

  it('given a valid city, when Continue is pressed, then update fires before advance', () => {
    const callOrder: string[] = [];
    mockUpdate.mockImplementation(() => { callOrder.push('update'); });
    mockAdvance.mockImplementation(() => { callOrder.push('advance'); });

    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.residenceCity.label')),
      'London',
    );
    fireEvent.press(screen.getByLabelText(t('wizard.footer.continue')));

    expect(callOrder).toEqual(['update', 'advance']);
  });
});

// ── WizardHeader back navigation ──────────────────────────────────────────────

describe('Page16ResidenceCityScreen — WizardHeader back navigation', () => {
  it('given the screen renders, then a back button is accessible', () => {
    renderScreen();
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    expect(backButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('given the back button is pressed, then navigation.goBack is called', () => {
    const { nav } = renderScreen();
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    const firstBack = backButtons[0];
    if (firstBack === undefined) throw new Error('No back button found');
    fireEvent.press(firstBack);
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });
});
