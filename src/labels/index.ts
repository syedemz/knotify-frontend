import en from "./labels.en.json";
import ur from "./labels.ur.json";
import type { SupportedLocale } from "@/theme/useLocalizedFontFamily";
import type { LabelKey } from "./labels.types";

// ---------------------------------------------------------------------------
// Stub locale context
// ---------------------------------------------------------------------------

/**
 * Stub that returns the active locale until `LanguageProvider` is wired in
 * story 1.8. The returned value controls which translation bundle `t()` reads.
 *
 * @returns `'en'` — hard-coded until story 1.8 replaces this stub.
 *
 * TODO(1.8): Replace the body of this function with
 * `useContext(LanguageContext).locale` once `LanguageProvider` is implemented.
 * The call-site signature of `t()` will remain identical — only this internal
 * data source changes.
 */
function getActiveLocale(): SupportedLocale {
  // Stub: returns English until LanguageProvider (story 1.8) is available.
  return "en";
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** The translation bundles keyed by locale. */
const bundles: Record<SupportedLocale, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  ur: ur as Record<string, unknown>,
};

/**
 * Walks a nested object using a dot-separated path string and returns the
 * leaf value, or `undefined` if any segment is missing.
 *
 * @param obj  - The object to traverse.
 * @param path - A dot-separated path such as `'auth.login.title'`.
 * @returns The string value at the path, or `undefined`.
 */
function resolvePath(obj: Record<string, unknown>, path: string): string | undefined {
  const segments = path.split(".");
  let cursor: unknown = obj;
  for (const segment of segments) {
    if (cursor === null || typeof cursor !== "object") {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === "string" ? cursor : undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the translated string for `key` in the active locale.
 *
 * Resolution order:
 * 1. Active-locale bundle (from `getActiveLocale()`).
 * 2. English bundle — fallback when the active-locale translation is missing
 *    or empty.
 *
 * The `key` parameter is constrained to `LabelKey`, so passing a key that
 * does not exist in `labels.en.json` is a TypeScript compile error.
 *
 * @param key - A valid label key derived from `labels.en.json`.
 * @returns The translated string, never `undefined`.
 *
 * @example
 * ```ts
 * import { t } from '@/labels';
 *
 * const label = t('common.loading');  // 'Loading…' (en) or 'لوڈ ہو رہا ہے…' (ur)
 * const bad   = t('common.missing'); // TS error — key does not exist
 * ```
 */
export function t(key: LabelKey): string {
  const locale = getActiveLocale();
  const localeBundle = bundles[locale];
  const translated = resolvePath(localeBundle, key);
  if (translated !== undefined && translated.length > 0) {
    return translated;
  }
  // Fall back to English when the locale translation is absent or empty.
  const fallback = resolvePath(bundles.en, key);
  // The key is a compile-time-validated LabelKey, so the English fallback
  // always exists. The non-null assertion below is safe because LabelKey
  // is derived from labels.en.json itself.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return fallback!;
}

export type { LabelKey } from "./labels.types";
