/**
 * OwnProfileProvider — fetches + caches the signed-in user's own profile.
 *
 * Lifecycle:
 * 1. On mount (or whenever `auth.status` becomes `'authenticated'`):
 *    - Synchronously hydrate from AsyncStorage key `profile.me` for instant
 *      paint ("stale-while-revalidate" first half).
 *    - Fire `GET /profile/me` to refresh — on success, update state + cache.
 * 2. On signOut (`auth.status` transitions to `'unauthenticated'`):
 *    - Clear the AsyncStorage cache + reset in-memory state.
 *
 * Mounted inside `AuthProvider` so it can observe `useAuth().status` and
 * react to authentication state changes.
 *
 * @module state/ownProfile/OwnProfileProvider
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useAuth } from '@/state/auth/AuthProvider';
import { profileApi } from '@/services/api/endpoints';
import {
  clearCachedOwnProfile,
  getCachedOwnProfile,
  saveCachedOwnProfile,
} from '@/features/profile/storage/ownProfileStorage';
import type { UserProfile } from '@/types/api/UserProfile';

// ── Types ─────────────────────────────────────────────────────────────────────

/** Loading state for the own-profile fetch. */
export type OwnProfileStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Value exposed by `useOwnProfile()`.
 *
 * - `profile`: latest known own-profile (either hydrated from cache or fetched
 *   fresh). `null` when there's no session OR before any cache/fetch has
 *   resolved.
 * - `status`: lifecycle marker.
 *   - `'idle'` — no session yet (status === unauthenticated or still loading)
 *   - `'loading'` — initial hydration/fetch in flight, no profile yet
 *   - `'ready'` — at least one source (cache or network) has produced a profile
 *   - `'error'` — the network fetch failed AND no cached snapshot is available
 * - `error`: the last network error, if any (cleared on next successful fetch).
 * - `refresh`: forces a network fetch; resolves when the fetch settles.
 */
export interface OwnProfileContextValue {
  readonly profile: UserProfile | null;
  readonly status: OwnProfileStatus;
  readonly error: Error | null;
  readonly refresh: () => Promise<void>;
}

const OwnProfileContext = createContext<OwnProfileContextValue | undefined>(
  undefined,
);

// ── Provider ──────────────────────────────────────────────────────────────────

interface OwnProfileProviderProps {
  readonly children?: React.ReactNode;
}

/**
 * Wraps the authenticated subtree. Must be a descendant of `AuthProvider`.
 */
export function OwnProfileProvider({
  children,
}: OwnProfileProviderProps): React.JSX.Element {
  const { status: authStatus } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<OwnProfileStatus>('idle');
  const [error, setError] = useState<Error | null>(null);

  // Guard against setState-after-unmount races.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ── Core fetch routine ─────────────────────────────────────────────────────

  const fetchFromNetwork = useCallback(async (): Promise<void> => {
    try {
      const fresh = await profileApi.getMe();
      if (!mountedRef.current) return;
      setProfile(fresh);
      setStatus('ready');
      setError(null);
      // Write-through: next cold boot paints instantly.
      await saveCachedOwnProfile(fresh).catch((err) => {
        console.warn('[OwnProfileProvider] failed to persist profile cache', err);
      });
    } catch (err) {
      if (!mountedRef.current) return;
      const asError = err instanceof Error ? err : new Error(String(err));
      setError(asError);
      // Only flip to error if we have no cached data to fall back on.
      setStatus((prev) => (prev === 'ready' ? 'ready' : 'error'));
    }
  }, []);

  // ── React to auth status transitions ───────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const run = async (): Promise<void> => {
      if (authStatus === 'authenticated') {
        setStatus('loading');
        // Step 1: hydrate from cache (fast path).
        try {
          const cached = await getCachedOwnProfile();
          if (cancelled || !mountedRef.current) return;
          if (cached !== null) {
            setProfile(cached);
            setStatus('ready');
          }
        } catch (err) {
          console.warn('[OwnProfileProvider] cache hydration failed', err);
        }
        // Step 2: revalidate from network.
        if (cancelled) return;
        await fetchFromNetwork();
      } else if (authStatus === 'unauthenticated') {
        // Clear the cache + reset state so the next sign-in starts clean.
        setProfile(null);
        setStatus('idle');
        setError(null);
        clearCachedOwnProfile().catch((err) => {
          console.warn('[OwnProfileProvider] failed to clear cache', err);
        });
      }
      // 'loading' auth state → stay idle until it settles.
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [authStatus, fetchFromNetwork]);

  // ── Public API ─────────────────────────────────────────────────────────────

  const value = useMemo<OwnProfileContextValue>(
    () => ({
      profile,
      status,
      error,
      refresh: fetchFromNetwork,
    }),
    [profile, status, error, fetchFromNetwork],
  );

  return (
    <OwnProfileContext.Provider value={value}>
      {children}
    </OwnProfileContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the current own-profile state + actions.
 *
 * Must be called within an {@link OwnProfileProvider}.
 */
export function useOwnProfile(): OwnProfileContextValue {
  const ctx = useContext(OwnProfileContext);
  if (ctx === undefined) {
    throw new Error('useOwnProfile must be used within OwnProfileProvider');
  }
  return ctx;
}
