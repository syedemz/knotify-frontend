/**
 * Wiring tests for Page10ProfessionalCategoryScreen (story 4.2).
 *
 * Covers:
 * - List length matches `options.professionalCategory.length` (not a hardcoded number).
 * - Selected row is highlighted after tap.
 * - Tap writes `professional_category` to the draft and calls `advance(11)`.
 * - Auto-advances to `Page11WorkDetailsScreen`.
 * - Back-navigation: tapping a row overwrites `professional_category` and auto-advances.
 * - WizardHeader back navigation.
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

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  OnboardingDraftProvider: ({ children }: any) => children,
  useOnboardingDraft: () => ({
    update: mockUpdate,
    advance: mockAdvance,
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: jest.fn(() => ({
      schemaVersion: 2,
      lastCheckpoint: 'firstCheckpoint',
      currentPage: 10,
      fields: {},
      siblings: [],
      photoPreviewUris: [],
      notificationPermissionStatus: null,
      locationPermissionStatus: null,
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
import { options } from '@/config/options';
import { Page10ProfessionalCategoryScreen } from '@/features/onboarding/screens/Page10ProfessionalCategoryScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

function mockRoute() {
  return {
    key: 'Page10ProfessionalCategoryScreen',
    name: 'Page10ProfessionalCategoryScreen' as const,
    params: undefined,
  };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page10ProfessionalCategoryScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

beforeEach(() => {
  mockUpdate.mockClear();
  mockAdvance.mockClear();
});

// ── Mount ─────────────────────────────────────────────────────────────────────

describe('Page10ProfessionalCategoryScreen — mount', () => {
  it('given the screen, when rendered, then it mounts without throwing', () => {
    expect(() => renderScreen()).not.toThrow();
  });

  it('given the screen renders, then the screen title is visible', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.professionalCategory.title'))).toBeTruthy();
  });
});

// ── List length (AC 1) ────────────────────────────────────────────────────────

describe('Page10ProfessionalCategoryScreen — list rendering (AC 1)', () => {
  it('given the screen renders, then it shows every professional category option', () => {
    renderScreen();
    const items = screen.getAllByRole('checkbox');
    expect(items).toHaveLength(options.professionalCategory.length);
  });

  it('given the screen renders, then every option label is accessible', () => {
    renderScreen();
    for (const category of options.professionalCategory) {
      expect(screen.getByLabelText(category)).toBeTruthy();
    }
  });

  it('given the screen renders, then no row is selected initially', () => {
    renderScreen();
    const checkboxes = screen.getAllByRole('checkbox');
    for (const cb of checkboxes) {
      expect(cb.props.accessibilityState.checked).toBe(false);
    }
  });
});

// ── Selection highlight (AC 2) ────────────────────────────────────────────────

describe('Page10ProfessionalCategoryScreen — selection highlight (AC 2)', () => {
  it('given a category row is tapped, then that row becomes checked', () => {
    renderScreen();
    const firstCategory = options.professionalCategory[0];
    if (firstCategory === undefined) throw new Error('professionalCategory is empty');
    fireEvent.press(screen.getByLabelText(firstCategory));
    const row = screen.getByLabelText(firstCategory);
    expect(row.props.accessibilityState.checked).toBe(true);
  });

  it('given "Engineering" is tapped, then its row is highlighted', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Engineering'));
    expect(screen.getByLabelText('Engineering').props.accessibilityState.checked).toBe(true);
  });

  it('given "Engineering" is tapped, then other rows remain unchecked', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Engineering'));
    const checkboxes = screen.getAllByRole('checkbox');
    const unchecked = checkboxes.filter(
      (cb) => cb.props.accessibilityState.checked === false,
    );
    expect(unchecked).toHaveLength(options.professionalCategory.length - 1);
  });
});

// ── Draft write + auto-advance (AC 2) ─────────────────────────────────────────

describe('Page10ProfessionalCategoryScreen — draft write and auto-advance (AC 2)', () => {
  it('given "Healthcare" is tapped, then update is called with professional_category=Healthcare', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Healthcare'));
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdate).toHaveBeenCalledWith({ professional_category: 'Healthcare' });
  });

  it('given "Healthcare" is tapped, then advance is called with 11', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Healthcare'));
    expect(mockAdvance).toHaveBeenCalledTimes(1);
    expect(mockAdvance).toHaveBeenCalledWith(11);
  });

  it('given "Healthcare" is tapped, then navigation goes to Page11WorkDetailsScreen', () => {
    const { nav } = renderScreen();
    fireEvent.press(screen.getByLabelText('Healthcare'));
    expect(nav.navigate).toHaveBeenCalledWith('Page11WorkDetailsScreen');
    expect(nav.navigate).toHaveBeenCalledTimes(1);
  });

  it('given "Law" is tapped, then update receives professional_category=Law', () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText('Law'));
    expect(mockUpdate).toHaveBeenCalledWith({ professional_category: 'Law' });
  });
});

// ── No manual Continue button (AC 3) ─────────────────────────────────────────

describe('Page10ProfessionalCategoryScreen — no manual Continue button (AC 3)', () => {
  it('given the screen renders, then there is no Continue button', () => {
    renderScreen();
    expect(screen.queryByText(t('wizard.footer.continue'))).toBeNull();
  });
});

// ── Back-nav overwrite (AC 4) ─────────────────────────────────────────────────

describe('Page10ProfessionalCategoryScreen — back-navigation overwrite (AC 4)', () => {
  it('given the screen is re-mounted after back-nav, tapping a new category writes the new value', () => {
    // Back-nav remounts the screen with fresh state. We simulate this by
    // rendering a new instance and tapping a different category.
    renderScreen();
    fireEvent.press(screen.getByLabelText('Finance'));
    expect(mockUpdate).toHaveBeenCalledWith({ professional_category: 'Finance' });
    expect(mockAdvance).toHaveBeenCalledWith(11);
  });
});

// ── WizardHeader back ─────────────────────────────────────────────────────────

describe('Page10ProfessionalCategoryScreen — WizardHeader', () => {
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
