/**
 * Unit tests for education-credential validators in
 * `src/Helper/validationHelper.ts` (story 5.2).
 *
 * Tests cover:
 * - `isValidEducationText`: character rules, length boundary (40 / 41),
 *   apostrophe acceptance, leading/trailing whitespace rejection.
 * - `isValidEducationYear`: boundary values per AC
 *   (1949 fails, 1950 passes, currentYear passes, currentYear+1 fails).
 *   `currentYear` is injected so the suite is deterministic.
 */

import {
  EDUCATION_TEXT_MAX_LENGTH,
  isValidEducationText,
  isValidEducationYear,
  isValidPhone,
  canonicalizePhone,
} from '@/Helper/validationHelper';

// ── Pinned current year for all tests ─────────────────────────────────────────
// We inject an explicit year so tests are not wall-clock dependent.
const CURRENT_YEAR = 2026;

// ═══════════════════════════════════════════════════════════════════════════════
// isValidEducationText
// ═══════════════════════════════════════════════════════════════════════════════

describe('isValidEducationText — character rules', () => {
  it('given a plain alpha string, when validated, then returns true', () => {
    expect(isValidEducationText('LUMS')).toBe(true);
  });

  it('given letters and digits, when validated, then returns true', () => {
    expect(isValidEducationText('Class 10A')).toBe(true);
  });

  it("given an apostrophe (St. Mary's), when validated, then returns true", () => {
    expect(isValidEducationText("St. Mary's High School")).toBe(true);
  });

  it("given a hyphen, when validated, then returns true", () => {
    expect(isValidEducationText('Al-Azhar University')).toBe(true);
  });

  it('given a period, when validated, then returns true', () => {
    expect(isValidEducationText('B.Sc. Engineering')).toBe(true);
  });

  it('given a comma, when validated, then returns true', () => {
    expect(isValidEducationText('Arts, Humanities')).toBe(true);
  });

  it('given an ampersand, when validated, then returns true', () => {
    expect(isValidEducationText('Science & Technology')).toBe(true);
  });

  it('given an exclamation mark (invalid char), when validated, then returns false', () => {
    expect(isValidEducationText('School!')).toBe(false);
  });

  it('given an at-sign (invalid char), when validated, then returns false', () => {
    expect(isValidEducationText('School@City')).toBe(false);
  });

  it('given a hash (invalid char), when validated, then returns false', () => {
    expect(isValidEducationText('School#1')).toBe(false);
  });

  it('given a forward slash (invalid char), when validated, then returns false', () => {
    expect(isValidEducationText('A/B School')).toBe(false);
  });
});

describe('isValidEducationText — leading/trailing whitespace', () => {
  it('given a leading space, when validated, then returns false', () => {
    expect(isValidEducationText(' LUMS')).toBe(false);
  });

  it('given a trailing space, when validated, then returns false', () => {
    expect(isValidEducationText('LUMS ')).toBe(false);
  });

  it('given a string with internal spaces only (trimmed = same), when validated, then returns true', () => {
    expect(isValidEducationText('Government College Lahore')).toBe(true);
  });
});

describe('isValidEducationText — empty string', () => {
  it('given an empty string, when validated, then returns false', () => {
    expect(isValidEducationText('')).toBe(false);
  });
});

describe(`isValidEducationText — length boundary (max = ${EDUCATION_TEXT_MAX_LENGTH})`, () => {
  it(`given a string of exactly ${EDUCATION_TEXT_MAX_LENGTH} chars, when validated, then returns true`, () => {
    // 40 'A' characters
    const s = 'A'.repeat(EDUCATION_TEXT_MAX_LENGTH);
    expect(s.length).toBe(40);
    expect(isValidEducationText(s)).toBe(true);
  });

  it(`given a string of ${EDUCATION_TEXT_MAX_LENGTH + 1} chars, when validated, then returns false`, () => {
    // 41 'A' characters
    const s = 'A'.repeat(EDUCATION_TEXT_MAX_LENGTH + 1);
    expect(s.length).toBe(41);
    expect(isValidEducationText(s)).toBe(false);
  });

  it('given a single character string, when validated, then returns true', () => {
    expect(isValidEducationText('A')).toBe(true);
  });
});

// ── Apostrophe-specific boundary test (per PRD "St. Mary's must pass") ────────

