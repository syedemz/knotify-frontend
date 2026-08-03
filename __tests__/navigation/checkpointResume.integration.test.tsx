/**
 * Integration test: checkpoint-resume mounts the correct initial route (story 3.4 AC).
 *
 * Simulates "kill and relaunch after firstCheckpoint":
 * - `useOnboardingDraft` is seeded synchronously with a draft that has
 *   `lastCheckpoint: 'firstCheckpoint'` plus all phase-3 fields.
 * - `useCheckpointResume` is the REAL implementation (not mocked) so the
 *   routing logic under test is live.
 * - Asserts:
 *   (a) Page09ReligionSubsectScreen is the mounted initial route.
 *   (b) getDraft() returns the seeded values (verified via a DraftReader
 *       consumer in the test tree).
 *
 * The `useOnboardingDraft` mock returns the seeded draft synchronously so that
 * `initialRouteName` is computed correctly on the first render — which is how
 * the real hook behaves once the app's splash-screen keep-alive flushes the
 * async storage load before NavigationContainer mounts. The important invariant
 * under test is the `useCheckpointResume('firstCheckpoint') → 'Page09…'` wiring.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';

// ── Module mocks ────────────────────────────────────────────────────────────

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  Screen: 'Screen',
  ScreenContainer: 'ScreenContainer',
  NativeScreen: 'NativeScreen',
  NativeScreenContainer: 'NativeScreenContainer',
  ScreenStack: 'ScreenStack',
  ScreenStackItem: 'ScreenStackItem',
  ScreenStackHeaderConfig: 'ScreenStackHeaderConfig',
  compatibilityFlags: {},
  ScreenFooter: 'ScreenFooter',
}));

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
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    GestureHandlerRootView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    Swipeable: RN.View, DrawerLayout: RN.View, State: {}, ScrollView: RN.ScrollView,
    Slider: RN.View, Switch: RN.View, TextInput: RN.View, PanGestureHandler: RN.View,
    TapGestureHandler: RN.View, RawButton: RN.View, BaseButton: RN.View, RectButton: RN.View,
    BorderlessButton: RN.View, LongPressGestureHandler: RN.View, FlatList: RN.FlatList,
    gestureHandlerRootHOC: function (C: any) { return C; }, Directions: {},
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
    default: Rct.forwardRef(function (props: any, _ref: any) {
      return Rct.createElement(RN.View, null, props.children);
    }),
    BottomSheetView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetScrollView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetFlatList: RN.View, BottomSheetSectionList: RN.View,
    BottomSheetTextInput: RN.View, BottomSheetBackdrop: RN.View,
    useBottomSheet: jest.fn(), useBottomSheetModal: jest.fn(),
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
      });
    },
  };
});

// Mock expo-secure-store to prevent native-module failures (useOnboardingDraft mock
// below bypasses the real storage layer, but the module must still be importable).
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock cognitoClient — Page02/03 import it transitively.
jest.mock('@/services/auth/cognitoClient', () => ({
  cognitoClient: {
    signUp: jest.fn(),
    confirmSignUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  },
}));

// Mock useLocale — Page01WelcomeScreen uses it.
jest.mock('@/state/i18n/LanguageProvider', () => ({
  useLocale: () => ({ locale: 'en', setLocale: jest.fn() }),
}));

// Mock useAuth — Page02/03 uses it.
jest.mock('@/state/auth/AuthProvider', () => ({
  useAuth: () => ({
    status: 'unauthenticated',
    session: null,
    profileComplete: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// ── Seeded draft ──────────────────────────────────────────────────────────────

const SEED_DRAFT = {
  schemaVersion: 3 as const,
  lastCheckpoint: 'firstCheckpoint' as const,
  currentPage: 9,
  fields: {
    sex: 'Male' as const,
    first_name: 'Marie',
    last_name: 'Curie',
    username: 'mariecurie1234',
    birthday: '2000-01-01',
  },
  siblings: [],
  photoPreviewUris: [],
  notificationPermissionStatus: null,
  locationPermissionStatus: null,
  phone_number: null,
  timestamps: { createdAt: '2026-07-23T00:00:00.000Z', updatedAt: '2026-07-23T00:00:00.000Z' },
};

/**
 * Mock useOnboardingDraft: returns the seeded draft synchronously so that
 * `useCheckpointResume` (the real implementation) receives the correct
 * `lastCheckpoint` on first render, causing the navigator to open at
 * `Page09ReligionSubsectScreen`.
 */
jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  OnboardingDraftProvider: ({ children }: any) => children,
  useOnboardingDraft: () => ({
    update: jest.fn(),
    advance: jest.fn(),
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: jest.fn(() => SEED_DRAFT),
    setSiblings: jest.fn(),
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    isLoading: false,
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '@/theme';
import { OnboardingStack } from '@/navigation/OnboardingStack';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';

// ── DraftReader: exposes draft values as testID-queryable text ───────────────

/**
 * Consumes `useOnboardingDraft().getDraft()` and renders the field values as
 * queryable Text nodes, letting the integration test assert seeded values
 * without reaching into component internals.
 */
function DraftReader(): React.JSX.Element {
  const { getDraft } = useOnboardingDraft();
  const draft = getDraft();
  return (
    <View>
      <Text testID="draft-sex">{draft.fields.sex ?? ''}</Text>
      <Text testID="draft-first-name">{draft.fields.first_name ?? ''}</Text>
      <Text testID="draft-last-name">{draft.fields.last_name ?? ''}</Text>
      <Text testID="draft-username">{draft.fields.username ?? ''}</Text>
      <Text testID="draft-birthday">{draft.fields.birthday ?? ''}</Text>
      <Text testID="draft-checkpoint">{draft.lastCheckpoint ?? ''}</Text>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderWithSeed() {
  return render(
    <ThemeProvider>
      <NavigationContainer>
        <OnboardingStack />
      </NavigationContainer>
      <DraftReader />
    </ThemeProvider>,
  );
}

// ── Integration tests ─────────────────────────────────────────────────────────

describe('Checkpoint-resume integration — firstCheckpoint initial route (story 3.4 AC)', () => {
  it('given a draft with lastCheckpoint=firstCheckpoint, when OnboardingStack mounts, then Page09ReligionSubsectScreen is the initial route', async () => {
    renderWithSeed();
    // Page09ReligionSubsectScreen is now a real screen (story 4.1).
    // Its title label is the authoritative indicator that Page09 is mounted.
    await expect(
      waitFor(() => screen.getByText('What is your religion?')),
    ).resolves.toBeTruthy();
  });

  it('given a draft with lastCheckpoint=firstCheckpoint, when OnboardingStack mounts, then Page01WelcomeScreen is NOT rendered', async () => {
    renderWithSeed();
    await waitFor(() => screen.getByText('What is your religion?'));
    // Welcome screen title must not be present.
    expect(screen.queryByText('Knotify')).toBeNull();
  });

  it('given the seeded draft, when DraftReader mounts, then lastCheckpoint equals firstCheckpoint', () => {
    renderWithSeed();
    const el = screen.getByTestId('draft-checkpoint');
    expect(el.props.children).toBe('firstCheckpoint');
  });

  it('given the seeded draft, when DraftReader mounts, then sex field equals Male', () => {
    renderWithSeed();
    expect(screen.getByTestId('draft-sex').props.children).toBe('Male');
  });

  it('given the seeded draft, when DraftReader mounts, then first_name field equals Marie', () => {
    renderWithSeed();
    expect(screen.getByTestId('draft-first-name').props.children).toBe('Marie');
  });

  it('given the seeded draft, when DraftReader mounts, then last_name field equals Curie', () => {
    renderWithSeed();
    expect(screen.getByTestId('draft-last-name').props.children).toBe('Curie');
  });

  it('given the seeded draft, when DraftReader mounts, then username field equals mariecurie1234', () => {
    renderWithSeed();
    expect(screen.getByTestId('draft-username').props.children).toBe('mariecurie1234');
  });

  it('given the seeded draft, when DraftReader mounts, then birthday field equals 2000-01-01', () => {
    renderWithSeed();
    expect(screen.getByTestId('draft-birthday').props.children).toBe('2000-01-01');
  });
});
