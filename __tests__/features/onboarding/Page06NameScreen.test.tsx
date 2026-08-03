/**
 * Wiring tests for Page06NameScreen (story 3.2).
 *
 * Covers:
 * (a) Invalid input keeps Continue disabled.
 * (b) Valid input enables Continue.
 * (c) Tap Continue writes first_name + last_name + username to draft, advances
 *     currentPage to 7, and navigates to Page07BirthdayScreen.
 * (d) Generated username matches /^[a-z]{2,}[0-9]{4}$/.
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

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

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
      lastCheckpoint: null,
      currentPage: 6,
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
import { Page06NameScreen } from '@/features/onboarding/screens/Page06NameScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

const USERNAME_RE = /^[a-z]{2,}[0-9]{4}$/;

function mockNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

function mockRoute() {
  return {
    key: 'Page06NameScreen',
    name: 'Page06NameScreen' as const,
    params: undefined,
  };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page06NameScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

beforeEach(() => {
  mockUpdate.mockClear();
  mockAdvance.mockClear();
});

// ── Mount ─────────────────────────────────────────────────────────────────────

describe('Page06NameScreen — mount', () => {
  it('given Page06NameScreen, when rendered, then it mounts without throwing', () => {
    expect(() => renderScreen()).not.toThrow();
  });

  it('given the screen renders, then the first name input is present', () => {
    renderScreen();
    expect(screen.getByLabelText(t('onboarding.name.firstNameLabel'))).toBeTruthy();
  });

  it('given the screen renders, then the last name input is present', () => {
    renderScreen();
    expect(screen.getByLabelText(t('onboarding.name.lastNameLabel'))).toBeTruthy();
  });
});

// ── Continue disabled (AC a) ──────────────────────────────────────────────────

describe('Page06NameScreen — Continue disabled with invalid input', () => {
  it('given both fields empty, then Continue button is disabled', () => {
    renderScreen();
    // Continue button is disabled — pressing it should not trigger update/advance
    const continueBtn = screen.getByText(t('wizard.footer.continue'));
    fireEvent.press(continueBtn);
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given only first name is filled (valid), then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.firstNameLabel')),
      'Marie',
    );
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given only last name is filled (valid), then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.lastNameLabel')),
      'Smith',
    );
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given first name contains a digit (invalid), then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.firstNameLabel')),
      'Marie1',
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.lastNameLabel')),
      'Smith',
    );
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('given last name has leading space (invalid), then Continue remains disabled', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.firstNameLabel')),
      'Marie',
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.lastNameLabel')),
      ' Smith',
    );
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ── Continue enabled (AC b) ───────────────────────────────────────────────────

describe('Page06NameScreen — Continue enabled with valid input', () => {
  it('given both names are valid, then Continue is enabled and does not no-op', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.firstNameLabel')),
      'Marie',
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.lastNameLabel')),
      'Smith',
    );
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledTimes(1);
  });

  it('given hyphenated names, then Continue activates correctly', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.firstNameLabel')),
      'Marie-Claire',
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.lastNameLabel')),
      "O'Brien",
    );
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});

// ── Continue tap — write, advance, navigate (AC c) ────────────────────────────

describe('Page06NameScreen — tap Continue', () => {
  it('given valid names, then update is called with first_name, last_name, and username', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.firstNameLabel')),
      'Marie',
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.lastNameLabel')),
      'Smith',
    );
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const [arg] = mockUpdate.mock.calls[0] as [{ first_name: string; last_name: string; username: string }];
    expect(arg.first_name).toBe('Marie');
    expect(arg.last_name).toBe('Smith');
    expect(typeof arg.username).toBe('string');
  });

  it('given valid names, then advance is called with 7', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.firstNameLabel')),
      'Marie',
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.lastNameLabel')),
      'Smith',
    );
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(mockAdvance).toHaveBeenCalledWith(7);
  });

  it('given valid names, then navigates to Page07BirthdayScreen', () => {
    const { nav } = renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.firstNameLabel')),
      'Marie',
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.lastNameLabel')),
      'Smith',
    );
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));
    expect(nav.navigate).toHaveBeenCalledWith('Page07BirthdayScreen');
    expect(nav.navigate).toHaveBeenCalledTimes(1);
  });
});

// ── Username regex (AC d) ─────────────────────────────────────────────────────

describe('Page06NameScreen — generated username format', () => {
  it('given valid names, then generated username matches /^[a-z]{2,}[0-9]{4}$/', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.firstNameLabel')),
      'Marie',
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.lastNameLabel')),
      'Smith',
    );
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));

    const [arg] = mockUpdate.mock.calls[0] as [{ first_name: string; last_name: string; username: string }];
    expect(arg.username).toMatch(USERNAME_RE);
  });

  it('given hyphenated first name, then generated username matches regex', () => {
    renderScreen();
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.firstNameLabel')),
      'Marie-Claire',
    );
    fireEvent.changeText(
      screen.getByLabelText(t('onboarding.name.lastNameLabel')),
      'Dubois',
    );
    fireEvent.press(screen.getByText(t('wizard.footer.continue')));

    const [arg] = mockUpdate.mock.calls[0] as [{ first_name: string; last_name: string; username: string }];
    expect(arg.username).toMatch(USERNAME_RE);
  });
});

// ── WizardHeader back ─────────────────────────────────────────────────────────

describe('Page06NameScreen — WizardHeader', () => {
  it('given the screen renders, then at least one back button with the header label is accessible', () => {
    renderScreen();
    // Both WizardHeader and WizardFooter render a "Back" label — getAllByLabelText
    // avoids the multiple-element error while still confirming the element exists.
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    expect(backButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('given WizardHeader back is pressed, then navigation.goBack is called', () => {
    const { nav } = renderScreen();
    // The header back button is rendered first in the tree — take index 0.
    const backButtons = screen.getAllByLabelText(t('wizard.header.back'));
    const firstBack = backButtons[0];
    if (firstBack === undefined) throw new Error('No back button found');
    fireEvent.press(firstBack);
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });
});
