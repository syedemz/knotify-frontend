/**
 * Page 27 — Profile-for-whom (relation).
 *
 * Renders a full-width vertical radio-picker list from `options.relation`.
 * One row per option: Myself, Son, Daughter, Sibling, Friend, Ward.
 *
 * **Auto-advance rule:**
 * Navigation to `Page28PhotosScreen` fires ONLY from the tap handler —
 * never from a `useEffect` watching draft state. This prevents back-nav
 * rubber-banding when returning from page 28.
 *
 * **Re-visit (back-nav from page 28):**
 * On mount the screen reads `draft.fields.relation` and sets the local
 * selected state so the previously-chosen row is highlighted. Auto-advance
 * is NOT fired on mount — the rehydration effect only calls `setSelected`,
 * never `navigation.navigate` or `advance`.
 *
 * @module features/onboarding/screens/Page27RelationScreen
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

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page27RelationScreen'>;

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 27: who the user is creating the profile for.
 *
 * Displays a scrollable vertical radio-picker list sourced from
 * `options.relation`. Tapping a row writes `relation` to the draft and
 * auto-advances to page 28. On re-visit the previously-selected row is
 * highlighted but auto-advance does NOT re-fire.
 */
export function Page27RelationScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance, getDraft } = useOnboardingDraft();

  // ── Local state ──────────────────────────────────────────────────────────────

  /**
   * The currently-selected relation value.
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
    const saved = draft.fields.relation;
    if (saved !== null && saved !== undefined) {
      // Highlight the previously-chosen row. Auto-advance MUST NOT fire here —
      // back-nav should land the user on this screen, not skip it.
      setSelected(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tap handler ──────────────────────────────────────────────────────────────

  /**
   * Handles a tap on a relation row.
   *
   * Writes `relation` to the draft and auto-advances to page 28 from inside
   * the tap handler — never from a `useEffect`. This is the sole place
   * auto-advance is triggered, which prevents back-nav rubber-banding.
   *
   * @param value - The tapped relation string from `options.relation`.
   */
  const handleSelect = useCallback(
    (value: string): void => {
      setSelected(value);
      update({ relation: value });
      advance(28);
      navigation.navigate('Page28PhotosScreen');
    },
    [update, advance, navigation],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={27} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Heading variant="display.md" color="primary">
          {t('onboarding.relation.title')}
        </Heading>

        <Column gap="sm" paddingY="lg">
          {options.relation.map((value) => (
            <ListRowSelectable
              key={value}
              label={value}
              selected={selected === value}
              onToggle={() => handleSelect(value)}
              control="radio"
            />
          ))}
        </Column>
      </ScrollView>
    </Screen>
  );
}
