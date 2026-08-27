/**
 * Unit tests for bookmarksStorage (story 14.1).
 *
 * Uses the official `@react-native-async-storage/async-storage` jest mock,
 * already wired in `jest.config.js` via `moduleNameMapper`.
 *
 * AC coverage:
 * (a) `getBookmarks` on empty storage returns `[]`.
 * (b) `getBookmarks` on corrupt JSON returns `[]` and logs `console.warn`.
 * (c) `addBookmark` writes the profile; a second `addBookmark` with the same
 *     `user_id` is idempotent (array length stays 1).
 * (d) `removeBookmark` removes by `user_id`; removing an unknown id is a no-op.
 * (e) `isBookmarked` returns `true` after add, `false` after remove.
 * (f) `clearBookmarks` wipes the key (subsequent `getBookmarks` returns `[]`).
 *
 * TODO(mock-only): remove when real bookmark backend ships
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BOOKMARKS_STORAGE_KEY,
  addBookmark,
  clearBookmarks,
  getBookmarks,
  isBookmarked,
  removeBookmark,
  saveBookmarks,
} from '@/features/bookmarks/storage/bookmarksStorage';
import type { DummyDeckProfile } from '@/types/DummyDeckProfile';

// ── Fixture ───────────────────────────────────────────────────────────────────

/**
 * Minimal `DummyDeckProfile` fixture with just the fields exercised by the
 * storage layer. Storage treats profiles as opaque JSON — type safety is
 * enforced at the call site, not inside the helper.
 */
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

const nadia: DummyDeckProfile = {
  ...mehvish,
  user_id: 'nadia-uuid-0002',
  first_name: 'Nadia',
  last_name: 'Hassan',
};

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(async () => {
  // Clear AsyncStorage between tests so each test starts from a clean state.
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// ── AC (a): getBookmarks on empty storage ─────────────────────────────────────

describe('getBookmarks', () => {
  it('given storage is empty, when getBookmarks is called, then returns []', async () => {
    const result = await getBookmarks();
    expect(result).toEqual([]);
  });

  // AC (b)
  it('given storage contains corrupt JSON, when getBookmarks is called, then returns [] and warns', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await AsyncStorage.setItem(BOOKMARKS_STORAGE_KEY, '{ not valid json {{{{');

    const result = await getBookmarks();

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('failed to parse stored JSON'),
    );

    warnSpy.mockRestore();
  });

  it('given storage has valid bookmarks, when getBookmarks is called, then returns the array', async () => {
    await saveBookmarks([mehvish]);
    const result = await getBookmarks();
    expect(result).toHaveLength(1);
    expect(result[0]?.user_id).toBe(mehvish.user_id);
  });
});

// ── AC (c): addBookmark idempotency ──────────────────────────────────────────

describe('addBookmark', () => {
  it('given empty storage, when addBookmark is called, then profile is persisted', async () => {
    const result = await addBookmark(mehvish);
    expect(result).toHaveLength(1);
    expect(result[0]?.user_id).toBe(mehvish.user_id);
  });

  it('given profile already bookmarked, when addBookmark is called again with same user_id, then array length stays 1 (idempotent)', async () => {
    await addBookmark(mehvish);
    const result = await addBookmark(mehvish);
    expect(result).toHaveLength(1);
  });

  it('given two different profiles, when both are added, then array length is 2', async () => {
    await addBookmark(mehvish);
    const result = await addBookmark(nadia);
    expect(result).toHaveLength(2);
  });
});

// ── AC (d): removeBookmark ────────────────────────────────────────────────────

describe('removeBookmark', () => {
  it('given a bookmarked profile, when removeBookmark is called with that user_id, then profile is removed', async () => {
    await addBookmark(mehvish);
    const result = await removeBookmark(mehvish.user_id);
    expect(result).toHaveLength(0);
  });

  it('given an unknown user_id, when removeBookmark is called, then array is unchanged (no-op)', async () => {
    await addBookmark(mehvish);
    const result = await removeBookmark('non-existent-uuid');
    expect(result).toHaveLength(1);
    expect(result[0]?.user_id).toBe(mehvish.user_id);
  });

  it('given empty storage, when removeBookmark is called, then returns [] (no-op)', async () => {
    const result = await removeBookmark('non-existent-uuid');
    expect(result).toEqual([]);
  });

  it('given two bookmarked profiles, when one is removed, then only the other remains', async () => {
    await addBookmark(mehvish);
    await addBookmark(nadia);
    const result = await removeBookmark(mehvish.user_id);
    expect(result).toHaveLength(1);
    expect(result[0]?.user_id).toBe(nadia.user_id);
  });
});

// ── AC (e): isBookmarked ──────────────────────────────────────────────────────

describe('isBookmarked', () => {
  it('given a bookmarked profile, when isBookmarked is called, then returns true', async () => {
    await addBookmark(mehvish);
    const result = await isBookmarked(mehvish.user_id);
    expect(result).toBe(true);
  });

  it('given no bookmarks, when isBookmarked is called, then returns false', async () => {
    const result = await isBookmarked(mehvish.user_id);
    expect(result).toBe(false);
  });

  it('given profile removed, when isBookmarked is called after remove, then returns false', async () => {
    await addBookmark(mehvish);
    await removeBookmark(mehvish.user_id);
    const result = await isBookmarked(mehvish.user_id);
    expect(result).toBe(false);
  });
});

// ── AC (f): clearBookmarks ────────────────────────────────────────────────────

describe('clearBookmarks', () => {
  it('given bookmarks exist, when clearBookmarks is called, then subsequent getBookmarks returns []', async () => {
    await addBookmark(mehvish);
    await addBookmark(nadia);

    await clearBookmarks();

    const result = await getBookmarks();
    expect(result).toEqual([]);
  });

  it('given empty storage, when clearBookmarks is called, then getBookmarks still returns []', async () => {
    await clearBookmarks();
    const result = await getBookmarks();
    expect(result).toEqual([]);
  });
});

// ── BOOKMARKS_STORAGE_KEY export ──────────────────────────────────────────────

describe('BOOKMARKS_STORAGE_KEY', () => {
  it('is exported and equals "dummy.bookmarks"', () => {
    expect(BOOKMARKS_STORAGE_KEY).toBe('dummy.bookmarks');
  });
});
