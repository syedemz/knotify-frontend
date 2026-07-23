import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image as ExpoImage } from "expo-image";
import type { Theme } from "@/theme/theme";
import { useTheme } from "@/theme";

/**
 * Props for the `ScreenBackground` component.
 */
export interface ScreenBackgroundProps {
  /**
   * The image source — a `require()` result or `{ uri: string }`.
   */
  source: number | { uri: string };
  /**
   * Accessibility label for the background image.
   * Use an empty string for purely decorative backgrounds.
   *
   * @default ''
   */
  accessibilityLabel?: string;
  /**
   * When true, wraps children in a `SafeAreaView` to respect device insets.
   *
   * @default true
   */
  safe?: boolean;
  /**
   * Content rendered on top of the background image.
   */
  children?: React.ReactNode;
}

/**
 * Full-screen background image container.
 *
 * Renders an image that fills the entire screen using `StyleSheet.absoluteFillObject`,
 * with children rendered on top in a flex column. Handles safe-area insets when
 * `safe` is true (the default).
 *
 * Used by screens that need a full-bleed photographic or illustrated background
 * (e.g., the welcome screen). All style values derive from the theme — no raw
 * pixel values, no inline style objects in the consuming screen.
 *
 * @example
 * ```tsx
 * import { images } from '@/config/images';
 * <ScreenBackground source={images.onboarding.background}>
 *   <Column flex>
 *     <Text>Content on top</Text>
 *   </Column>
 * </ScreenBackground>
 * ```
 */
export function ScreenBackground({
  source,
  accessibilityLabel = "",
  safe = true,
  children,
}: ScreenBackgroundProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const content = safe ? (
    <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
  ) : (
    <View style={styles.content}>{children}</View>
  );

  return (
    <View style={styles.root}>
      <ExpoImage
        source={source}
        style={styles.bg}
        contentFit="cover"
        accessibilityLabel={accessibilityLabel}
        accessibilityElementsHidden={accessibilityLabel === ""}
      />
      {content}
    </View>
  );
}

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    bg: {
      ...StyleSheet.absoluteFill,
    },
    safeArea: {
      flex: 1,
    },
    content: {
      flex: 1,
    },
  });
