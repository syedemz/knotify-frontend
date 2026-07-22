import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Image as ExpoImage, type ImageContentFit } from "expo-image";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type RadiusKey = keyof Theme["radii"];
type SpacingKey = keyof Theme["spacing"];

/**
 * Props for the `Image` component.
 */
export interface ImageProps {
  /**
   * Remote URI or local require() source for the image.
   */
  source: string | number | { uri: string };
  /**
   * Intrinsic width of the image in logical pixels.
   */
  width: number;
  /**
   * Intrinsic height of the image in logical pixels.
   */
  height: number;
  /**
   * How the image should be resized within its container.
   *
   * @default 'cover'
   */
  contentFit?: ImageContentFit;
  /**
   * Border radius token key from `theme.radii`.
   *
   * @default 'none'
   */
  radius?: RadiusKey;
  /**
   * Optional bottom margin token key from `theme.spacing`.
   *
   * @default undefined
   */
  marginBottom?: SpacingKey;
  /**
   * Accessibility label — required for non-decorative images.
   */
  accessibilityLabel: string;
}

/**
 * Themed image component backed by `expo-image`.
 *
 * Wraps `expo-image` for efficient remote image loading with blurhash
 * placeholder support and cross-platform caching. All border-radius and
 * margin values derive from theme tokens — no raw pixel values.
 *
 * @example
 * ```tsx
 * <Image
 *   source={{ uri: profile.bannerUrl }}
 *   width={320}
 *   height={200}
 *   radius="lg"
 *   accessibilityLabel="Profile banner"
 * />
 * ```
 */
export function Image({
  source,
  width,
  height,
  contentFit = "cover",
  radius = "none",
  marginBottom,
  accessibilityLabel,
}: ImageProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, width, height, radius, marginBottom),
    [theme, width, height, radius, marginBottom],
  );

  const resolvedSource =
    typeof source === "string" ? { uri: source } : source;

  return (
    <View style={styles.container}>
      <ExpoImage
        source={resolvedSource}
        style={styles.image}
        contentFit={contentFit}
        accessibilityLabel={accessibilityLabel}
      />
    </View>
  );
}

function createStyles(
  theme: Theme,
  width: number,
  height: number,
  radius: RadiusKey,
  marginBottom: SpacingKey | undefined,
) {
  return StyleSheet.create({
    container: {
      width,
      height,
      borderRadius: theme.radii[radius],
      overflow: "hidden",
      ...(marginBottom !== undefined && {
        marginBottom: theme.spacing[marginBottom],
      }),
    },
    image: {
      width,
      height,
    },
  });
}
