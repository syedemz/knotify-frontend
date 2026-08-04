/**
 * ProfileThumbnailCircle — a pressable avatar wrapper with an optional
 * edit-pencil dot overlay.
 *
 * Composes the existing `<Avatar />` primitive (`src/components/Avatar.tsx`)
 * rather than reimplementing avatar rendering. The optional pencil badge is
 * positioned absolutely in the bottom-right corner of the avatar circle using
 * a `lucide-react-native` `Pencil` icon.
 *
 * @module features/profile/components/ProfileThumbnailCircle
 */

import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Props for {@link ProfileThumbnailCircle}.
 */
export interface ProfileThumbnailCircleProps {
  /**
   * URI for the avatar image. Passed directly to the underlying `<Avatar />`.
   */
  readonly uri: string;
  /**
   * Callback fired when the avatar is pressed. When omitted the element is
   * non-interactive (renders as a plain `<View>`).
   */
  readonly onPress?: () => void;
  /**
   * When `true`, renders a small pencil-icon badge in the bottom-right corner
   * of the avatar circle.
   *
   * @default false
   */
  readonly showEditDot?: boolean;
  /**
   * Pixel diameter of the avatar circle. Passed to `<Avatar />` as a named
   * size preset matched by value.
   *
   * @default 64
   */
  readonly size?: number;
  /**
   * Accessibility label for the pressable wrapper.
   *
   * @default 'Profile photo'
   */
  readonly accessibilityLabel?: string;
  /**
   * Optional test identifier forwarded to the outermost element.
   */
  readonly testID?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

/** Default diameter of the avatar circle in pixels. */
const DEFAULT_SIZE = 64;

/** Size of the pencil icon in pixels. */
const BADGE_ICON_SIZE = 12;

/** Total diameter of the badge container (icon + padding). */
const BADGE_CONTAINER_SIZE = 22;

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders a circular avatar that is optionally pressable. When `showEditDot`
 * is `true`, an absolutely-positioned pencil icon badge appears in the
 * bottom-right quadrant of the circle.
 *
 * The avatar itself is rendered by `<Avatar />` — no image logic lives here.
 *
 * @example
 * ```tsx
 * <ProfileThumbnailCircle
 *   uri={profile.photos[0]}
 *   onPress={() => navigation.navigate('MyProfileScreen', { initialTab: 'preview' })}
 *   showEditDot
 *   size={72}
 * />
 * ```
 */
export function ProfileThumbnailCircle({
  uri,
  onPress,
  showEditDot = false,
  size = DEFAULT_SIZE,
  accessibilityLabel = 'Profile photo',
  testID,
}: ProfileThumbnailCircleProps): React.ReactElement {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme, size), [theme, size]);

  // Map numeric px size to the nearest Avatar size preset. Avatar accepts
  // 'sm'|'md'|'lg'|'xl' — pick the closest preset by px value.
  const avatarSizePreset: 'sm' | 'md' | 'lg' | 'xl' =
    size <= 32 ? 'sm' : size <= 48 ? 'md' : size <= 64 ? 'lg' : 'xl';

  const innerContent = (
    <>
      <Avatar
        uri={uri}
        size={avatarSizePreset}
        accessibilityLabel={accessibilityLabel}
      />
      {showEditDot && (
        <View style={styles.badge} testID="profile-thumbnail-edit-dot">
          <Pencil
            size={BADGE_ICON_SIZE}
            color={theme.colors.text.inverse}
            strokeWidth={2}
          />
        </View>
      )}
    </>
  );

  if (onPress === undefined) {
    return (
      <View style={styles.wrapper} testID={testID ?? 'profile-thumbnail-circle'}>
        {innerContent}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID ?? 'profile-thumbnail-circle'}
      style={({ pressed }) => [styles.wrapper, pressed && styles.pressed]}
    >
      {innerContent}
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme, size: number) {
  return StyleSheet.create({
    wrapper: {
      width: size,
      height: size,
      position: 'relative',
    },
    badge: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: BADGE_CONTAINER_SIZE,
      height: BADGE_CONTAINER_SIZE,
      borderRadius: BADGE_CONTAINER_SIZE / 2,
      backgroundColor: theme.colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.bg.primary,
    },
    pressed: {
      opacity: 0.8,
    },
  });
}
