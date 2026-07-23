/**
 * Date helper utilities for birthday validation and age computation.
 *
 * All functions that need "today" accept an optional `today` parameter so tests
 * can inject a fixed date. The default always resolves to today's wall-clock date
 * via `new Date().toISOString().slice(0, 10)`.
 *
 * @module Helper/dateHelper
 */

import type { LabelKey } from '@/labels';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Returns the current date as a `'YYYY-MM-DD'` string.
 *
 * Extracted to keep the defaulting logic in one place.
 *
 * @returns Today's date in ISO format.
 */
function todayDefault(): string {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Public predicates
// ---------------------------------------------------------------------------

/**
 * Returns `true` if the birthday ISO string represents a person who is at
 * least 18 completed years old as of `today`.
 *
 * "Completed years" means the birthday has already occurred in the current
 * year (i.e. the person has had their birthday this year), or the person's
 * birth month/day is on or before today's month/day in this year.
 *
 * @param iso   - The birthday as an ISO date string (`'YYYY-MM-DD'`).
 * @param today - Override for "today"; defaults to the current date. Must be
 *                a `'YYYY-MM-DD'` string. Inject in tests for determinism.
 * @returns `true` if the person is at least 18 years old.
 *
 * @example
 * ```ts
 * isAtLeast18('2000-03-15', '2018-03-14') // false — 17y364d
 * isAtLeast18('2000-03-15', '2018-03-15') // true  — exactly 18
 * ```
 */
export function isAtLeast18(iso: string, today: string = todayDefault()): boolean {
  return age(iso, today) >= 18;
}

/**
 * Returns `true` if the birthday ISO string is not in the future relative to
 * `today` (i.e. today or earlier is allowed).
 *
 * @param iso   - The date to test as `'YYYY-MM-DD'`.
 * @param today - Override for "today"; defaults to the current date.
 * @returns `true` if `iso <= today`.
 *
 * @example
 * ```ts
 * isNotFuture('2026-07-23', '2026-07-23') // true  — today is allowed
 * isNotFuture('2026-07-24', '2026-07-23') // false — tomorrow is future
 * ```
 */
export function isNotFuture(iso: string, today: string = todayDefault()): boolean {
  return iso <= today;
}

/**
 * Returns `true` if the year in `iso` falls within the reasonable range
 * `[1900, current_year]` (inclusive on both ends).
 *
 * `current_year` is derived from the system clock (not injected), because
 * year-boundary tests are not a concern here — the predicate only rejects
 * years before 1900 or in the future.
 *
 * @param iso - The date to test as `'YYYY-MM-DD'`.
 * @returns `true` if `1900 <= year <= currentYear`.
 *
 * @example
 * ```ts
 * isYearReasonable('1899-12-31') // false
 * isYearReasonable('1900-01-01') // true
 * ```
 */
export function isYearReasonable(iso: string): boolean {
  const year = parseInt(iso.slice(0, 4), 10);
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear;
}

/**
 * Computes the number of completed years between `iso` and `today`.
 *
 * The result is the person's age in whole years: year difference, minus 1
 * if today's month/day is strictly before the birthday's month/day.
 *
 * @param iso   - The birthday as `'YYYY-MM-DD'`.
 * @param today - Override for "today"; defaults to the current date.
 * @returns Completed years as a non-negative integer.
 *
 * @example
 * ```ts
 * age('2008-03-15', '2026-03-14') // 17 — birthday not yet reached this year
 * age('2008-03-15', '2026-03-15') // 18 — birthday reached today
 * ```
 */
export function age(iso: string, today: string = todayDefault()): number {
  const [birthYear, birthMonth, birthDay] = iso.split('-').map(Number) as [number, number, number];
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number) as [number, number, number];

  let years = todayYear - birthYear;

  // Subtract 1 if the birthday in the current year has not yet occurred.
  if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
    years -= 1;
  }

  return years;
}

/**
 * Composite birthday validator.
 *
 * Runs all predicates in the following priority order and returns the
 * `LabelKey` for the first failing rule, or `null` if all pass:
 *
 * 1. `isNotFuture` — date is not in the future.
 * 2. `isYearReasonable` — year is in `[1900, currentYear]`.
 * 3. `isAtLeast18` — person is at least 18 years old.
 *
 * @param iso   - The birthday to validate as `'YYYY-MM-DD'`.
 * @param today - Override for "today"; defaults to the current date.
 * @returns The first failing `LabelKey`, or `null` if the birthday is valid.
 *
 * @example
 * ```ts
 * validateBirthday('2030-01-01', '2026-07-23')
 * // 'onboarding.birthday.errors.future'
 *
 * validateBirthday('2010-01-01', '2026-07-23')
 * // 'onboarding.birthday.errors.under18'
 *
 * validateBirthday('2000-01-01', '2026-07-23')
 * // null
 * ```
 */
export function validateBirthday(iso: string, today: string = todayDefault()): LabelKey | null {
  if (!isNotFuture(iso, today)) {
    return 'onboarding.birthday.errors.future';
  }
  if (!isYearReasonable(iso)) {
    return 'onboarding.birthday.errors.yearUnreasonable';
  }
  if (!isAtLeast18(iso, today)) {
    return 'onboarding.birthday.errors.under18';
  }
  return null;
}
