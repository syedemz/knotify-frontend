import { fontFamily } from "./typography";

/**
 * Supported locale codes for font family selection.
 * Extended to a full union type when `LanguageProvider` (story 1.8) is wired.
 */
export type SupportedLocale = "en" | "ur";

/**
 * Pure function that maps a locale code to the correct font family object.
 * Exported for unit testing without requiring a live hook context.
 *
 * @param locale - The active locale code.
 * @returns `fontFamily.urdu` when locale is `'ur'`, otherwise `fontFamily.primary`.
 */
export function selectFontFamily(
  locale: SupportedLocale,
): typeof fontFamily.primary | typeof fontFamily.urdu {
  return locale === "ur" ? fontFamily.urdu : fontFamily.primary;
}

/**
 * Stub locale context used until `LanguageProvider` is implemented in story 1.8.
 *
 * @returns The current locale. Defaults to `'en'` until the real provider is wired.
 *
 * TODO(1.8): Replace this stub with `useContext(LanguageContext)` once
 * `LanguageProvider` is implemented in story 1.8. The hook signature and
 * return type will remain identical — only the data source changes.
 */
function useLocale(): SupportedLocale {
  // Stub: returns English until LanguageProvider (story 1.8) is available.
  return "en";
}

/**
 * Returns the font family object appropriate for the active locale.
 *
 * - When locale is `'en'` (or any non-Urdu locale), returns `fontFamily.primary`
 *   (Plus Jakarta Sans).
 * - When locale is `'ur'`, returns `fontFamily.urdu` (Noto Nastaliq Urdu).
 *
 * Consumed by the `Text` and `Heading` catalog components (stories 1.4–1.6)
 * so they automatically render in the correct script without receiving an
 * explicit `fontFamily` prop from the caller.
 *
 * @returns The font family sub-object for the active locale.
 *
 * @example
 * ```tsx
 * const fonts = useLocalizedFontFamily();
 * // fonts.bold is 'PlusJakartaSans-Bold' when locale === 'en'
 * // fonts.bold is 'NotoNastaliqUrdu-Bold'  when locale === 'ur'
 * ```
 */
export function useLocalizedFontFamily(): typeof fontFamily.primary | typeof fontFamily.urdu {
  const locale = useLocale();
  return selectFontFamily(locale);
}
