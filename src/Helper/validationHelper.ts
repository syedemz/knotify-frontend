/**
 * Pure validation helpers used across the onboarding wizard.
 *
 * All functions are stateless and side-effect-free — safe to call in render
 * paths, button-disabled guards, and unit tests without any setup.
 *
 * @module Helper/validationHelper
 */

import { parsePhoneNumberFromString } from 'libphonenumber-js';

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

// ── Education credentials — text fields ───────────────────────────────────────

/**
 * Maximum character length for education text credential fields
 * (`high_school`, `higher_secondary`, `college_name`, `highest_degree`).
 *
 * db-schema.json declares these columns as TEXT (unbounded); the frontend
 * enforces this 40-char limit as a UI choice per story 5.2 AC.
 */
export const EDUCATION_TEXT_MAX_LENGTH = 40;

/**
 * Returns `true` when `s` is a valid education credential text value.
 *
 * Rules:
 * - Allowed characters: `[A-Za-z0-9]`, space, hyphen (`-`), period (`.`),
 *   comma (`,`), ampersand (`&`), apostrophe (`'`).
 * - No leading or trailing whitespace.
 * - Length: 1–{@link EDUCATION_TEXT_MAX_LENGTH} characters (inclusive).
 *
 * Apostrophe is required so names like "St. Mary's High School" pass.
 *
 * @param s - The string to validate.
 * @returns `true` if `s` is a valid education credential text value.
 *
 * @example
 * ```ts
 * isValidEducationText("St. Mary's High School")  // true
 * isValidEducationText("BSc Computer Science")    // true
 * isValidEducationText("LUMS")                    // true
 * isValidEducationText(" LUMS")                   // false — leading space
 * isValidEducationText("LUMS!")                   // false — invalid char
 * isValidEducationText("")                         // false — empty
 * ```
 */
