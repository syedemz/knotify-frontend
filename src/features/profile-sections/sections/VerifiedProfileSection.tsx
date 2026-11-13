/**
 * VerifiedProfileSection — indicates the profile has been face-verified.
 *
 * Field bindings:
 * - `faceSelfieUri` — primary guard. Hides if null or undefined.
 * - `first_name` — used in the copy text.
 *
 * @module features/profile-sections/sections/VerifiedProfileSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { CheckCircle } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VerifiedProfileSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VerifiedProfileSection({
  profile,
}: VerifiedProfileSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (profile.faceSelfieUri == null) {
    return null;
  }

  const name = profile.first_name ?? 'This profile';

  return (
    <View style={styles.section} testID="verified-profile-section">
      <View style={styles.row}>
        <CheckCircle
          size={24}
          color={theme.colors.status.success}
          strokeWidth={2}
        />
        <View style={styles.textBlock}>
          <RNText style={styles.heading}>Verified profile</RNText>
          <RNText style={styles.body}>
            {name}&apos;s photo has been verified by the Knotify team.
          </RNText>
        </View>
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
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    textBlock: {
      flex: 1,
      gap: theme.spacing.xxs,
    },
    heading: {
      ...textStyles.label.md,
      color: theme.colors.text.primary,
    },
    body: {
      ...textStyles.body.sm,
      color: theme.colors.text.secondary,
    },
  });
}
