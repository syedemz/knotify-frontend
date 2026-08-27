/**
 * In-memory mirror of the persisted bookmarks state, exposed via
 * `useBookmarks()`.
 *
 * TODO(mock-only): replace in-memory mirror with real useQuery(['bookmarks'])
 *
 * **Why in-memory?** AsyncStorage reads are async; React render bodies are
 * synchronous. Holding a mirror allows `isBookmarked` and `getBookmark` to
 * be called directly in render bodies and `useMemo` dependency arrays without
 * awaiting storage on every call.
 *
 * **Freshness guarantee.** Every mutation (`addBookmark`, `removeBookmark`)
 * updates the mirror in the same tick as the storage write resolves, so
 * consumers always see consistent state.
 *
 * **Provider order.** `BookmarksProvider` sits AFTER `FriendshipProvider` in
 * `App.tsx`. A future `BookmarkDeckViewScreen` may want to read friendship
 * state for the bookmarked user (e.g. to hide the send-request FAB when
 * already a friend). Phase 14 does not wire that dependency yet, but the tree
 * order costs nothing and forward-compatibility is free.
 *
 * @module state/bookmarks/BookmarksProvider
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { DummyDeckProfile } from '@/types/DummyDeckProfile';
import * as bookmarksStorage from '@/features/bookmarks/storage/bookmarksStorage';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * The value exposed by `useBookmarks()`.
 *
 * TODO(mock-only): retire when real bookmark backend ships; replace mirror
 * with React Query cache.
 */
export interface BookmarksContextValue {
  /** The current in-memory bookmarks array. Reflects persisted state. */
  readonly bookmarks: DummyDeckProfile[];

  /**
   * `true` while the initial AsyncStorage hydration is in-flight.
   *
   * Consumers that render unconditionally (e.g. a grid that shows an
   * empty-state placeholder until loaded) should gate on this flag.
   */
  readonly loading: boolean;

  /**
   * Adds a profile to bookmarks.
   *
   * Writes to AsyncStorage, then updates the in-memory mirror with the
   * returned array. Idempotent: calling twice with the same profile leaves
   * the array unchanged.
   *
   * @param profile - The full deck profile to bookmark.
   */
  readonly addBookmark: (profile: DummyDeckProfile) => Promise<void>;

  /**
   * Removes the profile matching `userId` from bookmarks.
   *
   * Writes to AsyncStorage, then updates the in-memory mirror. Idempotent:
   * removing a non-bookmarked user is a no-op.
   *
   * @param userId - The `user_id` of the profile to remove.
   */
  readonly removeBookmark: (userId: string) => Promise<void>;

  /**
   * Synchronous check: returns `true` if `userId` is currently bookmarked.
   *
   * Reads from the in-memory mirror — safe to call in render bodies and
   * `useMemo` dependency arrays without triggering AsyncStorage I/O.
   *
   * @param userId - The `user_id` to check.
   */
  readonly isBookmarked: (userId: string) => boolean;

  /**
   * Synchronous lookup: returns the bookmarked `DummyDeckProfile` for
   * `userId`, or `undefined` if not bookmarked.
   *
   * Reads from the in-memory mirror — safe to call in render bodies.
   *
   * @param userId - The `user_id` to look up.
   */
  readonly getBookmark: (userId: string) => DummyDeckProfile | undefined;
}

// ── Context ───────────────────────────────────────────────────────────────────

const BookmarksContext = createContext<BookmarksContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

interface BookmarksProviderProps {
  /** React subtree that can call `useBookmarks()`. */
  readonly children?: React.ReactNode;
}

/**
 * Provider for the bookmarks in-memory mirror.
 *
 * Hydrates once on mount by reading `dummy.bookmarks` from AsyncStorage via
 * {@link bookmarksStorage.getBookmarks}. Sets `loading: false` after the
 * first read resolves, whether or not any bookmarks exist.
 *
 * Insert between `FriendshipProvider` and `NavigationContainer` in `App.tsx`.
 *
 * TODO(mock-only): remove when real bookmark backend ships
 *
 * @param props - {@link BookmarksProviderProps}
 */
export function BookmarksProvider({ children }: BookmarksProviderProps): React.JSX.Element {
  // TODO(mock-only): replace in-memory mirror with real useQuery(['bookmarks'])
  const [bookmarks, setBookmarks] = useState<DummyDeckProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Hydrate once on mount.
  useEffect(() => {
    let cancelled = false;

    const hydrate = async (): Promise<void> => {
      const stored = await bookmarksStorage.getBookmarks();
      if (!cancelled) {
        setBookmarks(stored);
        setLoading(false);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  const addBookmark = useCallback(async (profile: DummyDeckProfile): Promise<void> => {
    const updated = await bookmarksStorage.addBookmark(profile);
    setBookmarks(updated);
  }, []);

  const removeBookmark = useCallback(async (userId: string): Promise<void> => {
    const updated = await bookmarksStorage.removeBookmark(userId);
    setBookmarks(updated);
  }, []);

  const isBookmarked = useCallback(
    (userId: string): boolean => bookmarks.some((b) => b.user_id === userId),
    [bookmarks],
  );

  const getBookmark = useCallback(
    (userId: string): DummyDeckProfile | undefined =>
      bookmarks.find((b) => b.user_id === userId),
    [bookmarks],
  );

  const value: BookmarksContextValue = {
    bookmarks,
    loading,
    addBookmark,
    removeBookmark,
    isBookmarked,
    getBookmark,
  };

  return (
    <BookmarksContext.Provider value={value}>
      {children}
    </BookmarksContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the bookmarks state and actions from the nearest
 * {@link BookmarksProvider}.
 *
 * @returns The current {@link BookmarksContextValue}.
 * @throws {Error} When called outside a `BookmarksProvider`.
 *
 * TODO(mock-only): remove when real bookmark backend ships
 */
export function useBookmarks(): BookmarksContextValue {
  const ctx = useContext(BookmarksContext);
  if (ctx === undefined) {
    throw new Error('useBookmarks must be used within a BookmarksProvider');
  }
  return ctx;
}
