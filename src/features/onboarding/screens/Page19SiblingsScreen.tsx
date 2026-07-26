/**
 * Page 19 — Siblings dynamic list.
 *
 * Implements a three-state machine:
 *
 * **Initial** — The user enters the number of siblings (0–4). A count of `0`
 * immediately enables Continue; a count of 1–4 enables Continue which
 * transitions to Filling. The count must be an integer in [0, 4].
 *
 * **Filling** — N `<SiblingForm />` cards rendered in a `ScrollView`. Continue
 * is disabled until every card is valid. A Cancel button returns to Initial
 * (count cleared, in-progress local state discarded, `draft.siblings` unchanged).
 *
 * **Complete** — Continue enabled; navigates to Page 20.
 *
 * **Back-nav / mount-time state resolution** reads `draft.siblings` and
 * `draft.currentPage`:
 * - `currentPage < 20` → Initial (blank count).
 * - `currentPage >= 20 && siblings.length === 0` → Complete (the 0-case).
 * - `currentPage >= 20 && siblings.length > 0` → Filling (pre-populated, valid
 *   if all cards are valid).
 *
 * On Continue in Filling state, the assembled `SiblingDraft[]` is written via
 * `setSiblings`, `advance(20)` is called, then navigation moves to Page 20.
 *
 * @module features/onboarding/screens/Page19SiblingsScreen
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Button,
  Column,
  FormField,
  Heading,
  Screen,
  Text,
  TextInput,
  WizardFooter,
  WizardHeader,
} from '@/components';
import { t } from '@/labels';
import { useOnboardingDraft } from '../hooks/useOnboardingDraft';
import type { SiblingDraft } from '../draftSchema';
import { SiblingForm } from '../components/SiblingForm';
import type { OnboardingStackParamList } from '@/navigation/types';

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page19SiblingsScreen'>;

/**
 * The three states of Page 19's state machine.
 *
 * - `Initial`  — count input visible; Continue enabled only when count is in [0, 4].
 * - `Filling`  — N SiblingForm cards visible; Cancel visible.
 * - `Complete` — Continue enabled; no count input or Cancel.
 */
type ScreenState = 'Initial' | 'Filling' | 'Complete';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parses the raw count input string.
 *
 * Returns the integer value if the string represents a non-negative integer in
 * [0, 4]. Returns `null` for any string that is empty, non-integer, negative,
 * or greater than 4.
 */
