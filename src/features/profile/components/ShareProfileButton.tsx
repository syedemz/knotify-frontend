/**
 * Reusable share primitive for Knotify user profiles.
 *
 * Three visual variants cover all usage sites identified in phase 12:
 * - `'icon-only'` — 24×24 share glyph, no label (profile1.jpeg top-right).
 * - `'pill'` — rounded outline button, icon left, "Share" label
 *   (profilehome.jpeg next to Edit).
 * - `'row-link'` — centered icon + "Share profile" text, no background
 *   (landing7.jpeg and profile3.jpeg bottom).
 *
 * On press, delegates to React Native's built-in `Share.share`. User
 * dismissal (rejection) is swallowed silently per the phase-12 requirement:
 * the share sheet is a read-only surface — there is no error to propagate.
 *
 * @module features/profile/components/ShareProfileButton
 */

import React, { useMemo, useCallback } from 'react';
import { Pressable, Share, StyleSheet, Text as RNText, View } from 'react-native';
import { Share2 } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import { buildShareMessage } from '../buildShareMessage';
import { t } from '@/labels';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Visual presentation variant.
 *
 * - `'icon-only'` — 24×24 share icon, no text. Fits top-right header slots.
 * - `'pill'` — outline pill with icon + "Share" label. Fits action-bar slots.
 * - `'row-link'` — centered icon + "Share profile" text, transparent. Fits
 *   bottom-of-scroll link rows.
 */
export type ShareProfileButtonVariant = 'icon-only' | 'pill' | 'row-link';

/**
 * Props for {@link ShareProfileButton}.
 */
export interface ShareProfileButtonProps {
  /**
   * A minimal profile slice used by {@link buildShareMessage} to build the
   * share text and deep-link URL.
   */
  readonly profile: Pick<UserProfile, 'user_id' | 'first_name'>;
  /**
   * Visual presentation variant.
   *
   * @default 'icon-only'
   */
  readonly variant?: ShareProfileButtonVariant;
  /**
   * Optional test identifier forwarded to the outermost `Pressable`.
   * Defaults to `share-profile-button-<variant>`.
   */
  readonly testID?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders a share button in one of three visual variants.
 *
 * Pressing the button calls `Share.share` with the output of
 * `buildShareMessage(profile)`. User cancellation of the share sheet is
 * swallowed with `.catch(() => {})` — there is no error state to surface.
 *
 * @example
 * ```tsx
 * // Header icon-only variant
 * <ShareProfileButton profile={dummyprofile} variant="icon-only" />
 *
 * // Pill variant (next to Edit button)
 * <ShareProfileButton profile={dummyprofile} variant="pill" />
 *
 * // Bottom row-link variant
 * <ShareProfileButton profile={dummyprofile} variant="row-link" />
 * ```
 */
export function ShareProfileButton({
  profile,
  variant = 'icon-only',
  testID,
}: ShareProfileButtonProps): React.ReactElement {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const resolvedTestID = testID ?? `share-profile-button-${variant}`;

  const handlePress = useCallback(() => {
    const { message, url } = buildShareMessage(profile);
    Share.share({ message, url }).catch(() => {});
  }, [profile]);

  if (variant === 'icon-only') {
    return (
      <Pressable
        onPress={handlePress}
        testID={resolvedTestID}
        accessibilityLabel={t('share.actionAccessibility')}
        accessibilityRole="button"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Share2
          size={24}
          color={theme.colors.text.primary}
          strokeWidth={1.8}
        />
      </Pressable>
    );
  }

  if (variant === 'pill') {
    return (
      <Pressable
        onPress={handlePress}
        testID={resolvedTestID}
        accessibilityLabel={t('share.actionAccessibility')}
        accessibilityRole="button"
        style={styles.pill}
      >
        <Share2
          size={16}
          color={theme.colors.accent.primary}
          strokeWidth={1.8}
        />
        <RNText style={styles.pillLabel}>{t('share.action')}</RNText>
      </Pressable>
    );
  }

  // variant === 'row-link'
  return (
    <Pressable
      onPress={handlePress}
      testID={resolvedTestID}
      accessibilityLabel={t('share.actionAccessibility')}
      accessibilityRole="button"
      style={styles.rowLink}
    >
      <Share2
        size={18}
        color={theme.colors.accent.primary}
        strokeWidth={1.8}
      />
      <RNText style={styles.rowLinkLabel}>{t('share.actionAccessibility')}</RNText>
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.colors.accent.primary,
    },
    pillLabel: {
      ...textStyles.label.md,
      color: theme.colors.accent.primary,
    },
    rowLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
    },
    rowLinkLabel: {
      ...textStyles.label.md,
      color: theme.colors.accent.primary,
    },
  });
}
