/**
 * Tests for `src/features/chat/components/TypingIndicatorRow.tsx`.
 *
 * Story 16.CH2 — typing-indicator subscription + chat-room typing row.
 *
 * AC coverage:
 * (a) Renders without crash.
 * (b) Renders the "{friend} is typing…" text using the labels.en.json template,
 *     substituting `friendName` for `{friend}`.
 * (c) The root View carries testID="typing-indicator-row".
 * (d) `accessibilityLabel` on the inner Text equals the full label string.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { TypingIndicatorRow } from '@/features/chat/components/TypingIndicatorRow';

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderRow(friendName: string) {
  return render(
    <ThemeProvider>
      <TypingIndicatorRow friendName={friendName} />
    </ThemeProvider>,
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('TypingIndicatorRow — render without crash', () => {
  it('given a friendName, when rendered, then it does not throw', () => {
    expect(() => renderRow('Mehvish')).not.toThrow();
  });
});

describe('TypingIndicatorRow — label interpolation', () => {
  it(
    'given friendName="Mehvish", when rendered, then text reads "Mehvish is typing…"',
    () => {
      const { getByText } = renderRow('Mehvish');
      expect(getByText('Mehvish is typing…')).toBeTruthy();
    },
  );

  it(
    'given friendName="Ali", when rendered, then text reads "Ali is typing…"',
    () => {
      const { getByText } = renderRow('Ali');
      expect(getByText('Ali is typing…')).toBeTruthy();
    },
  );
});

describe('TypingIndicatorRow — testID', () => {
  it(
    'given rendered, then the root view carries testID="typing-indicator-row"',
    () => {
      const { getByTestId } = renderRow('Mehvish');
      expect(getByTestId('typing-indicator-row')).toBeTruthy();
    },
  );
});

describe('TypingIndicatorRow — accessibilityLabel', () => {
  it(
    'given friendName="Mehvish", when rendered, then the text has accessibilityLabel "Mehvish is typing…"',
    () => {
      const { getByLabelText } = renderRow('Mehvish');
      expect(getByLabelText('Mehvish is typing…')).toBeTruthy();
    },
  );
});
