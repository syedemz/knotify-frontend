/**
 * Edit-tab wiring tests for MyProfileScreen (story 16.FR3).
 *
 * Story 16.FR3 removes the DevTriggersPanel and modal hosts from the Edit tab.
 * The Edit tab now shows a "Coming soon" EmptyState.
 *
 * AC coverage:
 * (a) Edit tab renders without crashing (no FriendshipProvider required).
 * (b) Edit tab shows the "Coming soon" EmptyState (testID my-profile-edit-empty-state).
 * (c) DevTriggersPanel is NOT rendered on the Edit tab (deleted in story 16.FR3).
 * (d) IncomingRequestModal is NOT mounted in the MyProfileScreen tree (removed
 *     in 16.FR3; will be mounted by FriendRequestSubscriptionListener in 16.8).
 * (e) RequestAcceptedModal is NOT mounted in the MyProfileScreen tree.
 * (f) No import of FriendshipProvider anywhere in the screen file.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { MyProfileScreen } from '@/features/profile/screens/MyProfileScreen';

// ── Native module mocks ────────────────────────────────────────────────────────

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

// ── Navigation mock ────────────────────────────────────────────────────────────

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native') as Record<string, unknown>;
  return {
    ...actual,
    useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
    useRoute: () => ({ params: { initialTab: 'edit' } }),
  };
});

// ── OwnProfileProvider mock ───────────────────────────────────────────────────

jest.mock('@/state/ownProfile/OwnProfileProvider', () => {
  const mockOwnProfile = require('../../../assets/dummyprofile.json');
  return {
    useOwnProfile: () => ({
      profile: mockOwnProfile,
      status: 'ready' as const,
      error: null,
      refresh: jest.fn(),
    }),
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

// ── Render helper ──────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <ThemeProvider>
      <MyProfileScreen />
    </ThemeProvider>,
  );
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockGoBack.mockClear();
  mockNavigate.mockClear();
});

// ── (a) Edit tab renders without crashing ─────────────────────────────────────

describe('(a) Edit tab renders without crashing', () => {
  it('renders the screen testID', () => {
    renderScreen();
    expect(screen.getByTestId('my-profile-screen')).toBeTruthy();
  });

  it('renders the edit scroll container', () => {
    renderScreen();
    expect(screen.getByTestId('my-profile-edit-scroll')).toBeTruthy();
  });
});

// ── (b) Edit tab shows "Coming soon" EmptyState ───────────────────────────────

describe('(b) Edit tab shows "Coming soon" EmptyState', () => {
  it('renders the edit EmptyState with testID my-profile-edit-empty-state', () => {
    renderScreen();
    expect(screen.getByTestId('my-profile-edit-empty-state')).toBeTruthy();
  });

  it('shows "Coming soon" text', () => {
    renderScreen();
    expect(screen.getByText('Coming soon')).toBeTruthy();
  });
});

// ── (c) DevTriggersPanel is NOT rendered ──────────────────────────────────────

describe('(c) DevTriggersPanel is NOT rendered on the Edit tab', () => {
  it('does not render dev-triggers-panel', () => {
    renderScreen();
    expect(screen.queryByTestId('dev-triggers-panel')).toBeNull();
  });

  it('does not render dev-trigger-incoming-btn', () => {
    renderScreen();
    expect(screen.queryByTestId('dev-trigger-incoming-btn')).toBeNull();
  });

  it('does not render dev-trigger-accepted-btn', () => {
    renderScreen();
    expect(screen.queryByTestId('dev-trigger-accepted-btn')).toBeNull();
  });
});

// ── (d) IncomingRequestModal is NOT in the tree ───────────────────────────────

describe('(d) IncomingRequestModal is NOT mounted in MyProfileScreen', () => {
  it('does not render incoming-request-modal', () => {
    renderScreen();
    expect(screen.queryByTestId('incoming-request-modal')).toBeNull();
  });

  it('does not render incoming-request-card', () => {
    renderScreen();
    expect(screen.queryByTestId('incoming-request-card')).toBeNull();
  });
});

// ── (e) RequestAcceptedModal is NOT in the tree ───────────────────────────────

describe('(e) RequestAcceptedModal is NOT mounted in MyProfileScreen', () => {
  it('does not render request-accepted-modal', () => {
    renderScreen();
    expect(screen.queryByTestId('request-accepted-modal')).toBeNull();
  });

  it('does not render request-accepted-card', () => {
    renderScreen();
    expect(screen.queryByTestId('request-accepted-card')).toBeNull();
  });
});

// ── Tab switch still works ────────────────────────────────────────────────────

describe('tab switching', () => {
  it('switching to Preview tab hides the edit EmptyState', () => {
    renderScreen();
    // Initially on edit tab (from route params)
    expect(screen.getByTestId('my-profile-edit-scroll')).toBeTruthy();

    // Switch to preview
    fireEvent.press(screen.getByTestId('my-profile-tab-preview'));
    expect(screen.queryByTestId('my-profile-edit-scroll')).toBeNull();
    expect(screen.getByTestId('my-profile-preview-scroll')).toBeTruthy();
  });
});
