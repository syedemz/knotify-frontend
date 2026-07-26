/**
 * Page 24 — Willingness to move abroad after marriage.
 *
 * Renders a single header question with a YES / NO row picker from
 * `options.yesNo`. The semantics of this screen differ from a plain
 * radio-picker in one subtle way: on **first visit** (when
 * `draft.fields.move_abroad` is `null`), YES is visually pre-selected
 * but the draft is NOT written. The pre-select is a UI hint only — the
 * user's tap is what triggers both the draft write and the auto-advance.
 *
 * **Boolean coercion rule:**
 * `move_abroad` is typed `boolean | null` in {@link UserProfile}. The raw
 * option strings ('YES' / 'NO') are NEVER written to the draft. Every tap
 * coerces: `move_abroad: tapped === 'YES'`.
 *
 * **Re-visit (back-nav from page 25):**
 * On mount the screen reads `draft.fields.move_abroad`:
 * - `true`  → YES highlighted (persisted choice from a forward pass)
 * - `false` → NO highlighted (persisted choice from a forward pass)
 * - `null`  → YES highlighted as the default pre-select (draft untouched)
 *
 * Auto-advance MUST NOT fire on mount regardless of the draft value — only
 * the user's tap triggers navigation.
 *
 * **Auto-advance rule:**
 * Navigation to `Page25Preferences1Screen` fires ONLY from the tap handler,
 * never from a `useEffect` watching draft or local state. This prevents
 * back-nav rubber-banding.
 *
 * @module features/onboarding/screens/Page24MoveAbroadScreen
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

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page24MoveAbroadScreen'>;

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 24: willingness to move abroad after marriage.
 *
 * - First visit (draft.fields.move_abroad === null): YES is highlighted as a
 *   visual default. Draft is NOT written until the user taps.
 * - Tap on YES or NO: writes `move_abroad` (boolean coerced) and advances to
 *   page 25.
 * - Re-visit: rehydrates the highlighted row from the previously-saved boolean.
 *   Auto-advance does NOT re-fire.
 */
export function Page24MoveAbroadScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance, getDraft } = useOnboardingDraft();

  // ── Local state ──────────────────────────────────────────────────────────────

  /**
   * The currently-highlighted option ('YES' or 'NO').
   *
   * Initialises to 'YES' to satisfy the default pre-select requirement. This
   * local state is purely visual — it does NOT write to the draft on mount.
   * The draft is only written when the user taps a row.
   */
  const [selected, setSelected] = useState<string>('YES');

  // ── Mount-time rehydration ───────────────────────────────────────────────────

  // Guard ensures rehydration runs exactly once per mount.
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const draft = getDraft();
    const savedValue = draft.fields.move_abroad;

    if (savedValue === true) {
      // Back-nav with a previously-saved YES answer.
      setSelected('YES');
    } else if (savedValue === false) {
      // Back-nav with a previously-saved NO answer.
      // Explicit false (not null) means the user answered No.
      setSelected('NO');
    }
    // null branch: leave `selected` as 'YES' (default pre-select, draft untouched).

    // Auto-advance MUST NOT fire here — back-nav must land the user on this
    // screen, not skip past it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tap handler ──────────────────────────────────────────────────────────────

  /**
   * Handles a tap on a YES / NO row.
   *
   * Coerces the option string to a boolean — never writes the raw string to
   * the draft. Writes `move_abroad` and auto-advances to page 25.
   *
   * @param option - The tapped option from `options.yesNo` ('YES' or 'NO').
   */
  const handleTap = useCallback(
    (option: string): void => {
      setSelected(option);
      // Coerce to boolean — never write the raw 'YES'/'NO' string.
      const moveAbroad: boolean = option === 'YES';
      update({ move_abroad: moveAbroad });
      advance(25);
      navigation.navigate('Page25Preferences1Screen');
    },
    [update, advance, navigation],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={24} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Heading variant="display.md" color="primary">
          {t('onboarding.moveAbroad.title')}
        </Heading>

        <Column gap="sm" paddingY="lg">
          {options.yesNo.map((option) => (
            <ListRowSelectable
              key={option}
              label={option}
              selected={selected === option}
              onToggle={() => handleTap(option)}
              control="radio"
            />
          ))}
        </Column>
      </ScrollView>
    </Screen>
  );
}
