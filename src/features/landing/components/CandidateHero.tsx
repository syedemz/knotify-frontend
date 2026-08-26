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
import { t } from '@/labels';
import { resolveDummyPhoto } from '@/assets/dummyPhotoRegistry';
import { CountryFlag } from '@/components/CountryFlag';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Narrower structural interface for `CandidateHero`'s `profile` prop.
 *
 * Includes exactly the fields CandidateHero reads. Both `DummyFemaleProfile`
 * and `DummyDeckProfile` are assignable to this type structurally without any
 * cast, satisfying the B2 widening requirement (story 13.3 AC1).
 *
 * @see {@link CandidateHeroProps}
 */
export interface CandidateHeroProfile {
  /** Given name displayed in the name row. */
  readonly first_name: string | null;
  /** Age displayed after the comma in the name row. */
  readonly age: number | null;
  /** City component of the city/country subtitle. */
  readonly current_residence_city: string | null;
  /** Country component of the city/country subtitle. */
  readonly current_residence_country: string | null;
  /** ISO 3166-1 alpha-2 code driving the country flag chip. */
  readonly resident_country_code: string | null;
  /** Job title driving the profession chip. */
  readonly job_title: string | null;
  /**
   * Ordered photo URI array. `photos[0]` is the hero image.
   * Nullable — falls back to `photo_url`.
   */
  readonly photos: string[] | null;
  /**
   * Direct photo URL used when `photos` is null or empty.
   * Nullable — renders a placeholder when both are absent.
   */
  readonly photo_url: string | null;
  /**
   * URI of the verified face selfie. Non-null drives the green verified tick.
   * Nullable — tick is hidden when null.
   */
  readonly faceSelfieUri: string | null;
  /**
   * Optional display-only field bag for overlay bubbles (active-today dot,
   * membership-tier badge). Optional so callers without this block compile
   * without supplying it.
   */
  readonly __dummy_display_only?: {
    readonly is_active_today?: boolean;
    readonly membership_tier?: 'gold' | 'silver' | null;
  };
}

export interface CandidateHeroProps {
  /**
   * The candidate profile to display. Accepts any type assignable to
   * {@link CandidateHeroProfile} — both `DummyFemaleProfile` and
   * `DummyDeckProfile` satisfy this structurally without a cast (AC1 of
   * story 13.3).
   */
  readonly profile: CandidateHeroProfile;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HERO_HEIGHT = Dimensions.get('window').height * 0.65;

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

  const photoPath = profile.photos?.[0] ?? profile.photo_url ?? undefined;
  const photoSource = resolveDummyPhoto(photoPath);
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
      {photoSource !== undefined ? (
        <ExpoImage
          source={photoSource}
          style={styles.image}
          contentFit="cover"
          testID="candidate-hero-image"
          accessibilityLabel={`${profile.first_name ?? 'Candidate'} photo`}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} testID="candidate-hero-image" />
      )}

      {/* Stacked semi-transparent bands fake a bottom-up gradient — the
          single-block overlay previously covered the bottom half of every
          hero photo at a uniform 50 % opacity, which read as "the image is
          darkened", not as a soft fade. */}
      <View pointerEvents="none" style={styles.gradientStack}>
        <View style={[styles.gradientBand, styles.gradientBand1]} />
        <View style={[styles.gradientBand, styles.gradientBand2]} />
        <View style={[styles.gradientBand, styles.gradientBand3]} />
      </View>

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
            <View
              style={[styles.chip, styles.countryChip]}
              testID="candidate-hero-country-chip"
            >
              <CountryFlag isoCode={profile.resident_country_code} size={14} />
              <RNText style={styles.chipLabel}>
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
    topBubbles: {
      position: 'absolute',
      // Muzz-style: bubbles sit under the header on the LEFT.
      top: theme.spacing.md,
      left: theme.spacing.md,
      gap: theme.spacing.xs,
      alignItems: 'flex-start',
    },
    bubble: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      backgroundColor: 'rgba(0,0,0,0.65)',
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
      // Slightly darker + border for the muzz-style contrast against
      // photographic backgrounds.
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
