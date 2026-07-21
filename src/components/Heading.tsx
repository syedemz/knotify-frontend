import React, { useMemo } from "react";
import { StyleSheet, Text as RNText } from "react-native";
import { useTheme } from "@/theme";
import { useLocalizedFontFamily } from "@/theme/useLocalizedFontFamily";
import { textStyles as allTextStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

type TextColor = keyof Theme["colors"]["text"];

/**
 * The heading/display variant names served by the `Heading` component.
 */
export type HeadingVariant =
  | "display.lg"
  | "display.md"
  | "heading.xl"
  | "heading.lg"
  | "heading.md"
  | "heading.sm";

/**
 * Props for the `Heading` component.
 */
export interface HeadingProps {
  /**
   * Typography preset from the display/heading section of the type scale.
   *
   * @default 'heading.xl'
   */
  variant?: HeadingVariant;
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
   * Number of lines before the heading is truncated. `0` means no limit.
   *
   * @default 0
   */
  numberOfLines?: number;
  /**
   * Accessibility label. Defaults to the text content when not supplied.
   */
  accessibilityLabel?: string;
  /**
   * Heading content.
   */
  children: React.ReactNode;
}

/**
 * Themed heading component for display and heading text styles.
 *
 * Automatically uses the correct font family for the active locale:
 * Plus Jakarta Sans for `en`, Noto Nastaliq Urdu for `ur`. Consumers must
 * never pass a `fontFamily` prop — the locale-appropriate font is applied
 * internally via `useLocalizedFontFamily()`.
 *
 * For body, label, and caption styles, use the `Text` component instead.
 *
 * @example
 * ```tsx
 * <Heading variant="display.md">Welcome to Knotify</Heading>
 * <Heading variant="heading.lg" color="brand" align="center">
 *   Find your match
 * </Heading>
 * ```
 */
export function Heading({
  variant = "heading.xl",
  color = "primary",
  align = "left",
  numberOfLines = 0,
  accessibilityLabel,
  children,
}: HeadingProps) {
  const theme = useTheme();
  const fontFamilySet = useLocalizedFontFamily();
  const styles = useMemo(
    () => createStyles(theme, fontFamilySet, variant, color, align),
    [theme, fontFamilySet, variant, color, align],
  );

  return (
    <RNText
      style={styles.heading}
      numberOfLines={numberOfLines === 0 ? undefined : numberOfLines}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="header"
    >
      {children}
    </RNText>
  );
}

/** Resolves the base TextStyle preset for a given heading variant string. */
function resolvePreset(variant: HeadingVariant) {
  const [category, size] = variant.split(".") as [
    "display" | "heading",
    "lg" | "md" | "xl" | "sm",
  ];
  return allTextStyles[category][size as keyof (typeof allTextStyles)[typeof category]];
}

/**
 * Maps a `fontFamily.primary.*` string to the equivalent in the active locale.
 * Noto Nastaliq Urdu has no ExtraBold weight; falls back to Bold.
 */
function remapFontFamily(
  primaryFontFamily: string,
  fontFamilySet: ReturnType<typeof useLocalizedFontFamily>,
): string {
  if (primaryFontFamily.endsWith("-Regular")) return fontFamilySet.regular;
  if (primaryFontFamily.endsWith("-Medium")) return fontFamilySet.medium;
  if (primaryFontFamily.endsWith("-SemiBold")) return fontFamilySet.semibold;
  if (primaryFontFamily.endsWith("-Bold")) return fontFamilySet.bold;
  if (primaryFontFamily.endsWith("-ExtraBold")) {
    return "extrabold" in fontFamilySet
      ? (fontFamilySet as { extrabold: string }).extrabold
      : fontFamilySet.bold;
  }
  return primaryFontFamily;
}

function createStyles(
  theme: Theme,
  fontFamilySet: ReturnType<typeof useLocalizedFontFamily>,
  variant: HeadingVariant,
  color: TextColor,
  align: "left" | "center" | "right",
) {
  const preset = resolvePreset(variant);
  const localizedFontFamily = remapFontFamily(preset.fontFamily as string, fontFamilySet);

  return StyleSheet.create({
    heading: {
      ...preset,
      fontFamily: localizedFontFamily,
      color: theme.colors.text[color],
      textAlign: align,
    },
  });
}
