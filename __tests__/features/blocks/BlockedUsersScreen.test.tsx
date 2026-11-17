/**
 * Wiring tests for `BlockedUsersScreen` (story 16.10).
 *
 * AC coverage:
 * (a) Loading state — `useBlockedUsersQuery` pending → `<LoadingState />` renders.
 * (b) Error state — query rejected → `<ErrorState />` renders with Retry.
 * (c) Empty state — query resolves with [] → `<EmptyState />` renders.
 * (d) Ready state — query resolves with data → FlatList of ListRow renders.
 * (e) Unblock action — pressing the Unblock button on a row calls
 *     `useUnblockUserMutation.mutate({ userId })`.
 *
 * Tests stub `useBlockedUsersQuery` and `useUnblockUserMutation` at the hook
 * boundary — no network calls.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(
        ctx.Provider,
        { value: INSETS },
        Rct.createElement(RN.View, null, props.children),
      );
    },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) {
      return Rct.createElement(RN.View, null, props.children);
    },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () { return INSETS; },
    useSafeAreaFrame: function () {
      return { x: 0, y: 0, width: 375, height: 812 };
    },
    initialWindowMetrics: {
      insets: INSETS,
      frame: { x: 0, y: 0, width: 375, height: 812 },
    },
  };
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { BlockedUsersScreen } from '@/features/blocks/screens/BlockedUsersScreen';
import type { BlockedUser } from '@/services/api/endpoints';

// ── Mutation spy ──────────────────────────────────────────────────────────────

const mockUnblockMutate = jest.fn();

// ── Query + mutation mocks ────────────────────────────────────────────────────

type MockQueryReturn = {
  data: readonly BlockedUser[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

let mockQueryReturn: MockQueryReturn = {
  data: undefined,
  isLoading: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
};

jest.mock('@/features/blocks/api', () => ({
  useBlockedUsersQuery: () => mockQueryReturn,
  useUnblockUserMutation: () => ({
    mutate: mockUnblockMutate,
    isPending: false,
  }),
  BLOCKED_USERS_QUERY_KEY: ['blocked-users'] as const,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BLOCKED_USER_A: BlockedUser = {
  user_id: 'u-blocked-001',
  created_at: '2026-01-01T00:00:00.000Z',
};

const BLOCKED_USER_B: BlockedUser = {
  user_id: 'u-blocked-002',
  created_at: '2026-01-02T00:00:00.000Z',
};

// ── Render helper ─────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <ThemeProvider>
      <BlockedUsersScreen />
    </ThemeProvider>,
  );
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockQueryReturn = {
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  };
});

// ── (a) Loading state ─────────────────────────────────────────────────────────

describe('BlockedUsersScreen — loading state', () => {
  it('given useBlockedUsersQuery is loading, when screen renders, then LoadingState is shown', () => {
    mockQueryReturn = { ...mockQueryReturn, isLoading: true, data: undefined };
    renderScreen();
    expect(screen.getByTestId('blocked-users-loading-state')).toBeTruthy();
  });

  it('given loading state, FlatList is not rendered', () => {
    mockQueryReturn = { ...mockQueryReturn, isLoading: true, data: undefined };
    renderScreen();
    expect(screen.queryByTestId('blocked-users-flat-list')).toBeNull();
  });
});

// ── (b) Error state ───────────────────────────────────────────────────────────

describe('BlockedUsersScreen — error state', () => {
  it('given useBlockedUsersQuery errors, when screen renders, then ErrorState is shown', () => {
    mockQueryReturn = {
      ...mockQueryReturn,
      isError: true,
      error: new Error('Network failure'),
    };
    renderScreen();
    expect(screen.getByText('Could not load blocked users')).toBeTruthy();
  });

  it('given error state, pressing Retry calls refetch', () => {
    const mockRefetch = jest.fn();
    mockQueryReturn = {
      ...mockQueryReturn,
      isError: true,
      error: new Error('Network failure'),
      refetch: mockRefetch,
    };
    renderScreen();
    fireEvent.press(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });
});

// ── (c) Empty state ───────────────────────────────────────────────────────────

describe('BlockedUsersScreen — empty state', () => {
  it('given useBlockedUsersQuery resolves with [], when screen renders, then EmptyState is shown', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [] };
    renderScreen();
    expect(screen.getByTestId('blocked-users-empty-state')).toBeTruthy();
  });

  it('given empty list, FlatList is not rendered', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [] };
    renderScreen();
    expect(screen.queryByTestId('blocked-users-flat-list')).toBeNull();
  });

  it('given empty list, renders the empty title label', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [] };
    renderScreen();
    expect(screen.getByText('No blocked users')).toBeTruthy();
  });
});

// ── (d) Ready state ───────────────────────────────────────────────────────────

describe('BlockedUsersScreen — ready state', () => {
  it('given two blocked users, FlatList is shown', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [BLOCKED_USER_A, BLOCKED_USER_B] };
    renderScreen();
    expect(screen.getByTestId('blocked-users-flat-list')).toBeTruthy();
  });

  it('given two blocked users, renders a ListRow for each by testID', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [BLOCKED_USER_A, BLOCKED_USER_B] };
    renderScreen();
    expect(screen.getByTestId(`blocked-row-${BLOCKED_USER_A.user_id}`)).toBeTruthy();
    expect(screen.getByTestId(`blocked-row-${BLOCKED_USER_B.user_id}`)).toBeTruthy();
  });

  it('given ready state, LoadingState is not rendered', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [BLOCKED_USER_A] };
    renderScreen();
    expect(screen.queryByTestId('blocked-users-loading-state')).toBeNull();
  });

  it('given ready state, EmptyState is not rendered', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [BLOCKED_USER_A] };
    renderScreen();
    expect(screen.queryByTestId('blocked-users-empty-state')).toBeNull();
  });

  it('given ready state, renders an Unblock button for each row', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [BLOCKED_USER_A, BLOCKED_USER_B] };
    renderScreen();
    expect(screen.getByTestId(`unblock-btn-${BLOCKED_USER_A.user_id}`)).toBeTruthy();
    expect(screen.getByTestId(`unblock-btn-${BLOCKED_USER_B.user_id}`)).toBeTruthy();
  });
});

// ── (e) Unblock action ────────────────────────────────────────────────────────

describe('BlockedUsersScreen — unblock action', () => {
  it('given a blocked user row, pressing Unblock calls mutation with the correct userId', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [BLOCKED_USER_A] };
    renderScreen();
    fireEvent.press(screen.getByTestId(`unblock-btn-${BLOCKED_USER_A.user_id}`));
    expect(mockUnblockMutate).toHaveBeenCalledTimes(1);
    expect(mockUnblockMutate).toHaveBeenCalledWith({ userId: BLOCKED_USER_A.user_id });
  });

  it('given two blocked users, pressing second row unblock calls mutation with correct userId', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [BLOCKED_USER_A, BLOCKED_USER_B] };
    renderScreen();
    fireEvent.press(screen.getByTestId(`unblock-btn-${BLOCKED_USER_B.user_id}`));
    expect(mockUnblockMutate).toHaveBeenCalledWith({ userId: BLOCKED_USER_B.user_id });
  });
});

// ── Screen structure ──────────────────────────────────────────────────────────

describe('BlockedUsersScreen — screen structure', () => {
  it('renders the root screen container', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [] };
    renderScreen();
    expect(screen.getByTestId('blocked-users-screen')).toBeTruthy();
  });

  it('renders the header title', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [] };
    renderScreen();
    expect(screen.getByText('Blocked Users')).toBeTruthy();
  });
});
