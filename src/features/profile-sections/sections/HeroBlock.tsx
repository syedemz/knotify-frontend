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
import { resolveDummyPhoto } from '@/assets/dummyPhotoRegistry';
import { CountryFlag } from '@/components/CountryFlag';

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

  const photoPath = profile.photos?.[0] ?? profile.photo_url ?? undefined;
  const photoSource = resolveDummyPhoto(photoPath);
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
      {photoSource !== undefined ? (
        <ExpoImage
          source={photoSource}
          style={styles.image}
          contentFit="cover"
          accessibilityLabel={`${profile.first_name ?? 'Profile'} photo`}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}

      {/* Fake gradient — three stacked bands so the bottom fades in
          instead of the image looking half-darkened by a single overlay. */}
      <View pointerEvents="none" style={styles.gradientStack}>
        <View style={[styles.gradientBand, styles.gradientBand1]} />
        <View style={[styles.gradientBand, styles.gradientBand2]} />
        <View style={[styles.gradientBand, styles.gradientBand3]} />
      </View>

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
            <View
              style={[styles.chip, styles.countryChip]}
              testID="hero-country-chip"
            >
              <CountryFlag isoCode={profile.resident_country_code} size={14} />
              <RNText style={styles.chipLabel}>
                {profile.resident_country_code}
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

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      width: '100%',
      height: HERO_HEIGHT,
      position: 'relative',
      borderTopLeftRadius: theme.radii.xl,
      borderTopRightRadius: theme.radii.xl,
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imagePlaceholder: {
      backgroundColor: theme.colors.bg.input,
    },
    gradientStack: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: HERO_HEIGHT * 0.32,
    },
    gradientBand: {
      position: 'absolute',
      left: 0,
      right: 0,
    },
    gradientBand1: {
      bottom: 0,
      height: '45%',
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    gradientBand2: {
      bottom: '45%',
      height: '30%',
      backgroundColor: 'rgba(0,0,0,0.3)',
    },
    gradientBand3: {
      bottom: '75%',
      height: '25%',
      backgroundColor: 'rgba(0,0,0,0.12)',
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
      textShadowColor: 'rgba(0,0,0,0.55)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    subtitle: {
      ...textStyles.body.sm,
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0,0,0,0.55)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xxs,
    },
    chip: {
      backgroundColor: 'rgba(0,0,0,0.45)',
      borderRadius: theme.radii.pill,
      paddingVertical: theme.spacing.xxs,
      paddingHorizontal: theme.spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    countryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xxs,
    },
    chipLabel: {
      ...textStyles.label.sm,
      color: theme.colors.text.inverse,
    },
  });
}