export function isValidEducationText(s: string): boolean {
  if (s.length === 0 || s.length > EDUCATION_TEXT_MAX_LENGTH) return false;
  if (s !== s.trim()) return false;
  return /^[A-Za-z0-9 \-.,&']+$/.test(s);
}

// ── Residence city ────────────────────────────────────────────────────────────

/**
 * Maximum character length for the `current_residence_city` field.
 *
 * City names can exceed 35 characters (e.g. "Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch"),
 * so this limit is intentionally larger than `MAX_NAME_LENGTH` (35). The
 * frontend enforces this as a UI choice — the db column is TEXT (unbounded).
 */
export const MAX_CITY_NAME_LENGTH = 40;

/**
 * Returns `true` when `s` is a valid city name string.
 *
 * Rules:
 * - Allowed characters: `[A-Za-z]`, space (` `), hyphen (`-`), apostrophe (`'`).
 * - No leading or trailing whitespace.
 * - Length: 1–{@link MAX_CITY_NAME_LENGTH} characters (inclusive).
 *
 * The character class intentionally mirrors `isValidName`'s allowed set.
 * The only difference is the maximum length: 40 for cities vs. 35 for names.
 * `isValidName` is NOT reused here because it hard-codes `MAX_NAME_LENGTH = 35`.
 *
 * @param s - The string to validate.
 * @returns `true` if `s` is a valid city name.
 *
 * @example
 * ```ts
 * isValidCity('London')          // true
 * isValidCity('New York')        // true
 * isValidCity('Clermont-Ferrand') // true
 * isValidCity("Saint-Genis-de-Saintonge") // true
 * isValidCity(' London')         // false — leading space
 * isValidCity('London1')         // false — digit not allowed
 * isValidCity('')                // false — empty
 * ```
 */
export function isValidCity(s: string): boolean {
  if (s.length === 0 || s.length > MAX_CITY_NAME_LENGTH) return false;
  // Reject leading or trailing whitespace
  if (s !== s.trim()) return false;
  // Only letters, spaces, hyphens, and apostrophes are allowed
  return /^[A-Za-z' -]+$/.test(s);
}

// ── Family residence address ──────────────────────────────────────────────────

/**
 * Maximum character length for the `family_residence_address` field.
 *
 * No character-class restriction is applied (mirrors `isValidOfficeAddress`);
 * only length is enforced. The db column is TEXT (unbounded); the frontend
 * imposes this 70-char limit per story 6.3 AC.
 */
export const MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH = 70;

/**
 * Returns `true` when `s` is a valid family residence address string.
 *
 * Rules:
 * - Any printable character is allowed (no character-set restriction); this
 *   mirrors `isValidOfficeAddress` which also has no character-class rule.
 * - Length: 1–{@link MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH} characters (inclusive),
 *   measured on the **trimmed** value so leading/trailing whitespace does not
 *   count toward the useful content.
 * - Special characters (`/`, `#`, `,`, `.`, digits, apostrophes) are all accepted.
 *
 * @param s - The string to validate.
 * @returns `true` if `s` is a valid family residence address.
 *
 * @example
 * ```ts
 * isValidFamilyResidenceAddress('House #5, Street 3, Srinagar')  // true
 * isValidFamilyResidenceAddress('')                               // false — empty
 * isValidFamilyResidenceAddress('A'.repeat(71))                  // false — too long
 * isValidFamilyResidenceAddress('A'.repeat(70))                  // true — at limit
 * isValidFamilyResidenceAddress('A')                             // true — minimum
 * ```
 */
export function isValidFamilyResidenceAddress(s: string): boolean {
  const trimmed = s.trim();
  return trimmed.length >= 1 && trimmed.length <= MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH;
}

// ── Parents — name ────────────────────────────────────────────────────────────

/**
 * Maximum character length for parent name fields
 * (`fathers_name`, `mothers_name`).
 *
 * Mirrors `isValidName`'s character class but with a 40-char cap instead of 35.
 * db-schema columns are TEXT (unbounded); the frontend enforces this limit per
 * story 7.1 AC.
 */
export const MAX_PARENT_NAME_LENGTH = 40;

/**
 * Returns `true` when `input` is a valid parent name string.
 *
 * Rules:
 * - Allowed characters: `[A-Za-z]`, space (` `), hyphen (`-`), apostrophe (`'`).
 * - No leading or trailing whitespace.
 * - Length: 1–{@link MAX_PARENT_NAME_LENGTH} characters (inclusive), measured on
 *   the **trimmed** value.
 *
 * Mirrors {@link isValidName}'s character class; the only difference is the
 * maximum length (40 here vs. 35 for first/last names). `isValidName` is NOT
 * reused because it hard-codes a 35-char cap.
 *
 * @param input - The string to validate.
 * @returns `true` if `input` is a valid parent name.
 *
 * @example
 * ```ts
 * isValidParentName('Muhammad Ali')      // true
 * isValidParentName("O'Brien-Smith")     // true
 * isValidParentName(' Ali')              // false — leading space
 * isValidParentName('Ali1')             // false — digit not allowed
 * isValidParentName('')                  // false — empty
 * isValidParentName('A'.repeat(41))      // false — too long
 * ```
 */
export function isValidParentName(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_PARENT_NAME_LENGTH) return false;
  // Reject leading or trailing whitespace on the original input
  if (input !== trimmed) return false;
  // Only letters, spaces, hyphens, and apostrophes are allowed
  return /^[A-Za-z' -]+$/.test(trimmed);
}

// ── Parents — job ─────────────────────────────────────────────────────────────

/**
 * Maximum character length for parent job fields
 * (`fathers_job`, `mothers_job`).
 *
 * db-schema columns are TEXT (unbounded); the frontend enforces this limit per
 * story 7.1 AC.
 */
export const MAX_PARENT_JOB_LENGTH = 40;

/**
 * Returns `true` when `input` is a valid parent job string.
 *
 * Rules:
 * - Allowed characters: `[A-Za-z]`, digits `[0-9]`, space (` `), hyphen (`-`),
 *   apostrophe (`'`), ampersand (`&`), period (`.`).
 * - No leading or trailing whitespace.
 * - Length: 1–{@link MAX_PARENT_JOB_LENGTH} characters (inclusive), measured on
 *   the **trimmed** value.
 *
 * This is a loose character class that accommodates job descriptions such as
 * `"AT&T Manager"`, `"Sr. Engineer"`, and `"O'Reilly Author"`.
 *
 * @param input - The string to validate.
 * @returns `true` if `input` is a valid parent job.
 *
 * @example
 * ```ts
 * isValidParentJob('Retired Farmer')    // true
 * isValidParentJob('AT&T Manager')      // true
 * isValidParentJob("O'Reilly Author")   // true
 * isValidParentJob('Sr. Engineer')      // true
 * isValidParentJob(' Farmer')           // false — leading space
 * isValidParentJob('Farmer!')           // false — invalid char
 * isValidParentJob('')                  // false — empty
 * isValidParentJob('A'.repeat(41))      // false — too long
 * ```
 */
export function isValidParentJob(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_PARENT_JOB_LENGTH) return false;
  // Reject leading or trailing whitespace on the original input
  if (input !== trimmed) return false;
  // Letters, digits, spaces, hyphens, apostrophes, ampersands, and periods
  return /^[A-Za-z0-9 \-'&.]+$/.test(trimmed);
}

// ── Sibling — profession ──────────────────────────────────────────────────────

/**
 * Maximum character length for the sibling `profession` field.
 *
 * db-schema columns are TEXT (unbounded); the frontend enforces this limit per
 * story 7.2 AC.
 */
export const MAX_SIBLING_PROFESSION_LENGTH = 35;

/**
 * Returns `true` when `input` is a valid sibling profession string.
 *
 * Rules:
 * - Allowed characters: `[A-Za-z]`, digits `[0-9]`, space (` `), hyphen (`-`),
 *   apostrophe (`'`), ampersand (`&`), period (`.`).
 * - No leading or trailing whitespace.
 * - Length: 1–{@link MAX_SIBLING_PROFESSION_LENGTH} characters (inclusive),
 *   measured on the **trimmed** value.
 *
 * This is a loose character class that accommodates profession values such as
 * `"AT&T Engineer"`, `"Sr. Manager"`, and `"O'Reilly Author"`.
 *
 * @param input - The string to validate.
 * @returns `true` if `input` is a valid sibling profession.
 *
 * @example
 * ```ts
 * isValidProfession('Teacher')          // true
 * isValidProfession('AT&T Manager')     // true
 * isValidProfession("O'Reilly Author")  // true
 * isValidProfession('Sr. Engineer')     // true
 * isValidProfession(' Teacher')         // false — leading space
 * isValidProfession('Teacher!')         // false — invalid char
 * isValidProfession('')                 // false — empty
 * isValidProfession('A'.repeat(36))     // false — too long
 * ```
 */
export function isValidProfession(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_SIBLING_PROFESSION_LENGTH) return false;
  // Reject leading or trailing whitespace on the original input
  if (input !== trimmed) return false;
  // Letters, digits, spaces, hyphens, apostrophes, ampersands, and periods
  return /^[A-Za-z0-9 \-'&.]+$/.test(trimmed);
}

// ── Phone ─────────────────────────────────────────────────────────────────────

/**
 * Returns `true` when the combination of `dialCode` and `nationalNumber`
 * forms a valid international phone number.
 *
 * Uses `parsePhoneNumberFromString` from `libphonenumber-js` to parse the
 * concatenated string (e.g. `+9198123456789`) and returns the library's
 * `.isValid()` result. Both arguments must be non-empty for a `true` result.
 *
 * @param dialCode      - The E.164 country calling code prefix, e.g. `'+91'`.
 * @param nationalNumber - The national subscriber number without the country
 *                         code, e.g. `'9812345678'`.
 * @returns `true` if the concatenated number is valid per libphonenumber-js.
 *
 * @example
 * ```ts
 * isValidPhone('+91', '9812345678')  // true  — valid Indian mobile
 * isValidPhone('+44', '7911123456')  // true  — valid UK mobile
 * isValidPhone('+92', '3001234567')  // true  — valid Pakistani mobile
 * isValidPhone('+91', '12345')       // false — too short
 * isValidPhone('', '9812345678')     // false — empty dial code
 * isValidPhone('+91', '')            // false — empty number
 * ```
 */
export function isValidPhone(dialCode: string, nationalNumber: string): boolean {
  if (dialCode.trim() === '' || nationalNumber.trim() === '') {
    return false;
  }
  const parsed = parsePhoneNumberFromString(dialCode + nationalNumber);
  return parsed !== undefined && parsed.isValid();
}

/**
 * Returns the E.164 representation of the phone number formed by concatenating
 * `dialCode` and `nationalNumber`, or `null` when the number is invalid.
 *
 * @param dialCode       - The E.164 country calling code prefix, e.g. `'+91'`.
 * @param nationalNumber - The national subscriber number without the country
 *                         code, e.g. `'9812345678'`.
 * @returns The E.164 string (e.g. `'+919812345678'`) when valid, `null` otherwise.
 *
 * @example
 * ```ts
 * canonicalizePhone('+91', '9812345678')  // '+919812345678'
 * canonicalizePhone('+44', '7911123456')  // '+447911123456'
 * canonicalizePhone('+91', '12345')       // null — invalid number
 * canonicalizePhone('', '9812345678')     // null — empty dial code
 * ```
 */
export function canonicalizePhone(dialCode: string, nationalNumber: string): string | null {
  if (dialCode.trim() === '' || nationalNumber.trim() === '') {
    return null;
  }
  const parsed = parsePhoneNumberFromString(dialCode + nationalNumber);
  if (parsed === undefined || !parsed.isValid()) {
    return null;
  }
  return parsed.format('E.164');
}

// ── Education credentials — year fields ───────────────────────────────────────

/**
 * Returns `true` when `year` is a valid education passing/graduation year.
 *
 * Rules:
 * - Exactly 4 digits when represented as a string (i.e. value in 1000–9999).
 * - Value in the range [1950, current calendar year] (inclusive).
 *
 * The `currentYear` parameter is injected so the function is fully
 * deterministic in tests (no wall-clock dependency).
 *
 * @param year        - The numeric year to validate.
 * @param currentYear - The current calendar year (injected for testability).
 * @returns `true` if `year` is in [1950, currentYear].
 *
 * @example
 * ```ts
 * isValidEducationYear(1949, 2026)  // false — below 1950
 * isValidEducationYear(1950, 2026)  // true
 * isValidEducationYear(2026, 2026)  // true — current year
 * isValidEducationYear(2027, 2026)  // false — future
 * ```
 */
export function isValidEducationYear(year: number, currentYear: number): boolean {
  // Must be a 4-digit integer: in [1000, 9999].
  if (!Number.isInteger(year) || year < 1000 || year > 9999) return false;
  return year >= 1950 && year <= currentYear;
}
