/**
 * Cognito authentication client — thin wrapper over `aws-amplify` Auth.
 *
 * No code outside this module imports `aws-amplify` directly. All Cognito
 * interactions (sign-up, sign-in, sign-out, token refresh) go through
 * `cognitoClient`.
 *
 * Amplify is configured lazily on the first call via `ensureConfigured()` so
 * that `env` is fully resolved before any network call is made.
 *
 * @module services/auth/cognitoClient
 */

import { Amplify } from 'aws-amplify';
import {
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  signIn as amplifySignIn,
  signOut as amplifySignOut,
  fetchAuthSession,
  type SignUpOutput,
  type ConfirmSignUpOutput,
  type SignInOutput,
} from 'aws-amplify/auth';

import { env } from '@/config/env';
import { secureStorage } from './secureStorage';

// ── Amplify configuration ─────────────────────────────────────────────────

let _amplifyConfigured = false;

/**
 * Configures Amplify with Cognito credentials from `env` if not already done.
 *
 * Called at the top of every public method to ensure the singleton is
 * configured before use. Idempotent. Skipped in mock mode.
 */
function ensureConfigured(): void {
  if (env.isMockAuth) return;
  if (_amplifyConfigured) return;
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: env.cognitoUserPoolId,
        userPoolClientId: env.cognitoAppClientId,
      },
    },
  });
  _amplifyConfigured = true;
}

// ── Public API types ──────────────────────────────────────────────────────

/**
 * Credentials returned after a successful sign-in or token refresh.
 *
 * Note: the Cognito refresh token is managed internally by `aws-amplify`
 * and is not exposed in the `AuthSession.tokens` shape. It is stored
 * separately by `secureStorage` after sign-in via Amplify's internal cookie /
 * storage mechanism. `refreshToken` is therefore optional here.
 */
export interface SessionTokens {
  /** Short-lived access token (~1 hour). */
  accessToken: string;
  /**
   * Long-lived refresh token (~30 days).
   * May be absent in refresh-only calls where Amplify manages it internally.
   */
  refreshToken?: string;
  /** ID token containing user claims. */
  idToken: string;
}

/**
 * Input for the `signUp` call.
 */
export interface SignUpInput {
  /** Cognito username (typically the user's email address). */
  username: string;
  /** Plain-text password; Cognito SRP never exposes it to the backend. */
  password: string;
  /** Email address used for verification. */
  email: string;
}

/**
 * Input for the `confirmSignUp` call.
 */
export interface ConfirmSignUpInput {
  /** Cognito username used at sign-up. */
  username: string;
  /** 6-digit confirmation code delivered to the user's email. */
  code: string;
}

/**
 * Input for the `signIn` call.
 */
export interface SignInInput {
  /** Cognito username (email address). */
  username: string;
  /** Plain-text password. */
  password: string;
}

// ── Implementation ────────────────────────────────────────────────────────

/**
 * Registers a new user in the Cognito User Pool.
 *
 * After a successful call the user must confirm their account via a
 * verification code before they can sign in (see {@link confirmSignUp}).
 *
 * @param input - Sign-up credentials and email.
 * @returns The raw Amplify `SignUpOutput` (includes `userId` and
 *   `nextStep` metadata).
 * @throws {AuthError} Propagated from Amplify on validation failure,
 *   duplicate username, or policy violation.
 */
async function signUp(input: SignUpInput): Promise<SignUpOutput> {
  if (env.isMockAuth) {
    return {
      isSignUpComplete: false,
      userId: `mock-${input.username}`,
      nextStep: {
        signUpStep: 'CONFIRM_SIGN_UP',
        codeDeliveryDetails: {
          destination: input.email,
          deliveryMedium: 'EMAIL',
          attributeName: 'email',
        },
      },
    } as unknown as SignUpOutput;
  }
  ensureConfigured();
  return amplifySignUp({
    username: input.username,
    password: input.password,
    options: {
      userAttributes: {
        email: input.email,
      },
    },
  });
}

/**
 * Confirms a user's account using the verification code sent to their email.
 *
 * @param input - Username and confirmation code.
 * @returns The raw Amplify `ConfirmSignUpOutput` (includes `isSignUpComplete`
 *   and `nextStep` metadata).
 * @throws {AuthError} Propagated from Amplify on invalid or expired code.
 */
async function confirmSignUp(input: ConfirmSignUpInput): Promise<ConfirmSignUpOutput> {
  if (env.isMockAuth) {
    // Accept any 6-digit code in mock mode. The label helper already caught
    // non-6-digit inputs upstream.
    return {
      isSignUpComplete: true,
      nextStep: { signUpStep: 'DONE' },
    } as unknown as ConfirmSignUpOutput;
  }
  ensureConfigured();
  return amplifyConfirmSignUp({
    username: input.username,
    confirmationCode: input.code,
  });
}

