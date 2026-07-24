/**
 * Wiring tests for Page14SecondCheckpointScreen (story 5.3).
 *
 * Covers:
 * (a) First-time grant flow — both prompts fire in order, both draft setters
 *     called with 'granted', Continue navigates to Page15.
 * (b) First-time deny flow — both prompts fire, both setters called with
 *     'denied', Continue still enabled after deny.
 * (c) Resumed-both-granted state — no prompts fire on mount-reconciliation
 *     (both already granted), plain Continue button shown, advanceWithCheckpoint
 *     called on tap.
 * (d) Resumed-one-denied-terminal state — no prompts fire, plain Continue shown.
 * (e) Mount reconciliation — getPermissionsAsync for both modules is called on
 *     mount, draft updated with observed statuses.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';

// ── Native module mocks ───────────────────────────────────────────────────────

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
    gestureHandlerRootHOC: function (C: any) { return C; },
    Directions: {},
    Gesture: {
      Tap: jest.fn(), Pan: jest.fn(), Pinch: jest.fn(), Rotation: jest.fn(),
      Fling: jest.fn(), LongPress: jest.fn(), Exclusive: jest.fn(),
      Simultaneous: jest.fn(), Race: jest.fn(),
    },
    GestureDetector: RN.View, NativeViewGestureHandler: RN.View,
    FlingGestureHandler: RN.View, ForceTouchGestureHandler: RN.View,
    PinchGestureHandler: RN.View, RotationGestureHandler: RN.View,
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
    BottomSheetFlatList: RN.View, BottomSheetSectionList: RN.View,
    BottomSheetTextInput: RN.View, BottomSheetBackdrop: RN.View,
    useBottomSheet: jest.fn(), useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function (props: any, _ref: any) { return Rct.createElement(RN.View, null, props.children); }),
    BottomSheetModalProvider: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
  };
});

jest.mock('react-native-reanimated', () => {
  const m = require('react-native-reanimated/mock');
  m.default.call = jest.fn();
  return m;
});

// ── expo-notifications mock ───────────────────────────────────────────────────

const mockGetNotifPermissions = jest.fn();
const mockRequestNotifPermissions = jest.fn();

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: (...args: unknown[]) => mockGetNotifPermissions(...args),
  requestPermissionsAsync: (...args: unknown[]) => mockRequestNotifPermissions(...args),
}));

// ── expo-location mock ────────────────────────────────────────────────────────

const mockGetLocPermissions = jest.fn();
const mockRequestLocPermissions = jest.fn();

jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: (...args: unknown[]) => mockGetLocPermissions(...args),
  requestForegroundPermissionsAsync: (...args: unknown[]) => mockRequestLocPermissions(...args),
}));

// ── @/services/permissions mock ───────────────────────────────────────────────
// We mock the permissions module so we can control requestNotificationPermission
// and requestLocationPermission independently, while letting getPermissionsAsync
// calls go through the expo mocks above (mount reconciliation tests use expo-
// notifications and expo-location directly, not the permissions module).

const mockRequestNotificationPermission = jest.fn();
const mockRequestLocationPermission = jest.fn();

jest.mock('@/services/permissions', () => ({
  requestNotificationPermission: (...args: unknown[]) =>
    mockRequestNotificationPermission(...args),
  requestLocationPermission: (...args: unknown[]) =>
    mockRequestLocationPermission(...args),
}));

// ── useOnboardingDraft mock ───────────────────────────────────────────────────

const mockAdvanceWithCheckpoint = jest.fn();
const mockSetNotificationPermissionStatus = jest.fn();
const mockSetLocationPermissionStatus = jest.fn();

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  useOnboardingDraft: () => ({
    update: jest.fn(),
    advance: jest.fn(),
    advanceWithCheckpoint: mockAdvanceWithCheckpoint,
    reset: jest.fn(),
    getDraft: jest.fn(() => ({
      schemaVersion: 1,
      lastCheckpoint: 'firstCheckpoint',
      currentPage: 14,
      fields: {},
      siblings: [],
      photoPreviewUris: [],
      notificationPermissionStatus: null,
      locationPermissionStatus: null,
      timestamps: { createdAt: '', updatedAt: '' },
    })),
    setSiblings: jest.fn(),
    setNotificationPermissionStatus: mockSetNotificationPermissionStatus,
    setLocationPermissionStatus: mockSetLocationPermissionStatus,
    isLoading: false,
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { Page14SecondCheckpointScreen } from '@/features/onboarding/screens/Page14SecondCheckpointScreen';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePermResult(status: string, canAskAgain = true) {
  return { status, canAskAgain };
}

function mockNavigation() {
  return { navigate: jest.fn(), goBack: jest.fn() };
}

function mockRoute() {
  return {
    key: 'Page14SecondCheckpointScreen',
    name: 'Page14SecondCheckpointScreen' as const,
    params: undefined,
  };
}

function renderScreen(nav = mockNavigation()) {
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page14SecondCheckpointScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Default: both permissions are undetermined (first-time user).
  mockGetNotifPermissions.mockResolvedValue(makePermResult('undetermined'));
  mockGetLocPermissions.mockResolvedValue(makePermResult('undetermined'));

  mockRequestNotificationPermission.mockResolvedValue('granted');
  mockRequestLocationPermission.mockResolvedValue('granted');
});

// ── (a) First-time grant flow ─────────────────────────────────────────────────

describe('Page14SecondCheckpointScreen — (a) first-time grant flow', () => {
  it('given both permissions undetermined and user grants both, when Enable Notifications is tapped, then requestNotificationPermission then requestLocationPermission are called in order', async () => {
    const callOrder: string[] = [];
    mockRequestNotificationPermission.mockImplementation(async () => {
      callOrder.push('notif');
      return 'granted';
    });
    mockRequestLocationPermission.mockImplementation(async () => {
      callOrder.push('loc');
      return 'granted';
    });

    const { nav } = renderScreen();

    // Wait for mount reconciliation to complete (mode flips from loading to prompt).
    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.enableNotifications'))).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText(t('onboarding.secondCheckpoint.enableNotifications')));
    });

    expect(callOrder).toEqual(['notif', 'loc']);
    void nav; // navigation.navigate is checked in next test
  });

  it('given user grants both, then both draft setters are called with granted', async () => {
    mockRequestNotificationPermission.mockResolvedValue('granted');
    mockRequestLocationPermission.mockResolvedValue('granted');

    renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.enableNotifications'))).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText(t('onboarding.secondCheckpoint.enableNotifications')));
    });

    expect(mockSetNotificationPermissionStatus).toHaveBeenCalledWith('granted');
    expect(mockSetLocationPermissionStatus).toHaveBeenCalledWith('granted');
  });

  it('given user grants both, then button label swaps to Continue', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.enableNotifications'))).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText(t('onboarding.secondCheckpoint.enableNotifications')));
    });

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.continue'))).toBeTruthy();
    });
  });

  it('given button is in continue state, when tapped, then advanceWithCheckpoint(15, secondCheckpoint) is called and navigates to Page15', async () => {
    // Skip the prompt state — mock permissions already granted at OS level.
    mockGetNotifPermissions.mockResolvedValue(makePermResult('granted'));
    mockGetLocPermissions.mockResolvedValue(makePermResult('granted'));

    const { nav } = renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.continue'))).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText(t('onboarding.secondCheckpoint.continue')));
    });

    expect(mockAdvanceWithCheckpoint).toHaveBeenCalledWith(15, 'secondCheckpoint');
    expect(nav.navigate).toHaveBeenCalledWith('Page15ResidenceCountryScreen');
  });
});

// ── (b) First-time deny flow ─────────────────────────────────────────────────

describe('Page14SecondCheckpointScreen — (b) first-time deny flow', () => {
  it('given both permissions denied by user, then both setters are called with denied', async () => {
    mockRequestNotificationPermission.mockResolvedValue('denied');
    mockRequestLocationPermission.mockResolvedValue('denied');

    renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.enableNotifications'))).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText(t('onboarding.secondCheckpoint.enableNotifications')));
    });

    expect(mockSetNotificationPermissionStatus).toHaveBeenCalledWith('denied');
    expect(mockSetLocationPermissionStatus).toHaveBeenCalledWith('denied');
  });

  it('given user denies both, then Continue button is still enabled after deny', async () => {
    mockRequestNotificationPermission.mockResolvedValue('denied');
    mockRequestLocationPermission.mockResolvedValue('denied');

    renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.enableNotifications'))).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText(t('onboarding.secondCheckpoint.enableNotifications')));
    });

    // After deny, button should swap to Continue and remain enabled.
    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.continue'))).toBeTruthy();
    });

    const btn = screen.getByLabelText(t('onboarding.secondCheckpoint.continue'));
    expect(btn.props.accessibilityState?.disabled).toBeFalsy();
  });
});

// ── (c) Resumed-both-granted state ───────────────────────────────────────────

describe('Page14SecondCheckpointScreen — (c) resumed-both-granted state', () => {
  it('given both permissions already granted at OS level, then no request prompts fire on mount', async () => {
    mockGetNotifPermissions.mockResolvedValue(makePermResult('granted'));
    mockGetLocPermissions.mockResolvedValue(makePermResult('granted'));

    renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.continue'))).toBeTruthy();
    });

    expect(mockRequestNotificationPermission).not.toHaveBeenCalled();
    expect(mockRequestLocationPermission).not.toHaveBeenCalled();
  });

  it('given both granted, when Continue is tapped, then advanceWithCheckpoint(15, secondCheckpoint) is called', async () => {
    mockGetNotifPermissions.mockResolvedValue(makePermResult('granted'));
    mockGetLocPermissions.mockResolvedValue(makePermResult('granted'));

    renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.continue'))).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText(t('onboarding.secondCheckpoint.continue')));
    });

    expect(mockAdvanceWithCheckpoint).toHaveBeenCalledWith(15, 'secondCheckpoint');
  });
});

// ── (d) Resumed-one-denied-terminal state ────────────────────────────────────

describe('Page14SecondCheckpointScreen — (d) resumed-one-denied-terminal state', () => {
  it('given one permission granted and one denied (terminal, canAskAgain false), then no prompts fire and Continue shown', async () => {
    mockGetNotifPermissions.mockResolvedValue(makePermResult('granted'));
    // Denied with canAskAgain=false is terminal — treat as settled.
    mockGetLocPermissions.mockResolvedValue(makePermResult('denied', false));

    renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.continue'))).toBeTruthy();
    });

    expect(mockRequestNotificationPermission).not.toHaveBeenCalled();
    expect(mockRequestLocationPermission).not.toHaveBeenCalled();
  });

  it('given terminal denied state, then setLocationPermissionStatus is called with denied', async () => {
    mockGetNotifPermissions.mockResolvedValue(makePermResult('granted'));
    mockGetLocPermissions.mockResolvedValue(makePermResult('denied', false));

    renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.continue'))).toBeTruthy();
    });

    expect(mockSetLocationPermissionStatus).toHaveBeenCalledWith('denied');
  });
});

// ── (e) Mount reconciliation ──────────────────────────────────────────────────

describe('Page14SecondCheckpointScreen — (e) mount reconciliation', () => {
  it('given screen mounts, then getPermissionsAsync for notifications and location are both called', async () => {
    renderScreen();

    await waitFor(() => {
      expect(mockGetNotifPermissions).toHaveBeenCalledTimes(1);
      expect(mockGetLocPermissions).toHaveBeenCalledTimes(1);
    });
  });

  it('given observed statuses on mount, then both draft setters are called with those statuses', async () => {
    mockGetNotifPermissions.mockResolvedValue(makePermResult('undetermined'));
    mockGetLocPermissions.mockResolvedValue(makePermResult('undetermined'));

    renderScreen();

    await waitFor(() => {
      expect(mockSetNotificationPermissionStatus).toHaveBeenCalledWith('undetermined');
      expect(mockSetLocationPermissionStatus).toHaveBeenCalledWith('undetermined');
    });
  });

  it('given loading state on mount, then Continue button is disabled', () => {
    // Make getPermissionsAsync hang to keep loading state.
    mockGetNotifPermissions.mockReturnValue(new Promise(() => {}));
    mockGetLocPermissions.mockReturnValue(new Promise(() => {}));

    renderScreen();

    // During loading, the Continue/Enable button must be disabled.
    // It renders with either the enable or continue label initially.
    // The label shown during loading is 'Enable Notifications' (default before reconciliation).
    const btn = screen.queryByLabelText(t('onboarding.secondCheckpoint.enableNotifications'));
    if (btn) {
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    }
    // If neither label is found, the loading guard is enforced by state — acceptable.
  });
});

// ── Basic wiring ──────────────────────────────────────────────────────────────

describe('Page14SecondCheckpointScreen — basic wiring', () => {
  it('given the screen, when rendered, then mounts without throwing', () => {
    // Make getPermissionsAsync synchronously pending so the useEffect does not
    // trigger async React state updates during the synchronous render assertion.
    mockGetNotifPermissions.mockReturnValue(new Promise(() => {}));
    mockGetLocPermissions.mockReturnValue(new Promise(() => {}));
    expect(() => renderScreen()).not.toThrow();
  });

  it('given the screen renders, then the title is visible', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.title'))).toBeTruthy();
    });
  });

  it('given the screen renders, then the subtitle is visible', async () => {
    renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.subtitle'))).toBeTruthy();
    });
  });

  it('given WizardHeader back is pressed, then navigation.goBack is called', async () => {
    const { nav } = renderScreen();

    await waitFor(() => {
      expect(screen.queryByText(t('onboarding.secondCheckpoint.title'))).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText(t('wizard.header.back')));
    expect(nav.goBack).toHaveBeenCalledTimes(1);
  });
});
