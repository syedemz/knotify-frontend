/**
 * ParentsSection — renders father and mother information blocks.
 *
 * Field bindings:
 * - Father block: `fathers_name` (primary guard), `fathers_job`, `father_retired`.
 * - Mother block: `mothers_name` (primary guard), `mothers_job`, `mother_retired`.
 *
 * Father block hides if `fathers_name` is null; job and retired chips inside the
 * father block each hide independently. Mother block is symmetric. Section hides
 * if both parent blocks would hide.
 *
 * @module features/profile-sections/sections/ParentsSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ParentsSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ParentsSection({
  profile,
}: ParentsSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasFather = profile.fathers_name !== null;
  const hasMother = profile.mothers_name !== null;

  if (!hasFather && !hasMother) {
    return null;
  }

  return (
    <View style={styles.section} testID="parents-section">
      <RNText style={styles.title}>Parents</RNText>
      <View style={styles.blocks}>
        {hasFather && (
          <View style={styles.parentBlock} testID="parents-father-block">
            <RNText style={styles.parentName}>{profile.fathers_name}</RNText>
            <View style={styles.chipRow}>
              {profile.fathers_job !== null && (
                <View style={styles.chip} testID="parents-father-job-chip">
                  <RNText style={styles.chipLabel}>{profile.fathers_job}</RNText>
                </View>
              )}
              {profile.father_retired !== null && (
                <View style={styles.chip} testID="parents-father-retired-chip">
                  <RNText style={styles.chipLabel}>
                    {profile.father_retired === 'YES' ? 'Retired' : 'Not retired'}
                  </RNText>
                </View>
              )}
            </View>
          </View>
        )}
        {hasMother && (
          <View style={styles.parentBlock} testID="parents-mother-block">
            <RNText style={styles.parentName}>{profile.mothers_name}</RNText>
            <View style={styles.chipRow}>
              {profile.mothers_job !== null && (
                <View style={styles.chip} testID="parents-mother-job-chip">
                  <RNText style={styles.chipLabel}>{profile.mothers_job}</RNText>
                </View>
              )}
              {profile.mother_retired !== null && (
                <View style={styles.chip} testID="parents-mother-retired-chip">
                  <RNText style={styles.chipLabel}>
                    {profile.mother_retired === 'YES' ? 'Retired' : 'Not retired'}
                  </RNText>
                </View>
              )}
            </View>
          </View>
        )}
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
    blocks: {
      gap: theme.spacing.lg,
    },
    parentBlock: {
      gap: theme.spacing.xs,
    },
    parentName: {
      ...textStyles.body.md,
      color: theme.colors.text.primary,
      fontFamily: undefined,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    chip: {
      backgroundColor: theme.colors.bg.muted,
      borderRadius: theme.radii.sm,
      paddingVertical: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.sm,
    },
    chipLabel: {
      ...textStyles.label.sm,
      color: theme.colors.text.secondary,
    },
  });
}
