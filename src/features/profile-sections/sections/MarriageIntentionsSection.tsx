/**
 * MarriageIntentionsSection — Muzz-style intent timeline.
 *
 * Layout (matches Muzz landing2.jpeg):
 * 1. Section title + info icon.
 * 2. Quoted intent line ("Serious relationship that leads to marriage").
 * 3. Chip row: Chatting / Family / Marriage (progression stages).
 * 4. Horizontal timeline line with four anchors underneath:
 *    - Match! (heart)
 *    - <chatting-duration>  (dummy overlay — otherwise defaults to a
 *      neutral "Let's chat" label)
 *    - Agree together (family stage)
 *    - Agree together (marriage stage; falls back to `marriage_time` if
 *      the profile carries one, e.g. "Within 2 years").
 *
 * Section hides only if `marriage_time` is null AND no chatting-duration
 * override is present — matching the previous guard behaviour so
 * profiles without any intent data render nothing.
 *
 * @module features/profile-sections/sections/MarriageIntentionsSection
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text as RNText, View } from 'react-native';
import { Heart, MessageCircle, Users, Gem, Info } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

export interface MarriageIntentionsSectionProps {
  readonly profile: UserProfile & DummyOverlay;
}

export function MarriageIntentionsSection({
  profile,
}: MarriageIntentionsSectionProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (profile.marriage_time === null) {
    return null;
  }

  const marriageLabel = profile.marriage_time;
  // meet_time comes from the page-20 first pick (client-local during
  // onboarding). Fall back to a neutral label if the profile does not
  // carry it yet.
  const meetLabel = profile.meet_time ?? "Let's chat";
  const firstName = profile.first_name ?? 'Their';
  const intent =
    'Serious relationship that leads to marriage';

  return (
    <View style={styles.section} testID="marriage-intentions-section">
      <View style={styles.titleRow}>
        <RNText style={styles.title}>{`💍 ${firstName}'s marriage intentions`}</RNText>
        <Info size={16} color={theme.colors.text.tertiary} strokeWidth={2} />
      </View>

      <View style={styles.card}>
        <RNText style={styles.quote}>{`"${intent}"`}</RNText>

        {/* Stage chips */}
        <View style={styles.chipRow}>
          <StageChip
            icon={<MessageCircle size={14} color={theme.colors.text.secondary} strokeWidth={2} />}
            label="Chatting"
            styles={styles}
          />
          <StageChip
            icon={<Users size={14} color={theme.colors.text.secondary} strokeWidth={2} />}
            label="Family"
            styles={styles}
          />
          <StageChip
            icon={<Gem size={14} color={theme.colors.text.secondary} strokeWidth={2} />}
            label="Marriage"
            styles={styles}
          />
        </View>

        {/* Timeline */}
        <View style={styles.timelineRow}>
          <View style={styles.matchAnchor} testID="intent-match-anchor">
            <Heart size={16} color={theme.colors.text.inverse} strokeWidth={2} fill={theme.colors.text.inverse} />
          </View>
          <View style={styles.line} />
          <TickMark styles={styles} />
          <View style={styles.line} />
          <TickMark styles={styles} />
          <View style={styles.line} />
          <TickMark styles={styles} />
        </View>

        {/* Anchor labels aligned to timeline positions */}
        <View style={styles.labelRow}>
          <RNText style={[styles.anchorLabel, styles.matchLabel]}>Match!</RNText>
          <RNText style={styles.anchorLabel} testID="intent-meet-label">
            {meetLabel}
          </RNText>
          <RNText style={styles.anchorLabel}>Agree together</RNText>
          <RNText style={styles.anchorLabel} testID="intent-marriage-label">
            {marriageLabel}
          </RNText>
        </View>
      </View>
    </View>
  );
}

interface StageChipProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly styles: ReturnType<typeof createStyles>;
}

function StageChip({ icon, label, styles }: StageChipProps) {
  return (
    <View style={styles.stageChip}>
      {icon}
      <RNText style={styles.stageChipLabel}>{label}</RNText>
    </View>
  );
}

function TickMark({ styles }: { readonly styles: ReturnType<typeof createStyles> }) {
  return <View style={styles.tick} />;
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    section: {
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
      backgroundColor: theme.colors.bg.surface,
      gap: theme.spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    title: {
      ...textStyles.heading.lg,
      color: theme.colors.text.primary,
    },
    card: {
      backgroundColor: theme.colors.bg.chip,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    quote: {
      ...textStyles.body.md,
      color: theme.colors.text.primary,
      fontStyle: 'italic',
    },
    chipRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    stageChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xxs,
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.radii.pill,
      paddingVertical: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.sm,
    },
    stageChipLabel: {
      ...textStyles.label.md,
      color: theme.colors.text.secondary,
    },
    timelineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xxs,
    },
    matchAnchor: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.colors.accent.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    line: {
      flex: 1,
      height: 2,
      backgroundColor: theme.colors.text.tertiary,
      opacity: 0.4,
    },
    tick: {
      width: 2,
      height: 10,
      backgroundColor: theme.colors.text.tertiary,
      opacity: 0.6,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    anchorLabel: {
      ...textStyles.label.md,
      color: theme.colors.text.secondary,
      flex: 1,
      textAlign: 'center',
    },
    matchLabel: {
      color: theme.colors.text.brand,
      textAlign: 'left',
    },
  });
}
