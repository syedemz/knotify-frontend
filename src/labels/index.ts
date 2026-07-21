import en from "./labels.en.json";
import ur from "./labels.ur.json";
import type { LabelKey } from "./labels.types";

// ---------------------------------------------------------------------------
// Module-level locale store
// ---------------------------------------------------------------------------

/**
 * Supported locale codes. Kept as a local alias to avoid a circular
 * import with `state/i18n/LanguageProvider` (which imports `t()` from here).
 * The string literal union is identical to `LanguageProvider.SupportedLocale`.
 */
type ActiveLocale = "en" | "ur";

/**
 * Module-level active locale.
 *
 * Initialised to `'en'`. `LanguageProvider` calls `setActiveLocale()` on
 * mount (after hydrating from AsyncStorage) and on every locale change, so
 * `t()` always returns the correct translation without requiring hooks.
 */
let _activeLocale: ActiveLocale = "en";

/**
 * Updates the module-level locale used by `t()`.
 *
 * Called by `LanguageProvider` whenever the active locale changes. This
 * avoids a circular dependency between the label resolver and the provider:
 * `LanguageProvider` imports `setActiveLocale` from here (one direction only).
 *
 * @param locale - The new active locale.
 */
export function setActiveLocale(locale: ActiveLocale): void {
  _activeLocale = locale;
}

/**
 * Returns the current active locale as set by `LanguageProvider`.
 *
 * Exported for testing; application code should use `t()` directly.
 *
 * @returns The current {@link ActiveLocale}.
 */
export function getActiveLocale(): ActiveLocale {
  return _activeLocale;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** The translation bundles keyed by locale. */
const bundles: Record<ActiveLocale, Record<string, unknown>> = {
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
 * 1. Active-locale bundle (from the locale set by `LanguageProvider` via
 *    `setActiveLocale()`).
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
  const locale = _activeLocale;
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
