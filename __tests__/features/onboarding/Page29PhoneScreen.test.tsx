/**
 * Wiring tests for Page29PhoneScreen (story 10.2).
 *
 * AC coverage:
 * (i)   Default dial code is derived from `draft.fields.resident_country_code`
 *       when it is set (e.g. 'IN' → '+91').
 * (ii)  Falls back to '+91' when `resident_country_code` is absent/empty.
 * (iii) Continue is disabled when nationalNumber + dialCode produce an invalid
 *       phone number; enabled only when `isValidPhone` returns true.
 * (iv)  Continue tap writes E.164 to `draft.phone_number` via `update()` and
 *       calls `advance(30)` and `navigation.navigate('Page30FaceVerifyIntroScreen')`.
 * (v)   Tapping the dial-code chip opens the country picker modal; selecting a
 *       country from the picker updates the displayed dial code.
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

// Mock react-native-country-flag — used inside CountryPicker for flag images.
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
    setPhotoPreviewUris: jest.fn(),
    setFaceSelfieUri: jest.fn(),
    clear: jest.fn(),
    isLoading: false,
  }),
}));

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { Page29PhoneScreen } from '@/features/onboarding/screens/Page29PhoneScreen';

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
    key: 'Page29PhoneScreen',
    name: 'Page29PhoneScreen' as const,
    params: undefined,
  };
}

/**
 * Builds a minimal draft object.
 *
 * @param residentCountryCode - ISO-2 code for `resident_country_code`.
 * @param phoneNumber         - Pre-existing E.164 phone number, or `null`.
 */
function makeDraft(
  residentCountryCode: string | undefined = undefined,
  phoneNumber: string | null = null,
) {
  return {
    schemaVersion: 4 as const,
    lastCheckpoint: 'secondCheckpoint' as const,
    currentPage: 29,
    fields: residentCountryCode !== undefined
      ? { resident_country_code: residentCountryCode }
      : {},
    siblings: [],
    photoPreviewUris: [],
    notificationPermissionStatus: null,
    locationPermissionStatus: null,
    phone_number: phoneNumber,
    faceSelfieUri: null,
    timestamps: { createdAt: '', updatedAt: '' },
  };
}

