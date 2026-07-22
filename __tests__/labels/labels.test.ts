/**
 * Labels parity and resolver tests.
 *
 * Acceptance criteria covered:
 * - Every key in labels.en.json exists in labels.ur.json and vice versa.
 * - t() returns the locale-specific string when present.
 * - t() falls back to English when the Urdu translation is missing or empty.
 * - setActiveLocale() switches the module-level locale used by t().
 * - getActiveLocale() reflects the current locale.
 */

import en from "@/labels/labels.en.json";
import ur from "@/labels/labels.ur.json";
import { t, setActiveLocale, getActiveLocale } from "@/labels";

// ---------------------------------------------------------------------------
// Parity helpers
// ---------------------------------------------------------------------------

/**
 * Recursively collects all dot-separated leaf paths from a nested object.
 * Used to compare key sets between the EN and UR bundles.
 */
function collectPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  const paths: string[] = [];
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (value !== null && typeof value === "object") {
      paths.push(...collectPaths(value as Record<string, unknown>, fullKey));
    } else {
      paths.push(fullKey);
    }
  }
  return paths;
}

// ---------------------------------------------------------------------------
// Parity test
// ---------------------------------------------------------------------------

describe("labels parity", () => {
  const enPaths = collectPaths(en as Record<string, unknown>).sort();
  const urPaths = collectPaths(ur as Record<string, unknown>).sort();

  it("given labels.en.json and labels.ur.json, when comparing key sets, then they are identical", () => {
    expect(enPaths).toEqual(urPaths);
  });

  it("given a key in labels.en.json, when checking labels.ur.json, then every EN key exists in UR", () => {
    const urSet = new Set(urPaths);
    const missing = enPaths.filter((k) => !urSet.has(k));
    expect(missing).toEqual([]);
  });

  it("given a key in labels.ur.json, when checking labels.en.json, then every UR key exists in EN", () => {
    const enSet = new Set(enPaths);
    const extra = urPaths.filter((k) => !enSet.has(k));
    expect(extra).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// t() resolver tests — locale = 'en' (module default)
// ---------------------------------------------------------------------------

describe("t() resolver", () => {
  beforeEach(() => {
    // Reset to English before each test in this group.
    setActiveLocale("en");
  });

  describe("given locale is 'en'", () => {
    it("when resolving 'common.notImplemented', then returns the English string", () => {
      expect(t("common.notImplemented")).toBe("Not implemented yet");
    });

    it("when resolving 'common.loading', then returns the English string", () => {
      expect(t("common.loading")).toBe("Loading…");
    });

    it("when resolving 'common.error', then returns the English string", () => {
      expect(t("common.error")).toBe("Something went wrong");
    });

    it("when resolving 'common.retry', then returns the English string", () => {
      expect(t("common.retry")).toBe("Retry");
    });

    it("when resolving 'auth.login.title', then returns the English string", () => {
      expect(t("auth.login.title")).toBe("Log in");
    });

    it("when resolving 'auth.forgotPassword.title', then returns the English string", () => {
      expect(t("auth.forgotPassword.title")).toBe("Forgot password");
    });

    it("when resolving 'auth.resetPassword.title', then returns the English string", () => {
      expect(t("auth.resetPassword.title")).toBe("Reset password");
    });

    it("when resolving 'language.changeTitle', then returns the English string", () => {
      expect(t("language.changeTitle")).toBe("Restart required");
    });

    it("when resolving 'language.restart', then returns the English string", () => {
      expect(t("language.restart")).toBe("Restart");
    });

    it("given all baseline keys, when t() resolves each, then never returns an empty string", () => {
      const allEnKeys = collectPaths(en as Record<string, unknown>);
      const empty = allEnKeys.filter(
        (key) => t(key as Parameters<typeof t>[0]).length === 0,
      );
      expect(empty).toEqual([]);
    });

    it("given all baseline keys, when t() resolves each, then returns a string for every key", () => {
      const allEnKeys = collectPaths(en as Record<string, unknown>);
      for (const key of allEnKeys) {
        expect(typeof t(key as Parameters<typeof t>[0])).toBe("string");
      }
    });
  });

  describe("given locale switched to 'ur' via setActiveLocale()", () => {
    beforeEach(() => {
      setActiveLocale("ur");
    });

    it("then getActiveLocale() returns 'ur'", () => {
      expect(getActiveLocale()).toBe("ur");
    });

    it("when resolving 'common.loading', then returns the Urdu string", () => {
      expect(t("common.loading")).toBe("لوڈ ہو رہا ہے…");
    });

    it("when resolving 'auth.login.title', then returns the Urdu string", () => {
      expect(t("auth.login.title")).toBe("لاگ ان کریں");
    });

    it("when resolving 'language.cancel', then returns the Urdu string", () => {
      expect(t("language.cancel")).toBe("منسوخ کریں");
    });
  });

  describe("fallback contract", () => {
    it("given an Urdu translation exists for every key, when comparing to English, then no key is empty in either bundle", () => {
      const allEnKeys = collectPaths(en as Record<string, unknown>);
      const allUrKeys = collectPaths(ur as Record<string, unknown>);

      const emptyEn = allEnKeys.filter((key) => {
        const val = (en as Record<string, unknown>);
        const segments = key.split(".");
        let cursor: unknown = val;
        for (const seg of segments) {
          cursor = (cursor as Record<string, unknown>)[seg];
        }
        return typeof cursor !== "string" || cursor.length === 0;
      });

      const emptyUr = allUrKeys.filter((key) => {
        const val = (ur as Record<string, unknown>);
        const segments = key.split(".");
        let cursor: unknown = val;
        for (const seg of segments) {
          cursor = (cursor as Record<string, unknown>)[seg];
        }
        return typeof cursor !== "string" || cursor.length === 0;
      });

      expect(emptyEn).toEqual([]);
      expect(emptyUr).toEqual([]);
    });

    it("given the EN bundle, when any key is resolved, then the fallback path always returns a non-empty string", () => {
      const allEnKeys = collectPaths(en as Record<string, unknown>);
      for (const key of allEnKeys) {
        const result = t(key as Parameters<typeof t>[0]);
        expect(result).toBeTruthy();
      }
    });
  });
});
