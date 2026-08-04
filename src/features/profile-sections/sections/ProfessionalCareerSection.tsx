/**
 * ProfessionalCareerSection — renders professional information chips and rows.
 *
 * Field bindings (each guarded independently):
 * - `professional_category`
 * - `job_title`
 * - `employer_name`
 * - `employment_type`
 * - `office_address`
 * - `salary_range`
 *
 * Section hides if all fields are null.
 *
 * @module features/profile-sections/sections/ProfessionalCareerSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfessionalCareerSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProfessionalCareerSection({
  profile,
}: ProfessionalCareerSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasAny =
    profile.professional_category !== null ||
    profile.job_title !== null ||
    profile.employer_name !== null ||
    profile.employment_type !== null ||
    profile.office_address !== null ||
    profile.salary_range !== null;

  if (!hasAny) {
    return null;
  }

  return (
    <View style={styles.section} testID="professional-career-section">
      <RNText style={styles.title}>Professional career</RNText>
      <View style={styles.rows}>
        {profile.professional_category !== null && (
          <InfoRow
            label="Category"
            value={profile.professional_category}
            testID="career-category-row"
            styles={styles}
          />
        )}
        {profile.job_title !== null && (
          <InfoRow
            label="Job title"
            value={profile.job_title}
            testID="career-job-title-row"
            styles={styles}
          />
        )}
        {profile.employer_name !== null && (
          <InfoRow
            label="Employer"
            value={profile.employer_name}
            testID="career-employer-row"
            styles={styles}
          />
        )}
        {profile.employment_type !== null && (
          <InfoRow
            label="Employment type"
            value={profile.employment_type}
            testID="career-employment-type-row"
            styles={styles}
          />
        )}
        {profile.office_address !== null && (
          <InfoRow
            label="Office address"
            value={profile.office_address}
            testID="career-office-address-row"
            styles={styles}
          />
        )}
        {profile.salary_range !== null && (
          <InfoRow
            label="Salary range"
            value={profile.salary_range}
            testID="career-salary-row"
            styles={styles}
          />
        )}
      </View>
    </View>
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────────

interface InfoRowProps {
  readonly label: string;
  readonly value: string;
  readonly testID: string;
  readonly styles: ReturnType<typeof createStyles>;
}

function InfoRow({ label, value, testID, styles }: InfoRowProps) {
  return (
    <View style={styles.row} testID={testID}>
      <RNText style={styles.rowLabel}>{label}</RNText>
      <RNText style={styles.rowValue}>{value}</RNText>
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