function parseCount(text: string): number | null {
  if (text === '') return null;
  const n = parseInt(text, 10);
  if (!Number.isInteger(n) || isNaN(n) || String(n) !== text) return null;
  if (n < 0 || n > 4) return null;
  return n;
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 19: siblings dynamic list.
 *
 * The count input accepts 0–4 (inclusive); negatives, non-integers, and >4
 * are rejected. When count is 0, Continue writes `draft.siblings = []` and
 * navigates immediately. When count is 1–4, Continue transitions to Filling
 * with N `SiblingForm` cards. Cancel from Filling returns to Initial without
 * touching `draft.siblings`.
 */
export function Page19SiblingsScreen({ navigation }: Props): React.JSX.Element {
  const { setSiblings, advance, getDraft } = useOnboardingDraft();

  // ── Mount-time state resolution (back-nav re-hydration) ─────────────────────

  const [screenState, setScreenState] = useState<ScreenState>('Initial');

  // Count input — only shown in Initial state
  const [countText, setCountText] = useState('');

  // In-progress sibling card values (Filling state)
  const [siblingDrafts, setSiblingDrafts] = useState<SiblingDraft[]>([]);

  // Per-card validity map: index → valid
  const [cardValidity, setCardValidity] = useState<Record<number, boolean>>({});

  // Track whether we have initialized from draft (avoid double init)
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const draft = getDraft();

    if (draft.currentPage < 20) {
      // Page 19 was never completed — open in Initial with blank count.
      setScreenState('Initial');
      return;
    }

    if (draft.siblings.length === 0) {
      // Page 19 completed with 0 siblings — open in Complete state.
      setScreenState('Complete');
      return;
    }

    // Page 19 completed with N > 0 siblings — open in Filling with pre-populated cards.
    setSiblingDrafts([...draft.siblings]);
    // Pre-populate validity: all pre-populated cards start as valid (they were
    // already validated when originally submitted).
    const initialValidity: Record<number, boolean> = {};
    draft.siblings.forEach((_, i) => {
      initialValidity[i] = true;
    });
    setCardValidity(initialValidity);
    setScreenState('Filling');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────────

  const parsedCount = parseCount(countText);
  const countIsValid = parsedCount !== null; // 0–4 inclusive

  const allCardsValid =
    siblingDrafts.length > 0 &&
    siblingDrafts.every((_, i) => cardValidity[i] === true);

  // Continue button enabled logic:
  // - Initial: enabled when count is in [0, 4]
  // - Filling: enabled when all cards are valid
  // - Complete: always enabled
  const continueEnabled =
    screenState === 'Complete' ||
    (screenState === 'Initial' && countIsValid) ||
    (screenState === 'Filling' && allCardsValid);

  // ── Callbacks ────────────────────────────────────────────────────────────────

  const handleCardChange = useCallback(
    (index: number, sibling: SiblingDraft): void => {
      setSiblingDrafts((prev) => {
        const next = [...prev];
        next[index] = sibling;
        return next;
      });
    },
    [],
  );

  const handleCardValidityChange = useCallback(
    (index: number, valid: boolean): void => {
      setCardValidity((prev) => ({ ...prev, [index]: valid }));
    },
    [],
  );

  const handleCountChange = useCallback((text: string): void => {
    // Only allow digits — strip anything else
    const sanitized = text.replace(/[^0-9]/g, '');
    setCountText(sanitized);
  }, []);

  const handleCancel = useCallback((): void => {
    // Return to Initial — clear count input and discard in-progress state.
    // MUST NOT modify draft.siblings.
    setCountText('');
    setSiblingDrafts([]);
    setCardValidity({});
    setScreenState('Initial');
  }, []);

  const handleContinue = useCallback((): void => {
    if (!continueEnabled) return;

    if (screenState === 'Initial') {
      if (parsedCount === 0) {
        // 0-case: write empty siblings array, advance, navigate.
        setSiblings([]);
        advance(20);
        navigation.navigate('Page20MarriageTimelineScreen');
        return;
      }

      if (parsedCount !== null && parsedCount >= 1) {
        // Transition to Filling: create N empty sibling slots.
        const empty: SiblingDraft[] = Array.from({ length: parsedCount }, () => ({
          name: '',
          age: null,
          maritalStatus: null,
          gender: null,
          profession: null,
        }));
        setSiblingDrafts(empty);
        setCardValidity({});
        setScreenState('Filling');
        return;
      }
      return;
    }

    if (screenState === 'Filling') {
      // Write assembled siblings, advance, navigate.
      setSiblings(siblingDrafts);
      advance(20);
      navigation.navigate('Page20MarriageTimelineScreen');
      return;
    }

    if (screenState === 'Complete') {
      // Already completed — just navigate.
      navigation.navigate('Page20MarriageTimelineScreen');
    }
  }, [
    continueEnabled,
    screenState,
    parsedCount,
    siblingDrafts,
    setSiblings,
    advance,
    navigation,
  ]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={19} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Heading variant="display.md" color="primary">
          {t('onboarding.siblings.title')}
        </Heading>

        {/* ── Initial state: count input ──────────────────────────────────── */}
        {screenState === 'Initial' && (
          <FormField
            label={t('onboarding.siblings.countPrompt')}
            required
          >
            <TextInput
              value={countText}
              onChangeText={handleCountChange}
              placeholder="0"
              keyboardType="number-pad"
              maxLength={1}
              returnKeyType="done"
              error={countText !== '' && parsedCount === null}
              accessibilityLabel={t('onboarding.siblings.countPrompt')}
            />
          </FormField>
        )}

        {/* ── Filling state: N SiblingForm cards + Cancel button ─────────── */}
        {screenState === 'Filling' && (
          <Column gap="md">
            {siblingDrafts.map((sibling, i) => (
              <SiblingForm
                key={i}
                index={i}
                initial={sibling.name !== '' || sibling.age !== null ? sibling : undefined}
                onChange={handleCardChange}
                onValidityChange={handleCardValidityChange}
              />
            ))}

            <Button
              label={t('onboarding.siblings.cancel')}
              onPress={handleCancel}
              variant="ghost"
              accessibilityLabel={t('onboarding.siblings.cancel')}
            />
          </Column>
        )}

        {/* ── Complete state: summary text ────────────────────────────────── */}
        {screenState === 'Complete' && (
          <Text variant="body.md" color="secondary">
            {t('onboarding.siblings.completeSummary')}
          </Text>
        )}
      </ScrollView>

      <WizardFooter onContinue={handleContinue} disabled={!continueEnabled} />
    </Screen>
  );
}
