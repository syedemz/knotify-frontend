/**
 * Unit tests for `src/features/friends/api.ts` — `useFriendsQuery`.
 *
 * AC coverage (story 16.1):
 * (a) Happy-path — backend returns a populated friend list; `data` holds the
 *     typed `Friend[]` array.
 * (b) Empty response — backend returns `[]`; `data` is an empty array.
 * (c) Error mapping — backend throws; `isError` is `true` and `error`
 *     propagates to the caller.
 *
 * Tests stub the service boundary at `friendsApi.list` (via
 * `jest.mock('@/services/api/endpoints')`) — no fixtures under
 * `src/services/api/mocks/` are created (real-backend-only per PRD 16.1).
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Service boundary stub ─────────────────────────────────────────────────────

const mockList = jest.fn();

jest.mock('@/services/api/endpoints', () => ({
  friendsApi: {
    list: (...args: unknown[]) => mockList(...args),
  },
  // Other exports are unused in this test; keep the module shape intact.
  profileApi: {},
  matchApi: {},
}));

// ── Imports (after mock declaration) ─────────────────────────────────────────

import { useFriendsQuery, FRIENDS_QUERY_KEY } from '@/features/friends/api';
import type { Friend } from '@/types/api/Friend';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/**
 * Minimal `Friend` fixture — only the fields exercised by the hook layer.
 * The hook surfaces the array as-is; field completeness is the backend's
 * responsibility.
 */
function makeFriend(user_id: string, first_name: string): Friend {
  return {
    user_id,
    email: `${first_name.toLowerCase()}@example.com`,
    phone_number: null,
    username: first_name.toLowerCase(),
    first_name,
    last_name: 'Test',
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

// ── Wrapper — fresh QueryClient per test to isolate cache ─────────────────────

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client }, children);
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
});

// ── FRIENDS_QUERY_KEY export ──────────────────────────────────────────────────

describe('FRIENDS_QUERY_KEY', () => {
  it('is exported as the tuple ["friends"] per §7.3 query-key convention', () => {
    expect(FRIENDS_QUERY_KEY).toEqual(['friends']);
  });
});

// ── (a) Happy-path ────────────────────────────────────────────────────────────

describe('useFriendsQuery — happy-path', () => {
  it('given backend returns a populated friend list, when hook resolves, then data is the typed Friend array', async () => {
    const aisha = makeFriend('u-aisha-001', 'Aisha');
    const nadia = makeFriend('u-nadia-002', 'Nadia');
    mockList.mockResolvedValue([aisha, nadia]);

    const { result } = renderHook(() => useFriendsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.user_id).toBe('u-aisha-001');
    expect(result.current.data?.[1]?.user_id).toBe('u-nadia-002');
  });

  it('given backend returns a populated list, then isLoading transitions to false and isError stays false', async () => {
    const aisha = makeFriend('u-aisha-001', 'Aisha');
    mockList.mockResolvedValue([aisha]);

    const { result } = renderHook(() => useFriendsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

// ── (b) Empty response ────────────────────────────────────────────────────────

describe('useFriendsQuery — empty response', () => {
  it('given backend returns an empty array, when hook resolves, then data is []', async () => {
    mockList.mockResolvedValue([]);

    const { result } = renderHook(() => useFriendsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

// ── (c) Error mapping ─────────────────────────────────────────────────────────

describe('useFriendsQuery — error mapping', () => {
  it('given backend throws, when hook rejects, then isError is true and error propagates', async () => {
    mockList.mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useFriendsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network failure');
    expect(result.current.data).toBeUndefined();
  });

  it('given backend throws an ApiError, when hook rejects, then the original error object is surfaced', async () => {
    const apiError = Object.assign(new Error('Unauthorized'), {
      status: 401,
      code: 'SESSION_EXPIRED',
    });
    mockList.mockRejectedValue(apiError);

    const { result } = renderHook(() => useFriendsQuery(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(apiError);
  });
});
