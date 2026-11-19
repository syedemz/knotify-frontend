/**
 * Wiring tests for `FriendsListScreen` (story 16.2).
 *
 * AC coverage:
 * (a) Loading state — `useFriendsQuery` pending → `<LoadingState />` renders.
 * (b) Error state — query rejected → `<ErrorState />` renders.
 * (c) Empty state — query resolves with [] → `<EmptyState />` renders.
 * (d) Ready state — query resolves with data → FlatList of ListRow renders.
 * (e) Row-tap navigation — pressing a friend row navigates to
 *     `OtherProfileScreen` with `{ userId, source: 'friend' }`.
 *
 * Tests stub `useFriendsQuery` at the hook boundary — no network calls.
 * Navigation is stubbed via `jest.mock('@react-navigation/native')`.
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
import { FriendsListScreen } from '@/features/friends/screens/FriendsListScreen';
import type { UserProfile } from '@/types/api/UserProfile';

// ── resolveDummyPhoto mock (used by Avatar) ───────────────────────────────────

jest.mock('@/assets/dummyPhotoRegistry', () => ({
  resolveDummyPhoto: () => 42,
}));

// ── Friends query mock ────────────────────────────────────────────────────────

type MockQueryReturn = {
  data: readonly UserProfile[] | undefined;
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

jest.mock('@/features/friends/api', () => ({
  useFriendsQuery: () => mockQueryReturn,
  FRIENDS_QUERY_KEY: ['friends'] as const,
}));

// ── Navigation mock ───────────────────────────────────────────────────────────

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
  // useFocusEffect: fire the callback once on mount (mimicking initial focus).
  useFocusEffect: (cb: () => (() => void) | void) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Rct = require('react') as typeof import('react');
    Rct.useEffect(() => {
      const cleanup = cb();
      return cleanup ?? undefined;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  },
}));

// ── QueryClient mock (for the useFocusEffect refetch) ────────────────────────

const mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeProfile(user_id: string, first_name: string, last_name: string): UserProfile {
  return {
    user_id,
    email: `${first_name.toLowerCase()}@example.com`,
    phone_number: null,
    username: first_name.toLowerCase(),
    first_name,
    last_name,
    sex: 'Female',
    birthday: '1998-05-15',
    age: 28,
    religion: 'Islam',
    subsect: null,
    religious_level: 'Practising',
    chosen_profile_avatar: null,
    photo_url: null,
    college_name: 'Test University',
    current_residence_city: 'Hamburg',
    current_residence_country: 'Germany',
    resident_country_code: 'DE',
    district: null,
    education_level: 'Bachelors',
    employer_name: null,
    employment_type: 'Full-time',
    family_residence_address: null,
    father_retired: 'NO',
    fathers_job: null,
    fathers_name: null,
    graduation_year: 2020,
    has_children: false,
    higher_secondary: null,
    higher_secondary_passing_year: null,
    highest_degree: 'BSc',
    high_school: null,
    high_school_passing_year: null,
    job_title: 'Engineer',
    marital_status: 'Never Married',
    marriage_time: 'Within 1 year',
    mother_retired: 'NO',
    mothers_job: null,
    mothers_name: null,
    move_abroad: false,
    office_address: null,
    partners_religious_level: null,
    professional_category: 'Technology',
    profile_complete_verified: true,
    relation: 'Marriage',
    salary_range: null,
    preferences: null,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
    deleted_at: null,
  };
}

const PROFILE_AISHA = makeProfile('u-aisha-001', 'Aisha', 'Khan');
const PROFILE_NADIA = makeProfile('u-nadia-002', 'Nadia', 'Ahmed');

// ── Render helper ─────────────────────────────────────────────────────────────

function renderScreen() {
  return render(
    <ThemeProvider>
      <FriendsListScreen />
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

// ── Focus-driven refetch ─────────────────────────────────────────────────────

describe('FriendsListScreen — focus refetch', () => {
  it('invalidates ["friends"] on screen focus', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [] };
    renderScreen();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['friends'] });
  });
});

// ── (a) Loading state ─────────────────────────────────────────────────────────

describe('FriendsListScreen — loading state', () => {
  it('given useFriendsQuery is loading, when screen renders, then LoadingState is shown', () => {
    mockQueryReturn = { ...mockQueryReturn, isLoading: true, data: undefined };
    renderScreen();
    expect(screen.getByTestId('friends-loading-state')).toBeTruthy();
  });

  it('given useFriendsQuery is loading, then FlatList is not rendered', () => {
    mockQueryReturn = { ...mockQueryReturn, isLoading: true, data: undefined };
    renderScreen();
    expect(screen.queryByTestId('friends-flat-list')).toBeNull();
  });
});

// ── (b) Error state ───────────────────────────────────────────────────────────

describe('FriendsListScreen — error state', () => {
  it('given useFriendsQuery errors, when screen renders, then ErrorState is shown', () => {
    mockQueryReturn = {
      ...mockQueryReturn,
      isError: true,
      error: new Error('Network failure'),
    };
    renderScreen();
    expect(screen.getByText('Could not load friends')).toBeTruthy();
  });

  it('given error state, pressing retry calls refetch', () => {
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

describe('FriendsListScreen — empty state', () => {
  it('given useFriendsQuery resolves with [], when screen renders, then EmptyState is shown', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [] };
    renderScreen();
    expect(screen.getByTestId('friends-empty-state')).toBeTruthy();
  });

  it('given empty list, then FlatList is not rendered', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [] };
    renderScreen();
    expect(screen.queryByTestId('friends-flat-list')).toBeNull();
  });

  it('given empty list, renders the empty title label', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [] };
    renderScreen();
    expect(screen.getByText('No friends yet')).toBeTruthy();
  });
});

// ── (d) Ready state — FlatList of ListRow renders ────────────────────────────

describe('FriendsListScreen — ready state', () => {
  it('given useFriendsQuery resolves with two friends, when screen renders, then FlatList is shown', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [PROFILE_AISHA, PROFILE_NADIA] };
    renderScreen();
    expect(screen.getByTestId('friends-flat-list')).toBeTruthy();
  });

  it('given two friends, renders a ListRow for each friend by testID', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [PROFILE_AISHA, PROFILE_NADIA] };
    renderScreen();
    expect(screen.getByTestId(`friend-row-${PROFILE_AISHA.user_id}`)).toBeTruthy();
    expect(screen.getByTestId(`friend-row-${PROFILE_NADIA.user_id}`)).toBeTruthy();
  });

  it('given two friends, renders each friend full name as row label', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [PROFILE_AISHA, PROFILE_NADIA] };
    renderScreen();
    expect(screen.getByText('Aisha Khan')).toBeTruthy();
    expect(screen.getByText('Nadia Ahmed')).toBeTruthy();
  });

  it('given ready state, LoadingState is not rendered', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [PROFILE_AISHA] };
    renderScreen();
    expect(screen.queryByTestId('friends-loading-state')).toBeNull();
  });

  it('given ready state, EmptyState is not rendered', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [PROFILE_AISHA] };
    renderScreen();
    expect(screen.queryByTestId('friends-empty-state')).toBeNull();
  });
});

// ── (e) Row-tap navigation ────────────────────────────────────────────────────

describe('FriendsListScreen — row-tap navigation', () => {
  it('given a friend row, when tapped, then navigates to OtherProfileScreen with userId and source=friend', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [PROFILE_AISHA] };
    renderScreen();
    fireEvent.press(screen.getByTestId(`friend-row-${PROFILE_AISHA.user_id}`));
    expect(mockNavigate).toHaveBeenCalledWith('OtherProfileScreen', {
      userId: PROFILE_AISHA.user_id,
      source: 'friend',
    });
  });

  it('given two friends, pressing second row navigates with the second userId', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [PROFILE_AISHA, PROFILE_NADIA] };
    renderScreen();
    fireEvent.press(screen.getByTestId(`friend-row-${PROFILE_NADIA.user_id}`));
    expect(mockNavigate).toHaveBeenCalledWith('OtherProfileScreen', {
      userId: PROFILE_NADIA.user_id,
      source: 'friend',
    });
  });

  it('given a friend row press, then source is always "friend"', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [PROFILE_AISHA] };
    renderScreen();
    fireEvent.press(screen.getByTestId(`friend-row-${PROFILE_AISHA.user_id}`));
    expect(mockNavigate).toHaveBeenCalledWith(
      'OtherProfileScreen',
      expect.objectContaining({ source: 'friend' }),
    );
  });
});

// ── Screen structure ──────────────────────────────────────────────────────────

describe('FriendsListScreen — screen structure', () => {
  it('renders the root screen container', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [] };
    renderScreen();
    expect(screen.getByTestId('friends-list-screen')).toBeTruthy();
  });

  it('renders the header title', () => {
    mockQueryReturn = { ...mockQueryReturn, data: [] };
    renderScreen();
    expect(screen.getByText('Friends')).toBeTruthy();
  });
});
