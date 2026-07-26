import { fontFamily } from "./typography";
import { getActiveLocale } from "@/labels";

/**
 * Supported locale codes for font family selection.
 * Identical to `LanguageProvider.SupportedLocale`.
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
 * Returns the font family object appropriate for the active locale.
 *
 * - When locale is `'en'` (or any non-Urdu locale), returns `fontFamily.primary`
 *   (Plus Jakarta Sans).
 * - When locale is `'ur'`, returns `fontFamily.urdu` (Noto Nastaliq Urdu).
 *
 * Reads the active locale from the module-level store in `@/labels`, which is
 * updated by `LanguageProvider` on every locale change via `setActiveLocale()`.
 * This avoids a React context dependency and allows the hook to work in any
 * component tree regardless of provider wrapping.
 *
 * Consumed by the `Text` and `Heading` catalog components so they automatically
 * render in the correct script without receiving an explicit `fontFamily` prop
 * from the caller.
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
  const locale = getActiveLocale() as SupportedLocale;
  return selectFontFamily(locale);
}

/**
 * Line-height multiplier applied to Latin-calibrated `textStyles` presets when
 * rendering Nastaliq (Urdu). Nastaliq glyphs extend further above and below the
 * baseline than Latin, so lineHeight values that fit Plus Jakarta Sans clip
 * ascenders/descenders in Noto Nastaliq Urdu. Empirically ~1.4× keeps the
 * script legible without excessive vertical padding.
 */
export const URDU_LINE_HEIGHT_MULTIPLIER = 1.4;

/**
 * Returns the lineHeight multiplier for the active locale. `1` for Latin
 * scripts, `URDU_LINE_HEIGHT_MULTIPLIER` for Urdu. Consumed by `Text`,
 * `Heading`, and `PillButton` to scale preset lineHeight values at render time.
 */
export function useLocaleLineHeightMultiplier(): number {
  const locale = getActiveLocale() as SupportedLocale;
  return locale === "ur" ? URDU_LINE_HEIGHT_MULTIPLIER : 1;
}
