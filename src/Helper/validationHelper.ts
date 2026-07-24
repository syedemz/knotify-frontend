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

// ── Work details — job title ───────────────────────────────────────────────────

/**
 * Maximum character length for the `job_title` field.
 *
 * db-schema.json columns are TEXT (unbounded); the frontend enforces this
 * limit per architecture §11.3 and story 4.3 AC.
 */
export const JOB_TITLE_MAX_LENGTH = 40;

/**
 * Returns `true` when `s` is a valid job title string.
 *
 * Rules:
 * - Allowed characters: `[A-Za-z]`, digits `[0-9]`, space, hyphen (`-`),
 *   period (`.`), comma (`,`), ampersand (`&`), apostrophe (`'`).
 * - No leading or trailing whitespace.
 * - Length: 1–{@link JOB_TITLE_MAX_LENGTH} characters (inclusive).
 *
 * Examples of valid values: `Software Engineer`, `AT&T Manager`,
 * `O'Reilly Author`, `Sr. VP, Sales`.
 *
 * @param s - The string to validate.
 * @returns `true` if `s` is a valid job title.
 *
 * @example
 * ```ts
 * isValidJobTitle('Software Engineer')   // true
 * isValidJobTitle("O'Reilly Author")     // true
 * isValidJobTitle('AT&T Manager')        // true
 * isValidJobTitle(' Engineer')           // false — leading space
 * isValidJobTitle('Engineer!')           // false — invalid char
 * isValidJobTitle('')                    // false — empty
 * ```
 */
export function isValidJobTitle(s: string): boolean {
  if (s.length === 0 || s.length > JOB_TITLE_MAX_LENGTH) return false;
  if (s !== s.trim()) return false;
  return /^[A-Za-z0-9 \-.,&']+$/.test(s);
}

// ── Work details — employer name ───────────────────────────────────────────────

/**
 * Maximum character length for the `employer_name` field.
 *
 * db-schema.json columns are TEXT (unbounded); the frontend enforces this
 * limit per architecture §11.3 and story 4.3 AC.
 */
export const EMPLOYER_NAME_MAX_LENGTH = 50;

/**
 * Returns `true` when `s` is a valid employer name string.
 *
 * Rules:
 * - Allowed characters: `[A-Za-z]`, digits `[0-9]`, space, hyphen (`-`),
 *   period (`.`), comma (`,`), ampersand (`&`), apostrophe (`'`).
 * - No leading or trailing whitespace.
 * - Length: 1–{@link EMPLOYER_NAME_MAX_LENGTH} characters (inclusive).
 *
 * Examples of valid values: `P&G`, `AT&T`, `Macy's`, `O'Reilly Media`.
 *
 * @param s - The string to validate.
 * @returns `true` if `s` is a valid employer name.
 *
 * @example
 * ```ts
 * isValidEmployerName("P&G")            // true
 * isValidEmployerName("Macy's")         // true
 * isValidEmployerName('AT&T')           // true
 * isValidEmployerName(' Acme')          // false — leading space
 * isValidEmployerName('Acme!')          // false — invalid char
 * isValidEmployerName('')               // false — empty
 * ```
 */
export function isValidEmployerName(s: string): boolean {
  if (s.length === 0 || s.length > EMPLOYER_NAME_MAX_LENGTH) return false;
  if (s !== s.trim()) return false;
  return /^[A-Za-z0-9 \-.,&']+$/.test(s);
}

// ── Work details — office address ─────────────────────────────────────────────

/**
 * Maximum character length for the `office_address` field.
 *
 * db-schema.json columns are TEXT (unbounded); the frontend enforces this
 * limit per architecture §11.3 and story 4.3 AC.
 */
export const OFFICE_ADDRESS_MAX_LENGTH = 150;

/**
 * Returns `true` when `s` is a valid office address string.
 *
 * Rules:
 * - Any printable character is allowed (no character-set restriction).
 * - Length: 1–{@link OFFICE_ADDRESS_MAX_LENGTH} characters (inclusive).
 *
 * The office address field intentionally permits a wide character set to
 * accommodate international address formats, building names, and postal codes.
 *
 * @param s - The string to validate.
 * @returns `true` if `s` is a valid office address.
 *
 * @example
 * ```ts
 * isValidOfficeAddress('123 Baker St, London NW1 6XE')  // true
 * isValidOfficeAddress('')                               // false — empty
 * ```
 */
export function isValidOfficeAddress(s: string): boolean {
  if (s.length === 0 || s.length > OFFICE_ADDRESS_MAX_LENGTH) return false;
  return true;
}
