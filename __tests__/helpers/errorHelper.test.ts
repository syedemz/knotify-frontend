/**
 * Unit tests for errorHelper.ts (story 2.5).
 *
 * Covers:
 * - Every documented aws-amplify error name maps to the expected LabelKey.
 * - Unknown errors map to the generic key.
 * - The function handles non-Error inputs without throwing (null, string, number).
 */

import { cognitoErrorToLabelKey } from "@/Helper/errorHelper";

// ── Helper to construct Amplify-shaped errors ──────────────────────────────────

function amplifyError(name: string, message = "error message"): Error {
  const err = new Error(message);
  err.name = name;
  return err;
}

// ── Known Amplify error mappings ───────────────────────────────────────────────

describe("cognitoErrorToLabelKey — known Amplify errors", () => {
  it("given UsernameExistsException, then maps to usernameExists", () => {
    expect(cognitoErrorToLabelKey(amplifyError("UsernameExistsException"))).toBe(
      "onboarding.email.errors.usernameExists",
    );
  });

  it("given InvalidPasswordException, then maps to invalidPassword", () => {
    expect(cognitoErrorToLabelKey(amplifyError("InvalidPasswordException"))).toBe(
      "onboarding.email.errors.invalidPassword",
    );
  });

  it("given CodeMismatchException, then maps to generic", () => {
    expect(cognitoErrorToLabelKey(amplifyError("CodeMismatchException"))).toBe(
      "onboarding.email.errors.generic",
    );
  });

  it("given ExpiredCodeException, then maps to generic", () => {
    expect(cognitoErrorToLabelKey(amplifyError("ExpiredCodeException"))).toBe(
      "onboarding.email.errors.generic",
    );
  });

  it("given LimitExceededException, then maps to generic", () => {
    expect(cognitoErrorToLabelKey(amplifyError("LimitExceededException"))).toBe(
      "onboarding.email.errors.generic",
    );
  });

  it("given NotAuthorizedException, then maps to generic", () => {
    expect(cognitoErrorToLabelKey(amplifyError("NotAuthorizedException"))).toBe(
      "onboarding.email.errors.generic",
    );
  });
});

// ── Network error detection ────────────────────────────────────────────────────

describe("cognitoErrorToLabelKey — network errors", () => {
  it("given NetworkError name, then maps to network", () => {
    expect(cognitoErrorToLabelKey(amplifyError("NetworkError", "Network request failed"))).toBe(
      "onboarding.email.errors.network",
    );
  });

  it("given error message containing 'network', then maps to network", () => {
    const err = amplifyError("UnknownError", "Network request failed");
    expect(cognitoErrorToLabelKey(err)).toBe("onboarding.email.errors.network");
  });

  it("given error message containing 'Network' (capital N), then maps to network", () => {
    const err = amplifyError("FetchError", "Network error occurred");
    expect(cognitoErrorToLabelKey(err)).toBe("onboarding.email.errors.network");
  });
});

// ── Unknown errors ─────────────────────────────────────────────────────────────

describe("cognitoErrorToLabelKey — unknown / unexpected errors", () => {
  it("given unknown Error name, then maps to generic", () => {
    expect(cognitoErrorToLabelKey(amplifyError("SomeOtherException"))).toBe(
      "onboarding.email.errors.generic",
    );
  });

  it("given standard Error with no special name, then maps to generic", () => {
    expect(cognitoErrorToLabelKey(new Error("something went wrong"))).toBe(
      "onboarding.email.errors.generic",
    );
  });
});

// ── Non-Error inputs ───────────────────────────────────────────────────────────

describe("cognitoErrorToLabelKey — non-Error inputs (must not throw)", () => {
  it("given null, then returns generic without throwing", () => {
    expect(() => cognitoErrorToLabelKey(null)).not.toThrow();
    expect(cognitoErrorToLabelKey(null)).toBe("onboarding.email.errors.generic");
  });

  it("given undefined, then returns generic without throwing", () => {
    expect(() => cognitoErrorToLabelKey(undefined)).not.toThrow();
    expect(cognitoErrorToLabelKey(undefined)).toBe("onboarding.email.errors.generic");
  });

  it("given a plain string, then returns generic without throwing", () => {
    expect(() => cognitoErrorToLabelKey("some error string")).not.toThrow();
    expect(cognitoErrorToLabelKey("some error string")).toBe("onboarding.email.errors.generic");
  });

  it("given a number, then returns generic without throwing", () => {
    expect(() => cognitoErrorToLabelKey(42)).not.toThrow();
    expect(cognitoErrorToLabelKey(42)).toBe("onboarding.email.errors.generic");
  });

  it("given an empty object, then returns generic without throwing", () => {
    expect(() => cognitoErrorToLabelKey({})).not.toThrow();
    expect(cognitoErrorToLabelKey({})).toBe("onboarding.email.errors.generic");
  });
});
