/**
 * Tests for BookmarksProvider and useBookmarks (story 14.1).
 *
 * Uses the official `@react-native-async-storage/async-storage` jest mock,
 * already wired in `jest.config.js` via `moduleNameMapper`.
 *
 * AC coverage:
 * (a) Renders with empty seed; `bookmarks` is `[]`, `loading` starts `true`
 *     then flips to `false` after hydration.
 * (b) `addBookmark(mehvish)` mutates in-memory state; a sibling component
 *     reading via `useBookmarks()` re-renders with the new array.
 * (c) `removeBookmark(mehvish.user_id)` mirrors the reverse.
 * (d) `isBookmarked(mehvish.user_id)` returns `true` after add, `false` after remove.
 * (e) Idempotency: calling `addBookmark(mehvish)` twice leaves array length 1.
 * (f) Cold-start hydration: seed AsyncStorage with a fixture array before
 *     mount; `bookmarks` reflects the seed after the initial `loading` flip.
 *
 * TODO(mock-only): remove when real bookmark backend ships
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BookmarksProvider,
  useBookmarks,
} from '@/state/bookmarks/BookmarksProvider';
import { BOOKMARKS_STORAGE_KEY } from '@/features/bookmarks/storage/bookmarksStorage';
import type { DummyDeckProfile } from '@/types/DummyDeckProfile';

// ── Fixture ───────────────────────────────────────────────────────────────────

const mehvish: DummyDeckProfile = {
  user_id: 'mehvish-uuid-0001',
  first_name: 'Mehvish',
  last_name: 'Hayat',
  sex: 'Female',
  age: 26,
  chosen_profile_avatar: null,
  photo_url: 'Female3.png',
  current_residence_city: 'Hamburg',
  current_residence_country: 'Germany',
  resident_country_code: 'DE',
  religion: 'Islam',
  job_title: 'Biomedical Engineer',
  username: 'mehvish',
  profile_complete_verified: true,
  photos: ['Female3.png'],
  faceSelfieUri: null,
  marital_status: 'Never Married',
  has_children: false,
  marriage_time: 'Within 1 year',
  meet_time: 'As soon as possible',
  professional_category: 'Healthcare',
  employer_name: null,
  employment_type: 'Full-time',
  office_address: null,
  salary_range: null,
  highest_degree: 'MSc Biomedical Engineering',
  education_level: 'Masters',
  college_name: 'University of Hamburg',
  graduation_year: 2022,
  higher_secondary: null,
  higher_secondary_passing_year: null,
  high_school: null,
  high_school_passing_year: null,
  __dummy_display_only: {
    is_active_today: true,
    membership_tier: 'silver',
    has_unread_notifications: false,
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderBookmarksHook() {
  return renderHook(() => useBookmarks(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <BookmarksProvider>{children}</BookmarksProvider>
    ),
  });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// ── AC (a): initial state ──────────────────────────────────────────────────────

describe('BookmarksProvider — AC (a): initial empty state', () => {
  it('given empty storage, when provider mounts, then bookmarks is [] and loading starts true then flips false', async () => {
    const { result } = renderBookmarksHook();

    // loading should start true before hydration resolves
    expect(result.current.loading).toBe(true);
    expect(result.current.bookmarks).toEqual([]);

    // Wait for the useEffect hydration to complete
    await act(async () => {
      // allow promises to flush
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.bookmarks).toEqual([]);
  });
});

// ── AC (b): addBookmark mutates in-memory state ───────────────────────────────

describe('BookmarksProvider — AC (b): addBookmark', () => {
  it('given empty bookmarks, when addBookmark is called, then bookmarks array contains the profile', async () => {
    const { result } = renderBookmarksHook();

    await act(async () => {
      // wait for hydration
    });

    await act(async () => {
      await result.current.addBookmark(mehvish);
    });

    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.bookmarks[0]?.user_id).toBe(mehvish.user_id);
  });
});

// ── AC (c): removeBookmark mutates in-memory state ────────────────────────────

describe('BookmarksProvider — AC (c): removeBookmark', () => {
  it('given a bookmarked profile, when removeBookmark is called, then bookmarks array is empty', async () => {
    const { result } = renderBookmarksHook();

    await act(async () => {
      // wait for hydration
    });

    await act(async () => {
      await result.current.addBookmark(mehvish);
    });

    expect(result.current.bookmarks).toHaveLength(1);

    await act(async () => {
      await result.current.removeBookmark(mehvish.user_id);
    });

    expect(result.current.bookmarks).toHaveLength(0);
  });
});

// ── AC (d): isBookmarked synchronous read ────────────────────────────────────

describe('BookmarksProvider — AC (d): isBookmarked', () => {
  it('given a profile added via addBookmark, when isBookmarked is called, then returns true', async () => {
    const { result } = renderBookmarksHook();

    await act(async () => {
      // wait for hydration
    });

    await act(async () => {
      await result.current.addBookmark(mehvish);
    });

    expect(result.current.isBookmarked(mehvish.user_id)).toBe(true);
  });

  it('given a profile removed via removeBookmark, when isBookmarked is called, then returns false', async () => {
    const { result } = renderBookmarksHook();

    await act(async () => {
      // wait for hydration
    });

    await act(async () => {
      await result.current.addBookmark(mehvish);
    });

    await act(async () => {
      await result.current.removeBookmark(mehvish.user_id);
    });

    expect(result.current.isBookmarked(mehvish.user_id)).toBe(false);
  });
});

// ── AC (e): idempotency ───────────────────────────────────────────────────────

describe('BookmarksProvider — AC (e): addBookmark idempotency', () => {
  it('given addBookmark is called twice with same profile, then array length stays 1', async () => {
    const { result } = renderBookmarksHook();

    await act(async () => {
      // wait for hydration
    });

    await act(async () => {
      await result.current.addBookmark(mehvish);
    });

    await act(async () => {
      await result.current.addBookmark(mehvish);
    });

    expect(result.current.bookmarks).toHaveLength(1);
  });
});

// ── AC (f): cold-start hydration ──────────────────────────────────────────────

describe('BookmarksProvider — AC (f): cold-start hydration', () => {
  it('given AsyncStorage is pre-seeded before mount, when provider mounts, then bookmarks reflects the seed', async () => {
    // Pre-seed storage before rendering the provider
    await AsyncStorage.setItem(
      BOOKMARKS_STORAGE_KEY,
      JSON.stringify([mehvish]),
    );

    const { result } = renderBookmarksHook();

    // Wait for hydration
    await act(async () => {
      // allow promises to flush
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.bookmarks).toHaveLength(1);
    expect(result.current.bookmarks[0]?.user_id).toBe(mehvish.user_id);
  });
});

// ── getBookmark synchronous lookup ───────────────────────────────────────────

describe('BookmarksProvider — getBookmark', () => {
  it('given a bookmarked profile, when getBookmark is called with that user_id, then returns the profile', async () => {
    const { result } = renderBookmarksHook();

    await act(async () => {
      // wait for hydration
    });

    await act(async () => {
      await result.current.addBookmark(mehvish);
    });

    const found = result.current.getBookmark(mehvish.user_id);
    expect(found).toBeDefined();
    expect(found?.user_id).toBe(mehvish.user_id);
  });

  it('given no bookmarks, when getBookmark is called, then returns undefined', async () => {
    const { result } = renderBookmarksHook();

    await act(async () => {
      // wait for hydration
    });

    const found = result.current.getBookmark('non-existent-uuid');
    expect(found).toBeUndefined();
  });
});

// ── Error guard: useBookmarks outside provider ────────────────────────────────

describe('useBookmarks outside provider', () => {
  it('given no BookmarksProvider, when useBookmarks is called, then throws', () => {
    expect(() =>
      renderHook(() => useBookmarks()),
    ).toThrow('useBookmarks must be used within a BookmarksProvider');
  });
});
