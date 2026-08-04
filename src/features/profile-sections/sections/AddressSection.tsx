/**
 * AddressSection — renders current residence, home district, and home address.
 *
 * Field bindings:
 * - `current_residence_city` — "Current residence". Hides if null.
 * - `district` — "Home district". Hides if null.
 * - `family_residence_address` — "Home address". Hides if null.
 *
 * Section hides if all three are null.
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

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AddressSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AddressSection({
  profile,
}: AddressSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasCity = profile.current_residence_city !== null;
  const hasDistrict = profile.district !== null;
  const hasAddress = profile.family_residence_address !== null;

  if (!hasCity && !hasDistrict && !hasAddress) {
    return null;
  }

  return (
    <View style={styles.section} testID="address-section">
      <RNText style={styles.title}>Address</RNText>
      <View style={styles.rows}>
        {hasCity && (
          <View style={styles.row} testID="address-city-row">
            <RNText style={styles.rowLabel}>Current residence</RNText>
            <RNText style={styles.rowValue}>{profile.current_residence_city}</RNText>
          </View>
        )}
        {hasDistrict && (
          <View style={styles.row} testID="address-district-row">
            <RNText style={styles.rowLabel}>Home district</RNText>
            <RNText style={styles.rowValue}>{profile.district}</RNText>
          </View>
        )}
        {hasAddress && (
          <View style={styles.row} testID="address-family-row">
            <RNText style={styles.rowLabel}>Home address</RNText>
            <RNText style={styles.rowValue}>{profile.family_residence_address}</RNText>
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
