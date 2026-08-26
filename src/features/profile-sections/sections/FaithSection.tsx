/**
 * FaithSection — renders religion, subsect, religious level, and dummy
 * lifestyle chips (dress code, halal, smokes, drinks, fasts).
 *
 * Field bindings (8 chips total):
 * Real (3): `religion`, `subsect`, `religious_level`.
 * Dummy (5): `__dummy_display_only.dress_code`, `.eats_halal`, `.smokes`,
 *            `.drinks`, `.fasts`.
 *
 * Each chip hides independently on null / absent. Section hides if all 8
 * would hide.
 *
 * @module features/profile-sections/sections/FaithSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FaithSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FaithSection({ profile }: FaithSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const dummy = profile.__dummy_display_only;

  // Build the list of chips that will render.
  type ChipSpec = { testID: string; label: string };
  const chips: ChipSpec[] = [];

  if (profile.religion !== null) {
    chips.push({ testID: 'faith-religion-chip', label: profile.religion });
  }
  if (profile.subsect !== null) {
    chips.push({ testID: 'faith-subsect-chip', label: profile.subsect });
  }
  if (profile.religious_level !== null) {
    chips.push({ testID: 'faith-religious-level-chip', label: profile.religious_level });
  }
  if (dummy?.dress_code !== undefined) {
    chips.push({ testID: 'faith-dress-code-chip', label: dummy.dress_code });
  }
  if (dummy?.eats_halal !== undefined) {
    chips.push({
      testID: 'faith-halal-chip',
      label: dummy.eats_halal ? 'Eats halal' : 'Does not eat halal',
    });
  }
  if (dummy?.smokes !== undefined) {
    chips.push({
      testID: 'faith-smokes-chip',
      label: dummy.smokes ? 'Smokes' : 'Non-smoker',
    });
  }
  if (dummy?.drinks !== undefined) {
    chips.push({
      testID: 'faith-drinks-chip',
      label: dummy.drinks ? 'Drinks alcohol' : 'No alcohol',
    });
  }
  if (dummy?.fasts !== undefined) {
    chips.push({
      testID: 'faith-fasts-chip',
      label: dummy.fasts ? 'Regularly fasts' : 'Does not fast',
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.section} testID="faith-section">
      <RNText style={styles.title}>🕌 Faith</RNText>
      <View style={styles.chipRow}>
        {chips.map((chip) => (
          <View key={chip.testID} style={styles.chip} testID={chip.testID}>
            <RNText style={styles.chipLabel}>{chip.label}</RNText>
          </View>
        ))}
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
