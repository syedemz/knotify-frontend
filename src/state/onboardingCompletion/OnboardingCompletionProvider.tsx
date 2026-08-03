/**
 * Mock-only onboarding completion context.
 *
 * Reads `dummy.onboarding.complete` from expo-secure-store on mount and
 * exposes the completion state plus `markComplete()` / `reset()` actions.
 *
 * **Mock-only tech-debt.** This entire module exists because the real backend
 * (Cognito + AWS API + DB) is not yet stood up. When the backend ships, delete
 * this file, remove its mount from `App.tsx`, and wire up the JWT
 * `custom:profile_complete` claim decode in `AuthProvider.tsx`.
 *
 * TODO(mock-only): remove when real backend + JWT claim decode ship
 *
 * **Mount point:** MUST be a descendant of `AuthProvider` so that the provider
 * can call `useAuth()` for the runtime sanity warning. Required tree in
 * `App.tsx`:
 *   `<AuthProvider><OnboardingCompletionProvider><RootNavigator/></OnboardingCompletionProvider></AuthProvider>`
 * Sibling placement will throw because `useAuth()` requires an `AuthProvider` ancestor.
 *
 * @module state/onboardingCompletion/OnboardingCompletionProvider
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '@/state/auth/AuthProvider';
import { SecureStorageKey } from '@/services/auth/secureStorage';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * The value exposed by `useOnboardingCompletion()`.
 *
 * TODO(mock-only): remove when real backend + JWT claim decode ship
 */
export interface OnboardingCompletionContextValue {
  /**
   * `true` while the initial secure-store read is in flight.
   *
   * Starts `true`; flips to `false` once the read resolves (success or error).
   * Prevents the first-mount race where a returning completed user briefly sees
   * `OnboardingStack` before the persisted flag has been read.
   */
  readonly loading: boolean;

  /**
   * `true` when `dummy.onboarding.complete === "true"` in secure-store.
   *
   * In `RootNavigator`, read as `mockOnboardingComplete` (matching the
   * `env.isMockAuth` naming convention) to make the mock-only bypass explicit.
   *
   * TODO(mock-only): remove when real backend + JWT claim decode ship
   */
  readonly complete: boolean;

  /**
   * Writes `dummy.onboarding.complete = "true"` to secure-store AND flips the
   * in-memory `complete` state to `true` atomically.
   *
   * **Both writes happen inside this method.** Do NOT split "write secure-store"
   * and "flip in-memory" across the caller and the provider — that risks an
   * inconsistent state where the in-memory flag is `true` but the persistent
   * key is missing (or vice versa).
   *
   * @throws If the secure-store write fails (rare but possible on low-storage devices).
   *
   * TODO(mock-only): remove when real backend + JWT claim decode ship
   */
  readonly markComplete: () => Promise<void>;

  /**
   * Clears `dummy.onboarding.complete` from secure-store and resets the
   * in-memory `complete` state to `false`.
   *
   * Used for testing and teardown purposes.
   *
   * TODO(mock-only): remove when real backend + JWT claim decode ship
   */
  readonly reset: () => Promise<void>;
}

const OnboardingCompletionContext = createContext<OnboardingCompletionContextValue | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

interface OnboardingCompletionProviderProps {
  /** React subtree that can call `useOnboardingCompletion()`. */
  readonly children?: React.ReactNode;
}

/**
 * Provider for the mock-only onboarding completion flag.
 *
 * MUST be mounted inside `AuthProvider`. Reads `dummy.onboarding.complete`
 * from expo-secure-store on mount and exposes the result via context.
 *
 * TODO(mock-only): remove when real backend + JWT claim decode ship
 *
 * @param props - {@link OnboardingCompletionProviderProps}
 */
// TODO(mock-only): remove when real backend + JWT claim decode ship
export function OnboardingCompletionProvider({
  children,
}: OnboardingCompletionProviderProps): React.JSX.Element {
  const { status } = useAuth();

  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);

  // Read the persisted flag on mount.
  useEffect(() => {
    let cancelled = false;

    const loadFlag = async (): Promise<void> => {
      try {
        const raw = await SecureStore.getItemAsync(SecureStorageKey.dummyOnboardingComplete);
        if (!cancelled) {
          setComplete(raw === 'true');
        }
      } catch (err) {
        // Resilience: secure-store read failure must not crash the app.
        // Default to `complete: false` so the user can re-complete onboarding.
        console.error('[mock-only] Failed to read dummy.onboarding.complete from secure-store:', err);
        if (!cancelled) {
          setComplete(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadFlag();

    return () => {
      cancelled = true;
    };
  }, []);

  // Runtime sanity warning: if the completion flag is set but there is no
  // active auth session, this is likely stale data from a previous mock-mode
  // teardown or a signed-out session. Only warn when status === 'unauthenticated'
  // (real mismatch), NOT 'loading' (transient state on cold launch).
  // TODO(mock-only): remove when real backend + JWT claim decode ship
  useEffect(() => {
    if (complete && status === 'unauthenticated') {
      console.warn(
        '[mock-only] onboarding completion flag is set but auth session is missing — ' +
          'likely stale mock-mode teardown; see context.md → Before shipping',
      );
    }
  }, [complete, status]);

  const markComplete = useCallback(async (): Promise<void> => {
    // Write to secure-store first, then flip in-memory. Both happen here so
    // the caller cannot end up with an inconsistent state.
    // TODO(mock-only): remove when real backend + JWT claim decode ship
    await SecureStore.setItemAsync(SecureStorageKey.dummyOnboardingComplete, 'true');
    setComplete(true);
  }, []);

  const reset = useCallback(async (): Promise<void> => {
    // TODO(mock-only): remove when real backend + JWT claim decode ship
    await SecureStore.deleteItemAsync(SecureStorageKey.dummyOnboardingComplete);
    setComplete(false);
  }, []);

  const value: OnboardingCompletionContextValue = {
    loading,
    complete,
    markComplete,
    reset,
  };

  return (
    <OnboardingCompletionContext.Provider value={value}>
      {children}
    </OnboardingCompletionContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the mock-only onboarding completion state and actions.
 *
 * Must be called within an {@link OnboardingCompletionProvider}, which in turn
 * must be inside an `AuthProvider`.
 *
 * @returns The current {@link OnboardingCompletionContextValue}.
 * @throws {Error} When called outside `OnboardingCompletionProvider`.
 *
 * TODO(mock-only): remove when real backend + JWT claim decode ship
 */
// TODO(mock-only): remove when real backend + JWT claim decode ship
export function useOnboardingCompletion(): OnboardingCompletionContextValue {
  const ctx = useContext(OnboardingCompletionContext);
  if (ctx === undefined) {
    throw new Error(
      'useOnboardingCompletion must be used within OnboardingCompletionProvider',
    );
  }
  return ctx;
}
