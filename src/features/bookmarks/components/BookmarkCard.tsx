/**
 * BookmarkCard — portrait image card for the Bookmarks grid.
 *
 * Displays a bookmarked `DummyDeckProfile` as a 3:4 portrait card with a
 * full-bleed background image and a flat semi-opaque scrim at the bottom
 * showing the profile's name and age / job title.
 *
 * **Scrim:** Plain `View` with `backgroundColor: 'rgba(0,0,0,0.55)'` spanning
 * the bottom ~28% of the card. NO `LinearGradient`, NO `expo-linear-gradient`.
 * This is the intentional MVP; revisit with a real gradient if the flat scrim
 * reads harshly on device photos.
 *
 * **Image source:** Resolved via `resolveDummyPhoto()` from
 * `src/assets/dummyPhotoRegistry.ts`. Falls back to `theme.colors.bg.surface`
 * solid background if `resolveDummyPhoto()` returns `undefined`.
 *
 * **Border / shadow:** 3px border in `theme.colors.accent.primary` (brand pink)
 * paired with `theme.shadows.sm` to give a clean raised-card look without
 * overwhelming the fixture photos. The accent border colour reads better than
 * `border.default` (light gray) against the full-bleed images.
 *
 * @module features/bookmarks/components/BookmarkCard
 */

import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Column, Heading, Text } from '@/components';
import { useTheme } from '@/theme';
import { resolveDummyPhoto } from '@/assets/dummyPhotoRegistry';
import type { DummyDeckProfile } from '@/types/DummyDeckProfile';
import type { Theme } from '@/theme/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Props for the `BookmarkCard` component.
 */
export interface BookmarkCardProps {
  /**
   * The bookmarked deck profile to display.
   */
  readonly bookmark: DummyDeckProfile;

  /**
   * Called when the whole card is pressed.
   * Callers navigate to `BookmarkDeckViewScreen` with the `userId`.
   */
  readonly onPress: () => void;

  /**
   * Optional test ID forwarded to the `Pressable` root.
   *
   * @default undefined
   */
  readonly testID?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Portrait image card for the 2-column Bookmarks grid.
 *
 * The full card is a single `Pressable` touch target. Pressing triggers
 * `onPress` with a slight opacity reduction (`0.85`) for feedback.
 *
 * Overlay contents (bottom scrim):
 * - Line 1: Full name (`first_name last_name`) in `heading.sm`.
 * - Line 2: `age · job_title` in `label.sm`. Guards: if `job_title` is
 *   null renders age only; if `age` is null renders job title only.
 *
 * There is NO unbookmark affordance on the card — removal goes through the
 * Star toggle on the Marriage tab.
 *
 * @param props - {@link BookmarkCardProps}
 */
export function BookmarkCard({ bookmark, onPress, testID }: BookmarkCardProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // ── Image source ─────────────────────────────────────────────────────────
  // Prefer photos[0]; fall through to photo_url. If neither resolves via the
  // registry, imageSource stays undefined and the card renders a solid
  // bg.surface background.
  const rawPath: string | undefined = bookmark.photos[0] ?? bookmark.photo_url ?? undefined;
  const imageSource = resolveDummyPhoto(rawPath);

  // ── Overlay subtitle ─────────────────────────────────────────────────────
  // "age · job_title" with guards for null on either side.
  const subtitle: string = (() => {
    const age = bookmark.age;
    const job = bookmark.job_title;
    if (age !== null && job !== null) {
      return `${age} · ${job}`;
    }
    if (age !== null) {
      return String(age);
    }
    if (job !== null) {
      return job;
    }
    return '';
  })();

  // ── Accessibility label ───────────────────────────────────────────────────
  const a11yLabel = [
    `${bookmark.first_name} ${bookmark.last_name}`,
    bookmark.age !== null ? String(bookmark.age) : null,
    bookmark.job_title,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      testID={testID}
    >
      {/* Full-bleed background image or solid fallback */}
      {imageSource !== undefined ? (
        <Image
          source={imageSource}
          style={styles.backgroundImage}
          resizeMode="cover"
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      ) : (
        <View style={styles.imageFallback} />
      )}

      {/* Bottom scrim with name + subtitle overlay */}
      <View style={styles.scrim}>
        <Column gap="xs">
          <Heading variant="heading.sm" color="inverse" numberOfLines={1}>
            {`${bookmark.first_name} ${bookmark.last_name}`}
          </Heading>
          {subtitle.length > 0 && (
            <Text variant="label.sm" color="inverse" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </Column>
      </View>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      // flexBasis 48% pins each cell to half the row regardless of item count.
      // Without an explicit width, the card would collapse to 0×0 (its contents
      // are absoluteFill) — only the 3px pink border would render as a dot.
      // Using flexBasis (not flex:1) means a lone card in an odd-count row
      // still occupies half the width instead of stretching to full-width.
      flexBasis: '48%',
      flexGrow: 0,
      // 4:5 portrait — a softer portrait than 3:4 that pairs better with the
      // fixture photos (all 1024×1024 square). At 3:4 `resizeMode="cover"` on a
      // square source crops ~33% of the image; 4:5 drops that to ~20%.
      aspectRatio: 4 / 5,
      borderRadius: theme.radii.lg,
      borderWidth: 3,
      borderColor: theme.colors.accent.primary,
      overflow: 'hidden',
      marginBottom: theme.spacing.md,
      // Shadow — sm tier; md reads too heavy against the thin border.
      ...theme.shadows.sm,
    },
    cardPressed: {
      opacity: 0.85,
    },
    backgroundImage: {
      // Explicit width/height are required here — StyleSheet.absoluteFill
      // (top/left/right/bottom: 0) does not reliably stretch <Image> inside
      // an aspectRatio-sized parent. The image falls back to its intrinsic
      // dimensions (1024×1024) anchored top-left, showing only the corner
      // of the photo super-zoomed. width/height percentages are computed
      // against the parent's already-known dimensions and work correctly
      // with resizeMode="cover".
      width: '100%',
      height: '100%',
    },
    imageFallback: {
      // Solid bg.surface background when no registered asset is available.
      ...StyleSheet.absoluteFill,
      backgroundColor: theme.colors.bg.surface,
    },
    scrim: {
      // Flat semi-opaque scrim covering the bottom ~28% of the card.
      // position absolute keeps it over the image.
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      // 28% approximated via padding; the Column's content height is dynamic.
      // Using paddingVertical ensures the scrim wraps tightly around the text.
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
  });
}
