import React, { useMemo } from "react";
import { StyleSheet, Text as RNText } from "react-native";
import { useTheme } from "@/theme";
import {
  useLocaleLineHeightMultiplier,
  useLocalizedFontFamily,
} from "@/theme/useLocalizedFontFamily";
import { textStyles as allTextStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

type TextColor = keyof Theme["colors"]["text"];

/**
 * The text variant names that map to body / label / caption presets.
 * Heading and display presets are served by the `Heading` component.
 */
export type TextVariant =
  | "body.lg"
  | "body.md"
  | "body.sm"
  | "label.lg"
  | "label.md"
  | "label.sm"
  | "caption";

/**
 * Props for the `Text` component.
 */
export interface TextProps {
  /**
   * Typography preset from the type scale.
   *
   * @default 'body.md'
   */
  variant?: TextVariant;
  /**
   * Text color token key from `theme.colors.text`.
   *
   * @default 'primary'
   */
  color?: TextColor;
  /**
   * Text alignment.
   *
   * @default 'left'
   */
  align?: "left" | "center" | "right";
  /**
   * Number of lines before the text is truncated. `0` means no limit.
   *
   * @default 0
   */
  numberOfLines?: number;
  /**
   * Accessibility label. Defaults to the text content when not supplied.
   */
  accessibilityLabel?: string;
  /**
   * Text content.
   */
  children: React.ReactNode;
}

/**
 * Themed text component for body, label, and caption text styles.
 *
 * Automatically uses the correct font family for the active locale:
 * Plus Jakarta Sans for `en`, Noto Nastaliq Urdu for `ur`. Consumers must
 * never pass a `fontFamily` prop — the locale-appropriate font is applied
 * internally via `useLocalizedFontFamily()`.
 *
 * For display and heading styles, use the `Heading` component instead.
 *
 * @example
 * ```tsx
 * <Text variant="body.lg" color="secondary">Some body text</Text>
 * <Text variant="label.md" color="brand" align="center">Tap to continue</Text>
 * ```
 */
export function Text({
  variant = "body.md",
  color = "primary",
  align = "left",
  numberOfLines = 0,
  accessibilityLabel,
  children,
}: TextProps) {
  const theme = useTheme();
  const fontFamilySet = useLocalizedFontFamily();
  const lineHeightMultiplier = useLocaleLineHeightMultiplier();
  const styles = useMemo(
    () => createStyles(theme, fontFamilySet, lineHeightMultiplier, variant, color, align),
    [theme, fontFamilySet, lineHeightMultiplier, variant, color, align],
  );

  return (
    <RNText
      style={styles.text}
      numberOfLines={numberOfLines === 0 ? undefined : numberOfLines}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </RNText>
  );
}

/** Resolves the base TextStyle preset for a given variant string. */
function resolvePreset(variant: TextVariant) {
  if (variant === "caption") {
    return allTextStyles.caption;
  }
  const [category, size] = variant.split(".") as [
    "body" | "label",
    "lg" | "md" | "sm",
  ];
  return allTextStyles[category][size];
}

function createStyles(
  theme: Theme,
  fontFamilySet: ReturnType<typeof useLocalizedFontFamily>,
  lineHeightMultiplier: number,
  variant: TextVariant,
  color: TextColor,
  align: "left" | "center" | "right",
) {
  const preset = resolvePreset(variant);
  // Determine the weight sub-key from the preset's fontFamily string.
  // The preset fontFamily was set against fontFamily.primary; we remap it to
  // the localized family by matching the weight suffix.
  const localizedFontFamily = remapFontFamily(preset.fontFamily as string, fontFamilySet);
  // Nastaliq needs more vertical headroom than Latin at the same fontSize —
  // scale the preset lineHeight for the active locale.
  const presetLineHeight = preset.lineHeight;
  const localizedLineHeight =
    typeof presetLineHeight === "number"
      ? Math.round(presetLineHeight * lineHeightMultiplier)
      : presetLineHeight;

  return StyleSheet.create({
    text: {
      ...preset,
      fontFamily: localizedFontFamily,
      lineHeight: localizedLineHeight,
      color: theme.colors.text[color],
      textAlign: align,
    },
  });
}

/**
 * Maps a `fontFamily.primary.*` string (e.g. `'PlusJakartaSans-SemiBold'`) to
 * the equivalent weight string in the active locale's font family set.
 *
 * Text variants use Regular, Medium, and SemiBold weights only. The mapping
 * covers all weights present in `textStyles.body.*`, `textStyles.label.*`, and
 * `textStyles.caption` — Bold and ExtraBold are handled by `Heading` instead.
 */
function remapFontFamily(
  primaryFontFamily: string,
  fontFamilySet: ReturnType<typeof useLocalizedFontFamily>,
): string {
  if (primaryFontFamily.endsWith("-Regular")) {
    return fontFamilySet.regular;
  }
  if (primaryFontFamily.endsWith("-Medium")) {
    return fontFamilySet.medium;
  }
  if (primaryFontFamily.endsWith("-SemiBold")) {
    return fontFamilySet.semibold;
  }
  // Fallback: return the primary family string unchanged.
  return primaryFontFamily;
}
