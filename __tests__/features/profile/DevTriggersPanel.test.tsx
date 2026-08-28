/**
 * Tests for DevTriggersPanel (story 15.6).
 *
 * AC coverage:
 * (a) Renders section heading + description + arbitrary children.
 * (b) title prop overrides default heading.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { View, Text as RNText } from 'react-native';
import { ThemeProvider } from '@/theme';
import { DevTriggersPanel } from '@/features/profile/components/DevTriggersPanel';

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Helper ────────────────────────────────────────────────────────────────────

function renderPanel(
  props: Partial<React.ComponentProps<typeof DevTriggersPanel>> = {},
) {
  return render(
    <ThemeProvider>
      <DevTriggersPanel {...props}>
        {props.children ?? <RNText testID="slot-child">Trigger button</RNText>}
      </DevTriggersPanel>
    </ThemeProvider>,
  );
}

// ── (a) Renders heading + description + children ──────────────────────────────

describe('(a) renders heading + description + arbitrary children', () => {
  it('renders the default section heading text', () => {
    renderPanel();
    expect(screen.getByText('Dev triggers — remove before ship')).toBeTruthy();
  });

  it('renders the default description text', () => {
    renderPanel();
    expect(
      screen.getByText(
        'These buttons simulate subscription events that will be driven by AppSync in phase 17.',
      ),
    ).toBeTruthy();
  });

  it('renders arbitrary children in the slot', () => {
    renderPanel();
    expect(screen.getByTestId('slot-child')).toBeTruthy();
  });

  it('renders multiple children in the slot', () => {
    renderPanel({
      children: (
        <>
          <RNText testID="child-1">Button 1</RNText>
          <RNText testID="child-2">Button 2</RNText>
        </>
      ),
    });
    expect(screen.getByTestId('child-1')).toBeTruthy();
    expect(screen.getByTestId('child-2')).toBeTruthy();
  });

  it('renders the panel root with testID dev-triggers-panel', () => {
    renderPanel();
    expect(screen.getByTestId('dev-triggers-panel')).toBeTruthy();
  });
});

// ── (b) title prop overrides default heading ──────────────────────────────────

describe('(b) title prop overrides default heading', () => {
  it('shows the custom title instead of the default heading', () => {
    renderPanel({ title: 'My Custom Heading' });
    expect(screen.getByText('My Custom Heading')).toBeTruthy();
    expect(screen.queryByText('Dev triggers — remove before ship')).toBeNull();
  });

  it('shows a custom description when description prop is provided', () => {
    renderPanel({ description: 'Custom description text' });
    expect(screen.getByText('Custom description text')).toBeTruthy();
    expect(
      screen.queryByText(
        'These buttons simulate subscription events that will be driven by AppSync in phase 17.',
      ),
    ).toBeNull();
  });
});
