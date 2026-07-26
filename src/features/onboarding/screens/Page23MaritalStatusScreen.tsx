/**
 * Page 23 — Marital status + reactive children question.
 *
 * Renders three rows from `options.maritalStatus` (Never Married, Divorced,
 * Widowed). Tapping `Never Married` writes both `marital_status` and
 * `has_children=false` atomically and auto-advances. Tapping `Divorced` or
 * `Widowed` reveals a secondary "Do you have children?" row group — the
 * screen does NOT write to the draft at that point. Writing only occurs once
 * the user taps Yes or No.
 *
 * **Atomic write rule:**
 * Every draft write is a single `update({ marital_status, has_children })`
 * call. Split writes are never used.
 *
 * **Reset rule:**
 * Tapping `Never Married` always writes `{ marital_status: 'Never Married',
 * has_children: false }` unconditionally — prior draft state is ignored.
 *
 * **Auto-advance rule:**
 * Navigation to `Page24MoveAbroadScreen` fires ONLY from tap handlers, never
 * from a `useEffect` watching draft or local state. This prevents back-nav
 * rubber-banding.
 *
 * **Re-visit (back-nav from page 24):**
 * On mount the screen reads `draft.fields.marital_status` and
 * `draft.fields.has_children` to reconstruct local UI state. If
 * `marital_status` is Divorced or Widowed the children row is made visible
 * with the previously-chosen Yes/No highlighted. Auto-advance MUST NOT fire.
 *
 * @module features/onboarding/screens/Page23MaritalStatusScreen
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Column,
  Heading,
  ListRowSelectable,
  Screen,
  Text,
  WizardHeader,
} from '@/components';
import { t } from '@/labels';
import { options } from '@/config/options';
import { useOnboardingDraft } from '../hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page23MaritalStatusScreen'>;

/**
 * The marital-status options that trigger the children sub-question.
 * `'Never Married'` does not reveal children (always writes `false`).
 */
type BranchingStatus = 'Divorced' | 'Widowed';

