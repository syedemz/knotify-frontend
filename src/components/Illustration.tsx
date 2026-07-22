import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];

/**
 * Size preset for the illustration.
 *
 * - `'sm'`: 160×160
 * - `'md'`: 220×220 (default — matches §11 "200–280px" guidance)
 * - `'lg'`: 280×280
 */
export type IllustrationSize = "sm" | "md" | "lg";

/** Pixel dimensions for each illustration size preset. */
const SIZE_PX: Record<IllustrationSize, number> = {
  sm: 160,
  md: 220,
  lg: 280,
};

/**
 * Props for the `Illustration` component.
 */
export interface IllustrationProps {
  /**
   * Local SVG/PNG source via `require()` or a remote URI string.
   * Per §11 from `theme.md`, illustrations must be line-art PNGs/SVGs
   * placed in `src/assets/illustrations/`.
   */
  source: number | { uri: string };
  /**
   * Size preset.
   *
   * @default 'md'
   */
  size?: IllustrationSize;
  /**
   * Optional bottom margin token key from `theme.spacing`.
   *
   * @default undefined
   */
  marginBottom?: SpacingKey;
  /**
   * Accessibility label. Pass `''` for purely decorative illustrations.
   */
  accessibilityLabel: string;
}

/**
 * App illustration rendered via `expo-image`.
 *
 * Per §11 from `theme.md`, illustrations are black-and-white line-art
 * with selective brand-pink color pops. They are sourced from
 * `src/assets/illustrations/` as SVG or PNG files. This component acts
 * as a placeholder until the user provides the actual assets.
 *
 * All size values derive from theme-aware presets — no raw pixel values
 * in JSX.
 *
 * @example
 * ```tsx
 * <Illustration
 *   source={require('@/assets/illustrations/no-matches.png')}
 *   size="md"
 *   marginBottom="xxl"
 *   accessibilityLabel="No matches illustration"
 * />
 * ```
 */
export function Illustration({
  source,
  size = "md",
  marginBottom,
  accessibilityLabel,
}: IllustrationProps) {
  const theme = useTheme();
  const px = SIZE_PX[size];
  const styles = useMemo(
    () => createStyles(theme, px, marginBottom),
    [theme, px, marginBottom],
  );

  const decorative = accessibilityLabel === "";

  return (
    <View
      style={styles.container}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "yes"}
      accessibilityRole="image"
    >
      <ExpoImage
        source={source}
        style={styles.image}
        contentFit="contain"
        accessibilityLabel={decorative ? undefined : accessibilityLabel}
      />
    </View>
  );
}

function createStyles(
  theme: Theme,
  px: number,
  marginBottom: SpacingKey | undefined,
) {
  return StyleSheet.create({
    container: {
      width: px,
      height: px,
      alignItems: "center",
      justifyContent: "center",
      ...(marginBottom !== undefined && {
        marginBottom: theme.spacing[marginBottom],
      }),
    },
    image: {
      width: px,
      height: px,
    },
  });
}
