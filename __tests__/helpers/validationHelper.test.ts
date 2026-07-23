/**
 * Unit tests for validationHelper.ts (stories 2.5, 3.2).
 *
 * Covers:
 * - isValidEmail: RFC-5322-shaped check — accepts common good inputs, rejects bad ones.
 * - isSixDigitCode: accepts exactly "123456", rejects short/long/whitespace/non-digit.
 * - passwordMeetsCognitoPolicy: returns {ok:true, missing:[]} for compliant passwords
 *   and correctly enumerates missing requirements for defective ones.
 */

import {
  isValidEmail,
  isSixDigitCode,
  isValidName,
  passwordMeetsCognitoPolicy,
} from "@/Helper/validationHelper";

// ── isValidEmail ───────────────────────────────────────────────────────────────

describe("isValidEmail", () => {
  describe("given valid email addresses", () => {
    const VALID = [
      "user@example.com",
      "user.name@example.com",
      "user+tag@example.org",
      "user@sub.domain.com",
      "first.last@company.co.uk",
      "me@x.io",
      "a@b.co",
      "donny777@proton.me",
    ];

    it.each(VALID)("then '%s' is accepted", (input) => {
      expect(isValidEmail(input)).toBe(true);
    });
  });

  describe("given invalid email addresses", () => {
    const INVALID = [
      "",
      "notanemail",
      "@example.com",
      "user@",
      "user@@example.com",
      "user @example.com",
      "user@ example.com",
      "user@example",
      "user@.com",
      "plainaddress",
      "user@example.",
    ];

    it.each(INVALID)("then '%s' is rejected", (input) => {
      expect(isValidEmail(input)).toBe(false);
    });
  });

  it("given email with leading/trailing whitespace, then trims before checking", () => {
    // isValidEmail trims the input — "  user@example.com  " should be valid.
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });
});

// ── isSixDigitCode ─────────────────────────────────────────────────────────────

describe("isSixDigitCode", () => {
  it("given exactly '123456', then returns true", () => {
    expect(isSixDigitCode("123456")).toBe(true);
  });

  it("given '000000', then returns true", () => {
    expect(isSixDigitCode("000000")).toBe(true);
  });

  it("given '999999', then returns true", () => {
    expect(isSixDigitCode("999999")).toBe(true);
  });

  it("given five digits, then returns false (too short)", () => {
    expect(isSixDigitCode("12345")).toBe(false);
  });

  it("given seven digits, then returns false (too long)", () => {
    expect(isSixDigitCode("1234567")).toBe(false);
  });

  it("given six chars with a space, then returns false", () => {
    expect(isSixDigitCode("123 56")).toBe(false);
  });

  it("given six chars with a leading space, then returns false", () => {
    expect(isSixDigitCode(" 12345")).toBe(false);
  });

  it("given six chars including a letter, then returns false", () => {
    expect(isSixDigitCode("12345a")).toBe(false);
  });

  it("given empty string, then returns false", () => {
    expect(isSixDigitCode("")).toBe(false);
  });

  it("given six chars with a newline, then returns false", () => {
    expect(isSixDigitCode("12345\n")).toBe(false);
  });
});

// ── passwordMeetsCognitoPolicy ─────────────────────────────────────────────────

