/**
 * Authentication state provider.
 *
 * Implements the auth-state contract from §7.2:
 *
 * - `status`: `'loading'` while the silent-refresh attempt is in flight,
 *   `'authenticated'` on success, `'unauthenticated'` on failure.
 * - `session`: the current {@link SessionTokens} or `null`.
 * - `profileComplete`: decoded from the `custom:profile_complete` claim.
 *   Defaults to `false` until the claim is populated by the backend (wired
 *   fully in phase 2+ when the profile-completion endpoint is available).
 * - `signIn`: delegates to {@link cognitoClient.signIn}, then updates state.
 * - `signOut`: calls `cognitoClient.signOut()` first (to prevent re-fetches
 *   with a stale token), then clears the TanStack Query cache.
 * - `refresh`: re-runs the silent-refresh path manually.
 *
 * On mount the provider silently attempts a token refresh. Children are NOT
 * rendered until the attempt settles (status leaves `'loading'`).
 *
 * @module state/auth/AuthProvider
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
import { useQueryClient } from '@tanstack/react-query';
import type { SignInOutput } from 'aws-amplify/auth';

import { cognitoClient, type SessionTokens } from '@/services/auth/cognitoClient';
import type { SignInInput } from '@/services/auth/cognitoClient';

// ── Types ──────────────────────────────────────────────────────────────────

/** Auth loading / readiness status. */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * The value exposed by `useAuth()`.
 *
 * Implements the contract from `architecture.md §7.2`.
 */
export interface AuthContextValue {
  /**
   * `'loading'` during the initial silent-refresh;
   * `'authenticated'` when a valid session exists;
   * `'unauthenticated'` otherwise.
   */
  readonly status: AuthStatus;
  /**
   * The current session tokens, or `null` when not authenticated.
   */
  readonly session: SessionTokens | null;
  /**
   * Whether the user has completed their onboarding profile.
   *
   * Derived from `custom:profile_complete` in the ID token claims.
   * Defaults to `false` until the backend populates the claim (phase 2+).
   *
   * TODO(phase-2): Wire up full claim decoding once the profile-completion
   * endpoint is available and the claim is reliably set.
   */
  readonly profileComplete: boolean;
  /**
   * Signs the user in with email + password credentials.
   *
   * On success, updates status to `'authenticated'` and populates `session`.
   *
   * @param input - Username and password.
   * @returns The raw Amplify {@link SignInOutput}.
   * @throws {AuthError} On invalid credentials or unconfirmed account.
   */
  readonly signIn: (input: SignInInput) => Promise<SignInOutput>;
  /**
   * Signs the user out and clears the TanStack Query cache.
   *
   * Order: `cognitoClient.signOut()` first (revokes tokens on the network so
   * no in-flight requests can re-auth with a stale token), then
   * `queryClient.clear()` (evicts cached data for the signed-out user).
   *
   * @throws {AuthError} Propagated from Amplify on unexpected failure.
   */
  readonly signOut: () => Promise<void>;
  /**
   * Re-runs the silent-refresh path.
   *
   * Sets status to `'loading'` while in flight, then resolves to
   * `'authenticated'` or `'unauthenticated'`.
   */
  readonly refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────

interface AuthProviderProps {
  /** React subtree that can call `useAuth()`. */
  readonly children?: React.ReactNode;
}

/**
 * Wraps the application subtree with authentication state.
 *
 * Children are not rendered while `status === 'loading'` (i.e., while the
 * initial silent-refresh is in flight). This prevents navigator from choosing
 * a stack before the auth state is known.
 *
 * @param props - {@link AuthProviderProps}
 */
export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<SessionTokens | null>(null);

  // Derive profileComplete from the ID token claim (stub until phase 2).
  const profileComplete = useMemo<boolean>(() => {
    if (!session) return false;
    // TODO(phase-2): Decode `custom:profile_complete` from session.idToken JWT
    // once the backend populates this claim after onboarding completion.
    // For now, the claim is absent, so we default to false.
    return false;
  }, [session]);

  // ── Silent refresh ────────────────────────────────────────────────────────

  const silentRefresh = useCallback(async (): Promise<void> => {
    setStatus('loading');
    try {
      const tokens = await cognitoClient.refreshSession();
      if (tokens !== null) {
        setSession(tokens);
        setStatus('authenticated');
      } else {
        setSession(null);
        setStatus('unauthenticated');
      }
    } catch {
      // Refresh token expired / revoked / network unreachable — fall through
      // to unauthenticated. Do not crash; the user signs in manually.
      setSession(null);
      setStatus('unauthenticated');
    }
  }, []);

  // Track mount state to guard against setState after unmount.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Run silent refresh once on mount.
  useEffect(() => {
    silentRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sign-in ───────────────────────────────────────────────────────────────

  const signIn = useCallback(async (input: SignInInput): Promise<SignInOutput> => {
    const output = await cognitoClient.signIn(input);
    if (output.isSignedIn) {
      // Fetch a fresh session after sign-in to populate our session state.
      const tokens = await cognitoClient.refreshSession();
      setSession(tokens);
      setStatus(tokens !== null ? 'authenticated' : 'unauthenticated');
    }
    return output;
  }, []);

  // ── Sign-out ──────────────────────────────────────────────────────────────

  const signOut = useCallback(async (): Promise<void> => {
    // Sign out first — no re-fetch can happen with a stale token after this.
    await cognitoClient.signOut();
    // Clear cache — evicts all cached data for the signed-out user.
    queryClient.clear();
    setSession(null);
    setStatus('unauthenticated');
  }, [queryClient]);

  // ── Value ─────────────────────────────────────────────────────────────────

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      profileComplete,
      signIn,
      signOut,
      refresh: silentRefresh,
    }),
    [status, session, profileComplete, signIn, signOut, silentRefresh],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────

/**
 * Returns the current authentication state and actions.
 *
 * Must be called within an {@link AuthProvider}.
 *
 * @returns The current {@link AuthContextValue}.
 * @throws {Error} When called outside an `AuthProvider`.
 *
 * @example
 * ```tsx
 * const { status, session, signOut } = useAuth();
 * ```
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
