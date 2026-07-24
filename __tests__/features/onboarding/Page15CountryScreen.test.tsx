/**
 * Wiring tests for Page15CountryScreen (story 6.1).
 *
 * Covers:
 * 1. Screen renders a country list from `src/config/countries.ts`.
 * 2. Tapping a row writes BOTH `current_residence_country` AND
 *    `resident_country_code` atomically in a single `update({...})` call.
 * 3. Tapping a row auto-advances to `Page16ResidenceCityScreen`.
 * 4. WizardHeader back button calls `navigation.goBack()`.
 *
 * Test setup mirrors `Page13EducationCredentialsScreen.test.tsx` — the
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

// Mock react-native-country-flag — renders a plain RN Image in tests.
jest.mock('react-native-country-flag', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    __esModule: true,
    default: function (props: any) {
      return Rct.createElement(RN.Image, {
        source: { uri: `https://flagcdn.com/w80/${props.isoCode.toLowerCase()}.png` },
        testID: `flag-${props.isoCode}`,
      });
    },
  };
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
import { countries } from '@/config/countries';
import { Page15CountryScreen } from '@/features/onboarding/screens/Page15CountryScreen';

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
    key: 'Page15ResidenceCountryScreen',
    name: 'Page15ResidenceCountryScreen' as const,
    params: undefined,
  };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page15CountryScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

beforeEach(() => {
  mockUpdate.mockClear();
  mockAdvance.mockClear();
});

// ── 1. Row rendering ──────────────────────────────────────────────────────────

describe('Page15CountryScreen — row rendering', () => {
  it('given the screen renders, then the title is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.country.title'))).toBeTruthy();
  });

  it('given the screen renders, then the search bar is visible with the correct placeholder label', () => {
    renderScreen();
    expect(screen.getByLabelText(t('onboarding.country.searchPlaceholder'))).toBeTruthy();
  });

  it('given the screen renders, then country rows are present (countries list is non-empty)', () => {
    renderScreen();
    // The full country list from src/config/countries.ts should render.
    // We assert a known early entry (Afghanistan — first alphabetically).
    expect(screen.getByText('Afghanistan')).toBeTruthy();
  });

  it('given the screen renders, then the Pakistan row includes both name and dial code', () => {
    renderScreen();
    expect(screen.getByText('Pakistan')).toBeTruthy();
    expect(screen.getByText('+92')).toBeTruthy();
  });

  it('given the screen renders, then the number of country rows matches countries list length', () => {
    renderScreen();
    // All entries in the countries list should appear as accessible buttons.
    const allRows = screen.getAllByRole('button');
    // allRows includes WizardHeader back button — we just verify it's at least countries.length.
    expect(allRows.length).toBeGreaterThanOrEqual(countries.length);
  });

  it('given the screen renders, then flag images are rendered for visible rows', () => {
    renderScreen();
    // Check a known flag is present
    expect(screen.getByTestId('flag-AF')).toBeTruthy();
    expect(screen.getByTestId('flag-PK')).toBeTruthy();
  });
});

// ── 2. Atomic dual-field write ────────────────────────────────────────────────

describe('Page15CountryScreen — atomic dual-field write', () => {
  it('given the user taps Pakistan, then update is called ONCE with both fields', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('country-row-PK'));

    // Exactly one call — atomic write.
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      current_residence_country: 'Pakistan',
      resident_country_code: 'PK',
    });
  });

  it('given the user taps United Kingdom, then update is called with ("United Kingdom", "GB")', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('country-row-GB'));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({
      current_residence_country: 'United Kingdom',
      resident_country_code: 'GB',
    });
  });

  it('given the user taps Afghanistan, then update writes correct iso2 "AF"', () => {
    renderScreen();
    fireEvent.press(screen.getByTestId('country-row-AF'));

    expect(mockUpdate).toHaveBeenCalledWith({
      current_residence_country: 'Afghanistan',
      resident_country_code: 'AF',
    });
  });
});

// ── 3. Auto-advance ───────────────────────────────────────────────────────────

describe('Page15CountryScreen — auto-advance to Page16', () => {
  it('given the user taps a country row, then advance(16) is called', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByTestId('country-row-PK'));

    expect(mockAdvance).toHaveBeenCalledWith(16);
    void nav; // suppress unused variable warning
  });

  it('given the user taps a country row, then navigation.navigate is called with Page16ResidenceCityScreen', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByTestId('country-row-PK'));

    expect(nav.navigate).toHaveBeenCalledWith('Page16ResidenceCityScreen');
  });

  it('given the user taps a country row, then update fires before advance (atomic-first ordering)', () => {
    const callOrder: string[] = [];
    mockUpdate.mockImplementation(() => { callOrder.push('update'); });
    mockAdvance.mockImplementation(() => { callOrder.push('advance'); });

    renderScreen();
    fireEvent.press(screen.getByTestId('country-row-PK'));

    expect(callOrder).toEqual(['update', 'advance']);
  });
});

// ── 4. WizardHeader back ──────────────────────────────────────────────────────

describe('Page15CountryScreen — WizardHeader back', () => {
  it('given the screen renders, then a back button is accessible', () => {
    renderScreen();
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    expect(backButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('given the back button is pressed, then navigation.goBack is called', () => {
    const { nav } = renderScreen();
    const [firstBack] = screen.getAllByLabelText(t('wizard.header.back'));
    if (firstBack === undefined) throw new Error('No back button found');
    fireEvent.press(firstBack);
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });
});

// ── 5. No default pre-selection ───────────────────────────────────────────────

describe('Page15CountryScreen — no default pre-selection', () => {
  it('given the screen renders, then no country row has accessibilityState.selected=true', () => {
    renderScreen();
    // Sample a few well-known rows — none should be pre-selected.
    const rows = ['AF', 'PK', 'GB', 'US'].map(
      (iso) => screen.getByTestId(`country-row-${iso}`),
    );
    for (const row of rows) {
      expect(row.props.accessibilityState?.selected).not.toBe(true);
    }
  });
});
