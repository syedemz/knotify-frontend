/**
 * Tests for src/features/onboarding/components/PhotoTile.tsx
 *
 * expo-image is mocked with a plain View+testID for pure-JS assertions.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

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

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { PhotoTile } from '@/features/onboarding/components/PhotoTile';
import { t } from '@/labels';

function renderTile(props: Partial<React.ComponentProps<typeof PhotoTile>> = {}) {
  const defaults = {
    uri: undefined,
    index: 1,
    size: 100,
    onPress: jest.fn(),
    onRemove: jest.fn(),
    permissionDenied: false,
  };
  const merged = { ...defaults, ...props };
  return render(
    <ThemeProvider>
      <PhotoTile {...merged} />
    </ThemeProvider>,
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

describe('PhotoTile — empty state', () => {
  it('given no uri, then renders with the empty tile accessibility label', () => {
    renderTile();
    expect(
      screen.getByLabelText(t('onboarding.photos.tileAccessibilityEmpty')),
    ).toBeTruthy();
  });

  it('given no uri, then does NOT render the expo-image element', () => {
    renderTile();
    expect(screen.queryByTestId('expo-image')).toBeNull();
  });

  it('given no uri, then does NOT render the remove badge', () => {
    renderTile();
    expect(
      screen.queryByLabelText(t('onboarding.photos.removePhotoAccessibility')),
    ).toBeNull();
  });

  it('given no uri and permissionDenied=false, then pressing calls onPress', () => {
    const onPress = jest.fn();
    renderTile({ onPress });
    fireEvent.press(
      screen.getByLabelText(t('onboarding.photos.tileAccessibilityEmpty')),
    );
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('given no uri and permissionDenied=true, then shows grant access hint text', () => {
    renderTile({ permissionDenied: true });
    expect(
      screen.getByText(t('onboarding.photos.grantAccessHint')),
    ).toBeTruthy();
  });

  it('given no uri and permissionDenied=true, then pressing does NOT call onPress', () => {
    const onPress = jest.fn();
    renderTile({ permissionDenied: true, onPress });
    const tile = screen.getByLabelText(t('onboarding.photos.tileAccessibilityEmpty'));
    fireEvent.press(tile);
    expect(onPress).not.toHaveBeenCalled();
  });
});

// ── Filled state ──────────────────────────────────────────────────────────────

describe('PhotoTile — filled state', () => {
  const uri = 'content://media/external/images/media/42';

  it('given a uri, then renders the expo-image element', () => {
    renderTile({ uri, index: 2 });
    expect(screen.getByTestId('expo-image')).toBeTruthy();
  });

  it('given a uri, then renders the remove badge with correct accessibility label', () => {
    renderTile({ uri, index: 2 });
    expect(
      screen.getByLabelText(t('onboarding.photos.removePhotoAccessibility')),
    ).toBeTruthy();
  });

  it('given a uri, then tile body accessibility label uses the filled template', () => {
    renderTile({ uri, index: 3 });
    const expectedLabel = t('onboarding.photos.tileAccessibilityFilled').replace('{{index}}', '3');
    expect(screen.getByLabelText(expectedLabel)).toBeTruthy();
  });

  it('given a uri, then pressing the tile body calls onPress', () => {
    const onPress = jest.fn();
    renderTile({ uri, index: 1, onPress });
    const expectedLabel = t('onboarding.photos.tileAccessibilityFilled').replace('{{index}}', '1');
    fireEvent.press(screen.getByLabelText(expectedLabel));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('given a uri, then pressing the remove badge calls onRemove', () => {
    const onRemove = jest.fn();
    renderTile({ uri, index: 1, onRemove });
    fireEvent.press(
      screen.getByLabelText(t('onboarding.photos.removePhotoAccessibility')),
    );
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('given a uri, then pressing the remove badge does NOT call onPress', () => {
    const onPress = jest.fn();
    renderTile({ uri, index: 1, onPress });
    fireEvent.press(
      screen.getByLabelText(t('onboarding.photos.removePhotoAccessibility')),
    );
    expect(onPress).not.toHaveBeenCalled();
  });

  it('given a uri and permissionDenied=true (tile is still filled), then tile is pressable', () => {
    const onPress = jest.fn();
    // permissionDenied only disables EMPTY tiles; filled tiles remain interactive
    renderTile({ uri, index: 1, onPress, permissionDenied: true });
    const expectedLabel = t('onboarding.photos.tileAccessibilityFilled').replace('{{index}}', '1');
    fireEvent.press(screen.getByLabelText(expectedLabel));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('given a uri and permissionDenied=true, then does NOT show the grant access hint', () => {
    renderTile({ uri, index: 1, permissionDenied: true });
    expect(
      screen.queryByText(t('onboarding.photos.grantAccessHint')),
    ).toBeNull();
  });
});

// ── Light / dark theme ────────────────────────────────────────────────────────

describe('PhotoTile — theme', () => {
  it('given light theme, renders without crash', () => {
    const { toJSON } = renderTile();
    expect(toJSON()).toBeTruthy();
  });

  it('given dark theme, renders without crash', () => {
    jest
      .spyOn(require('react-native'), 'useColorScheme')
      .mockReturnValue('dark');
    const { toJSON } = renderTile();
    expect(toJSON()).toBeTruthy();
    jest.restoreAllMocks();
  });
});
