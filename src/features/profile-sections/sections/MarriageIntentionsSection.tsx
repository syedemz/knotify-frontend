/**
 * MarriageIntentionsSection — renders the match rail with relation and
 * marriage timeline.
 *
 * Field bindings:
 * - `relation` — shown in the anchor label (optional — section hides only on
 *   `marriage_time` null).
 * - `marriage_time` — the primary guard field. Section hides if null.
 *
 * Renders a two-anchor rail: `Match! ─── <relation> (<marriage_time>)`.
 *
 * @module features/profile-sections/sections/MarriageIntentionsSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MarriageIntentionsSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MarriageIntentionsSection({
  profile,
}: MarriageIntentionsSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (profile.marriage_time === null) {
    return null;
  }

  const rightLabel =
    profile.relation !== null
      ? `${profile.relation} (${profile.marriage_time})`
      : profile.marriage_time;

  return (
    <View style={styles.section} testID="marriage-intentions-section">
      <RNText style={styles.title}>Marriage intentions</RNText>
      <View style={styles.rail}>
        <View style={styles.anchor}>
          <RNText style={styles.anchorLabel}>Match!</RNText>
        </View>
        <View style={styles.line} />
        <View style={styles.anchor}>
          <RNText style={styles.anchorLabel}>{rightLabel}</RNText>
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
    rail: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    anchor: {
      backgroundColor: theme.colors.accent.primary,
      borderRadius: theme.radii.pill,
      paddingVertical: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.md,
    },
    anchorLabel: {
      ...textStyles.label.sm,
      color: theme.colors.text.inverse,
    },
    line: {
      flex: 1,
      height: 2,
      backgroundColor: theme.colors.border.default,
      marginHorizontal: theme.spacing.xs,
    },
  });
}
