import React, { useMemo } from "react";
import { StyleSheet, View, Text as RNText } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import type { Theme } from "@/theme/theme";

/**
 * Size preset for the avatar.
 *
 * - `'sm'`: 32px
 * - `'md'`: 48px (default)
 * - `'lg'`: 64px
 * - `'xl'`: 96px
 */
export type AvatarSize = "sm" | "md" | "lg" | "xl";

/**
 * Props for the `Avatar` component.
 */
export interface AvatarProps {
  /**
   * Remote or local image URI for the avatar photo.
   * When `undefined`, the initials fallback is rendered.
   */
  uri?: string;
  /**
   * Initials to display when no image URI is provided (1–2 characters).
   *
   * @default '?'
   */
  initials?: string;
  /**
   * Size preset.
   *
   * @default 'md'
   */
  size?: AvatarSize;
  /**
   * Accessibility label. Required for screen reader support.
   */
  accessibilityLabel: string;
}

/** Pixel dimensions for each avatar size preset. */
const SIZE_PX: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

/**
 * Circular avatar component with an image-or-initials fallback.
 *
 * When a `uri` is supplied, renders the photo via `expo-image` with
 * `contentFit="cover"`. When no `uri` is given, renders a filled circle in
 * `accent.tertiary` with up to 2 initials characters. All appearance values
 * derive from theme tokens.
 *
 * @example
 * ```tsx
 * <Avatar uri={profile.photoUrl} accessibilityLabel="Aisha's photo" />
 * <Avatar initials="AK" size="lg" accessibilityLabel="Aisha Khan" />
 * ```
 */
export function Avatar({
  uri,
  initials = "?",
  size = "md",
  accessibilityLabel,
}: AvatarProps) {
  const theme = useTheme();
  const px = SIZE_PX[size];
  const styles = useMemo(
    () => createStyles(theme, px),
    [theme, px],
  );

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      {uri !== undefined ? (
        <ExpoImage
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={accessibilityLabel}
        />
      ) : (
        <RNText style={styles.initials}>
          {initials.slice(0, 2).toUpperCase()}
        </RNText>
      )}
    </View>
  );
}

function createStyles(theme: Theme, px: number) {
  return StyleSheet.create({
    container: {
      width: px,
      height: px,
      borderRadius: px / 2,
      backgroundColor: theme.colors.accent.tertiary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    image: {
      width: px,
      height: px,
    },
    initials: {
      ...textStyles.label.md,
      color: theme.colors.text.inverse,
      fontSize: px * 0.35,
      lineHeight: px * 0.45,
    },
  });
}
