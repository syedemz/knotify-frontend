/**
 * Typed secure storage wrapper for auth tokens and onboarding draft.
 *
 * All reads and writes go through this module — nothing else in the codebase
 * calls `expo-secure-store` directly. Keys are enforced by the
 * {@link SecureStorageKey} enum so callers cannot introduce untyped strings.
 *
 * @module services/auth/secureStorage
 */

import * as SecureStore from 'expo-secure-store';

/**
 * All keys stored in `expo-secure-store`.
 *
 * Keeping keys in a single enum prevents typos and ensures every
 * key is documented in one place.
 */
export enum SecureStorageKey {
  /** Cognito access token (short-lived, ~1 h). */
  accessToken = 'auth.accessToken',
  /** Cognito refresh token (long-lived, ~30 days). */
  refreshToken = 'auth.refreshToken',
  /** Cognito ID token (contains user claims). */
  idToken = 'auth.idToken',
  /**
   * JSON-serialized onboarding wizard draft, persisted across sessions so
   * the user can resume after app restart.
   */
  onboardingDraft = 'onboarding.draft',
  /**
   * Bootstrap password captured on page 2 (email + password screen) so that
   * page 3 (confirm-code screen) can auto-signIn immediately after
   * `confirmSignUp` succeeds — without asking the user to re-enter their
   * password.
   *
   * **Lifecycle:** written on page 2 (story 2.5) BEFORE `cognitoClient.signUp`
   * is called; deleted on page 3 (story 2.6) immediately after
   * `cognitoClient.signIn` succeeds. If the user drops off between pages 2
   * and 3 the key persists — a future story will scrub it on app-launch resume
   * when `lastCheckpoint === null` and `currentPage <= 3`.
   */
  OnboardingBootstrapPassword = 'onboarding.bootstrapPassword',
  // TODO(mock-only): remove when real backend + JWT claim decode ship
  /**
   * Mock-only flag. Set to `"true"` by `OnboardingCompletionProvider.markComplete()`
   * after the final mock PATCH succeeds. Read on mount to determine whether the
   * onboarding flow is complete without a real JWT claim.
   */
  dummyOnboardingComplete = 'dummy.onboarding.complete',
  // TODO(mock-only): remove when real backend + JWT claim decode ship
  /**
   * Mock-only snapshot. JSON-stringified PATCH body written immediately before
   * `dummyOnboardingComplete` is set so phase-12 "My Profile" can render
   * real user-entered data rather than a hardcoded fixture.
   */
  dummyProfile = 'dummy.profile',
}

/**
 * Retrieves a value from secure storage.
 *
 * @param key - A member of {@link SecureStorageKey}.
 * @returns The stored string, or `null` if no value exists for this key.
 */
async function get(key: SecureStorageKey): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

/**
 * Stores a value in secure storage.
 *
 * @param key - A member of {@link SecureStorageKey}.
 * @param value - The string to store.
 */
async function set(key: SecureStorageKey, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

/**
 * Deletes a value from secure storage.
 *
 * Silently succeeds if the key does not exist.
 *
 * @param key - A member of {@link SecureStorageKey}.
 */
async function del(key: SecureStorageKey): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

/**
 * Removes all auth tokens from secure storage (access, refresh, and ID).
 *
 * Used by `cognitoClient.signOut()` and `AuthProvider` sign-out flows.
 */
async function clearAuthTokens(): Promise<void> {
  await Promise.all([
    del(SecureStorageKey.accessToken),
    del(SecureStorageKey.refreshToken),
    del(SecureStorageKey.idToken),
  ]);
}

// ── Convenience typed accessors ─────────────────────────────────────────────

/**
 * Reads the stored Cognito access token.
 *
 * @returns The access token string, or `null` if not stored.
 */
async function getAccessToken(): Promise<string | null> {
  return get(SecureStorageKey.accessToken);
}

/**
 * Persists the Cognito access token.
 *
 * @param token - Raw access token string.
 */
async function setAccessToken(token: string): Promise<void> {
  return set(SecureStorageKey.accessToken, token);
}

/**
 * Reads the stored Cognito refresh token.
 *
 * @returns The refresh token string, or `null` if not stored.
 */
async function getRefreshToken(): Promise<string | null> {
  return get(SecureStorageKey.refreshToken);
}

/**
 * Persists the Cognito refresh token.
 *
 * @param token - Raw refresh token string.
 */
async function setRefreshToken(token: string): Promise<void> {
  return set(SecureStorageKey.refreshToken, token);
}

/**
 * Reads the stored Cognito ID token.
 *
 * @returns The ID token string, or `null` if not stored.
 */
async function getIdToken(): Promise<string | null> {
  return get(SecureStorageKey.idToken);
}

/**
 * Persists the Cognito ID token.
 *
 * @param token - Raw ID token string.
 */
async function setIdToken(token: string): Promise<void> {
  return set(SecureStorageKey.idToken, token);
}

/**
 * Reads the JSON-serialized onboarding draft.
 *
 * @returns The raw JSON string, or `null` if no draft exists.
 */
async function getOnboardingDraft(): Promise<string | null> {
  return get(SecureStorageKey.onboardingDraft);
}

/**
 * Persists the JSON-serialized onboarding draft.
 *
 * @param draft - Serialized draft JSON string.
 */
async function setOnboardingDraft(draft: string): Promise<void> {
  return set(SecureStorageKey.onboardingDraft, draft);
}

/**
 * Deletes the onboarding draft.
 */
async function clearOnboardingDraft(): Promise<void> {
  return del(SecureStorageKey.onboardingDraft);
}

/**
 * Singleton secure-storage facade.
 *
 * Import `secureStorage` (not the individual functions) everywhere — this
 * makes the dependency injectable in tests.
 */
export const secureStorage = {
  get,
  set,
  del,
  clearAuthTokens,
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getIdToken,
  setIdToken,
  getOnboardingDraft,
  setOnboardingDraft,
  clearOnboardingDraft,
} as const;
