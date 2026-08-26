/**
 * Tests for BackHeaderBar (story 13.4).
 *
 * AC coverage:
 * (a) Component renders without crashing.
 * (b) Pressing the back button calls `onBack`.
 * (c) The passed `accessibilityLabel` is applied to the button.
 *
 * @see src/features/profile/components/BackHeaderBar.tsx
 */

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
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { BackHeaderBar } from '@/features/profile/components/BackHeaderBar';

function renderBar(onBack: jest.Mock, accessibilityLabel = 'Back') {
  return render(
    <ThemeProvider>
      <BackHeaderBar onBack={onBack} accessibilityLabel={accessibilityLabel} />
    </ThemeProvider>,
  );
}

// ── AC (a): renders ───────────────────────────────────────────────────────────

describe('BackHeaderBar — AC (a): renders', () => {
  it('given valid props, then renders the back-header container', () => {
    const onBack = jest.fn();
    renderBar(onBack);
    expect(screen.getByTestId('back-header-bar')).toBeTruthy();
  });

  it('given valid props, then renders the back button', () => {
    const onBack = jest.fn();
    renderBar(onBack);
    expect(screen.getByTestId('back-header-back-button')).toBeTruthy();
  });
});

// ── AC (b): calls onBack on press ────────────────────────────────────────────

describe('BackHeaderBar — AC (b): onBack fired on press', () => {
  it('given back button pressed, then onBack is called once', () => {
    const onBack = jest.fn();
    renderBar(onBack);
    fireEvent.press(screen.getByTestId('back-header-back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('given back button pressed twice, then onBack is called twice', () => {
    const onBack = jest.fn();
    renderBar(onBack);
    fireEvent.press(screen.getByTestId('back-header-back-button'));
    fireEvent.press(screen.getByTestId('back-header-back-button'));
    expect(onBack).toHaveBeenCalledTimes(2);
  });
});

// ── AC (c): accessibilityLabel ────────────────────────────────────────────────

describe('BackHeaderBar — AC (c): accessibilityLabel', () => {
  it('given accessibilityLabel "Go back", then button has that label', () => {
    const onBack = jest.fn();
    renderBar(onBack, 'Go back');
    const btn = screen.getByTestId('back-header-back-button');
    expect(btn.props.accessibilityLabel).toBe('Go back');
  });

  it('given accessibilityLabel "Back", then button has that label', () => {
    const onBack = jest.fn();
    renderBar(onBack, 'Back');
    const btn = screen.getByTestId('back-header-back-button');
    expect(btn.props.accessibilityLabel).toBe('Back');
  });
});