function renderScreen(
  residentCountryCode?: string,
  phoneNumber: string | null = null,
  nav = mockNavigation(),
) {
  mockGetDraft.mockReturnValue(makeDraft(residentCountryCode, phoneNumber));
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page29PhoneScreen navigation={nav as any} route={mockRoute() as any} />
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
// AC (i): Default dial code derived from resident_country_code
// ═══════════════════════════════════════════════════════════════════════════════

describe('Page29PhoneScreen — AC (i): default dial code from resident_country_code', () => {
  it('given resident_country_code is IN, then dial code chip shows +91', () => {
    renderScreen('IN');
    expect(screen.getByText('+91')).toBeTruthy();
  });

  it('given resident_country_code is PK, then dial code chip shows +92', () => {
    renderScreen('PK');
    expect(screen.getByText('+92')).toBeTruthy();
  });

  it('given resident_country_code is GB, then dial code chip shows +44', () => {
    renderScreen('GB');
    expect(screen.getByText('+44')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AC (ii): Fallback to +91 when resident_country_code is absent or unmapped
// ═══════════════════════════════════════════════════════════════════════════════

describe('Page29PhoneScreen — AC (ii): fallback to +91', () => {
  it('given resident_country_code is absent, then dial code chip shows +91', () => {
    renderScreen(undefined);
    expect(screen.getByText('+91')).toBeTruthy();
  });

  it('given resident_country_code is an empty string, then dial code chip shows +91', () => {
    renderScreen('');
    expect(screen.getByText('+91')).toBeTruthy();
  });

  it('given resident_country_code is an unmapped code ZZ, then dial code chip shows +91', () => {
    renderScreen('ZZ');
    expect(screen.getByText('+91')).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AC (iii): Continue gated by isValidPhone
// ═══════════════════════════════════════════════════════════════════════════════

describe('Page29PhoneScreen — AC (iii): Continue gated by validity', () => {
  it('given no number entered, then Continue button is disabled', () => {
    renderScreen('IN');
    const continueBtn = screen.getByText(t('onboarding.phone.continueLabel'));
    // The WizardFooter disables the Pressable — check that update is not called on press
    fireEvent.press(continueBtn);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given an invalid short number for IN, then Continue button does not write to draft on press', () => {
    renderScreen('IN');
    const input = screen.getByLabelText(t('onboarding.phone.inputAccessibility'));
    fireEvent.changeText(input, '12345');
    fireEvent.press(screen.getByText(t('onboarding.phone.continueLabel')));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given a valid Indian number 9812345678, then Continue is enabled and update is called on press', () => {
    const nav = mockNavigation();
    renderScreen('IN', null, nav);
    const input = screen.getByLabelText(t('onboarding.phone.inputAccessibility'));
    fireEvent.changeText(input, '9812345678');
    fireEvent.press(screen.getByText(t('onboarding.phone.continueLabel')));
    expect(mockUpdate).toHaveBeenCalledWith({ phone_number: '+919812345678' });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AC (iv): Continue writes E.164 and advances
// ═══════════════════════════════════════════════════════════════════════════════

describe('Page29PhoneScreen — AC (iv): Continue writes E.164 and advances', () => {
  it('given a valid UK number, when Continue is tapped, then update writes E.164 +447911123456', () => {
    const nav = mockNavigation();
    renderScreen('GB', null, nav);
    const input = screen.getByLabelText(t('onboarding.phone.inputAccessibility'));
    fireEvent.changeText(input, '7911123456');
    fireEvent.press(screen.getByText(t('onboarding.phone.continueLabel')));
    expect(mockUpdate).toHaveBeenCalledWith({ phone_number: '+447911123456' });
  });

  it('given a valid Pakistani number, when Continue is tapped, then advance(30) is called', () => {
    const nav = mockNavigation();
    renderScreen('PK', null, nav);
    const input = screen.getByLabelText(t('onboarding.phone.inputAccessibility'));
    fireEvent.changeText(input, '3001234567');
    fireEvent.press(screen.getByText(t('onboarding.phone.continueLabel')));
    expect(mockAdvance).toHaveBeenCalledWith(30);
  });

  it('given a valid Indian number, when Continue is tapped, then navigation advances to Page30FaceVerifyIntroScreen', () => {
    const nav = mockNavigation();
    renderScreen('IN', null, nav);
    const input = screen.getByLabelText(t('onboarding.phone.inputAccessibility'));
    fireEvent.changeText(input, '9812345678');
    fireEvent.press(screen.getByText(t('onboarding.phone.continueLabel')));
    expect(nav.navigate).toHaveBeenCalledWith('Page30FaceVerifyIntroScreen');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AC (v): Dial-code chip opens country picker and override changes dial code
// ═══════════════════════════════════════════════════════════════════════════════

describe('Page29PhoneScreen — AC (v): country picker override changes dial code', () => {
  it('given a tap on the dial-code chip, then the country picker appears (search input visible)', () => {
    renderScreen('IN');
    const dialChip = screen.getByLabelText(t('onboarding.phone.dialCodeAccessibility'));
    fireEvent.press(dialChip);
    expect(screen.getByLabelText(t('onboarding.country.searchPlaceholder'))).toBeTruthy();
  });

  it('given the picker is open, when the user selects GB (United Kingdom), then dial code updates to +44', () => {
    renderScreen('IN');
    const dialChip = screen.getByLabelText(t('onboarding.phone.dialCodeAccessibility'));
    fireEvent.press(dialChip);
    // Press the United Kingdom row in the CountryPicker
    const gbRow = screen.getByLabelText('United Kingdom +44');
    fireEvent.press(gbRow);
    expect(screen.getByText('+44')).toBeTruthy();
  });

  it('given the picker is open, when the user selects a country, then the modal closes', () => {
    renderScreen('IN');
    const dialChip = screen.getByLabelText(t('onboarding.phone.dialCodeAccessibility'));
    fireEvent.press(dialChip);
    const gbRow = screen.getByLabelText('United Kingdom +44');
    fireEvent.press(gbRow);
    // After selection the search input from the picker should no longer be accessible
    // (modal hidden). We verify by checking that the previous +91 is gone and +44 is shown.
    expect(screen.queryByLabelText(t('onboarding.country.searchPlaceholder'))).toBeNull();
  });

  it('given dial code changed to +44, when a valid UK number is entered, then Continue writes +44 E.164', () => {
    const nav = mockNavigation();
    renderScreen('IN', null, nav);
    // Open picker and select GB
    fireEvent.press(screen.getByLabelText(t('onboarding.phone.dialCodeAccessibility')));
    fireEvent.press(screen.getByLabelText('United Kingdom +44'));
    // Enter a valid UK number
    const input = screen.getByLabelText(t('onboarding.phone.inputAccessibility'));
    fireEvent.changeText(input, '7911123456');
    fireEvent.press(screen.getByText(t('onboarding.phone.continueLabel')));
    expect(mockUpdate).toHaveBeenCalledWith({ phone_number: '+447911123456' });
  });
});
