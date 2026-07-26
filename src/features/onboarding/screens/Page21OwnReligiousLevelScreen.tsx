/**
 * Page 21 — Own religious level.
 *
 * Renders a full-width vertical radio-picker list from `options.religiousLevel`.
 * Only the main label is shown per row — no subtext (AC: "smaller subtext from
 * the reference is intentionally skipped").
 *
 * **Auto-advance rule:**
 * Navigation to `Page22PartnersReligiousLevelScreen` fires ONLY from the tap
 * handler — never from a `useEffect` watching draft state. This prevents
 * back-nav rubber-banding when returning from page 22.
 *
 * **Re-visit (back-nav from page 22):**
 * On mount the screen reads `draft.fields.religious_level` and sets the local
 * selected state so the previously-chosen row is highlighted. Auto-advance is
 * NOT fired on mount — the rehydration effect only calls `setSelected`, never
 * `navigation.navigate` or `advance`.
 *
 * @module features/onboarding/screens/Page21OwnReligiousLevelScreen
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Column,
  Heading,
  ListRowSelectable,
  Screen,
  WizardHeader,
} from '@/components';
import { t } from '@/labels';
import { options } from '@/config/options';
import { useOnboardingDraft } from '../hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page21OwnReligiousLevelScreen'>;

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 21: user's own religious level.
 *
 * Displays a scrollable vertical radio-picker list sourced from
 * `options.religiousLevel`. Tapping a row writes `religious_level` to the
 * draft and auto-advances to page 22. On re-visit the previously-selected row
 * is highlighted but auto-advance does NOT re-fire.
 */
export function Page21OwnReligiousLevelScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance, getDraft } = useOnboardingDraft();

  // ── Local state ──────────────────────────────────────────────────────────────

  /**
   * The currently-selected religious level value.
   * Initialised to `null`; rehydrated from the draft on mount.
   */
  const [selected, setSelected] = useState<string | null>(null);

  // ── Mount-time rehydration ───────────────────────────────────────────────────

  // Guard ensures rehydration runs exactly once per mount (prevents stale
  // closure issues if the effect were to run more than once).
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const draft = getDraft();
    const saved = draft.fields.religious_level;
    if (saved !== null && saved !== undefined) {
      // Highlight the previously-chosen row. Auto-advance MUST NOT fire here —
      // back-nav should land the user on this screen, not skip it.
      setSelected(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tap handler ──────────────────────────────────────────────────────────────

  /**
   * Handles a tap on a religious-level row.
   *
   * Writes `religious_level` to the draft and auto-advances to page 22 from
   * inside the tap handler — never from a `useEffect`. This is the sole place
   * auto-advance is triggered, which prevents back-nav rubber-banding.
   *
   * @param level - The tapped religious level string from `options.religiousLevel`.
   */
  const handleSelect = useCallback(
    (level: string): void => {
      setSelected(level);
      update({ religious_level: level });
      advance(22);
      navigation.navigate('Page22PartnersReligiousLevelScreen');
    },
    [update, advance, navigation],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={21} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Heading variant="display.md" color="primary">
          {t('onboarding.ownReligiousLevel.title')}
        </Heading>

        <Column gap="sm" paddingY="lg">
          {options.religiousLevel.map((level) => (
            <ListRowSelectable
              key={level}
              label={level}
              selected={selected === level}
              onToggle={() => handleSelect(level)}
              control="radio"
            />
          ))}
        </Column>
      </ScrollView>
    </Screen>
  );
}
