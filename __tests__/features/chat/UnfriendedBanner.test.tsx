/**
 * Tests for `src/features/chat/components/UnfriendedBanner.tsx`.
 *
 * AC coverage:
 * (a) Renders without crash.
 * (b) Renders the "You and {firstName} are no longer connected" text using the
 *     labels.en.json template, substituting `friendName` for `{firstName}`.
 * (c) The root View carries testID="unfriended-banner".
 * (d) `accessibilityLabel` on the inner Text equals the full label string.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: { children: React.ReactNode }) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, Rct.createElement(RN.View, null, props.children));
    },
    SafeAreaConsumer: function (props: { children: (insets: typeof INSETS) => React.ReactNode }) {
      return props.children(INSETS);
    },
    SafeAreaView: function (props: { children: React.ReactNode }) {
      return Rct.createElement(RN.View, null, props.children);
    },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () { return INSETS; },
    useSafeAreaFrame: function () { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

import { ThemeProvider } from '@/theme';
import { UnfriendedBanner } from '@/features/chat/components/UnfriendedBanner';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderBanner(friendName: string) {
  return render(
    <ThemeProvider>
      <UnfriendedBanner friendName={friendName} />
    </ThemeProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('UnfriendedBanner — render without crash', () => {
  it('given a friendName, when rendered, then it does not throw', () => {
    expect(() => renderBanner('Mehvish')).not.toThrow();
  });
});

describe('UnfriendedBanner — label interpolation', () => {
  it(
    'given friendName="Mehvish", when rendered, then text reads "You and Mehvish are no longer connected"',
    () => {
      const { getByText } = renderBanner('Mehvish');
      expect(getByText('You and Mehvish are no longer connected')).toBeTruthy();
    },
  );

  it(
    'given friendName="Ali", when rendered, then text reads "You and Ali are no longer connected"',
    () => {
      const { getByText } = renderBanner('Ali');
      expect(getByText('You and Ali are no longer connected')).toBeTruthy();
    },
  );

  it(
    'given an empty friendName, when rendered, then still renders without crash',
    () => {
      const { getByText } = renderBanner('');
      expect(getByText('You and  are no longer connected')).toBeTruthy();
    },
  );
});

describe('UnfriendedBanner — testID', () => {
  it(
    'given rendered, then the root view carries testID="unfriended-banner"',
    () => {
      const { getByTestId } = renderBanner('Mehvish');
      expect(getByTestId('unfriended-banner')).toBeTruthy();
    },
  );
});

describe('UnfriendedBanner — accessibilityLabel', () => {
  it(
    'given friendName="Mehvish", when rendered, then the text has accessibilityLabel "You and Mehvish are no longer connected"',
    () => {
      const { getByLabelText } = renderBanner('Mehvish');
      expect(getByLabelText('You and Mehvish are no longer connected')).toBeTruthy();
    },
  );
});
