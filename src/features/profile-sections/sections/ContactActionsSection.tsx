/**
 * ContactActionsSection — phone number, share button, and disabled action triad.
 *
 * IMPORTANT role split (contractual):
 * - `viewer === 'self'` → returns `null`. Favourite/Block/Report make no sense
 *   on the self preview; Share is rendered separately by the profile-preview
 *   footer in story 12.5.
 * - `viewer === 'other'` → renders:
 *   1. Phone-number row (hidden if `phone_number` null).
 *   2. `<ShareProfileButton variant="row-link" />` (always shown — Share is
 *      always available).
 *   3. Disabled Favourite / Block / Report triad (buttons render at reduced
 *      opacity, no press handlers).
 *
 * Never hides in the other-viewer variant — Share is always available.
 *
 * @module features/profile-sections/sections/ContactActionsSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { Heart, Shield, Flag } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay, ProfileViewer } from '@/types/DummyOverlay';
import { ShareProfileButton } from '@/features/profile/components/ShareProfileButton';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContactActionsSectionProps {
  readonly profile: UserProfile & DummyOverlay;
  readonly viewer: ProfileViewer;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContactActionsSection({
  profile,
  viewer,
}: ContactActionsSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Contractual: this section is for other-viewer only.
  if (viewer === 'self') {
    return null;
  }

  return (
    <View style={styles.section} testID="contact-actions-section">
      <RNText style={styles.title}>Contact & actions</RNText>

      {/* Phone number row — hidden if null */}
      {profile.phone_number !== null && (
        <View style={styles.phoneRow} testID="contact-phone-row">
          <RNText style={styles.phoneLabel}>Phone</RNText>
          <RNText style={styles.phoneValue}>{profile.phone_number}</RNText>
        </View>
      )}

      {/* Share row — always shown for other-viewer */}
      <ShareProfileButton profile={profile} variant="row-link" />

      {/* Disabled action triad */}
      <View style={styles.actionTriad}>
        <View style={[styles.actionButton, styles.actionButtonDisabled]} testID="contact-favourite-btn">
          <Heart size={22} color={theme.colors.accent.primary} strokeWidth={1.8} />
          <RNText style={styles.actionLabel}>Favourite</RNText>
        </View>
        <View style={[styles.actionButton, styles.actionButtonDisabled]} testID="contact-block-btn">
          <Shield size={22} color={theme.colors.text.tertiary} strokeWidth={1.8} />
          <RNText style={styles.actionLabel}>Block</RNText>
        </View>
        <View style={[styles.actionButton, styles.actionButtonDisabled]} testID="contact-report-btn">
          <Flag size={22} color={theme.colors.status.error} strokeWidth={1.8} />
          <RNText style={styles.actionLabel}>Report</RNText>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
      backgroundColor: theme.colors.bg.surface,
      gap: theme.spacing.md,
    },
    title: {
      ...textStyles.heading.md,
      color: theme.colors.text.primary,
    },
    phoneRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    phoneLabel: {
      ...textStyles.label.sm,
      color: theme.colors.text.tertiary,
    },
    phoneValue: {
      ...textStyles.body.md,
      color: theme.colors.text.primary,
    },
    actionTriad: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: theme.spacing.sm,
    },
    actionButton: {
      alignItems: 'center',
      gap: theme.spacing.xxs,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
    },
    actionButtonDisabled: {
      opacity: 0.45,
    },
    actionLabel: {
      ...textStyles.caption,
      color: theme.colors.text.secondary,
    },
  });
}