describe("isValidEducationText — apostrophe required to pass real school names", () => {
  it("given \"St. Mary's High School\" (21 chars, apostrophe), when validated, then returns true", () => {
    expect(isValidEducationText("St. Mary's High School")).toBe(true);
  });

  it('given "BSc Computer Science" (20 chars, no special chars), when validated, then returns true', () => {
    expect(isValidEducationText('BSc Computer Science')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// isValidEducationYear
// ═══════════════════════════════════════════════════════════════════════════════

describe('isValidEducationYear — boundary values (AC)', () => {
  it('given year 1949, when validated against 2026, then returns false', () => {
    expect(isValidEducationYear(1949, CURRENT_YEAR)).toBe(false);
  });

  it('given year 1950, when validated against 2026, then returns true', () => {
    expect(isValidEducationYear(1950, CURRENT_YEAR)).toBe(true);
  });

  it('given currentYear (2026), when validated against 2026, then returns true', () => {
    expect(isValidEducationYear(CURRENT_YEAR, CURRENT_YEAR)).toBe(true);
  });

  it('given currentYear + 1 (2027), when validated against 2026, then returns false', () => {
    expect(isValidEducationYear(CURRENT_YEAR + 1, CURRENT_YEAR)).toBe(false);
  });
});

describe('isValidEducationYear — mid-range values', () => {
  it('given year 2000 (valid mid-range), when validated against 2026, then returns true', () => {
    expect(isValidEducationYear(2000, CURRENT_YEAR)).toBe(true);
  });

  it('given year 1990, when validated against 2026, then returns true', () => {
    expect(isValidEducationYear(1990, CURRENT_YEAR)).toBe(true);
  });
});

describe('isValidEducationYear — non-4-digit values', () => {
  it('given year 999 (3 digits), when validated, then returns false', () => {
    expect(isValidEducationYear(999, CURRENT_YEAR)).toBe(false);
  });

  it('given year 10000 (5 digits), when validated, then returns false', () => {
    expect(isValidEducationYear(10000, CURRENT_YEAR)).toBe(false);
  });

  it('given year 0, when validated, then returns false', () => {
    expect(isValidEducationYear(0, CURRENT_YEAR)).toBe(false);
  });

  it('given a non-integer (1950.5), when validated, then returns false', () => {
    expect(isValidEducationYear(1950.5, CURRENT_YEAR)).toBe(false);
  });
});

describe('isValidEducationYear — sentinel value 0', () => {
  it('given sentinel year 0 (hidden field default), when validated, then returns false', () => {
    // The sentinel 0 is not a valid user-entered year — this confirms the
    // Continue button stays disabled if a visible field still holds the sentinel.
    expect(isValidEducationYear(0, CURRENT_YEAR)).toBe(false);
  });
});

// ── Text field boundary test for each of the 4 education text fields ──────────
// The helper is shared; boundary coverage for each field name follows.

describe('isValidEducationText — per-field 40/41 boundary (high_school)', () => {
  it('given 40 chars for high_school, then returns true', () => {
    expect(isValidEducationText('A'.repeat(40))).toBe(true);
  });
  it('given 41 chars for high_school, then returns false', () => {
    expect(isValidEducationText('A'.repeat(41))).toBe(false);
  });
});

describe('isValidEducationText — per-field 40/41 boundary (higher_secondary)', () => {
  it('given 40 chars for higher_secondary, then returns true', () => {
    expect(isValidEducationText('B'.repeat(40))).toBe(true);
  });
  it('given 41 chars for higher_secondary, then returns false', () => {
    expect(isValidEducationText('B'.repeat(41))).toBe(false);
  });
});

describe('isValidEducationText — per-field 40/41 boundary (college_name)', () => {
  it('given 40 chars for college_name, then returns true', () => {
    expect(isValidEducationText('C'.repeat(40))).toBe(true);
  });
  it('given 41 chars for college_name, then returns false', () => {
    expect(isValidEducationText('C'.repeat(41))).toBe(false);
  });
});

describe('isValidEducationText — per-field 40/41 boundary (highest_degree)', () => {
  it('given 40 chars for highest_degree, then returns true', () => {
    expect(isValidEducationText('D'.repeat(40))).toBe(true);
  });
  it('given 41 chars for highest_degree, then returns false', () => {
    expect(isValidEducationText('D'.repeat(41))).toBe(false);
  });
});

// ── Year boundary test for each of the 3 year fields ─────────────────────────

describe('isValidEducationYear — per-field boundary (high_school_passing_year)', () => {
  it('given 1949 for high_school_passing_year, then returns false', () => {
    expect(isValidEducationYear(1949, CURRENT_YEAR)).toBe(false);
  });
  it('given 1950 for high_school_passing_year, then returns true', () => {
    expect(isValidEducationYear(1950, CURRENT_YEAR)).toBe(true);
  });
  it('given currentYear for high_school_passing_year, then returns true', () => {
    expect(isValidEducationYear(CURRENT_YEAR, CURRENT_YEAR)).toBe(true);
  });
  it('given currentYear+1 for high_school_passing_year, then returns false', () => {
    expect(isValidEducationYear(CURRENT_YEAR + 1, CURRENT_YEAR)).toBe(false);
  });
});

describe('isValidEducationYear — per-field boundary (higher_secondary_passing_year)', () => {
  it('given 1949 for higher_secondary_passing_year, then returns false', () => {
    expect(isValidEducationYear(1949, CURRENT_YEAR)).toBe(false);
  });
  it('given 1950 for higher_secondary_passing_year, then returns true', () => {
    expect(isValidEducationYear(1950, CURRENT_YEAR)).toBe(true);
  });
  it('given currentYear for higher_secondary_passing_year, then returns true', () => {
    expect(isValidEducationYear(CURRENT_YEAR, CURRENT_YEAR)).toBe(true);
  });
  it('given currentYear+1 for higher_secondary_passing_year, then returns false', () => {
    expect(isValidEducationYear(CURRENT_YEAR + 1, CURRENT_YEAR)).toBe(false);
  });
});

describe('isValidEducationYear — per-field boundary (graduation_year)', () => {
  it('given 1949 for graduation_year, then returns false', () => {
    expect(isValidEducationYear(1949, CURRENT_YEAR)).toBe(false);
  });
  it('given 1950 for graduation_year, then returns true', () => {
    expect(isValidEducationYear(1950, CURRENT_YEAR)).toBe(true);
  });
  it('given currentYear for graduation_year, then returns true', () => {
    expect(isValidEducationYear(CURRENT_YEAR, CURRENT_YEAR)).toBe(true);
  });
  it('given currentYear+1 for graduation_year, then returns false', () => {
    expect(isValidEducationYear(CURRENT_YEAR + 1, CURRENT_YEAR)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// isValidPhone
// ═══════════════════════════════════════════════════════════════════════════════

describe('isValidPhone — valid numbers by country', () => {
  it('given a valid Indian mobile (+91 9812345678), when validated, then returns true', () => {
    expect(isValidPhone('+91', '9812345678')).toBe(true);
  });

  it('given a valid Pakistani mobile (+92 3001234567), when validated, then returns true', () => {
    expect(isValidPhone('+92', '3001234567')).toBe(true);
  });

  it('given a valid UK mobile (+44 7911123456), when validated, then returns true', () => {
    expect(isValidPhone('+44', '7911123456')).toBe(true);
  });
});

describe('isValidPhone — invalid numbers by country', () => {
  it('given an Indian number that is too short (+91 98123), when validated, then returns false', () => {
    expect(isValidPhone('+91', '98123')).toBe(false);
  });

  it('given a Pakistani number that is too short (+92 300123), when validated, then returns false', () => {
    expect(isValidPhone('+92', '300123')).toBe(false);
  });

  it('given a UK number that is too short (+44 791112), when validated, then returns false', () => {
    expect(isValidPhone('+44', '791112')).toBe(false);
  });
});

describe('isValidPhone — empty / malformed input', () => {
  it('given an empty dialCode, when validated, then returns false', () => {
    expect(isValidPhone('', '9812345678')).toBe(false);
  });

  it('given an empty nationalNumber, when validated, then returns false', () => {
    expect(isValidPhone('+91', '')).toBe(false);
  });

  it('given both empty strings, when validated, then returns false', () => {
    expect(isValidPhone('', '')).toBe(false);
  });

  it('given a whitespace-only dialCode, when validated, then returns false', () => {
    expect(isValidPhone('   ', '9812345678')).toBe(false);
  });

  it('given a whitespace-only nationalNumber, when validated, then returns false', () => {
    expect(isValidPhone('+91', '   ')).toBe(false);
  });

  it('given an invalid country code (+999 9812345678), when validated, then returns false', () => {
    expect(isValidPhone('+999', '9812345678')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// canonicalizePhone
// ═══════════════════════════════════════════════════════════════════════════════

describe('canonicalizePhone — valid numbers return E.164', () => {
  it('given a valid Indian mobile, when canonicalized, then returns E.164 string', () => {
    expect(canonicalizePhone('+91', '9812345678')).toBe('+919812345678');
  });

  it('given a valid Pakistani mobile, when canonicalized, then returns E.164 string', () => {
    expect(canonicalizePhone('+92', '3001234567')).toBe('+923001234567');
  });

  it('given a valid UK mobile, when canonicalized, then returns E.164 string', () => {
    expect(canonicalizePhone('+44', '7911123456')).toBe('+447911123456');
  });
});

describe('canonicalizePhone — invalid / empty input returns null', () => {
  it('given an Indian number that is too short, when canonicalized, then returns null', () => {
    expect(canonicalizePhone('+91', '98123')).toBeNull();
  });

  it('given an empty dialCode, when canonicalized, then returns null', () => {
    expect(canonicalizePhone('', '9812345678')).toBeNull();
  });

  it('given an empty nationalNumber, when canonicalized, then returns null', () => {
    expect(canonicalizePhone('+91', '')).toBeNull();
  });

  it('given both empty strings, when canonicalized, then returns null', () => {
    expect(canonicalizePhone('', '')).toBeNull();
  });
});
