/**
 * Maps aws-amplify Auth errors to label keys for display in the UI.
 *
 * The Cognito Auth surface throws errors with a `.name` property that
 * identifies the error type. This module centralises the mapping so every
 * screen that calls Cognito can show consistent, localised error messages
 * without duplicating the `switch` logic.
 *
 * **Convention:** mock `@/services/auth/cognitoClient` in tests, not
 * `aws-amplify/auth` directly (established in story 2.5).
 *
 * @module Helper/errorHelper
 */

import type { LabelKey } from '@/labels';

/**
 * Maps a thrown aws-amplify Auth error (or any unknown value) to a
 * `LabelKey` for display in the UI.
 *
 * **Mapping table:**
 *
 * | Amplify error name          | LabelKey                                          |
 * |-----------------------------|---------------------------------------------------|
 * | `UsernameExistsException`   | `onboarding.email.errors.usernameExists`          |
 * | `InvalidPasswordException`  | `onboarding.email.errors.invalidPassword`         |
 * | `CodeMismatchException`     | `onboarding.email.errors.generic`*                |
 * | `ExpiredCodeException`      | `onboarding.email.errors.generic`*                |
 * | `LimitExceededException`    | `onboarding.email.errors.generic`*                |
 * | `NotAuthorizedException`    | `onboarding.email.errors.generic`*                |
 * | Network / fetch errors      | `onboarding.email.errors.network`                 |
 * | All other / unknown         | `onboarding.email.errors.generic`                 |
 *
 * *`CodeMismatchException`, `ExpiredCodeException`, `LimitExceededException`,
 * and `NotAuthorizedException` are mapped to their specific keys when used
 * in the confirm-code screen (story 2.6). This function maps them to the
 * generic email-screen key because they are not expected on the email/signUp
 * screen. Story 2.6 will add its own mapping layer for those.
 *
 * **Network error detection:** Amplify wraps fetch failures in errors whose
 * `message` contains "Network" or whose `name` is `NetworkError`. Both
 * patterns are handled.
 *
 * @param err - The caught value. May be an `Error`, an Amplify `AuthError`,
 *   or any other value (string, null, etc.).
 * @returns A `LabelKey` suitable for passing to `t()`.
 *
 * @example
 * ```ts
 * try {
 *   await cognitoClient.signUp({ username: email, password, email });
 * } catch (err) {
 *   const key = cognitoErrorToLabelKey(err);
 *   setError(t(key));
 * }
 * ```
 */
export function cognitoErrorToLabelKey(err: unknown): LabelKey {
  if (err !== null && typeof err === 'object') {
    const e = err as { name?: unknown; message?: unknown };
    const name = typeof e.name === 'string' ? e.name : '';
    const message = typeof e.message === 'string' ? e.message : '';

    switch (name) {
      case 'UsernameExistsException':
        return 'onboarding.email.errors.usernameExists';

      case 'InvalidPasswordException':
        return 'onboarding.email.errors.invalidPassword';

      // CodeMismatchException, ExpiredCodeException, LimitExceededException,
      // NotAuthorizedException are expected primarily on the confirm-code screen
      // (story 2.6). On the email screen they are unexpected; fall through to
      // the generic key so the user always sees an actionable message.
      case 'CodeMismatchException':
      case 'ExpiredCodeException':
      case 'LimitExceededException':
      case 'NotAuthorizedException':
        return 'onboarding.email.errors.generic';

      case 'NetworkError':
        return 'onboarding.email.errors.network';

      default:
        break;
    }

    // Amplify wraps fetch/network failures in errors whose message contains
    // "Network" even when `name` is not `NetworkError`.
    if (message.toLowerCase().includes('network')) {
      return 'onboarding.email.errors.network';
    }
  }

  return 'onboarding.email.errors.generic';
}
