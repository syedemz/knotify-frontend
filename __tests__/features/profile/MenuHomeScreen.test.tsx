/**
 * Screen-wiring tests for MenuHomeScreen (story 12.5).
 *
 * (a) renders dummyprofile.first_name + " " + last_name ("Adnan Malik") visible.
 * (b) Share pill press triggers Share.share.
 * (c) tapping the avatar navigates to MyProfileScreen with { initialTab: 'preview' }.
 * (d) tapping the Edit pill navigates to MyProfileScreen with { initialTab: 'edit' }.
 * (e) engagement cards render the exact hard-coded numbers 15 / 3 / 1.
 *
 * Navigation is mocked via `@react-navigation/native` so the screen can be
 * rendered without a real navigator tree.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { Share } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';

// ── Native module mocks ───────────────────────────────────────────────────────

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

jest.mock('expo-image', () => {
  const Rct = require('react') as typeof import('react');
  const RN = require('react-native') as typeof import('react-native');
  return {
    Image: function (props: any) {
      return Rct.createElement(RN.View, {
        testID: props.testID,
        accessibilityLabel: props.accessibilityLabel,
      });
    },
  };
});

// ── Navigation mock ───────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as Record<string, unknown>;
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
    useRoute: () => ({ params: {} }),
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { ThemeProvider } from '@/theme';
import { MenuHomeScreen } from '@/features/profile/screens/MenuHomeScreen';

// ── Helper ────────────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <ThemeProvider>
      <MenuHomeScreen />
    </ThemeProvider>,
  );
}

// ── (a) Full name "Adnan Malik" visible ───────────────────────────────────────

describe('(a) renders full name "Adnan Malik"', () => {
  it('shows "Adnan Malik" in the profile row', () => {
    renderScreen();
    expect(screen.getByText('Adnan Malik')).toBeTruthy();
  });
});

// ── (b) Share pill press triggers Share.share ─────────────────────────────────

describe('(b) Share pill press triggers Share.share', () => {
  let shareSpy: jest.SpyInstance;

  beforeEach(() => {
    shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction });
  });

  afterEach(() => {
    shareSpy.mockRestore();
  });

  it('pressing the share pill calls Share.share', () => {
    renderScreen();
    const sharePill = screen.getByTestId('menu-home-share-pill');
    fireEvent.press(sharePill);
    expect(shareSpy).toHaveBeenCalledTimes(1);
  });
});

// ── (c) Avatar press navigates to MyProfileScreen with { initialTab: 'preview' }

describe('(c) avatar press navigates to MyProfileScreen preview', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('pressing the avatar calls navigate with { initialTab: "preview" }', () => {
    renderScreen();
    const avatar = screen.getByTestId('menu-home-avatar');
    fireEvent.press(avatar);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('MyProfileScreen', { initialTab: 'preview' });
  });
});

// ── (d) Edit pill press navigates to MyProfileScreen with { initialTab: 'edit' }

describe('(d) Edit pill press navigates to MyProfileScreen edit', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('pressing the Edit pill calls navigate with { initialTab: "edit" }', () => {
    renderScreen();
    const editPill = screen.getByTestId('menu-home-edit-pill');
    fireEvent.press(editPill);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('MyProfileScreen', { initialTab: 'edit' });
  });
});

// ── (e) Engagement cards render hard-coded numbers 15 / 3 / 1 ────────────────

describe('(e) engagement cards render hard-coded numbers', () => {
  it('renders 15 (Likes)', () => {
    renderScreen();
    expect(screen.getByText('15')).toBeTruthy();
  });

  it('renders 3 (Compliments)', () => {
    renderScreen();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('renders 1 (Profile Boost)', () => {
    renderScreen();
    expect(screen.getByText('1')).toBeTruthy();
  });
});
