/**
 * Unit tests for usernameHelper.ts (story 3.2).
 *
 * Covers:
 * - sanitizeNamePart: strips non-alpha chars; lowercases; NFD-normalises diacritics.
 * - generateUsername: output matches /^[a-z]{2,}[0-9]{4}$/ across many iterations.
 */

import { sanitizeNamePart, generateUsername } from '@/Helper/usernameHelper';

// ── sanitizeNamePart ───────────────────────────────────────────────────────────

describe('sanitizeNamePart', () => {
  it('given "Marie-Claire", then returns "marieclaire"', () => {
    expect(sanitizeNamePart('Marie-Claire')).toBe('marieclaire');
  });

  it("given \"O'Brien\", then returns \"obrien\"", () => {
    expect(sanitizeNamePart("O'Brien")).toBe('obrien');
  });

  it('given "Zoë", then returns "zoe" (diacritic stripped via NFD)', () => {
    expect(sanitizeNamePart('Zoë')).toBe('zoe');
  });

  it('given lowercase ascii "smith", then returns "smith" unchanged', () => {
    expect(sanitizeNamePart('smith')).toBe('smith');
  });

  it('given "Van Der Berg", then returns "vanderberg" (spaces stripped)', () => {
    expect(sanitizeNamePart('Van Der Berg')).toBe('vanderberg');
  });

  it('given empty string, then returns empty string', () => {
    expect(sanitizeNamePart('')).toBe('');
  });

  it('given string with only non-alpha chars, then returns empty string', () => {
    expect(sanitizeNamePart("---''")).toBe('');
  });

  it('given "André", then strips diacritic from é', () => {
    expect(sanitizeNamePart('André')).toBe('andre');
  });
});

// ── generateUsername ───────────────────────────────────────────────────────────

describe('generateUsername', () => {
  const USERNAME_RE = /^[a-z]{2,}[0-9]{4}$/;

  it('given Math.random mocked to 0, then suffix is "0000"', () => {
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const result = generateUsername('Marie', 'Smith');
      expect(result).toBe('mariesmith0000');
    } finally {
      spy.mockRestore();
    }
  });

  it('given Math.random mocked to 0.9999, then suffix is "9999"', () => {
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.9999);
    try {
      const result = generateUsername('Marie', 'Smith');
      expect(result).toBe('mariesmith9999');
    } finally {
      spy.mockRestore();
    }
  });

  it('given Math.random mocked to 0.042, then suffix is zero-padded "0420"', () => {
    // floor(0.042 * 10000) = 420, padStart(4,'0') = '0420'
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.042);
    try {
      const result = generateUsername('Al', 'Ba');
      expect(result).toBe('alba0420');
    } finally {
      spy.mockRestore();
    }
  });

  it('given "Marie" and "Smith", then result matches the username regex', () => {
    const result = generateUsername('Marie', 'Smith');
    expect(result).toMatch(USERNAME_RE);
  });

  it('given diacritic names, then result matches the username regex', () => {
    const result = generateUsername('Zoë', 'Müller');
    expect(result).toMatch(USERNAME_RE);
  });

  it('given hyphenated first name, then result matches the username regex', () => {
    const result = generateUsername('Marie-Claire', 'Dubois');
    expect(result).toMatch(USERNAME_RE);
  });

  it('given 1000 random invocations, then every result matches /^[a-z]{2,}[0-9]{4}$/', () => {
    for (let i = 0; i < 1000; i++) {
      const result = generateUsername('Marie', 'Smith');
      expect(result).toMatch(USERNAME_RE);
    }
  });

  it('given Math.random producing a 3-digit floor, then suffix is zero-padded to 4 digits', () => {
    // floor(0.042 * 10000) = 420 → '0420'
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.042);
    try {
      const result = generateUsername('A', 'B');
      expect(result).toMatch(/0420$/);
    } finally {
      spy.mockRestore();
    }
  });
});
