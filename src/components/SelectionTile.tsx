import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import { Text } from './Text';

type RadiusKey = keyof Theme['radii'];
type SpacingKey = keyof Theme['spacing'];
type ShadowKey = keyof Theme['shadows'];

/**
 * Props for the `SelectionTile` component.
 */
export interface SelectionTileProps {
  /**
   * Image source — typically a local `require()` reference from `@/config/images`.
   */
  imageSource: number | { uri: string };
  /**
   * Intrinsic width of the tile image in logical pixels.
   *
   * @default 120
   */
  imageWidth?: number;
  /**
   * Intrinsic height of the tile image in logical pixels.
   *
   * @default 120
   */
  imageHeight?: number;
  /**
   * Label displayed below the image.
   */
  label: string;
  /**
   * Callback invoked when the tile is tapped.
   */
  onPress: () => void;
  /**
   * Accessibility label for the tile.
   * Defaults to `label` when not provided.
   */
  accessibilityLabel?: string;
  /**
   * When `true`, renders the tile in a visually selected state (brand-color border).
   *
   * @default false
   */
  selected?: boolean;
  /**
   * Optional testID applied to the pressable container. Useful in tests to
   * target the tile without relying on accessibility label ambiguity.
   */
  testID?: string;
  /**
   * Internal padding of the tile.
   *
   * @default 'lg'
   */
  padding?: SpacingKey;
  /**
   * Border radius of the tile container.
   *
   * @default 'xl'
   */
  radius?: RadiusKey;
  /**
   * Shadow token key.
   *
   * @default 'sm'
   */
  shadow?: ShadowKey;
}

/**
 * Tappable image-and-label tile used for single-choice selection flows
 * (e.g., the sex-selection page in onboarding).
 *
 * The tile is always tappable — there is no locked/disabled state. It
 * displays an image above a text label, with a branded border when `selected`
 * is true. Press feedback is provided via opacity reduction.
 *
 * @example
 * ```tsx
 * <SelectionTile
 *   imageSource={images.onboarding.genderMale}
 *   label="Male"
 *   onPress={() => handleSelect('Male')}
 *   selected={sex === 'Male'}
 * />
 * ```
 */
export function SelectionTile({
  imageSource,
  imageWidth = 120,
  imageHeight = 120,
  label,
  onPress,
  accessibilityLabel,
  selected = false,
  padding = 'lg',
  radius = 'xl',
  shadow = 'sm',
  testID,
}: SelectionTileProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, padding, radius, shadow),
    [theme, padding, radius, shadow],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        selected && styles.tileSelected,
        pressed && styles.tilePressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      testID={testID}
    >
      <View style={styles.imageWrapper}>
        <ExpoImage
          source={imageSource}
          style={{ width: imageWidth, height: imageHeight }}
          contentFit="contain"
          // The enclosing Pressable already carries the accessibility label.
          // Marking the image as decorative prevents duplicate screen-reader
          // announcements and avoids ambiguous label matches in tests.
          accessibilityLabel=""
          accessible={false}
        />
      </View>
      <Text variant="body.md" color="primary" align="center">
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(
  theme: Theme,
  padding: SpacingKey,
  radius: RadiusKey,
  shadow: ShadowKey,
) {
  const shadowStyle = theme.shadows[shadow];
  return StyleSheet.create({
    tile: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.radii[radius],
      padding: theme.spacing[padding],
      borderWidth: 2,
      borderColor: theme.colors.border.default,
      alignItems: 'center',
      ...shadowStyle,
    },
    tileSelected: {
      borderColor: theme.colors.accent.primary,
      backgroundColor: theme.colors.bg.primary,
    },
    tilePressed: {
      opacity: 0.75,
    },
    imageWrapper: {
      marginBottom: theme.spacing.sm,
    },
  });
}
