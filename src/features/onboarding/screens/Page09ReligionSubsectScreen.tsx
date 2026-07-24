/**
 * Page 9 — Religion picker + Islam-conditional subsect picker.
 *
 * Renders a selectable list of religion options sourced from
 * `options.religion`. When the user picks `'Islam'`, a second selectable
 * list (`options.islamicSubsect`) slides in beneath the religion list.
 * Picking a subsect writes `religion='Islam'` and `subsect=<pick>` to the
 * draft and auto-advances to `Page10ProfessionalCategoryScreen`.
 *
 * When any non-Islam religion is picked, `subsect` is immediately set to
 * `"Not Applicable"` and the screen auto-advances.
 *
 * Re-tapping the currently-selected religion row is a no-op (AC 4).
 *
 * Switching from `Islam` + subsect to another religion clears the in-flight
 * subsect and sets it to `"Not Applicable"` before advancing (AC 5 / AC 6).
 *
 * @module features/onboarding/screens/Page09ReligionSubsectScreen
 */

import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, WizardHeader, Heading, ListRowSelectable, Column } from '@/components';
import { t } from '@/labels';
import { options } from '@/config/options';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page09ReligionSubsectScreen'>;

/** The exact option value that triggers the subsect branch. */
const ISLAM = 'Islam';

/** The subsect value written when a non-Islam religion is selected. */
const NOT_APPLICABLE = 'Not Applicable';

/**
 * Religion and subsect selection screen for onboarding page 9.
 *
 * Implements the Islam-only subsect branch: selecting Islam exposes the
 * subsect list; selecting any other religion skips it and auto-advances.
 * Tapping the already-selected religion row is a no-op.
 */
export function Page09ReligionSubsectScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance } = useOnboardingDraft();

  /**
   * In-flight religion selection — tracks what the user tapped on this
   * screen without committing to the draft until the subsect (if needed) is
   * also resolved.
   */
  const [selectedReligion, setSelectedReligion] = useState<string | null>(null);

  /**
   * In-flight subsect selection — only relevant when `selectedReligion === 'Islam'`.
   * Reset whenever the religion changes.
   */
  const [selectedSubsect, setSelectedSubsect] = useState<string | null>(null);

  /** Navigate to the next page after committing the draft write. */
  function goNext(): void {
    advance(10);
    navigation.navigate('Page10ProfessionalCategoryScreen');
  }

  /**
   * Handles tapping a religion row.
   *
   * - No-op if the tapped religion is already selected (AC 4).
   * - For non-Islam: clears in-flight subsect, writes both fields to the
   *   draft with `subsect="Not Applicable"`, and auto-advances (AC 3 / AC 5 / AC 6).
   * - For Islam: updates in-flight religion, clears any prior subsect
   *   selection, and waits for the user to pick a subsect (AC 2 / AC 5).
   */
  function handleReligionPress(religion: string): void {
    // AC 4: re-tapping the same row is a no-op.
    if (religion === selectedReligion) return;

    setSelectedReligion(religion);
    // Clear any in-flight subsect whenever religion changes (AC 5 / AC 6).
    setSelectedSubsect(null);

    if (religion !== ISLAM) {
      // AC 3 / AC 5 / AC 6: non-Islam → write Not Applicable and advance.
      update({ religion, subsect: NOT_APPLICABLE });
      goNext();
    }
    // Islam: subsect list appears; advance happens only when subsect is chosen.
  }

  /**
   * Handles tapping a subsect row (only visible when Islam is selected).
   *
   * Writes both `religion='Islam'` and `subsect=<pick>` to the draft and
   * auto-advances to Page 10 (AC 2).
   */
  function handleSubsectPress(subsect: string): void {
    setSelectedSubsect(subsect);
    update({ religion: ISLAM, subsect });
    goNext();
  }

  return (
    <Screen>
      <WizardHeader
        currentPage={9}
        onBack={() => navigation.goBack()}
        canGoBack={navigation.canGoBack()}
      />
      <ScrollView>
        <Heading variant="display.md" color="primary">
          {t('onboarding.religion.title')}
        </Heading>
        <Column gap="sm" paddingY="lg">
          {options.religion.map((religion) => (
            <ListRowSelectable
              key={religion}
              label={religion}
              selected={selectedReligion === religion}
              onToggle={() => handleReligionPress(religion)}
            />
          ))}
        </Column>
        {selectedReligion === ISLAM && (
          <Column gap="sm" paddingY="md">
            <Heading variant="heading.md" color="secondary">
              {t('onboarding.religion.subsectTitle')}
            </Heading>
            {options.islamicSubsect.map((subsect) => (
              <ListRowSelectable
                key={subsect}
                label={subsect}
                selected={selectedSubsect === subsect}
                onToggle={() => handleSubsectPress(subsect)}
              />
            ))}
          </Column>
        )}
      </ScrollView>
    </Screen>
  );
}
