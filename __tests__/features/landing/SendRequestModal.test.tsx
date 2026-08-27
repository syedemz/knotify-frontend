/**
 * SendRequestModal.test.tsx — two-step confirmation modal for Like on the
 * Marriage-tab deck.
 *
 * Verifies the ask → confirm → sending state machine, and that:
 *   - Yes at ask advances to the confirm step.
 *   - Yes at confirm advances to the sending step and, after the pleasewait
 *     hold, fires both `onConfirmed` and `onCancel`.
 *   - No at any step fires `onCancel` and never fires `onConfirmed`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { t } from '@/labels';
import { SendRequestModal } from '@/features/landing/components/SendRequestModal';

// ── Native-module mocks — react-native-safe-area-context ─────────────────────

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, props.children);
    },
    useSafeAreaInsets: function () { return INSETS; },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    SafeAreaInsetsContext: ctx,
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Helper ────────────────────────────────────────────────────────────────────

function renderModal(overrides: Partial<React.ComponentProps<typeof SendRequestModal>> = {}) {
  const props: React.ComponentProps<typeof SendRequestModal> = {
    visible: true,
    targetName: 'Aisha Khan',
    onCancel: jest.fn(),
    onConfirmed: jest.fn(),
    ...overrides,
  };
  const utils = render(
    <ThemeProvider>
      <SendRequestModal {...props} />
    </ThemeProvider>,
  );
  return { ...utils, props };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SendRequestModal — visibility', () => {
  it('does NOT render the card when visible=false', () => {
    renderModal({ visible: false });
    expect(screen.queryByTestId('send-request-card')).toBeNull();
  });

  it('renders the card + Lottie when visible=true', () => {
    renderModal();
    expect(screen.getByTestId('send-request-card')).toBeTruthy();
    expect(screen.getByTestId('send-request-lottie-send')).toBeTruthy();
  });
});

describe('SendRequestModal — initial ask step', () => {
  it('shows the ask question interpolating the target name', () => {
    renderModal({ targetName: 'Mehvish Hayat' });
    const expected = t('landing.request.confirmQuestion').replace(
      '{name}',
      'Mehvish Hayat',
    );
    expect(screen.getByText(expected)).toBeTruthy();
  });

  it('shows Yes + No buttons on the ask step', () => {
    renderModal();
    expect(screen.getByTestId('send-request-yes-ask')).toBeTruthy();
    expect(screen.getByTestId('send-request-no-ask')).toBeTruthy();
  });

  it('No at ask fires onCancel and NOT onConfirmed', () => {
    const { props } = renderModal();
    fireEvent.press(screen.getByTestId('send-request-no-ask'));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onConfirmed).not.toHaveBeenCalled();
  });
});

describe('SendRequestModal — confirm step', () => {
  it('Yes at ask advances to the confirm step (question changes)', () => {
    renderModal({ targetName: 'Aisha Khan' });
    fireEvent.press(screen.getByTestId('send-request-yes-ask'));
    expect(screen.getByText(t('landing.request.confirmDouble'))).toBeTruthy();
    expect(screen.getByTestId('send-request-yes-confirm')).toBeTruthy();
    expect(screen.getByTestId('send-request-no-confirm')).toBeTruthy();
  });

  it('No at confirm fires onCancel and NOT onConfirmed', () => {
    const { props } = renderModal();
    fireEvent.press(screen.getByTestId('send-request-yes-ask'));
    fireEvent.press(screen.getByTestId('send-request-no-confirm'));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onConfirmed).not.toHaveBeenCalled();
  });
});

describe('SendRequestModal — sending step', () => {
  it('Yes at confirm swaps the Lottie to pleasewait and hides the buttons', () => {
    renderModal();
    fireEvent.press(screen.getByTestId('send-request-yes-ask'));
    fireEvent.press(screen.getByTestId('send-request-yes-confirm'));
    expect(screen.getByTestId('send-request-lottie-wait')).toBeTruthy();
    expect(screen.queryByTestId('send-request-yes-confirm')).toBeNull();
    expect(screen.queryByTestId('send-request-no-confirm')).toBeNull();
  });

  it('after the pleasewait hold, fires both onConfirmed and onCancel', () => {
    jest.useFakeTimers();
    try {
      const { props } = renderModal();
      fireEvent.press(screen.getByTestId('send-request-yes-ask'));
      fireEvent.press(screen.getByTestId('send-request-yes-confirm'));
      // Advance past the 1000 ms pleasewait hold
      act(() => {
        jest.advanceTimersByTime(1100);
      });
      expect(props.onConfirmed).toHaveBeenCalledTimes(1);
      expect(props.onCancel).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('SendRequestModal — reopens fresh', () => {
  it('re-opening resets the step back to ask', () => {
    const { rerender, props } = renderModal();
    // Advance to confirm
    fireEvent.press(screen.getByTestId('send-request-yes-ask'));
    expect(screen.getByText(t('landing.request.confirmDouble'))).toBeTruthy();
    // Close
    rerender(
      <ThemeProvider>
        <SendRequestModal {...props} visible={false} />
      </ThemeProvider>,
    );
    // Re-open — should be back at ask, not confirm
    rerender(
      <ThemeProvider>
        <SendRequestModal {...props} visible={true} />
      </ThemeProvider>,
    );
    expect(screen.queryByText(t('landing.request.confirmDouble'))).toBeNull();
    expect(screen.getByTestId('send-request-yes-ask')).toBeTruthy();
  });
});
