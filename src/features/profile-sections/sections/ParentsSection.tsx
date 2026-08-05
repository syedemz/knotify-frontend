/**
 * ParentsSection — one card per parent, mirroring `SiblingsSection`.
 *
 * Each parent card is a muted-bg rounded block containing the parent's name
 * on top and a flex-wrapping chip row of white chips below (matching the
 * two-tone contrast rule: chips inside grey cards are white).
 *
 * Field bindings:
 * - Father card: `fathers_name` (primary guard) + `fathers_job` +
 *   `father_retired` chips.
 * - Mother card: `mothers_name` (primary guard) + `mothers_job` +
 *   `mother_retired` chips.
 *
 * Section hides if both parent names are null.
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

export interface ParentsSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

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
      <View style={styles.cards}>
        {hasFather && (
          <ParentCard
            key="father"
            testIDPrefix="parents-father"
            name={profile.fathers_name}
            job={profile.fathers_job}
            retired={profile.father_retired}
            styles={styles}
          />
        )}
        {hasMother && (
          <ParentCard
            key="mother"
            testIDPrefix="parents-mother"
            name={profile.mothers_name}
            job={profile.mothers_job}
            retired={profile.mother_retired}
            styles={styles}
          />
        )}
      </View>
    </View>
  );
}

interface ParentCardProps {
  readonly testIDPrefix: string;
  readonly name: string | null;
  readonly job: string | null;
  readonly retired: string | null;
  readonly styles: ReturnType<typeof createStyles>;
}

function ParentCard({ testIDPrefix, name, job, retired, styles }: ParentCardProps) {
  return (
    <View style={styles.card} testID={`${testIDPrefix}-block`}>
      {name !== null && (
        <RNText style={styles.parentName} testID={`${testIDPrefix}-name`}>
          {name}
        </RNText>
      )}
      <View style={styles.chipRow}>
        {job !== null && (
          <View style={styles.chip} testID={`${testIDPrefix}-job-chip`}>
            <RNText style={styles.chipLabel}>{job}</RNText>
          </View>
        )}
        {retired !== null && (
          <View style={styles.chip} testID={`${testIDPrefix}-retired-chip`}>
            <RNText style={styles.chipLabel}>
              {retired === 'YES' ? 'Retired' : 'Not retired'}
            </RNText>
          </View>
        )}
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
      ...textStyles.heading.md,
      color: theme.colors.text.primary,
    },
    cards: {
      gap: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.bg.chip,
      borderRadius: theme.radii.md,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    parentName: {
      ...textStyles.label.md,
      color: theme.colors.text.primary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
    },
    chip: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.radii.pill,
      paddingVertical: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.sm,
    },
    chipLabel: {
      ...textStyles.label.sm,
      color: theme.colors.text.secondary,
    },
  });
}
