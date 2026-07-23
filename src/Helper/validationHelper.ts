/**
 * Pure validation helpers used across the onboarding wizard.
 *
 * All functions are stateless and side-effect-free — safe to call in render
 * paths, button-disabled guards, and unit tests without any setup.
 *
 * @module Helper/validationHelper
 */

// ── Email ──────────────────────────────────────────────────────────────────────

/**
 * Returns `true` when `input` has the shape of a valid email address.
 *
 * **Trade-off:** Full RFC 5322 is context-free-grammar-level complex and
 * cannot be correctly expressed in a single regular expression. This
 * implementation uses a pragmatic regex that accepts the overwhelming majority
 * of real-world email addresses while rejecting clearly malformed ones. It
 * will accept some technically-invalid strings (e.g. `a@b.c` with a
 * single-character TLD) and reject a tiny minority of valid-but-exotic
 * addresses (e.g. quoted local parts with spaces). For account-creation flows
 * this is acceptable because Cognito performs the authoritative check via
 * its `email` attribute validation and the confirmation-code step further
 * guarantees deliverability.
 *
 * @param input - The string to test.
 * @returns `true` if `input` resembles a valid email address.
 *
 * @example
 * ```ts
 * isValidEmail('user@example.com')   // true
 * isValidEmail('bad@')               // false
 * isValidEmail('')                   // false
 * ```
 */
export function isValidEmail(input: string): boolean {
  // Local part: one or more allowed chars before @
  // Domain: one or more labels separated by dots
  // TLD: at least two chars after the last dot
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return EMAIL_RE.test(input.trim());
}

// ── Six-digit code ─────────────────────────────────────────────────────────────

/**
 * Returns `true` when `input` is exactly six ASCII digit characters with no
 * whitespace.
 *
 * Used by the confirmation-code screen (story 2.6) to gate the Continue
 * button before the user submits their Cognito verification code.
 *
 * @param input - The string to test.
 * @returns `true` if `input` is exactly `"000000"` – `"999999"` format.
 *
 * @example
 * ```ts
 * isSixDigitCode('123456')   // true
 * isSixDigitCode('12345')    // false — too short
 * isSixDigitCode('1234567')  // false — too long
 * isSixDigitCode('12345a')   // false — contains non-digit
 * isSixDigitCode('123 56')   // false — contains space
 * ```
 */
export function isSixDigitCode(input: string): boolean {
  return /^\d{6}$/.test(input);
}

// ── Password policy ────────────────────────────────────────────────────────────

/** Requirements that may be missing from a candidate password. */
export type PasswordRequirement = 'length' | 'upper' | 'lower' | 'digit' | 'symbol';

/**
 * Result returned by {@link passwordMeetsCognitoPolicy}.
 */
export interface PasswordPolicyResult {
  /** `true` when all Cognito requirements are satisfied. */
  ok: boolean;
  /**
   * Ordered list of unmet requirements. Empty when `ok` is `true`.
   * Consumers should map each member to a label key for precise error display.
   */
  missing: readonly PasswordRequirement[];
}

/**
 * Checks whether `input` satisfies Knotify's Cognito password policy.
 *
 * Policy source: `knotify-backend/infrastructure/modules/cognito/main.tf`
 * - Minimum length: 12 characters
 * - At least one uppercase letter (A–Z)
 * - At least one lowercase letter (a–z)
 * - At least one digit (0–9)
 * - At least one symbol (any character that is not a letter or digit)
 *
 * Returns the full set of unmet requirements so the UI can render individual
 * error hints per requirement rather than a single generic message.
 *
 * @param input - The candidate password to check.
 * @returns `{ ok, missing }` where `missing` is empty when `ok` is `true`.
 *
 * @example
 * ```ts
 * passwordMeetsCognitoPolicy('SecurePass1!')
 * // { ok: false, missing: ['length'] } — 12 chars minimum not met
 *
 * passwordMeetsCognitoPolicy('SecurePassword1!')
 * // { ok: true, missing: [] }
 *
 * passwordMeetsCognitoPolicy('password')
 * // { ok: false, missing: ['length', 'upper', 'digit', 'symbol'] }
 * ```
 */
export function passwordMeetsCognitoPolicy(input: string): PasswordPolicyResult {
  const missing: PasswordRequirement[] = [];

  if (input.length < 12) {
    missing.push('length');
  }
  if (!/[A-Z]/.test(input)) {
    missing.push('upper');
  }
  if (!/[a-z]/.test(input)) {
    missing.push('lower');
  }
  if (!/[0-9]/.test(input)) {
    missing.push('digit');
  }
  // Symbol: any character that is not a letter or digit
  if (!/[^A-Za-z0-9]/.test(input)) {
    missing.push('symbol');
  }

  return { ok: missing.length === 0, missing };
}

// ── Name ───────────────────────────────────────────────────────────────────────

/**
 * Returns `true` when `s` is a valid person-name string.
 *
 * Rules:
 * - Allowed characters: `[A-Za-z]`, space (` `), hyphen (`-`), apostrophe (`'`).
 * - No leading or trailing whitespace.
 * - Length: 1–35 characters (inclusive).
 *
 * The check is intentionally ASCII-only. Diacritics and non-Latin scripts are
 * handled separately by `usernameHelper.sanitizeNamePart` — validation here is
 * for the raw user input stored as `first_name`/`last_name` on the profile.
 *
 * @param s - The string to validate.
 * @returns `true` if `s` is a valid name.
 *
 * @example
 * ```ts
 * isValidName('Marie')        // true
 * isValidName("O'Brien")      // true
 * isValidName('Marie-Claire') // true
 * isValidName(' Marie')       // false — leading space
 * isValidName('Marie1')       // false — digit not allowed
 * isValidName('')             // false — empty
 * ```
 */
export function isValidName(s: string): boolean {
  if (s.length === 0 || s.length > 35) return false;
  // Reject leading or trailing whitespace
  if (s !== s.trim()) return false;
  // Only letters, spaces, hyphens, and apostrophes are allowed
  return /^[A-Za-z' -]+$/.test(s);
}
