/**
 * HeroBlock — self-preview hero section.
 *
 * IMPORTANT role split (contractual — do NOT add other-viewer logic here):
 * - `viewer === 'other'` → returns `null`. The landing candidate view supplies
 *   its own hero via `<CandidateHero>` in story 12.4; this component does not
 *   double-render on the landing page.
 * - `viewer === 'self'` → renders the full-bleed profile1.jpeg-style hero:
 *   profile photo, name / age / city subtitle, country-flag + job + religious-
 *   level chip strip, and a green verified tick when `faceSelfieUri` is non-null.
 *
 * The Active-today and Gold overlay bubbles are NOT rendered here — those are
 * engagement-facing surfaces for the `other` viewer, owned by `CandidateHero`
 * in story 12.4.
 *
 * Never hides overall in the `'self'` variant — the hero is the entry point of
 * the Preview tab.
 *
 * @module features/profile-sections/sections/HeroBlock
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
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay, ProfileViewer } from '@/types/DummyOverlay';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HeroBlockProps {
  readonly profile: UserProfile & DummyOverlay;
  readonly viewer: ProfileViewer;
}

// ── Component ─────────────────────────────────────────────────────────────────

const HERO_HEIGHT = Dimensions.get('window').height * 0.55;

export function HeroBlock({ profile, viewer }: HeroBlockProps): React.ReactElement | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Contractual: other-viewer hero is supplied by CandidateHero in 12.4.
  if (viewer === 'other') {
    return null;
  }

  const photoUri = profile.photos?.[0] ?? profile.photo_url ?? undefined;
  const cityCountry =
    profile.current_residence_city !== null &&
    profile.current_residence_country !== null
      ? `${profile.current_residence_city.toUpperCase()}, ${profile.current_residence_country.toUpperCase()}`
      : profile.current_residence_city !== null
      ? profile.current_residence_city.toUpperCase()
      : profile.current_residence_country !== null
      ? profile.current_residence_country.toUpperCase()
      : null;

  const hasVerified = profile.faceSelfieUri != null;

  return (
    <View style={styles.container} testID="hero-block">
      {photoUri !== undefined ? (
        <ExpoImage
          source={{ uri: photoUri }}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={`${profile.first_name ?? 'Profile'} photo`}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      {/* Gradient overlay */}
      <View style={styles.gradient} />

      {/* Content overlay at the bottom */}
      <View style={styles.overlay}>
        {/* Name + age + verified tick */}
        <View style={styles.nameRow}>
          <RNText style={styles.name}>
            {profile.first_name ?? ''}
            {profile.age !== null ? `, ${profile.age}` : ''}
          </RNText>
          {hasVerified && (
            <View testID="hero-verified-tick">
              <CheckCircle
                size={20}
                color={theme.colors.status.success}
                strokeWidth={2}
              />
            </View>
          )}
        </View>

        {/* City / country subtitle */}
        {cityCountry !== null && (
          <RNText style={styles.subtitle} testID="hero-city-country">
            {cityCountry}
          </RNText>
        )}

        {/* Chip strip: country flag, job title, religious level */}
        <View style={styles.chipRow}>
          {profile.resident_country_code !== null && (
            <View style={styles.chip} testID="hero-country-chip">
              <RNText style={styles.chipLabel}>
                {countryCodeToFlag(profile.resident_country_code)} {profile.resident_country_code}
              </RNText>
            </View>
          )}
          {profile.job_title !== null && (
            <View style={styles.chip} testID="hero-job-chip">
              <RNText style={styles.chipLabel}>{profile.job_title}</RNText>
            </View>
          )}
          {profile.religious_level !== null && (
            <View style={styles.chip} testID="hero-religious-level-chip">
              <RNText style={styles.chipLabel}>{profile.religious_level}</RNText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts an ISO 3166-1 alpha-2 country code to the corresponding regional
 * indicator emoji flag.
 *
 * Works by mapping each letter to its regional indicator symbol codepoint
 * (U+1F1E6 + offset). Standard Unicode emoji flag pairs are supported on all
 * modern iOS and Android versions.
 */
function countryCodeToFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((ch) => String.fromCodePoint(0x1f1e0 + ch.charCodeAt(0) - 65))
    .join('');
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
      height: HERO_HEIGHT * 0.5,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    overlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
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
