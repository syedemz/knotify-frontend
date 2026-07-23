/**
 * Username generation helpers for the onboarding wizard.
 *
 * Generates a deterministic-ish username from the user's first and last name
 * parts by stripping all non-alpha characters (including diacritics via NFD
 * normalisation) and appending a 4-digit random suffix.
 *
 * Uniqueness is enforced by the backend on the final PATCH — a 409 collision
 * triggers regeneration on page 31 (phase 11). This module is client-side only.
 *
 * @module Helper/usernameHelper
 */

/**
 * Lowercases `s` and strips every character that is not an ASCII lowercase
 * letter.
 *
 * Diacritics are removed via NFD decomposition followed by a single pass that
 * drops every code point outside `[a-z]`. This turns `"Zoë"` into `"zoe"`,
 * `"Marie-Claire"` into `"marieclaire"`, and `"O'Brien"` into `"obrien"`.
 *
 * @param s - The raw name part (first or last name).
 * @returns Lowercase ASCII letters only; empty string if the input yields none.
 *
 * @example
 * ```ts
 * sanitizeNamePart('Marie-Claire') // 'marieclaire'
 * sanitizeNamePart("O'Brien")      // 'obrien'
 * sanitizeNamePart('Zoë')          // 'zoe'
 * ```
 */
export function sanitizeNamePart(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '');
}

/**
 * Generates a username by concatenating the sanitized first and last name
 * parts and appending a zero-padded 4-digit random suffix.
 *
 * The suffix is produced by `Math.floor(Math.random() * 10000)` padded to 4
 * digits, yielding values from `"0000"` to `"9999"`.
 *
 * The result always matches `/^[a-z]{2,}[0-9]{4}$/` provided that the
 * sanitized first and last names together yield at least two ASCII letters.
 *
 * @param first - The user's first name (raw, pre-sanitisation).
 * @param last  - The user's last name (raw, pre-sanitisation).
 * @returns A username string of the form `<letters><4 digits>`.
 *
 * @example
 * ```ts
 * generateUsername('Marie', 'Smith') // e.g. 'mariesmith3421'
 * generateUsername('Zoë', 'Tan')     // e.g. 'zoetan0087'
 * ```
 */
export function generateUsername(first: string, last: string): string {
  const namePart = sanitizeNamePart(first) + sanitizeNamePart(last);
  const suffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return namePart + suffix;
}
