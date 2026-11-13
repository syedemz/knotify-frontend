/**
 * Unit tests for `src/features/landing/hooks/useDeckQuery.ts`.
 *
 * Covers:
 * (a) Plucks `.results` from the backend envelope `{results, next_cursor}`
 *     and surfaces it as `data: DeckProfile[]`.
 * (b) Empty backend response → empty array in `data`.
 * (c) Backend error propagates to `isError` + `error`.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── matchApi mock — the only I/O under test ──────────────────────────────────

const mockGetDeck = jest.fn();

jest.mock('@/services/api/endpoints', () => ({
  matchApi: {
    getDeck: (...args: unknown[]) => mockGetDeck(...args),
  },
}));

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { useDeckQuery } from '@/features/landing/hooks/useDeckQuery';
import type { DeckProfile } from '@/types/api/DeckProfile';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeProfile(user_id: string, first_name: string): DeckProfile {
  return {
    user_id,
    first_name,
    last_name: 'Doe',
    sex: 'Female',
    age: 28,
    chosen_profile_avatar: null,
    photo_url: 'https://cdn.example.com/photo.jpg',
    current_residence_city: 'Berlin',
    current_residence_country: 'Germany',
    resident_country_code: 'DE',
    religion: 'Islam',
    job_title: 'Software Engineer',
    username: 'test_user',
    profile_complete_verified: true,
  };
}

// ── Wrapper — fresh QueryClient per test to isolate cache ────────────────────

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

// ── (a) Envelope unwrap ──────────────────────────────────────────────────────

describe('useDeckQuery — envelope unwrap', () => {
  it('given backend returns {results: [...], next_cursor: ...}, then data is the results array', async () => {
    const profile = makeProfile('u-1', 'Aisha');
    mockGetDeck.mockResolvedValue({ results: [profile], next_cursor: null });

    const { result } = renderHook(() => useDeckQuery(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([profile]);
  });
});

// ── (b) Empty backend response ───────────────────────────────────────────────

describe('useDeckQuery — empty response', () => {
  it('given backend returns {results: [], next_cursor: null}, then data is an empty array', async () => {
    mockGetDeck.mockResolvedValue({ results: [], next_cursor: null });

    const { result } = renderHook(() => useDeckQuery(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(result.current.data).toEqual([]);
  });
});

// ── (c) Backend error ────────────────────────────────────────────────────────

describe('useDeckQuery — backend error', () => {
  it('given backend throws, then isError and error propagate', async () => {
    mockGetDeck.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useDeckQuery(), { wrapper: makeWrapper() });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.error?.message).toBe('boom');
  });
});
