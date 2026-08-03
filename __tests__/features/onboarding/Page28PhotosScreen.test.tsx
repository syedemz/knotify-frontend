/**
 * Wiring tests for Page28PhotosScreen (story 10.1).
 *
 * AC coverage:
 * (i)   permission-grant + valid selection appends URI to photoPreviewUris.
 * (ii)  permission-grant + picker-cancel leaves tile empty (no draft write).
 * (iii) permission-denied → shows grant-access hint; Continue stays disabled.
 * (iv)  "x" badge tap removes the URI at that index.
 * (v)   tile-body tap after fill re-opens picker and replaces the URI.
 * (vi)  Continue label reads "Add photos" at 0 URIs, "Continue" at >= 1.
 * (vii) Continue is enabled only when >= 1 URI is present.
 * (viii) Continue advances to Page29PhoneScreen when >= 1 URI.
 */

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Native module mocks ───────────────────────────────────────────────────────

jest.mock('expo-image', () => {
  const Rct = require('react');
  const { View } = require('react-native');
  return {
    Image: ({ style, accessibilityLabel }: { source: unknown; style?: object; accessibilityLabel?: string }) =>
      Rct.createElement(View, { testID: 'expo-image', style, accessibilityLabel, accessibilityRole: 'image' }),
  };
});

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

jest.mock('react-native-reanimated', () => ({
  default: {
    call: jest.fn(),
    createAnimatedComponent: (c: unknown) => c,
    Value: jest.fn(),
    event: jest.fn(),
    add: jest.fn(),
    eq: jest.fn(),
    set: jest.fn(),
    cond: jest.fn(),
    interpolate: jest.fn(),
    Extrapolate: { CLAMP: 'clamp' },
    Transition: { Together: 'together', Out: 'out', In: 'in' },
    Easing: { in: jest.fn(), out: jest.fn(), inOut: jest.fn() },
  },
  useSharedValue: jest.fn(() => ({ value: 0 })),
  useAnimatedStyle: jest.fn(() => ({})),
  useAnimatedGestureHandler: jest.fn(),
  useAnimatedRef: jest.fn(() => ({ current: null })),
  useAnimatedScrollHandler: jest.fn(),
  useDerivedValue: jest.fn(() => ({ value: 0 })),
  withTiming: jest.fn((v: unknown) => v),
  withSpring: jest.fn((v: unknown) => v),
  withDelay: jest.fn((_, v: unknown) => v),
  withRepeat: jest.fn((v: unknown) => v),
  withSequence: jest.fn(),
  interpolate: jest.fn(),
  Extrapolation: { CLAMP: 'clamp' },
  runOnJS: jest.fn((fn: unknown) => fn),
  runOnUI: jest.fn((fn: unknown) => fn),
  Animated: {
    View: require('react-native').View,
    Text: require('react-native').Text,
    Image: require('react-native').Image,
    ScrollView: require('react-native').ScrollView,
  },
}));

// ── expo-image-picker mock ───────────────────────────────────────────────────

const mockLaunchImageLibraryAsync = jest.fn();

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: any[]) => mockLaunchImageLibraryAsync(...args),
  MediaType: { Images: 'images' },
}));

// ── permissions service mock ─────────────────────────────────────────────────

const mockRequestMediaLibraryPermission = jest.fn();

jest.mock('@/services/permissions', () => ({
  requestMediaLibraryPermission: (...args: any[]) =>
    mockRequestMediaLibraryPermission(...args),
  requestNotificationPermission: jest.fn(),
  requestLocationPermission: jest.fn(),
}));

// ── useOnboardingDraft mock ───────────────────────────────────────────────────

const mockAdvance = jest.fn();
const mockGetDraft = jest.fn();
const mockSetPhotoPreviewUris = jest.fn();

