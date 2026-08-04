/**
 * Wiring tests for ShareProfileButton (story 12.3).
 *
 * Three tests — one per variant — each asserting:
 * (a) The element with the correct testID renders.
 * (b) Pressing the button calls `Share.share` with the exact output of
 *     `buildShareMessage(profile)`.
 *
 * `Share.share` is spied on via `jest.spyOn(Share, 'share')` and resolved
 * immediately to a mock `ShareAction` so the `.catch(() => {})` chain does
 * not produce unhandled rejection warnings.
 */

import React from 'react';
import { Share } from 'react-native';
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

jest.mock('react-native-reanimated', () => {
  const m = require('react-native-reanimated/mock');
  m.default.call = jest.fn();
  return m;
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { ThemeProvider } from '@/theme';
import { ShareProfileButton } from '@/features/profile/components/ShareProfileButton';
import { buildShareMessage } from '@/features/profile/buildShareMessage';
import type { UserProfile } from '@/types/api/UserProfile';

// ── Fixtures ─────────────────────────────────────────────────────────────────

type ProfileSlice = Pick<UserProfile, 'user_id' | 'first_name'>;

const testProfile: ProfileSlice = {
  user_id: 'adnan-malik-uuid-001',
  first_name: 'Adnan',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderButton(props: React.ComponentProps<typeof ShareProfileButton>) {
  return render(
    <ThemeProvider>
      <ShareProfileButton {...props} />
    </ThemeProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ShareProfileButton', () => {
  let shareSpy: jest.SpyInstance;

  beforeEach(() => {
    shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: Share.sharedAction });
  });

  afterEach(() => {
    shareSpy.mockRestore();
  });

  describe('variant: icon-only', () => {
    it('(a) renders with testID share-profile-button-icon-only', () => {
      renderButton({ profile: testProfile, variant: 'icon-only' });
      expect(screen.getByTestId('share-profile-button-icon-only')).toBeTruthy();
    });

    it('(b) press triggers Share.share with the message from buildShareMessage', () => {
      renderButton({ profile: testProfile, variant: 'icon-only' });
      fireEvent.press(screen.getByTestId('share-profile-button-icon-only'));
      const expected = buildShareMessage(testProfile);
      expect(shareSpy).toHaveBeenCalledTimes(1);
      expect(shareSpy).toHaveBeenCalledWith({
        message: expected.message,
        url: expected.url,
      });
    });
  });

  describe('variant: pill', () => {
    it('(a) renders with testID share-profile-button-pill', () => {
      renderButton({ profile: testProfile, variant: 'pill' });
      expect(screen.getByTestId('share-profile-button-pill')).toBeTruthy();
    });

    it('(b) press triggers Share.share with the message from buildShareMessage', () => {
      renderButton({ profile: testProfile, variant: 'pill' });
      fireEvent.press(screen.getByTestId('share-profile-button-pill'));
      const expected = buildShareMessage(testProfile);
      expect(shareSpy).toHaveBeenCalledTimes(1);
      expect(shareSpy).toHaveBeenCalledWith({
        message: expected.message,
        url: expected.url,
      });
    });
  });

  describe('variant: row-link', () => {
    it('(a) renders with testID share-profile-button-row-link', () => {
      renderButton({ profile: testProfile, variant: 'row-link' });
      expect(screen.getByTestId('share-profile-button-row-link')).toBeTruthy();
    });

    it('(b) press triggers Share.share with the message from buildShareMessage', () => {
      renderButton({ profile: testProfile, variant: 'row-link' });
      fireEvent.press(screen.getByTestId('share-profile-button-row-link'));
      const expected = buildShareMessage(testProfile);
      expect(shareSpy).toHaveBeenCalledTimes(1);
      expect(shareSpy).toHaveBeenCalledWith({
        message: expected.message,
        url: expected.url,
      });
    });
  });

  describe('custom testID', () => {
    it('forwards custom testID to the pressable', () => {
      renderButton({
        profile: testProfile,
        variant: 'icon-only',
        testID: 'my-custom-share-btn',
      });
      expect(screen.getByTestId('my-custom-share-btn')).toBeTruthy();
    });
  });
});
