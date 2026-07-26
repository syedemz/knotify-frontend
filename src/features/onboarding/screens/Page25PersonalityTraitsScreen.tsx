/**
 * Page 25 — Personality traits multi-select.
 *
 * Renders a scrollable pill grid of 57 personality traits (sourced from
 * `options.preferences1`). The user may select up to 5 traits. Attempting
 * to select a 6th trait shows a Snackbar toast ("You can select up to 5
 * traits") and rejects the tap.
 *
 * **Continue button:**
 * Always enabled (regardless of selection count). When N === 0, label reads
 * "Continue" and no draft write occurs. When N >= 1, label reads "Select (N)"
 * and `preferences: { personalityTraits: [...] }` is written to the draft
 * before navigating to `Page27RelationScreen`.
 *
 * **Re-visit (back-nav from page 27):**
 * On mount the screen reads `draft.fields.preferences?.personalityTraits`
 * and pre-selects those pills. The `initializedRef` guard prevents
 * auto-advance from firing on mount.
 *
 * **Auto-advance rule:**
 * Navigation to `Page27RelationScreen` fires ONLY from the Continue tap
 * handler — never from a `useEffect` watching state. This prevents
 * back-nav rubber-banding.
 *
 * @module features/onboarding/screens/Page25PersonalityTraitsScreen
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Heading,
  PillButton,
  Screen,
  Snackbar,
  Text,
  WizardFooter,
  WizardHeader,
} from '@/components';
import { t, type LabelKey } from '@/labels';
import { options } from '@/config/options';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import { useOnboardingDraft } from '../hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';
import iconMap from '@/config/options/preferences1Icons.json';

// ── Constants ──────────────────────────────────────────────────────────────────

/** Maximum number of personality traits the user may select. */
const MAX_TRAITS = 5;

/**
 * Typed emoji icon map keyed by the same trait strings used in
 * `options.preferences1`. Sourced from `preferences1Icons.json` so the DB
 * key (English trait string) is never changed.
 */
const TRAIT_ICONS = iconMap as Record<string, string>;

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page25Preferences1Screen'>;

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 25: personality traits multi-select.
 *
 * Pill grid of 57 traits with a 5-trait selection cap. Continue is always
 * enabled. With N >= 1 selected, tapping Continue writes
 * `preferences: { personalityTraits: [...] }` to the draft and advances to
 * page 27. With N === 0, tapping Continue advances without writing. Re-visit
 * pre-selects previously saved traits without auto-advancing.
 */
export function Page25PersonalityTraitsScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance, getDraft } = useOnboardingDraft();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // ── Local state ──────────────────────────────────────────────────────────────

  /**
   * Set of currently-selected trait strings.
   * Initialised empty; rehydrated from draft on mount if a prior value exists.
   */
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /**
   * Whether the cap-exceeded Snackbar toast is visible.
   */
  const [capToastVisible, setCapToastVisible] = useState(false);

  // ── Mount-time rehydration ───────────────────────────────────────────────────

  // Guard ensures rehydration runs exactly once per mount — prevents stale
  // closure issues and stops auto-advance from firing on re-visit.
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const draft = getDraft();
    const savedPreferences = draft.fields.preferences;

    if (
      savedPreferences !== null &&
      savedPreferences !== undefined &&
      typeof savedPreferences === 'object' &&
      Array.isArray((savedPreferences as Record<string, unknown>)['personalityTraits'])
    ) {
      const savedTraits = (savedPreferences as { personalityTraits: string[] }).personalityTraits;
      if (savedTraits.length > 0) {
        // Pre-select previously-saved traits. Auto-advance MUST NOT fire here —
        // back-nav should land the user on this screen, not skip it.
        setSelected(new Set(savedTraits));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tap handlers ─────────────────────────────────────────────────────────────

  /**
   * Handles a tap on a trait pill.
   *
   * Toggles the trait in/out of the selected set. If the user attempts to
   * add a 6th trait, shows a Snackbar toast and rejects the tap.
   *
   * @param trait - The tapped trait string from `options.preferences1`.
   */
  const handlePillPress = useCallback(
    (trait: string): void => {
      setSelected((prev) => {
        if (prev.has(trait)) {
          // Deselect
          const next = new Set(prev);
          next.delete(trait);
          return next;
        }
        if (prev.size >= MAX_TRAITS) {
          // Cap exceeded — show toast and reject the tap
          setCapToastVisible(true);
          return prev;
        }
        // Select
        const next = new Set(prev);
        next.add(trait);
        return next;
      });
    },
    [],
  );

  /**
   * Handles the Continue button tap.
   *
   * When N >= 1 traits are selected, writes
   * `preferences: { personalityTraits: [...] }` to the draft. When N === 0,
   * skips the write (draft is left unchanged). Always advances to page 27.
   */
  const handleContinue = useCallback((): void => {
    if (selected.size > 0) {
      update({
        preferences: { personalityTraits: Array.from(selected) },
      });
    }
    advance(27);
    navigation.navigate('Page27RelationScreen');
  }, [selected, update, advance, navigation]);

  /**
   * Dismisses the cap-exceeded Snackbar toast.
   */
  const handleToastDismiss = useCallback((): void => {
    setCapToastVisible(false);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────────

  const selectedCount = selected.size;

  /**
   * Continue label:
   * - 0 selected → "Continue" (plain, from `continueLabelEmpty` label key)
   * - N >= 1     → "Select (N)" (from `continueLabel` with `{count}` replaced)
   */
  const continueLabel =
    selectedCount === 0
      ? t('onboarding.personalityTraits.continueLabelEmpty')
      : t('onboarding.personalityTraits.continueLabel').replace(
          '{count}',
          String(selectedCount),
        );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={25} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Heading variant="display.md" color="primary">
          {t('onboarding.personalityTraits.title')}
        </Heading>

        <View style={styles.subtitleWrapper}>
          <Text variant="body.md" color="secondary">
            {t('onboarding.personalityTraits.subtitle')}
          </Text>
        </View>

        {/* Pill grid — natural flex-wrap, content-width pills */}
        <View style={styles.pillGrid}>
          {options.preferences1.map((trait) => {
            // Localised trait label. Every trait has an entry under
            // `onboarding.personalityTraits.options.*` in both locale bundles
            // (MBTI acronyms map to themselves in Urdu), so the cast is safe.
            const displayLabel = t(
              `onboarding.personalityTraits.options.${trait}` as LabelKey,
            );
            return (
              <PillButton
                key={trait}
                label={displayLabel}
                variant={selected.has(trait) ? 'selected' : 'default'}
                borderVariant="subtle"
                onPress={() => handlePillPress(trait)}
                accessibilityLabel={displayLabel}
                icon={TRAIT_ICONS[trait]}
              />
            );
          })}
        </View>
      </ScrollView>

      {/* Footer — Continue button (always enabled) */}
      <WizardFooter
        onContinue={handleContinue}
        continueLabel={continueLabel}
      />

      {/* Cap-exceeded toast */}
      <Snackbar
        visible={capToastVisible}
        message={t('onboarding.personalityTraits.capExceededToast')}
        onDismiss={handleToastDismiss}
        duration={3000}
        accessibilityLabel={t('onboarding.personalityTraits.capExceededToast')}
      />
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    subtitleWrapper: {
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    pillGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
  });
}
