/**
 * Tests for IncomingRequestModal (story 15.6).
 *
 * AC coverage:
 * (a) Renders profile fields correctly (name, age · city visible).
 * (b) Tapping Accept calls `onAccept(profile.user_id)` + `onClose`.
 * (c) Tapping Decline calls `onDecline(profile.user_id)` + `onClose`.
 * (d) Tapping View-full-profile calls navigation.navigate + `onClose`.
 * (e) Backdrop press calls `onClose` only (no `onAccept` / `onDecline` firing).
 * (f) Renders nothing when `profile` is null.
 * (g) `visible={false}` renders nothing.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { IncomingRequestModal } from '@/features/friendRequests/components/IncomingRequestModal';
import type { DummyFullProfile } from '@/types/DummyFullProfile';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as Record<string, unknown>;
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate }),
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

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Fixture ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const quratFixture = require('../../../../assets/dummyqurat.json') as DummyFullProfile;

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderModal(
  overrides: Partial<{
    visible: boolean;
    profile: DummyFullProfile | null;
    onClose: jest.Mock;
    onAccept: jest.Mock;
    onDecline: jest.Mock;
  }> = {},
) {
  const onClose = overrides.onClose ?? jest.fn();
  const onAccept = overrides.onAccept ?? jest.fn();
  const onDecline = overrides.onDecline ?? jest.fn();

  return {
    onClose,
    onAccept,
    onDecline,
    ...render(
      <ThemeProvider>
        <IncomingRequestModal
          visible={overrides.visible ?? true}
          profile={overrides.profile !== undefined ? overrides.profile : quratFixture}
          onClose={onClose}
          onAccept={onAccept}
          onDecline={onDecline}
        />
      </ThemeProvider>,
    ),
  };
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockNavigate.mockClear();
});

// ── (a) Renders profile fields correctly ──────────────────────────────────────

describe('(a) renders profile fields correctly', () => {
  it('shows full name', () => {
    renderModal();
    expect(screen.getByText('Qurat Baloch')).toBeTruthy();
  });

  it('shows age · city subtitle', () => {
    renderModal();
    expect(screen.getByText('28 · Munich')).toBeTruthy();
  });

  it('shows Accept and Decline buttons', () => {
    renderModal();
    expect(screen.getByTestId('incoming-request-accept-btn')).toBeTruthy();
    expect(screen.getByTestId('incoming-request-decline-btn')).toBeTruthy();
  });

  it('shows the View full profile link', () => {
    renderModal();
    expect(screen.getByTestId('incoming-request-view-profile-link')).toBeTruthy();
  });
});

// ── (b) Accept calls onAccept(user_id) + onClose ─────────────────────────────

describe('(b) Accept calls onAccept(user_id) + onClose', () => {
  it('fires onAccept with profile.user_id when Accept is pressed', () => {
    const { onAccept, onClose } = renderModal();
    fireEvent.press(screen.getByTestId('incoming-request-accept-btn'));
    expect(onAccept).toHaveBeenCalledWith(quratFixture.user_id);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onDecline when Accept is pressed', () => {
    const { onDecline } = renderModal();
    fireEvent.press(screen.getByTestId('incoming-request-accept-btn'));
    expect(onDecline).not.toHaveBeenCalled();
  });
});

// ── (c) Decline calls onDecline(user_id) + onClose ───────────────────────────

describe('(c) Decline calls onDecline(user_id) + onClose', () => {
  it('fires onDecline with profile.user_id when Decline is pressed', () => {
    const { onDecline, onClose } = renderModal();
    fireEvent.press(screen.getByTestId('incoming-request-decline-btn'));
    expect(onDecline).toHaveBeenCalledWith(quratFixture.user_id);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onAccept when Decline is pressed', () => {
    const { onAccept } = renderModal();
    fireEvent.press(screen.getByTestId('incoming-request-decline-btn'));
    expect(onAccept).not.toHaveBeenCalled();
  });
});

// ── (d) View full profile navigates + onClose ────────────────────────────────

describe('(d) View full profile calls navigation.navigate + onClose', () => {
  it('calls onClose when View full profile is pressed', () => {
    const { onClose } = renderModal();
    fireEvent.press(screen.getByTestId('incoming-request-view-profile-link'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls navigation.navigate to OtherProfileScreen with correct params', () => {
    renderModal();
    fireEvent.press(screen.getByTestId('incoming-request-view-profile-link'));
    expect(mockNavigate).toHaveBeenCalledWith('Explore', {
      screen: 'OtherProfileScreen',
      params: { userId: quratFixture.user_id, source: 'request' },
    });
  });

  it('does NOT fire onAccept or onDecline when View full profile is pressed', () => {
    const { onAccept, onDecline } = renderModal();
    fireEvent.press(screen.getByTestId('incoming-request-view-profile-link'));
    expect(onAccept).not.toHaveBeenCalled();
    expect(onDecline).not.toHaveBeenCalled();
  });
});

// ── (e) Backdrop press calls onClose only ────────────────────────────────────

describe('(e) backdrop press calls onClose only (no accept/decline)', () => {
  it('fires onClose when backdrop is pressed', () => {
    const { onClose } = renderModal();
    fireEvent.press(screen.getByTestId('incoming-request-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onAccept when backdrop is pressed', () => {
    const { onAccept } = renderModal();
    fireEvent.press(screen.getByTestId('incoming-request-backdrop'));
    expect(onAccept).not.toHaveBeenCalled();
  });

  it('does NOT fire onDecline when backdrop is pressed', () => {
    const { onDecline } = renderModal();
    fireEvent.press(screen.getByTestId('incoming-request-backdrop'));
    expect(onDecline).not.toHaveBeenCalled();
  });
});

// ── (f) Renders nothing when profile is null ──────────────────────────────────

describe('(f) renders nothing when profile is null', () => {
  it('returns null with no UI nodes when profile is null', () => {
    renderModal({ profile: null });
    expect(screen.queryByTestId('incoming-request-card')).toBeNull();
  });
});

// ── (g) visible=false renders nothing ────────────────────────────────────────

describe('(g) visible=false renders nothing', () => {
  it('returns null with no UI nodes when visible is false', () => {
    renderModal({ visible: false });
    expect(screen.queryByTestId('incoming-request-card')).toBeNull();
  });
});
