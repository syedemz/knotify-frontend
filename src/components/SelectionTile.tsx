import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import { Text } from './Text';

type RadiusKey = keyof Theme['radii'];
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
   * Label displayed BELOW the tile (outside the bordered box).
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
 * Tappable image tile with a label rendered below the bordered box.
 *
 * The image fills the bordered Pressable edge-to-edge (rounded corners clip
 * the image via `overflow: 'hidden'`). The label sits underneath the tile,
 * outside the border.
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
  radius = 'xl',
  shadow = 'sm',
  testID,
}: SelectionTileProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, radius, shadow),
    [theme, radius, shadow],
  );

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.tile,
          { width: imageWidth, height: imageHeight },
          selected && styles.tileSelected,
          pressed && styles.tilePressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ selected }}
        testID={testID}
      >
        <ExpoImage
          source={imageSource}
          style={styles.image}
          contentFit="cover"
          // The enclosing Pressable already carries the accessibility label.
          // Marking the image as decorative prevents duplicate screen-reader
          // announcements and avoids ambiguous label matches in tests.
          accessibilityLabel=""
          accessible={false}
        />
      </Pressable>
      <Text variant="body.md" color="primary" align="center">
        {label}
      </Text>
    </View>
  );
}

function createStyles(theme: Theme, radius: RadiusKey, shadow: ShadowKey) {
  const shadowStyle = theme.shadows[shadow];
  return StyleSheet.create({
    wrapper: {
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    tile: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.radii[radius],
      borderWidth: 2,
      borderColor: theme.colors.border.default,
      overflow: 'hidden',
      ...shadowStyle,
    },
    tileSelected: {
      borderColor: theme.colors.accent.primary,
      backgroundColor: theme.colors.bg.primary,
    },
    tilePressed: {
      opacity: 0.75,
    },
    image: {
      width: '100%',
      height: '100%',
    },
  });
}
