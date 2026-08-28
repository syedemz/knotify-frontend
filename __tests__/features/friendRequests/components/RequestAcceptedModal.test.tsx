/**
 * Tests for RequestAcceptedModal (story 15.7).
 *
 * AC coverage:
 * (a) Renders the interpolated title with Mehvish's firstName.
 * (b) Tapping Say hi calls `onSayHi` + `onClose`.
 * (c) Tapping Not now calls `onClose` only (no `onSayHi`).
 * (d) Backdrop press calls `onClose` only.
 * (e) Renders nothing when `profile` is null.
 * (f) `visible={false}` renders nothing.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { RequestAcceptedModal } from '@/features/friendRequests/components/RequestAcceptedModal';
import type { DummyFullProfile } from '@/types/DummyFullProfile';

// ── Mocks ─────────────────────────────────────────────────────────────────────

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

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Fixture ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mehvishFixture = require('../../../../assets/dummymehvish.json') as DummyFullProfile;

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderModal(
  overrides: Partial<{
    visible: boolean;
    profile: DummyFullProfile | null;
    onClose: jest.Mock;
    onSayHi: jest.Mock;
  }> = {},
) {
  const onClose = overrides.onClose ?? jest.fn();
  const onSayHi = overrides.onSayHi ?? jest.fn();

  return {
    onClose,
    onSayHi,
    ...render(
      <ThemeProvider>
        <RequestAcceptedModal
          visible={overrides.visible ?? true}
          profile={overrides.profile !== undefined ? overrides.profile : mehvishFixture}
          onClose={onClose}
          onSayHi={onSayHi}
        />
      </ThemeProvider>,
    ),
  };
}

// ── (a) Renders interpolated title with Mehvish's firstName ───────────────────

describe('(a) renders interpolated title with Mehvish firstName', () => {
  it('shows the card with Mehvish firstName interpolated into the title', () => {
    renderModal();
    // Title: "You and {{firstName}} are now connected!" with {{firstName}} replaced
    expect(
      screen.getByText(`You and ${mehvishFixture.first_name} are now connected!`),
    ).toBeTruthy();
  });

  it('renders the card testID', () => {
    renderModal();
    expect(screen.getByTestId('request-accepted-card')).toBeTruthy();
  });

  it('renders the subtitle text', () => {
    renderModal();
    expect(screen.getByText('You can start a chat now.')).toBeTruthy();
  });

  it('renders Say hi and Not now buttons', () => {
    renderModal();
    expect(screen.getByTestId('request-accepted-say-hi-btn')).toBeTruthy();
    expect(screen.getByTestId('request-accepted-not-now-btn')).toBeTruthy();
  });
});

// ── (b) Say hi calls onSayHi + onClose ───────────────────────────────────────

describe('(b) Say hi calls onSayHi + onClose', () => {
  it('fires onSayHi when Say hi is pressed', () => {
    const { onSayHi } = renderModal();
    fireEvent.press(screen.getByTestId('request-accepted-say-hi-btn'));
    expect(onSayHi).toHaveBeenCalledTimes(1);
  });

  it('fires onClose when Say hi is pressed', () => {
    const { onClose } = renderModal();
    fireEvent.press(screen.getByTestId('request-accepted-say-hi-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onSayHi when Not now is pressed', () => {
    const { onSayHi } = renderModal();
    fireEvent.press(screen.getByTestId('request-accepted-not-now-btn'));
    expect(onSayHi).not.toHaveBeenCalled();
  });
});

// ── (c) Not now calls onClose only ───────────────────────────────────────────

describe('(c) Not now calls onClose only (no onSayHi)', () => {
  it('fires onClose when Not now is pressed', () => {
    const { onClose } = renderModal();
    fireEvent.press(screen.getByTestId('request-accepted-not-now-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onSayHi when Not now is pressed', () => {
    const { onSayHi } = renderModal();
    fireEvent.press(screen.getByTestId('request-accepted-not-now-btn'));
    expect(onSayHi).not.toHaveBeenCalled();
  });
});

// ── (d) Backdrop press calls onClose only ────────────────────────────────────

describe('(d) backdrop press calls onClose only', () => {
  it('fires onClose when backdrop is pressed', () => {
    const { onClose } = renderModal();
    fireEvent.press(screen.getByTestId('request-accepted-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onSayHi when backdrop is pressed', () => {
    const { onSayHi } = renderModal();
    fireEvent.press(screen.getByTestId('request-accepted-backdrop'));
    expect(onSayHi).not.toHaveBeenCalled();
  });
});

// ── (e) Renders nothing when profile is null ──────────────────────────────────

describe('(e) renders nothing when profile is null', () => {
  it('returns null with no UI nodes when profile is null', () => {
    renderModal({ profile: null });
    expect(screen.queryByTestId('request-accepted-card')).toBeNull();
  });
});

// ── (f) visible=false renders nothing ────────────────────────────────────────

describe('(f) visible=false renders nothing', () => {
  it('returns null with no UI nodes when visible is false', () => {
    renderModal({ visible: false });
    expect(screen.queryByTestId('request-accepted-card')).toBeNull();
  });
});
