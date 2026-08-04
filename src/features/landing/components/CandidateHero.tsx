/**
 * CandidateHero — full-bleed hero image for the "other" viewer on the
 * Marriage landing page.
 *
 * This component is the landing-page counterpart to `HeroBlock`.
 * `HeroBlock` (inside `ProfileScrollView`) explicitly returns `null` when
 * `viewer === 'other'`; `CandidateHero` fills that slot with the
 * engagement-facing surfaces that belong only on the candidate view:
 * "Active today" and "Gold" overlay bubbles, and the profile chip strip.
 *
 * Takes {@link DummyFemaleProfile} rather than the generic
 * `UserProfile & DummyOverlay` so TypeScript can resolve `__dummy_display_only`
 * keys without a cast.
 *
 * @module features/landing/components/CandidateHero
 */

import React, { useMemo } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { CheckCircle } from 'lucide-react-native';

import { useTheme } from '@/theme';
import { textStyles } from '@/theme/typography';
import type { Theme } from '@/theme/theme';
import type { DummyFemaleProfile } from '@/types/DummyFemaleProfile';
import { t } from '@/labels';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CandidateHeroProps {
  /**
   * The candidate female profile to display. The hero reads `photos[0]`
   * (fallback `photo_url`) for the background image.
   */
  readonly profile: DummyFemaleProfile;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_HEIGHT = Dimensions.get('window').height * 0.65;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts an ISO 3166-1 alpha-2 country code to the corresponding regional
 * indicator emoji flag.
 *
 * Uses Unicode regional indicator symbol codepoints (U+1F1E6 + offset).
 * Supported on all modern iOS and Android versions.
 *
 * @param code - A two-letter ISO country code (e.g. `'DE'`).
 * @returns The emoji flag string (e.g. `'🇩🇪'`).
 */
function countryCodeToFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((ch) => String.fromCodePoint(0x1f1e0 + ch.charCodeAt(0) - 65))
    .join('');
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders the candidate hero on the Marriage landing page.
 *
 * Displays:
 * - Full-bleed hero image (`photos[0]` → `photo_url` fallback).
 * - "Active today" bubble (guarded on `__dummy_display_only.is_active_today`).
 * - "Gold" bubble (guarded on `__dummy_display_only.membership_tier === 'gold'`).
 * - Name / age row with optional green verified tick (`faceSelfieUri` non-null).
 * - City + country subtitle.
 * - Chip strip: country flag, profession (each guarded on null).
 */
export function CandidateHero({ profile }: CandidateHeroProps): React.ReactElement {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const photoUri = profile.photos?.[0] ?? profile.photo_url ?? undefined;
  const hasVerified = profile.faceSelfieUri != null;

  const cityCountry =
    profile.current_residence_city !== null &&
    profile.current_residence_country !== null
      ? `${profile.current_residence_city.toUpperCase()}, ${profile.current_residence_country.toUpperCase()}`
      : profile.current_residence_city !== null
      ? profile.current_residence_city.toUpperCase()
      : profile.current_residence_country !== null
      ? profile.current_residence_country.toUpperCase()
      : null;

  const dummy = profile.__dummy_display_only;
  const showActiveToday = dummy?.is_active_today !== undefined;
  const showGold = dummy?.membership_tier !== undefined && dummy.membership_tier === 'gold';

  return (
    <View style={styles.container} testID="candidate-hero">
      {/* Background image */}
      {photoUri !== undefined ? (
        <ExpoImage
          source={{ uri: photoUri }}
          style={styles.image}
          contentFit="cover"
          testID="candidate-hero-image"
          accessibilityLabel={`${profile.first_name ?? 'Candidate'} photo`}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} testID="candidate-hero-image" />
      )}

      {/* Dark gradient overlay at bottom */}
      <View style={styles.gradient} />

      {/* Top-right overlay bubbles */}
      <View style={styles.topBubbles}>
        {showActiveToday && (
          <View style={styles.bubble} testID="hero-active-today-bubble">
            <View style={styles.greenDot} />
            <RNText style={styles.bubbleLabel}>{t('landing.hero.activeToday')}</RNText>
          </View>
        )}
        {showGold && (
          <View style={[styles.bubble, styles.goldBubble]} testID="hero-gold-bubble">
            <RNText style={[styles.bubbleLabel, styles.goldBubbleLabel]}>
              {t('landing.hero.gold')}
            </RNText>
          </View>
        )}
      </View>

      {/* Bottom content overlay */}
      <View style={styles.overlay}>
        {/* Name + age + verified tick */}
        <View style={styles.nameRow}>
          <RNText style={styles.name} testID="candidate-hero-name">
            {profile.first_name ?? ''}
            {profile.age !== null ? `, ${profile.age}` : ''}
          </RNText>
          {hasVerified && (
            <View testID="candidate-hero-verified-tick">
              <CheckCircle
                size={22}
                color={theme.colors.status.success}
                strokeWidth={2}
              />
            </View>
          )}
        </View>

        {/* City / country */}
        {cityCountry !== null && (
          <RNText style={styles.subtitle} testID="candidate-hero-city">
            {cityCountry}
          </RNText>
        )}

        {/* Chip strip */}
        <View style={styles.chipRow}>
          {profile.resident_country_code !== null && (
            <View style={styles.chip} testID="candidate-hero-country-chip">
              <RNText style={styles.chipLabel}>
                {countryCodeToFlag(profile.resident_country_code)}{' '}
                {profile.resident_country_code}
              </RNText>
            </View>
          )}
          {profile.job_title !== null && (
            <View style={styles.chip} testID="candidate-hero-job-chip">
              <RNText style={styles.chipLabel}>{profile.job_title}</RNText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      width: '100%',
      height: HERO_HEIGHT,
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      backgroundColor: theme.colors.bg.input,
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: HERO_HEIGHT * 0.55,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    topBubbles: {
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
      gap: theme.spacing.xs,
      alignItems: 'flex-end',
    },
    bubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: theme.radii.pill,
      paddingVertical: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.sm,
    },
    goldBubble: {
      backgroundColor: 'rgba(168,138,44,0.85)',
    },
    greenDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.colors.status.success,
    },
    bubbleLabel: {
      ...textStyles.label.sm,
      color: theme.colors.text.inverse,
    },
    goldBubbleLabel: {
      color: theme.colors.text.inverse,
    },
    overlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.xs,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    name: {
      ...textStyles.display.md,
      color: theme.colors.text.inverse,
    },
    subtitle: {
      ...textStyles.body.sm,
      color: 'rgba(255,255,255,0.85)',
      letterSpacing: 0.5,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xxs,
    },
    chip: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderRadius: theme.radii.pill,
      paddingVertical: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.sm,
    },
    chipLabel: {
      ...textStyles.label.sm,
      color: theme.colors.text.inverse,
    },
  });
}
