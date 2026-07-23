/**
 * Wiring tests for Page07BirthdayScreen (story 3.3).
 *
 * Covers:
 * (a) Valid-birthday continue: advances draft + navigates to
 *     Page08FirstCheckpointScreen.
 * (b) Invalid-birthday inline error rendering (under-18 case).
 * (c) Continue disabled until a valid birthday is selected.
 * (d) WizardHeader back navigation.
 *
 * The DatePicker is mocked to expose its `onChange` callback via a captured
 * ref, letting tests drive date selection without the native module.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

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

/**
 * DatePicker mock.
 *
 * Renders a Pressable trigger. Captures `onChange` in `latestOnChange` so
 * tests can drive date selection by calling `latestOnChange('YYYY-MM-DD')`.
 *
 * Also exposes `accessibilityLabel` so a11y queries work normally.
 */
let latestOnChange: ((iso: string | undefined) => void) | null = null;

jest.mock('@/components/DatePicker', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    DatePicker: function (props: any) {
      // Capture the callback so tests can invoke it directly.
      latestOnChange = props.onChange;
      return Rct.createElement(RN.Pressable, {
        testID: 'date-picker-trigger',
        accessibilityLabel: props.accessibilityLabel ?? 'date-picker',
      });
    },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── useOnboardingDraft mock ───────────────────────────────────────────────────

const mockUpdate = jest.fn();
const mockAdvance = jest.fn();

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  useOnboardingDraft: () => ({
    update: mockUpdate,
    advance: mockAdvance,
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: jest.fn(() => ({
      schemaVersion: 1,
      lastCheckpoint: null,
      currentPage: 7,
      fields: {},
      siblings: [],
      photoPreviewUris: [],
      notificationPermissionStatus: null,
      locationPermissionStatus: null,
      timestamps: { createdAt: '', updatedAt: '' },
    })),
    setSiblings: jest.fn(),
    isLoading: false,
  }),
}));

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { Page07BirthdayScreen } from '@/features/onboarding/screens/Page07BirthdayScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

function mockRoute() {
  return {
    key: 'Page07BirthdayScreen',
    name: 'Page07BirthdayScreen' as const,
    params: undefined,
  };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page07BirthdayScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

/** Simulates the user picking a date through the mocked DatePicker. */
function pickDate(iso: string): void {
  act(() => {
    if (latestOnChange === null) throw new Error('DatePicker onChange not captured');
    latestOnChange(iso);
  });
}

beforeEach(() => {
  mockUpdate.mockClear();
  mockAdvance.mockClear();
  latestOnChange = null;
});

// ── Mount ─────────────────────────────────────────────────────────────────────

describe('Page07BirthdayScreen — mount', () => {
  it('given the screen, when rendered, then mounts without throwing', () => {
    expect(() => renderScreen()).not.toThrow();
  });

  it('given the screen renders, then the date picker trigger is present', () => {
    renderScreen();
    expect(screen.getByTestId('date-picker-trigger')).toBeTruthy();
  });

  it('given the screen renders, then the banner image is present', () => {
    renderScreen();
    expect(screen.getByTestId('expo-image')).toBeTruthy();
  });

  it('given the screen renders, then the picker accessibility label matches the label key', () => {
    renderScreen();
    expect(screen.getByLabelText(t('onboarding.birthday.pickerLabel'))).toBeTruthy();
  });
});

// ── Continue disabled (no date selected) ─────────────────────────────────────

describe('Page07BirthdayScreen — Continue disabled with no date', () => {
  it('given no birthday selected, then pressing Continue does not call update or advance', () => {
    renderScreen();
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockAdvance).not.toHaveBeenCalled();
  });
});

// ── Invalid-birthday inline error (AC b) ─────────────────────────────────────

describe('Page07BirthdayScreen — invalid birthday shows inline error', () => {
  it('given an under-18 birthday is selected, then the under18 error label renders', () => {
    renderScreen();
    // Pick a date that is only a few days old — clearly under 18.
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    pickDate(yesterday);
    expect(screen.getByText(t('onboarding.birthday.errors.under18'))).toBeTruthy();
  });

  it('given an under-18 birthday is selected, then Continue remains disabled (update not called)', () => {
    renderScreen();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    pickDate(yesterday);
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given a future birthday is selected, then the future error label renders', () => {
    renderScreen();
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    pickDate(tomorrow);
    expect(screen.getByText(t('onboarding.birthday.errors.future'))).toBeTruthy();
  });

  it('given an unreasonable year birthday is selected, then the yearUnreasonable error label renders', () => {
    renderScreen();
    pickDate('1899-06-15');
    expect(screen.getByText(t('onboarding.birthday.errors.yearUnreasonable'))).toBeTruthy();
  });
});

// ── Valid-birthday continue (AC a) ────────────────────────────────────────────

describe('Page07BirthdayScreen — valid birthday continue', () => {
  it('given a valid birthday is selected, then Continue does not show an error', () => {
    renderScreen();
    // A birthday 25 years ago — always valid.
    const twentyFiveYearsAgo = new Date(
      Date.now() - 25 * 365.25 * 24 * 60 * 60 * 1000,
    )
      .toISOString()
      .slice(0, 10);
    pickDate(twentyFiveYearsAgo);
    // Error labels should not be present.
    expect(screen.queryByText(t('onboarding.birthday.errors.under18'))).toBeNull();
    expect(screen.queryByText(t('onboarding.birthday.errors.future'))).toBeNull();
    expect(screen.queryByText(t('onboarding.birthday.errors.yearUnreasonable'))).toBeNull();
  });

  it('given a valid birthday is selected, then tapping Continue calls update with birthday', () => {
    renderScreen();
    const validBirthday = '1996-07-23';
    pickDate(validBirthday);
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ birthday: validBirthday });
  });

  it('given a valid birthday is selected, then tapping Continue calls advance with 8', () => {
    renderScreen();
    pickDate('1996-07-23');
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(8);
  });

  it('given a valid birthday is selected, then tapping Continue navigates to Page08FirstCheckpointScreen', () => {
    const { nav } = renderScreen();
    pickDate('1996-07-23');
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(nav.navigate).toHaveBeenCalledWith('Page08FirstCheckpointScreen');
    expect(nav.navigate).toHaveBeenCalledTimes(1);
  });

  it('given a valid birthday is selected, then the age preview is visible', () => {
    renderScreen();
    // '1996-07-23' is 29 or 30 years old depending on current date.
    // We just check the agePreview template string is resolved (contains "years").
    pickDate('1996-07-23');
    // The age preview text contains "years" from the template "{age} years".
    const agePreviewElements = screen.queryAllByText(/years/);
    expect(agePreviewElements.length).toBeGreaterThan(0);
  });
});

// ── WizardHeader back ─────────────────────────────────────────────────────────

describe('Page07BirthdayScreen — WizardHeader', () => {
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
});
