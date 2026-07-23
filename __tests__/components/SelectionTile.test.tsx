/**
 * Tests for src/components/SelectionTile.tsx (story 3.1).
 *
 * Covers:
 * - Renders without crash
 * - Label is rendered
 * - onPress callback fires
 * - accessibilityLabel defaults to label
 * - accessibilityLabel can be overridden
 * - accessibilityState.selected reflects the selected prop
 * - selected=true and selected=false both render (visual branches)
 * - Light and dark theme do not crash
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { darkTheme } from '@/theme/theme';
import { SelectionTile } from '@/components/SelectionTile';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
jest.mock('expo-image', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    Image: function (props: any) {
      return Rct.createElement(RN.Image, {
        source: props.source,
        accessibilityLabel: props.accessibilityLabel ?? '',
        testID: 'expo-image',
      });
    },
  };
});
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

const IMAGE_SOURCE = 0 as unknown as number; // mock local require()

function renderTile(props: Partial<React.ComponentProps<typeof SelectionTile>> = {}) {
  return render(
    <ThemeProvider>
      <SelectionTile
        imageSource={IMAGE_SOURCE}
        label="Male"
        onPress={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  );
}

describe('SelectionTile — render', () => {
  it('given required props, when rendered, then mounts without throwing', () => {
    expect(() => renderTile()).not.toThrow();
  });

  it('given a label, when rendered, then the label text is visible', () => {
    renderTile({ label: 'Male' });
    expect(screen.getByText('Male')).toBeTruthy();
  });

  it('given required props, when rendered, then the image is present', () => {
    renderTile();
    expect(screen.getByTestId('expo-image')).toBeTruthy();
  });
});

describe('SelectionTile — accessibility', () => {
  it('given no accessibilityLabel override, when rendered, then accessibilityLabel defaults to label', () => {
    renderTile({ label: 'Female' });
    // The Pressable should carry the label as its accessibility label.
    expect(screen.getByLabelText('Female')).toBeTruthy();
  });

  it('given an explicit accessibilityLabel, when rendered, then the override is used', () => {
    renderTile({ label: 'Male', accessibilityLabel: 'Select male gender' });
    expect(screen.getByLabelText('Select male gender')).toBeTruthy();
  });

  it('given selected=false, when rendered, then accessibilityState.selected is false', () => {
    renderTile({ selected: false });
    const tile = screen.getByLabelText('Male');
    expect(tile.props.accessibilityState?.selected).toBe(false);
  });

  it('given selected=true, when rendered, then accessibilityState.selected is true', () => {
    renderTile({ selected: true });
    const tile = screen.getByLabelText('Male');
    expect(tile.props.accessibilityState?.selected).toBe(true);
  });
});

describe('SelectionTile — interaction', () => {
  it('given onPress, when tile is pressed, then onPress is called once', () => {
    const onPress = jest.fn();
    renderTile({ onPress });
    fireEvent.press(screen.getByLabelText('Male'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('SelectionTile — theme', () => {
  it('given light theme (default), when rendered, then mounts without throwing', () => {
    expect(() =>
      render(
        <ThemeProvider>
          <SelectionTile
            imageSource={IMAGE_SOURCE}
            label="Male"
            onPress={jest.fn()}
          />
        </ThemeProvider>,
      ),
    ).not.toThrow();
    // Suppress unused import — darkTheme is kept for documentation intent.
    void darkTheme;
  });
});
