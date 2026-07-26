/**
 * Page 20 — Marriage timeline (two pick-one groups).
 *
 * **First pick-one** ("I'd like to know someone on knotify for"):
 * Options are hardcoded in this screen — no catalog entry, no draft field,
 * no DB mapping. Selection is stored locally in `marriageTimelinePrimary`
 * (`useState`). Loss on back-nav past page 20 or app-kill is acceptable.
 *
 * **Second pick-one** ("I'd like to be married within"):
 * Reads `options.marriageTime` and writes to `draft.fields.marriage_time`.
 * On re-visit, the second pick-one rehydrates its selected row from the draft.
 * The first pick-one always starts empty on re-visit (local state discarded).
 *
 * **Auto-advance rule:**
 * Navigation to `Page21OwnReligiousLevelScreen` fires ONLY from a tap handler
 * — never from a `useEffect` watching draft state. Both selections must be set
 * when the tap fires. This prevents back-nav rubber-banding.
 *
 * @module features/onboarding/screens/Page20MarriageTimelineScreen
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Column,
  Heading,
  PillPickOneGroup,
  Screen,
  WizardHeader,
} from '@/components';
import { t } from '@/labels';
import { options } from '@/config/options';
import { useOnboardingDraft } from '../hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

// ── Constants ──────────────────────────────────────────────────────────────────

/**
 * Hardcoded options for the first pick-one ("know someone for").
 *
 * Intentionally NOT sourced from `options.*` — this group has no catalog entry,
 * no draft field, and no DB mapping. See AC note: "hardcoded in the screen".
 */
const PRIMARY_OPTIONS: readonly string[] = [
  '1-2 months',
  '3-4 months',
  '4-12 months',
  '1-2 years',
] as const;

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page20MarriageTimelineScreen'>;

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 20: marriage timeline.
 *
 * Two stacked pill pick-one groups under the page header. Auto-advances to
 * page 21 when both selections are made via a tap — never on mount/rehydrate.
 */
export function Page20MarriageTimelineScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance, getDraft } = useOnboardingDraft();

  // ── Local state ──────────────────────────────────────────────────────────────

  /**
   * First pick-one — client-local only, never persisted.
   * Starts empty on every mount (including back-nav from page 21).
   */
  const [marriageTimelinePrimary, setMarriageTimelinePrimary] = useState<string | null>(null);

  /**
   * Second pick-one — mirrors `draft.fields.marriage_time`.
   * Rehydrated on mount from the draft for back-nav continuity.
   */
  const [marriageTime, setMarriageTime] = useState<string | null>(null);

  // ── Mount-time rehydration ───────────────────────────────────────────────────

  // Guard prevents the rehydration from running more than once per mount.
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const draft = getDraft();
    const saved = draft.fields.marriage_time;
    if (saved !== null && saved !== undefined) {
      // Rehydrate the second pick-one from the draft. The first pick-one
      // stays empty — its local state was discarded on back-nav.
      setMarriageTime(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tap handlers ─────────────────────────────────────────────────────────────

  /**
   * Handles a tap on the first pick-one (local state only, no draft write).
   *
   * Auto-advance fires here if the second pick-one is already selected, because
   * this tap is the completing action. Advance is triggered in the tap handler
   * (not a useEffect) to prevent back-nav rubber-banding.
   */
  const handlePrimarySelect = useCallback(
    (option: string): void => {
      setMarriageTimelinePrimary(option);

      // Auto-advance: both selections now set (second was already set).
      if (marriageTime !== null) {
        update({ marriage_time: marriageTime });
        advance(21);
        navigation.navigate('Page21OwnReligiousLevelScreen');
      }
    },
    [marriageTime, update, advance, navigation],
  );

  /**
   * Handles a tap on the second pick-one (writes to draft, auto-advances if
   * the first pick-one is also set).
   */
  const handleSecondarySelect = useCallback(
    (option: string): void => {
      setMarriageTime(option);

      // Auto-advance: both selections now set (first was already set).
      if (marriageTimelinePrimary !== null) {
        update({ marriage_time: option });
        advance(21);
        navigation.navigate('Page21OwnReligiousLevelScreen');
      }
      // If only the second is tapped (first still null): stay on the page.
      // The draft is NOT written until both are selected and advance fires.
    },
    [marriageTimelinePrimary, update, advance, navigation],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={20} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Heading variant="display.md" color="primary">
          {t('onboarding.marriageTimeline.title')}
        </Heading>

        <Column gap="xl" paddingY="lg">
          <PillPickOneGroup
            label={t('onboarding.marriageTimeline.primary.label')}
            options={PRIMARY_OPTIONS}
            selected={marriageTimelinePrimary}
            onSelect={handlePrimarySelect}
            accessibilityPrefix="primary"
          />

          <PillPickOneGroup
            label={t('onboarding.marriageTimeline.secondary.label')}
            options={options.marriageTime}
            selected={marriageTime}
            onSelect={handleSecondarySelect}
            accessibilityPrefix="secondary"
          />
        </Column>
      </ScrollView>
    </Screen>
  );
}
