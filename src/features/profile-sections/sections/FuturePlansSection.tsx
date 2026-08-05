/**
 * FuturePlansSection — renders relocation and children future-intent chips.
 *
 * Field bindings:
 * - `move_abroad` — "Open to relocate globally" / "Won't move abroad". Hides
 *   if null.
 * - `has_children` — "Open to having children" / "Doesn't want children".
 *   Hides if null.
 *
 * Section hides if both fields are null.
 *
 * Note: `has_children` is also used in `AboutMeSection` (current-state chip)
 * and here (future-intent chip). The two sections interpret the same field
 * differently — this section renders the future intent framing.
 *
 * @module features/profile-sections/sections/FuturePlansSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FuturePlansSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function FuturePlansSection({
  profile,
}: FuturePlansSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasMoveAbroad = profile.move_abroad !== null;
  const hasChildren = profile.has_children !== null;

  if (!hasMoveAbroad && !hasChildren) {
    return null;
  }

  return (
    <View style={styles.section} testID="future-plans-section">
      <RNText style={styles.title}>Future plans</RNText>
      <View style={styles.chipRow}>
        {hasMoveAbroad && (
          <View style={styles.chip} testID="future-move-abroad-chip">
            <RNText style={styles.chipLabel}>
              {profile.move_abroad === true
                ? 'Open to relocate globally'
                : "Won't move abroad"}
            </RNText>
          </View>
        )}
        {hasChildren && (
          <View style={styles.chip} testID="future-children-chip">
            <RNText style={styles.chipLabel}>
              {profile.has_children === false
                ? 'Open to having children'
                : "Doesn't want children"}
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
      ...textStyles.label.sm,
      color: theme.colors.text.secondary,
    },
  });
}
