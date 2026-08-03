/**
 * PhotoTile — a single cell in the page-28 photo grid.
 *
 * Renders in one of two visual states:
 * - **Empty**: dashed-border square with a camera-plus icon. Tapping the tile
 *   calls `onPress`.
 * - **Filled**: the selected local-URI image fills the tile with `cover` fit.
 *   A small circular "×" badge is overlaid in the top-right corner; tapping
 *   that badge calls `onRemove` (with event stopPropagation so it does not
 *   also fire `onPress`). Tapping the tile body itself calls `onPress` to
 *   re-open the picker for replacement.
 *
 * When `permissionDenied` is `true` the empty-state label swaps to a
 * "grant photos access" hint and the tile becomes non-interactive.
 *
 * @module features/onboarding/components/PhotoTile
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Camera } from 'lucide-react-native';
import { X } from 'lucide-react-native';
import { Image } from '@/components/Image';
import { Text } from '@/components/Text';
import { useTheme } from '@/theme';
import { t } from '@/labels';
import type { Theme } from '@/theme/theme';

// ── Props ─────────────────────────────────────────────────────────────────────

/**
 * Props for the `PhotoTile` component.
 */
export interface PhotoTileProps {
  /**
   * The local URI of the selected image, or `undefined` if the tile is empty.
   */
  uri: string | undefined;

  /**
   * 1-based index of this tile within the 6-tile grid.
   * Used to compute accessibility labels.
   */
  index: number;

  /**
   * Tile side dimension in logical pixels.
   *
   * @default 100
   */
  size?: number;

  /**
   * Called when the tile body is pressed — either to open the picker on an
   * empty tile or to re-open it for replacement on a filled tile.
   *
   * Not called when `permissionDenied` is `true`.
   */
  onPress: () => void;

  /**
   * Called when the "×" badge is tapped on a filled tile.
   *
   * Not called on empty tiles; the badge is not rendered when `uri` is
   * `undefined`.
   */
  onRemove: () => void;

  /**
   * When `true`, the tile body press is disabled and the empty-state renders
   * the "grant photos access" hint instead of the camera icon.
   *
   * @default false
   */
  permissionDenied?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Single photo tile for the page-28 profile-photo grid.
 *
 * Handles both empty (tap-to-pick) and filled (image shown, tap-to-replace,
 * badge-to-remove) states, plus a permission-denied hint state.
 *
 * @example
 * ```tsx
 * <PhotoTile
 *   uri={photoUri}
 *   index={1}
 *   size={108}
 *   onPress={handleTilePress}
 *   onRemove={handleRemove}
 *   permissionDenied={isPermissionDenied}
 * />
 * ```
 */
export function PhotoTile({
  uri,
  index,
  size = 100,
  onPress,
  onRemove,
  permissionDenied = false,
}: PhotoTileProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, size),
    [theme, size],
  );

  const isFilled = uri !== undefined;

  const emptyAccessLabel = t('onboarding.photos.tileAccessibilityEmpty');
  const filledAccessLabel = t('onboarding.photos.tileAccessibilityFilled').replace(
    '{{index}}',
    String(index),
  );
  const removeAccessLabel = t('onboarding.photos.removePhotoAccessibility');

  return (
    <Pressable
      onPress={permissionDenied ? undefined : onPress}
      disabled={permissionDenied && !isFilled}
      accessibilityLabel={isFilled ? filledAccessLabel : emptyAccessLabel}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.tile,
        isFilled ? styles.tileFilled : styles.tileEmpty,
        pressed && !permissionDenied && styles.tilePressed,
      ]}
    >
      {isFilled ? (
        <>
          {/* Filled state: image fills the tile. The parent Pressable carries
              the accessibility label, so the image is decorative here. */}
          <Image
            source={{ uri }}
            width={size}
            height={size}
            contentFit="cover"
            accessibilityLabel=""
          />

          {/* Remove badge — overlaid top-right, independent hit target */}
          <Pressable
            onPress={onRemove}
            accessibilityLabel={removeAccessLabel}
            accessibilityRole="button"
            style={styles.removeBadge}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <X
              size={10}
              color={theme.colors.text.inverse}
              strokeWidth={2.5}
            />
          </Pressable>
        </>
      ) : permissionDenied ? (
        /* Permission-denied hint */
        <View style={styles.hintContainer}>
          <Text variant="body.sm" color="tertiary" align="center">
            {t('onboarding.photos.grantAccessHint')}
          </Text>
        </View>
      ) : (
        /* Empty state: camera icon */
        <Camera
          size={24}
          color={theme.colors.text.tertiary}
          strokeWidth={1.5}
        />
      )}
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme, size: number) {
  return StyleSheet.create({
    tile: {
      width: size,
      height: size,
      borderRadius: theme.radii.md,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileEmpty: {
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.colors.border.strong,
      borderStyle: 'dashed',
      backgroundColor: theme.colors.bg.input,
    },
    tileFilled: {
      borderWidth: 0,
      backgroundColor: theme.colors.bg.input,
    },
    tilePressed: {
      opacity: 0.85,
    },
    removeBadge: {
      position: 'absolute',
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      width: 20,
      height: 20,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.bg.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hintContainer: {
      paddingHorizontal: theme.spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
