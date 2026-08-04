/**
 * PersonalitySection — renders one chip per personality trait.
 *
 * Field bindings:
 * - `preferences.personalityTraits[]` — one chip per trait. Hides if array
 *   is missing or empty.
 *
 * The narrowed `preferences` type on `DummyOverlay` allows reading
 * `personalityTraits` without a cast.
 *
 * @module features/profile-sections/sections/PersonalitySection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PersonalitySectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PersonalitySection({
  profile,
}: PersonalitySectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const traits = profile.preferences?.personalityTraits;

  if (traits === undefined || traits.length === 0) {
    return null;
  }

  return (
    <View style={styles.section} testID="personality-section">
      <RNText style={styles.title}>Personality</RNText>
      <View style={styles.chipRow}>
        {traits.map((trait) => (
          <View key={trait} style={styles.chip} testID={`personality-trait-chip-${trait}`}>
            <RNText style={styles.chipLabel}>{trait}</RNText>
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
      ...textStyles.heading.md,
      color: theme.colors.text.primary,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
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