jest.mock('@/features/onboarding/hooks/useOnboardingDraft', () => ({
  OnboardingDraftProvider: ({ children }: any) => children,
  useOnboardingDraft: () => ({
    update: jest.fn(),
    advance: mockAdvance,
    advanceWithCheckpoint: jest.fn(),
    reset: jest.fn(),
    getDraft: mockGetDraft,
    setSiblings: jest.fn(),
    setNotificationPermissionStatus: jest.fn(),
    setLocationPermissionStatus: jest.fn(),
    setPhotoPreviewUris: mockSetPhotoPreviewUris,
    isLoading: false,
  }),
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Imports under test ────────────────────────────────────────────────────────

import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { Page28PhotosScreen } from '@/features/onboarding/screens/Page28PhotosScreen';

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
    key: 'Page28PhotosScreen',
    name: 'Page28PhotosScreen' as const,
    params: undefined,
  };
}

function makeDraft(photoPreviewUris: string[] = []) {
  return {
    schemaVersion: 2 as const,
    lastCheckpoint: null,
    currentPage: 28,
    fields: {},
    siblings: [],
    photoPreviewUris,
    notificationPermissionStatus: null,
    locationPermissionStatus: null,
    timestamps: { createdAt: '', updatedAt: '' },
  };
}

function renderScreen(
  photoPreviewUris: string[] = [],
  nav = mockNavigation(),
) {
  mockGetDraft.mockReturnValue(makeDraft(photoPreviewUris));
  return {
    nav,
    ...render(
      <ThemeProvider>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Page28PhotosScreen navigation={nav as any} route={mockRoute() as any} />
      </ThemeProvider>,
    ),
  };
}

const TILE_EMPTY_LABEL = t('onboarding.photos.tileAccessibilityEmpty');
const TILE_REMOVE_LABEL = t('onboarding.photos.removePhotoAccessibility');
const ADD_PHOTOS_LABEL = t('onboarding.photos.addPhotosLabel');
const CONTINUE_LABEL = t('onboarding.photos.continueLabel');

beforeEach(() => {
  mockAdvance.mockClear();
  mockGetDraft.mockClear();
  mockSetPhotoPreviewUris.mockClear();
  mockLaunchImageLibraryAsync.mockClear();
  mockRequestMediaLibraryPermission.mockClear();
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (vi): Continue label "Add photos" at 0 URIs
// ═════════════════════════════════════════════════════════════════════════════

describe('Page28PhotosScreen — AC (vi): Continue label', () => {
  it('given 0 uris, then Continue label reads "Add photos"', () => {
    renderScreen();
    expect(screen.getByText(ADD_PHOTOS_LABEL)).toBeTruthy();
  });

  it('given 1 uri pre-populated in draft, then Continue label reads "Continue"', async () => {
    renderScreen(['content://photo/1']);
    expect(await screen.findByText(CONTINUE_LABEL)).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (vii): Continue is enabled/disabled
// ═════════════════════════════════════════════════════════════════════════════

describe('Page28PhotosScreen — AC (vii): Continue enabled state', () => {
  it('given 0 uris, then Continue button is disabled', () => {
    renderScreen();
    // The Button component sets accessibilityLabel AND accessibilityState.disabled
    // on the Pressable. getByLabelText returns that Pressable directly.
    const btn = screen.getByLabelText(ADD_PHOTOS_LABEL);
    expect(btn.props.accessibilityState?.disabled).toBe(true);
  });

  it('given 1 uri pre-populated, then Continue button is enabled', async () => {
    renderScreen(['content://photo/1']);
    const btn = await screen.findByLabelText(CONTINUE_LABEL);
    expect(btn.props.accessibilityState?.disabled).not.toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (viii): Continue advances to Page29PhoneScreen
// ═════════════════════════════════════════════════════════════════════════════

describe('Page28PhotosScreen — AC (viii): Continue advances to Page29', () => {
  it('given 1 uri pre-populated, when Continue is tapped, then navigate to Page29PhoneScreen', async () => {
    const { nav } = renderScreen(['content://photo/1']);
    const btn = await screen.findByText(CONTINUE_LABEL);
    fireEvent.press(btn);
    expect(mockAdvance).toHaveBeenCalledWith(29);
    expect(nav.navigate).toHaveBeenCalledWith('Page29PhoneScreen');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (i): permission-grant + valid selection appends URI
// ═════════════════════════════════════════════════════════════════════════════

describe('Page28PhotosScreen — AC (i): permission-grant + valid selection', () => {
  it('given permission granted and valid selection, then setPhotoPreviewUris called with new URI', async () => {
    mockRequestMediaLibraryPermission.mockResolvedValueOnce('granted');
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'content://photo/new' }],
    });

    renderScreen();

    const tiles = screen.getAllByLabelText(TILE_EMPTY_LABEL);
    const firstTile = tiles[0];
    if (firstTile === undefined) throw new Error('No tiles found');
    await act(async () => {
      fireEvent.press(firstTile);
    });

    expect(mockRequestMediaLibraryPermission).toHaveBeenCalledTimes(1);
    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledTimes(1);
    expect(mockSetPhotoPreviewUris).toHaveBeenCalledWith(['content://photo/new']);
  });

  it('given permission granted and valid selection, then Continue label switches to "Continue"', async () => {
    mockRequestMediaLibraryPermission.mockResolvedValueOnce('granted');
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'content://photo/new' }],
    });

    renderScreen();

    const tiles = screen.getAllByLabelText(TILE_EMPTY_LABEL);
    const firstTile = tiles[0];
    if (firstTile === undefined) throw new Error('No tiles found');
    await act(async () => {
      fireEvent.press(firstTile);
    });

    expect(await screen.findByText(CONTINUE_LABEL)).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (ii): permission-grant + picker-cancel → tile stays empty
// ═════════════════════════════════════════════════════════════════════════════

describe('Page28PhotosScreen — AC (ii): picker-cancel leaves tile empty', () => {
  it('given permission granted but picker cancelled, then setPhotoPreviewUris NOT called', async () => {
    mockRequestMediaLibraryPermission.mockResolvedValueOnce('granted');
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: [] });

    renderScreen();

    const tiles = screen.getAllByLabelText(TILE_EMPTY_LABEL);
    const firstTile = tiles[0];
    if (firstTile === undefined) throw new Error('No tiles found');
    await act(async () => {
      fireEvent.press(firstTile);
    });

    expect(mockSetPhotoPreviewUris).not.toHaveBeenCalled();
  });

  it('given picker cancelled, then Continue label remains "Add photos"', async () => {
    mockRequestMediaLibraryPermission.mockResolvedValueOnce('granted');
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: [] });

    renderScreen();

    const tiles = screen.getAllByLabelText(TILE_EMPTY_LABEL);
    const firstTile = tiles[0];
    if (firstTile === undefined) throw new Error('No tiles found');
    await act(async () => {
      fireEvent.press(firstTile);
    });

    expect(screen.getByText(ADD_PHOTOS_LABEL)).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (iii): permission-denied → hint shown, Continue disabled
// ═════════════════════════════════════════════════════════════════════════════

describe('Page28PhotosScreen — AC (iii): permission denied', () => {
  it('given permission denied, then grant-access hint is shown on the empty tiles', async () => {
    mockRequestMediaLibraryPermission.mockResolvedValueOnce('denied');

    renderScreen();

    const tiles = screen.getAllByLabelText(TILE_EMPTY_LABEL);
    const firstTile = tiles[0];
    if (firstTile === undefined) throw new Error('No tiles found');
    fireEvent.press(firstTile);

    await waitFor(() => {
      // All empty tiles now show the hint; at least one should be present
      const hints = screen.getAllByText(t('onboarding.photos.grantAccessHint'));
      expect(hints.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('given permission denied, then Continue button label is "Add photos" and stays disabled', async () => {
    mockRequestMediaLibraryPermission.mockResolvedValueOnce('denied');

    renderScreen();

    const tiles = screen.getAllByLabelText(TILE_EMPTY_LABEL);
    const firstTile = tiles[0];
    if (firstTile === undefined) throw new Error('No tiles found');
    fireEvent.press(firstTile);

    // After the async permission check resolves, the "Add photos" button
    // should still be disabled (no photo was added).
    const btn = await screen.findByLabelText(ADD_PHOTOS_LABEL);
    await waitFor(() => {
      expect(btn.props.accessibilityState?.disabled).toBe(true);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (iv): "x" badge removes the URI at that index
// ═════════════════════════════════════════════════════════════════════════════

describe('Page28PhotosScreen — AC (iv): remove badge clears the URI', () => {
  it('given 1 pre-populated URI, when "x" is tapped, then setPhotoPreviewUris called with empty array', async () => {
    renderScreen(['content://photo/1']);

    const removeBadge = await screen.findByLabelText(TILE_REMOVE_LABEL);
    await act(async () => {
      fireEvent.press(removeBadge);
    });

    expect(mockSetPhotoPreviewUris).toHaveBeenCalledWith([]);
  });

  it('given 2 pre-populated URIs, when first "x" is tapped, then second URI remains', async () => {
    renderScreen(['content://photo/1', 'content://photo/2']);

    const removeBadges = await screen.findAllByLabelText(TILE_REMOVE_LABEL);
    const firstBadge = removeBadges[0];
    if (firstBadge === undefined) throw new Error('No remove badges found');
    await act(async () => {
      fireEvent.press(firstBadge);
    });

    expect(mockSetPhotoPreviewUris).toHaveBeenCalledWith(['content://photo/2']);
  });

  it('given 1 pre-populated URI, after removal Continue label reverts to "Add photos"', async () => {
    renderScreen(['content://photo/1']);

    const removeBadge = await screen.findByLabelText(TILE_REMOVE_LABEL);
    await act(async () => {
      fireEvent.press(removeBadge);
    });

    expect(await screen.findByText(ADD_PHOTOS_LABEL)).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// AC (v): tile-body tap after fill re-opens picker and replaces the URI
// ═════════════════════════════════════════════════════════════════════════════

describe('Page28PhotosScreen — AC (v): tile-body tap replaces URI', () => {
  it('given 1 pre-populated URI, when tile body tapped and picker returns new URI, then setPhotoPreviewUris called with replacement', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'content://photo/replaced' }],
    });

    renderScreen(['content://photo/original']);

    // The filled tile's accessibility label is "Photo 1"
    const filledTileLabel = t('onboarding.photos.tileAccessibilityFilled').replace('{{index}}', '1');
    const filledTile = await screen.findByLabelText(filledTileLabel);

    await act(async () => {
      fireEvent.press(filledTile);
    });

    // Permission should NOT have been re-requested (tile was already filled)
    expect(mockRequestMediaLibraryPermission).not.toHaveBeenCalled();
    // Picker should have been opened
    expect(mockLaunchImageLibraryAsync).toHaveBeenCalledTimes(1);
    // URI at index 0 replaced
    expect(mockSetPhotoPreviewUris).toHaveBeenCalledWith(['content://photo/replaced']);
  });

  it('given 1 pre-populated URI, when tile body tapped and picker cancelled, then URI unchanged', async () => {
    mockLaunchImageLibraryAsync.mockResolvedValueOnce({ canceled: true, assets: [] });

    renderScreen(['content://photo/original']);

    const filledTileLabel = t('onboarding.photos.tileAccessibilityFilled').replace('{{index}}', '1');
    const filledTile = await screen.findByLabelText(filledTileLabel);

    await act(async () => {
      fireEvent.press(filledTile);
    });

    expect(mockSetPhotoPreviewUris).not.toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// General render
// ═════════════════════════════════════════════════════════════════════════════

describe('Page28PhotosScreen — general render', () => {
  it('given a fresh mount, then renders the page title', () => {
    renderScreen();
    expect(screen.getByText(t('onboarding.photos.title'))).toBeTruthy();
  });

  it('given a fresh mount, then renders 6 empty tiles', () => {
    renderScreen();
    const emptyTiles = screen.getAllByLabelText(TILE_EMPTY_LABEL);
    expect(emptyTiles).toHaveLength(6);
  });

  it('given 2 URIs pre-populated, then renders 2 filled tiles and 4 empty tiles', async () => {
    renderScreen(['content://photo/1', 'content://photo/2']);
    const filledTile1 = await screen.findByLabelText(
      t('onboarding.photos.tileAccessibilityFilled').replace('{{index}}', '1'),
    );
    expect(filledTile1).toBeTruthy();
    const filledTile2 = screen.getByLabelText(
      t('onboarding.photos.tileAccessibilityFilled').replace('{{index}}', '2'),
    );
    expect(filledTile2).toBeTruthy();
    // 4 remaining tiles should be empty
    const emptyTiles = screen.getAllByLabelText(TILE_EMPTY_LABEL);
    expect(emptyTiles).toHaveLength(4);
  });

  it('given a fresh mount, then advance is NOT called', () => {
    renderScreen();
    expect(mockAdvance).not.toHaveBeenCalled();
  });

  it('given a fresh mount, then navigate is NOT called', () => {
    const { nav } = renderScreen();
    expect(nav.navigate).not.toHaveBeenCalled();
  });
});
