/**
 * AddressSection — Muzz-style bubble grid for address info.
 *
 * All three address fields render as flex-wrapping chips; uppercase field
 * labels ("CURRENT RESIDENCE" etc.) are gone.
 *
 * Field bindings (each guarded independently):
 * - `current_residence_city`
 * - `district`
 * - `family_residence_address`
 *
 * @module features/profile-sections/sections/AddressSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

export interface AddressSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

export function AddressSection({
  profile,
}: AddressSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const chips: ReadonlyArray<{ testID: string; label: string }> = [
    profile.current_residence_city !== null && {
      testID: 'address-city-chip',
      label: profile.current_residence_city,
    },
    profile.district !== null && {
      testID: 'address-district-chip',
      label: profile.district,
    },
    profile.family_residence_address !== null && {
      testID: 'address-family-chip',
      label: profile.family_residence_address,
    },
  ].filter((c): c is { testID: string; label: string } => c !== false);

  if (chips.length === 0) {
    return null;
  }

  return (
    <View style={styles.section} testID="address-section">
      <RNText style={styles.title}>Address</RNText>
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
