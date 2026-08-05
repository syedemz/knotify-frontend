/**
 * SiblingsSection — renders one card per sibling.
 *
 * Field bindings:
 * - `siblings[]` — one card per entry. Inside each card, `name` / `age` /
 *   `marital_status` / `gender` / `profession` each hide on null.
 *
 * Section hides if `siblings.length === 0` or `siblings` is undefined.
 *
 * @module features/profile-sections/sections/SiblingsSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';
import type { DummySibling } from '@/types/DummySibling';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SiblingsSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SiblingsSection({
  profile,
}: SiblingsSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const siblings = profile.siblings;

  if (siblings === undefined || siblings.length === 0) {
    return null;
  }

  return (
    <View style={styles.section} testID="siblings-section">
      <RNText style={styles.title}>Siblings</RNText>
      <View style={styles.cards}>
        {siblings.map((sibling, index) => (
          <SiblingCard
            key={index}
            sibling={sibling}
            index={index}
            styles={styles}
          />
        ))}
      </View>
    </View>
  );
}

// ── Internal helpers ──────────────────────────────────────────────────────────

interface SiblingCardProps {
  readonly sibling: DummySibling;
  readonly index: number;
  readonly styles: ReturnType<typeof createStyles>;
}

function SiblingCard({ sibling, index, styles }: SiblingCardProps) {
  const hasName = sibling.name !== null;
  const hasAge = sibling.age !== null;
  const hasMaritalStatus = sibling.marital_status !== null;
  const hasGender = sibling.gender !== null;
  const hasProfession = sibling.profession !== null;

  return (
    <View style={styles.card} testID={`sibling-card-${index}`}>
      {hasName && (
        <RNText style={styles.siblingName} testID={`sibling-name-${index}`}>
          {sibling.name}
        </RNText>
      )}
      <View style={styles.chipRow}>
        {hasGender && (
          <View style={styles.chip} testID={`sibling-gender-chip-${index}`}>
            <RNText style={styles.chipLabel}>{sibling.gender}</RNText>
          </View>
        )}
        {hasAge && (
          <View style={styles.chip} testID={`sibling-age-chip-${index}`}>
            <RNText style={styles.chipLabel}>{sibling.age} years</RNText>
          </View>
        )}
        {hasMaritalStatus && (
          <View style={styles.chip} testID={`sibling-marital-chip-${index}`}>
            <RNText style={styles.chipLabel}>{sibling.marital_status}</RNText>
          </View>
        )}
        {hasProfession && (
          <View style={styles.chip} testID={`sibling-profession-chip-${index}`}>
            <RNText style={styles.chipLabel}>{sibling.profession}</RNText>
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
    cards: {
      gap: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.bg.chip,
      borderRadius: theme.radii.md,
      padding: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    siblingName: {
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
