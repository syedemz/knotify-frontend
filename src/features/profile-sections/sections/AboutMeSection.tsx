/**
 * AboutMeSection — renders marital status and children status chips.
 *
 * Field bindings:
 * - `marital_status` — chip; hides if null.
 * - `has_children` — chip; hides if null.
 *
 * Section hides if both fields are null.
 *
 * @module features/profile-sections/sections/AboutMeSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AboutMeSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AboutMeSection({ profile }: AboutMeSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasMaritalStatus = profile.marital_status !== null;
  const hasChildren = profile.has_children !== null;

  if (!hasMaritalStatus && !hasChildren) {
    return null;
  }

  return (
    <View style={styles.section} testID="about-me-section">
      <RNText style={styles.title}>🙋 About me</RNText>
      <View style={styles.chipRow}>
        {hasMaritalStatus && (
          <View style={styles.chip} testID="about-marital-chip">
            <RNText style={styles.chipLabel}>{profile.marital_status}</RNText>
          </View>
        )}
        {hasChildren && (
          <View style={styles.chip} testID="about-children-chip">
            <RNText style={styles.chipLabel}>
              {profile.has_children === true ? 'Has children' : 'No children'}
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