/**
 * Signs a user in via Cognito SRP (Secure Remote Password).
 *
 * On success, stores the returned tokens in secure storage.
 *
 * @param input - Username and password.
 * @returns The raw Amplify `SignInOutput`.
 * @throws {AuthError} Propagated from Amplify on wrong credentials, unconfirmed
 *   account, or locked-out state.
 */
async function signIn(input: SignInInput): Promise<SignInOutput> {
  if (env.isMockAuth) {
    const mockTokens = makeMockTokens(input.username);
    await secureStorage.setAccessToken(mockTokens.accessToken);
    await secureStorage.setRefreshToken(mockTokens.refreshToken!);
    await secureStorage.setIdToken(mockTokens.idToken);
    return {
      isSignedIn: true,
      nextStep: { signInStep: 'DONE' },
    } as unknown as SignInOutput;
  }
  ensureConfigured();
  const output = await amplifySignIn({
    username: input.username,
    password: input.password,
  });

  // Persist tokens immediately so httpClient can inject them on the next call.
  if (output.isSignedIn) {
    const tokens = await extractTokens();
    if (tokens !== null) {
      await secureStorage.setAccessToken(tokens.accessToken);
      // refreshToken is optional in SessionTokens because Amplify manages it
      // internally. When present after sign-in, we persist it explicitly.
      if (tokens.refreshToken !== undefined) {
        await secureStorage.setRefreshToken(tokens.refreshToken);
      }
      await secureStorage.setIdToken(tokens.idToken);
    }
  }

  return output;
}

/**
 * Signs the currently authenticated user out and removes all stored tokens.
 *
 * @throws {AuthError} Propagated from Amplify on unexpected failure.
 */
async function signOut(): Promise<void> {
  if (env.isMockAuth) {
    await secureStorage.clearAuthTokens();
    return;
  }
  ensureConfigured();
  await amplifySignOut();
  await secureStorage.clearAuthTokens();
}

/**
 * Refreshes the current Cognito session using the stored refresh token.
 *
 * Used by `httpClient` on 401 responses (silent-refresh semantics per §8.2).
 * Returns `null` if no session exists (user is not signed in).
 *
 * @returns Fresh {@link SessionTokens}, or `null` when there is no active
 *   session to refresh.
 * @throws {AuthError} Propagated from Amplify on a non-recoverable refresh
 *   failure (e.g., refresh token expired or revoked). The caller
 *   (`httpClient`) should treat this as a terminal 401 and sign the user out.
 */
async function refreshSession(): Promise<SessionTokens | null> {
  if (env.isMockAuth) {
    const existing = await secureStorage.getAccessToken();
    if (existing === null) return null;
    return makeMockTokens('mock-user');
  }
  ensureConfigured();
  // `forceRefresh: true` instructs Amplify to bypass its in-memory cache and
  // issue a new token request to Cognito.
  const session = await fetchAuthSession({ forceRefresh: true });
  return tokensFromSession(session);
}

// ── Mock helpers ──────────────────────────────────────────────────────────

function makeMockTokens(username: string): Required<SessionTokens> {
  // Token-shaped strings for the UI walkthrough. Not real JWTs — downstream
  // code that treats them as opaque strings still works; anything that decodes
  // them will find valid JSON in the middle segment via atob().
  const now = Math.floor(Date.now() / 1000);
  const payload = globalThis
    .btoa(JSON.stringify({ sub: username, iat: now, exp: now + 3600 }));
  return {
    accessToken: `mock.${payload}.sig`,
    refreshToken: `mock-refresh-${username}`,
    idToken: `mock.${payload}.sig`,
  };
}

// ── Private helpers ───────────────────────────────────────────────────────

/**
 * Extracts `SessionTokens` from the current Amplify auth session.
 *
 * @returns Tokens if a session with all three token types exists, else `null`.
 */
async function extractTokens(): Promise<SessionTokens | null> {
  const session = await fetchAuthSession();
  return tokensFromSession(session);
}

/**
 * Maps an Amplify `AuthSession` to our typed {@link SessionTokens}.
 *
 * @param session - Raw Amplify session object.
 * @returns Typed tokens, or `null` when any token is absent.
 */
function tokensFromSession(
  session: Awaited<ReturnType<typeof fetchAuthSession>>,
): SessionTokens | null {
  const accessToken = session.tokens?.accessToken?.toString();
  const idToken = session.tokens?.idToken?.toString();

  if (!accessToken || !idToken) {
    return null;
  }

  return {
    accessToken,
    // The Cognito refresh token is not exposed in AuthSession.tokens — it is
    // managed internally by aws-amplify. We omit it here; callers that need
    // to persist the refresh token separately should do so at sign-in time via
    // the Amplify internal storage, or use the `secureStorage` typed helpers
    // with the value obtained post-signIn from Amplify's cache.
    idToken,
  };
}

/**
 * Singleton Cognito client.
 *
 * Import `cognitoClient` (not individual functions) everywhere — this makes
 * the dependency injectable in unit tests.
 */
export const cognitoClient = {
  signUp,
  confirmSignUp,
  signIn,
  signOut,
  refreshSession,
} as const;
