/**
 * Unit tests for src/Helper/immutableFieldHelper.ts (story 3.1).
 *
 * Covers:
 * - `sex` → true (immutable after first write)
 * - `first_name` → true (immutable after first write)
 * - `last_name` → true (immutable after first write)
 * - `birthday` → true (immutable after first write)
 * - `religion` → true (immutable after first write)
 * - `subsect` → true (immutable after first write)
 * - `username` → false (mutable — rate-limited rename)
 * - `job_title` → false (freely mutable)
 * - `email` → false (freely mutable)
 */

import { isImmutable } from '@/Helper/immutableFieldHelper';

describe('isImmutable — immutable fields', () => {
  it('given sex, when isImmutable is called, then returns true', () => {
    expect(isImmutable('sex')).toBe(true);
  });

  it('given first_name, when isImmutable is called, then returns true', () => {
    expect(isImmutable('first_name')).toBe(true);
  });

  it('given last_name, when isImmutable is called, then returns true', () => {
    expect(isImmutable('last_name')).toBe(true);
  });

  it('given birthday, when isImmutable is called, then returns true', () => {
    expect(isImmutable('birthday')).toBe(true);
  });

  it('given religion, when isImmutable is called, then returns true', () => {
    expect(isImmutable('religion')).toBe(true);
  });

  it('given subsect, when isImmutable is called, then returns true', () => {
    expect(isImmutable('subsect')).toBe(true);
  });
});

describe('isImmutable — mutable fields', () => {
  it('given username, when isImmutable is called, then returns false', () => {
    expect(isImmutable('username')).toBe(false);
  });

  it('given job_title, when isImmutable is called, then returns false', () => {
    expect(isImmutable('job_title')).toBe(false);
  });

  it('given email, when isImmutable is called, then returns false', () => {
    expect(isImmutable('email')).toBe(false);
  });

  it('given professional_category, when isImmutable is called, then returns false', () => {
    expect(isImmutable('professional_category')).toBe(false);
  });
});
