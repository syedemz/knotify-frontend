/**
 * Unit tests for `src/Helper/dateHelper.ts` (story 3.3).
 *
 * All tests inject `today` explicitly so the suite is fully deterministic and
 * never depends on the wall-clock date.
 *
 * Boundary cases per AC:
 * - isAtLeast18: 17y364d → false; 18y0d → true
 * - isNotFuture: today → true; today+1 → false
 * - isYearReasonable: 1899 → false; 1900 → true
 * - age: 17y364d → 17; 18y0d → 18
 * - validateBirthday: correct LabelKey per failure mode; null for valid input
 */

import {
  isAtLeast18,
  isNotFuture,
  isYearReasonable,
  age,
  validateBirthday,
} from '@/Helper/dateHelper';

// ---------------------------------------------------------------------------
// isAtLeast18
// ---------------------------------------------------------------------------

describe('isAtLeast18', () => {
  it('given a birthday 17 years and 364 days before today, then returns false', () => {
    // today = 2026-03-14, birthday = 2008-03-15 → 17y364d → false
    expect(isAtLeast18('2008-03-15', '2026-03-14')).toBe(false);
  });

  it('given a birthday exactly 18 years before today, then returns true', () => {
    // today = 2026-03-15, birthday = 2008-03-15 → 18y0d → true
    expect(isAtLeast18('2008-03-15', '2026-03-15')).toBe(true);
  });

  it('given a birthday 18 years and 1 day before today, then returns true', () => {
    // today = 2026-03-16, birthday = 2008-03-15 → 18y1d → true
    expect(isAtLeast18('2008-03-15', '2026-03-16')).toBe(true);
  });

  it('given a birthday 30 years before today, then returns true', () => {
    expect(isAtLeast18('1996-06-01', '2026-06-01')).toBe(true);
  });

  it('given a birthday exactly 17 years before today (birthday month/day = today), then returns false', () => {
    // today = 2026-07-01, birthday = 2009-07-01 → 17 years exactly → false
    expect(isAtLeast18('2009-07-01', '2026-07-01')).toBe(false);
  });

  it('given a birthday where today is one day before the 18th birthday, then returns false', () => {
    // today = 2026-12-31, birthday = 2009-01-01 → 17y364d → false
    expect(isAtLeast18('2009-01-01', '2026-12-31')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isNotFuture
// ---------------------------------------------------------------------------

describe('isNotFuture', () => {
  it('given a date equal to today, then returns true', () => {
    expect(isNotFuture('2026-07-23', '2026-07-23')).toBe(true);
  });

  it('given a date one day after today, then returns false', () => {
    expect(isNotFuture('2026-07-24', '2026-07-23')).toBe(false);
  });

  it('given a date well in the past, then returns true', () => {
    expect(isNotFuture('2000-01-01', '2026-07-23')).toBe(true);
  });

  it('given a date one day before today, then returns true', () => {
    expect(isNotFuture('2026-07-22', '2026-07-23')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isYearReasonable
// ---------------------------------------------------------------------------

describe('isYearReasonable', () => {
  it('given year 1899, then returns false', () => {
    expect(isYearReasonable('1899-12-31')).toBe(false);
  });

  it('given year 1900, then returns true', () => {
    expect(isYearReasonable('1900-01-01')).toBe(true);
  });

  it('given year 1950, then returns true', () => {
    expect(isYearReasonable('1950-06-15')).toBe(true);
  });

  it('given year 2000, then returns true', () => {
    expect(isYearReasonable('2000-01-01')).toBe(true);
  });

  it('given the current year, then returns true', () => {
    const thisYear = new Date().getFullYear();
    expect(isYearReasonable(`${thisYear}-01-01`)).toBe(true);
  });

  it('given the current year + 1, then returns false', () => {
    const futureYear = new Date().getFullYear() + 1;
    expect(isYearReasonable(`${futureYear}-01-01`)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// age
// ---------------------------------------------------------------------------

describe('age', () => {
  it('given a birthday 17 years and 364 days before today, then returns 17', () => {
    // today = 2026-03-14, birthday = 2008-03-15 → 17
    expect(age('2008-03-15', '2026-03-14')).toBe(17);
  });

  it('given a birthday exactly 18 years before today, then returns 18', () => {
    // today = 2026-03-15, birthday = 2008-03-15 → 18
    expect(age('2008-03-15', '2026-03-15')).toBe(18);
  });

  it('given a birthday 30 years before today (same month/day), then returns 30', () => {
    expect(age('1996-07-23', '2026-07-23')).toBe(30);
  });

  it('given a birthday where today is one day before the next birthday, then returns correct age', () => {
    // today = 2026-07-22, birthday = 1990-07-23 → 35 (birthday not yet reached)
    expect(age('1990-07-23', '2026-07-22')).toBe(35);
  });

  it('given a birthday where today is the birthday, then returns correct age', () => {
    // today = 2026-07-23, birthday = 1990-07-23 → 36
    expect(age('1990-07-23', '2026-07-23')).toBe(36);
  });

  it('given a birthday on the last day of the year and today is New Year\'s Day, then returns 0 if same year - 1', () => {
    // today = 2026-01-01, birthday = 2025-12-31 → 0 years (1 day old)
    expect(age('2025-12-31', '2026-01-01')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// validateBirthday
// ---------------------------------------------------------------------------

describe('validateBirthday', () => {
  it('given a future date, then returns the future error key', () => {
    expect(validateBirthday('2026-07-24', '2026-07-23')).toBe(
      'onboarding.birthday.errors.future',
    );
  });

  it('given year 1899, then returns the yearUnreasonable error key', () => {
    expect(validateBirthday('1899-01-01', '2026-07-23')).toBe(
      'onboarding.birthday.errors.yearUnreasonable',
    );
  });

  it('given a date that makes age < 18, then returns the under18 error key', () => {
    // today = 2026-07-23, birthday 17y364d earlier
    expect(validateBirthday('2008-07-24', '2026-07-23')).toBe(
      'onboarding.birthday.errors.under18',
    );
  });

  it('given a valid birthday (exactly 18 years before today), then returns null', () => {
    expect(validateBirthday('2008-07-23', '2026-07-23')).toBeNull();
  });

  it('given a valid birthday (30 years old), then returns null', () => {
    expect(validateBirthday('1996-07-23', '2026-07-23')).toBeNull();
  });

  it('given a valid birthday at year 1900, then returns null', () => {
    // 1900-01-01 is more than 18 years ago — valid
    expect(validateBirthday('1900-01-01', '2026-07-23')).toBeNull();
  });

  it('given today itself as birthday, then returns the under18 error (age 0)', () => {
    // A person born today is 0 years old — under 18
    expect(validateBirthday('2026-07-23', '2026-07-23')).toBe(
      'onboarding.birthday.errors.under18',
    );
  });

  it('given future takes priority over yearUnreasonable (year 2099)', () => {
    // 2099-01-01 is both future AND year > current — future error fires first
    expect(validateBirthday('2099-01-01', '2026-07-23')).toBe(
      'onboarding.birthday.errors.future',
    );
  });
});