/** Returns true for statuses that reveal the children question. */
function isBranchingStatus(value: string): value is BranchingStatus {
  return value === 'Divorced' || value === 'Widowed';
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 23: marital status with reactive children question.
 *
 * - `Never Married` tap → atomic write of both fields, then advance.
 * - `Divorced` / `Widowed` tap → reveals children question (local only, no write).
 * - Yes/No tap inside children question → atomic write of both fields, then advance.
 * - On re-visit: reconstructs local UI state from draft without firing advance.
 */
export function Page23MaritalStatusScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance, getDraft } = useOnboardingDraft();

  // ── Local state ──────────────────────────────────────────────────────────────

  /**
   * The currently-highlighted marital-status row.
   *
   * For `Never Married` this is set only after the tap completes (advance fires
   * immediately, so it's a cosmetic flash). For Divorced/Widowed it is set on
   * tap of the marital-status row — no draft write yet.
   */
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  /**
   * Pending branching status (Divorced / Widowed) waiting for a Yes/No answer.
   *
   * `null` when children row is hidden (first visit with no prior selection, or
   * Never Married selected).
   */
  const [pendingBranchStatus, setPendingBranchStatus] = useState<BranchingStatus | null>(null);

  /**
   * The currently-highlighted Yes/No row inside the children sub-question.
   *
   * Re-hydrated on back-nav from draft.fields.has_children.
   */
  const [selectedYesNo, setSelectedYesNo] = useState<string | null>(null);

  // ── Mount-time rehydration ───────────────────────────────────────────────────

  // Guard ensures rehydration runs exactly once per mount.
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const draft = getDraft();
    const savedStatus = draft.fields.marital_status;
    const savedHasChildren = draft.fields.has_children;

    if (savedStatus !== null && savedStatus !== undefined) {
      // Highlight the previously-chosen marital-status row.
      setSelectedStatus(savedStatus);

      if (isBranchingStatus(savedStatus)) {
        // Reveal the children row (same visibility logic as tapping the row).
        setPendingBranchStatus(savedStatus);

        // Reconstruct the previously-chosen Yes/No highlight.
        // `has_children` is boolean | null; coerce to the option string.
        if (savedHasChildren === true) {
          setSelectedYesNo('YES');
        } else if (savedHasChildren === false) {
          // Explicit false (not null) means the user answered No.
          setSelectedYesNo('NO');
        }
      }
    }
    // Auto-advance MUST NOT fire here — back-nav must land the user on this
    // screen, not skip past it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tap handlers ─────────────────────────────────────────────────────────────

  /**
   * Handles a tap on a marital-status row.
   *
   * For `Never Married`: atomically writes `{ marital_status: 'Never Married',
   * has_children: false }` and auto-advances. The reset rule is applied here
   * unconditionally — no inspection of prior draft state is needed.
   *
   * For `Divorced` / `Widowed`: stores the choice in local state (no draft
   * write) and reveals the children question. Auto-advance does NOT fire until
   * the user answers the children question.
   *
   * @param status - The tapped marital-status option from `options.maritalStatus`.
   */
  const handleStatusTap = useCallback(
    (status: string): void => {
      setSelectedStatus(status);

      if (!isBranchingStatus(status)) {
        // Never Married path: atomic write + advance.
        // Reset rule: always write has_children=false regardless of prior state.
        setPendingBranchStatus(null);
        setSelectedYesNo(null);
        update({ marital_status: status, has_children: false });
        advance(24);
        navigation.navigate('Page24MoveAbroadScreen');
        return;
      }

      // Divorced / Widowed path: reveal children question, no draft write yet.
      setPendingBranchStatus(status);
      // Keep any previously-highlighted Yes/No from a re-visit, but do NOT
      // reset it — tapping Divorced then Widowed (or vice versa) should
      // preserve the children highlight until the user taps again or back-navs.
    },
    [update, advance, navigation],
  );

  /**
   * Handles a tap on a Yes/No row inside the children sub-question.
   *
   * Writes `marital_status` (the pending branching status) AND `has_children`
   * (coerced from the option string: `'YES'` → `true`, `'NO'` → `false`) in a
   * single atomic update, then auto-advances.
   *
   * @param yesNoOption - The tapped option from `options.yesNo` ('YES' or 'NO').
   */
  const handleChildrenTap = useCallback(
    (yesNoOption: string): void => {
      if (pendingBranchStatus === null) return;

      setSelectedYesNo(yesNoOption);
      // Coerce the string option to a boolean — never write raw 'YES'/'NO'.
      const hasChildren: boolean = yesNoOption === 'YES';
      update({ marital_status: pendingBranchStatus, has_children: hasChildren });
      advance(24);
      navigation.navigate('Page24MoveAbroadScreen');
    },
    [pendingBranchStatus, update, advance, navigation],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  const childrenRowVisible = pendingBranchStatus !== null;

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={23} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Heading variant="display.md" color="primary">
          {t('onboarding.maritalStatus.title')}
        </Heading>

        <Column gap="sm" paddingY="lg">
          {options.maritalStatus.map((status) => (
            <ListRowSelectable
              key={status}
              label={status}
              selected={selectedStatus === status}
              onToggle={() => handleStatusTap(status)}
              control="radio"
            />
          ))}
        </Column>

        {childrenRowVisible && (
          <Column gap="sm" paddingY="lg">
            <Text variant="label.md" color="secondary">
              {t('onboarding.maritalStatus.hasChildren.label')}
            </Text>

            {options.yesNo.map((option) => (
              <ListRowSelectable
                key={option}
                label={option}
                selected={selectedYesNo === option}
                onToggle={() => handleChildrenTap(option)}
                control="radio"
              />
            ))}
          </Column>
        )}
      </ScrollView>
    </Screen>
  );
}
