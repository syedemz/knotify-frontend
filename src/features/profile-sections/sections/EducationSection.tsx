/**
 * EducationSection — renders four education rows (degree, college, higher
 * secondary, high school). Each row hides if its primary field is null;
 * year suffix hides if year is null. Section hides if all 4 rows would hide.
 *
 * Field bindings:
 * - Degree row: `education_level` / `highest_degree` (primary), `graduation_year`.
 * - College row: `college_name` (primary).
 * - Higher secondary row: `higher_secondary` (primary), `higher_secondary_passing_year`.
 * - High school row: `high_school` (primary), `high_school_passing_year`.
 *
 * @module features/profile-sections/sections/EducationSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EducationSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EducationSection({
  profile,
}: EducationSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasDegree = profile.education_level !== null || profile.highest_degree !== null;
  const hasCollege = profile.college_name !== null;
  const hasHigherSecondary = profile.higher_secondary !== null;
  const hasHighSchool = profile.high_school !== null;

  if (!hasDegree && !hasCollege && !hasHigherSecondary && !hasHighSchool) {
    return null;
  }

  return (
    <View style={styles.section} testID="education-section">
      <RNText style={styles.title}>Education</RNText>
      <View style={styles.rows}>
        {hasDegree && (
          <View style={styles.row} testID="education-degree-row">
            <RNText style={styles.rowLabel}>Degree</RNText>
            <RNText style={styles.rowValue}>
              {profile.highest_degree ?? profile.education_level ?? ''}
              {profile.graduation_year !== null ? ` (${profile.graduation_year})` : ''}
            </RNText>
          </View>
        )}
        {hasCollege && (
          <View style={styles.row} testID="education-college-row">
            <RNText style={styles.rowLabel}>College / University</RNText>
            <RNText style={styles.rowValue}>{profile.college_name}</RNText>
          </View>
        )}
        {hasHigherSecondary && (
          <View style={styles.row} testID="education-higher-secondary-row">
            <RNText style={styles.rowLabel}>Higher secondary</RNText>
            <RNText style={styles.rowValue}>
              {profile.higher_secondary}
              {profile.higher_secondary_passing_year !== null
                ? ` (${profile.higher_secondary_passing_year})`
                : ''}
            </RNText>
          </View>
        )}
        {hasHighSchool && (
          <View style={styles.row} testID="education-high-school-row">
            <RNText style={styles.rowLabel}>High school</RNText>
            <RNText style={styles.rowValue}>
              {profile.high_school}
              {profile.high_school_passing_year !== null
                ? ` (${profile.high_school_passing_year})`
                : ''}
            </RNText>
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
    rows: {
      gap: theme.spacing.sm,
    },
    row: {
      gap: theme.spacing.xxs,
    },
    rowLabel: {
      ...textStyles.caption,
      color: theme.colors.text.tertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    rowValue: {
      ...textStyles.body.md,
      color: theme.colors.text.primary,
    },
  });
}