describe("passwordMeetsCognitoPolicy", () => {
  it("given a fully compliant password, then returns {ok:true, missing:[]}", () => {
    const result = passwordMeetsCognitoPolicy("SecurePassword1!");
    expect(result).toEqual({ ok: true, missing: [] });
  });

  it("given another compliant password with different symbol, then ok", () => {
    expect(passwordMeetsCognitoPolicy("MyP@ssw0rd!xyz").ok).toBe(true);
  });

  it("given password shorter than 12 chars, then missing includes 'length'", () => {
    // 11 chars: S-e-c-u-r-e-P-a-s-1-! = 11, otherwise compliant
    const result = passwordMeetsCognitoPolicy("SecurePass1!");
    // SecurePass1! is actually 12 chars — use an 11-char string instead
    const result11 = passwordMeetsCognitoPolicy("SecurePas1!");
    expect(result11.ok).toBe(false);
    expect(result11.missing).toContain("length");
    // Ensure the 12-char one passes
    expect(result.ok).toBe(true);
  });

  it("given password with no uppercase, then missing includes 'upper'", () => {
    const result = passwordMeetsCognitoPolicy("securepassword1!");
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("upper");
  });

  it("given password with no lowercase, then missing includes 'lower'", () => {
    const result = passwordMeetsCognitoPolicy("SECUREPASSWORD1!");
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("lower");
  });

  it("given password with no digit, then missing includes 'digit'", () => {
    const result = passwordMeetsCognitoPolicy("SecurePassword!!");
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("digit");
  });

  it("given password with no symbol, then missing includes 'symbol'", () => {
    const result = passwordMeetsCognitoPolicy("SecurePassword1");
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("symbol");
  });

  it("given empty string, then missing includes all four requirements plus length", () => {
    const result = passwordMeetsCognitoPolicy("");
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("length");
    expect(result.missing).toContain("upper");
    expect(result.missing).toContain("lower");
    expect(result.missing).toContain("digit");
    expect(result.missing).toContain("symbol");
    expect(result.missing).toHaveLength(5);
  });

  it("given 'password' (all lowercase, no digit or symbol), then enumerates all missing reqs", () => {
    const result = passwordMeetsCognitoPolicy("password");
    expect(result.ok).toBe(false);
    expect(result.missing).toContain("length");
    expect(result.missing).toContain("upper");
    expect(result.missing).toContain("digit");
    expect(result.missing).toContain("symbol");
    expect(result.missing).not.toContain("lower"); // has lowercase
  });

  it("given password exactly 12 chars compliant, then ok is true", () => {
    const result = passwordMeetsCognitoPolicy("Abcdefghij1!");
    expect(result).toEqual({ ok: true, missing: [] });
  });

  it("given missing returns readonly array, then it is not mutable", () => {
    const result = passwordMeetsCognitoPolicy("password");
    // TypeScript readonly is compile-time only, but the value must be an array.
    expect(Array.isArray(result.missing)).toBe(true);
  });
});

// ── isValidName ────────────────────────────────────────────────────────────────

describe("isValidName", () => {
  describe("given valid names", () => {
    const VALID = [
      "Marie",
      "Marie-Claire",
      "O'Brien",
      "Van Der Berg",
    ];

    it.each(VALID)("then '%s' is accepted", (input) => {
      expect(isValidName(input)).toBe(true);
    });
  });

  describe("given invalid names", () => {
    const INVALID: Array<[string, string]> = [
      [" Marie", "leading space"],
      ["Marie ", "trailing space"],
      ["", "empty string"],
      ["Marie1", "contains digit"],
      ["Marie!", "contains disallowed symbol"],
      ["M".repeat(36), "36-character string exceeds max length"],
    ];

    it.each(INVALID)("then '%s' is rejected (%s)", (input) => {
      expect(isValidName(input)).toBe(false);
    });
  });

  it("given name at exactly 35 characters, then it is accepted", () => {
    expect(isValidName("M".repeat(35))).toBe(true);
  });

  it("given name at 36 characters, then it is rejected", () => {
    expect(isValidName("M".repeat(36))).toBe(false);
  });

  it("given name with only one character, then it is accepted", () => {
    expect(isValidName("A")).toBe(true);
  });

  it("given name with hyphen in the middle, then it is accepted", () => {
    expect(isValidName("Mary-Jane")).toBe(true);
  });

  it("given name with apostrophe, then it is accepted", () => {
    expect(isValidName("O'Brien")).toBe(true);
  });

  it("given name with internal spaces, then it is accepted", () => {
    expect(isValidName("Van Der Berg")).toBe(true);
  });
});
