/**
 * EducationSection — Muzz-style bubble grid.
 *
 * Each education field becomes an independent chip that flex-wraps into
 * multiple lines depending on width. Uppercase field labels ("DEGREE",
 * "HIGHER SECONDARY") are gone — the chip text itself carries meaning,
 * and short values pack multiple per line.
 *
 * Field bindings (each guarded independently):
 * - `highest_degree` / `education_level` (+ optional `graduation_year`)
 * - `college_name`
 * - `higher_secondary` (+ optional `higher_secondary_passing_year`)
 * - `high_school` (+ optional `high_school_passing_year`)
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

export interface EducationSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

export function EducationSection({
  profile,
}: EducationSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const degreeLabel = profile.highest_degree ?? profile.education_level;
  const degreeChip =
    degreeLabel !== null
      ? profile.graduation_year !== null
        ? `${degreeLabel} (${profile.graduation_year})`
        : degreeLabel
      : null;

  const collegeChip = profile.college_name;

  const higherSecondaryChip =
    profile.higher_secondary !== null
      ? profile.higher_secondary_passing_year !== null
        ? `${profile.higher_secondary} (${profile.higher_secondary_passing_year})`
        : profile.higher_secondary
      : null;

  const highSchoolChip =
    profile.high_school !== null
      ? profile.high_school_passing_year !== null
        ? `${profile.high_school} (${profile.high_school_passing_year})`
        : profile.high_school
      : null;

  const chips: ReadonlyArray<{ testID: string; label: string }> = [
    degreeChip !== null && { testID: 'education-degree-chip', label: degreeChip },
    collegeChip !== null && { testID: 'education-college-chip', label: collegeChip },
    higherSecondaryChip !== null && {
      testID: 'education-higher-secondary-chip',
      label: higherSecondaryChip,
    },
    highSchoolChip !== null && {
      testID: 'education-high-school-chip',
      label: highSchoolChip,
    },
  ].filter((c): c is { testID: string; label: string } => c !== false);

  if (chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.section} testID="education-section">
      <RNText style={styles.title}>Education</RNText>
      <View style={styles.chipRow}>
        {chips.map((c) => (
          <View key={c.testID} style={styles.chip} testID={c.testID}>
            <RNText style={styles.chipLabel}>{c.label}</RNText>
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
      backgroundColor: theme.colors.bg.surface,
      gap: theme.spacing.md,
    },
    title: {
      ...textStyles.heading.lg,
      color: theme.colors.text.primary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    chip: {
      backgroundColor: theme.colors.bg.chip,
      borderRadius: theme.radii.pill,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
    },
    chipLabel: {
      ...textStyles.label.md,
      color: theme.colors.text.secondary,
    },
  });
}
