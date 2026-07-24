/**
 * Page 12 — Education level picker.
 *
 * Renders a selectable list of education level options sourced from
 * `options.educationLevel`. Tapping any row writes `education_level` to the
 * draft and auto-advances to `Page13EducationCredentialsScreen`. There is no
 * manual Continue button — the advance is triggered immediately on row tap.
 *
 * Re-tapping the currently-selected row is a no-op (matches the story-4.1
 * religion re-tap behavior).
 *
 * Back-navigation from page 13 returns to this screen with the prior
 * `education_level` selection still visible as selected (local state is read
 * from the draft on mount via `getDraft().fields.education_level`). Downgrade
 * reconciliation of credentials fields is story 5.2's concern.
 *
 * @module features/onboarding/screens/Page12EducationLevelScreen
 */

import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, WizardHeader, Heading, ListRowSelectable, Column } from '@/components';
import { t } from '@/labels';
import { options } from '@/config/options';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page12EducationLevelScreen'>;

/**
 * Education level selection screen for onboarding page 12.
 *
 * All options are sourced dynamically from `options.educationLevel` — the
 * count is never hardcoded. Tapping a row writes `education_level` to the
 * draft and auto-advances to page 13; no manual Continue button is shown.
 *
 * Re-tapping the already-selected row is a no-op: `education_level` is not
 * written again and navigation does not fire.
 *
 * On back-navigation from page 13, the previously selected `education_level`
 * is restored from the draft so the row appears highlighted again.
 */
export function Page12EducationLevelScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance, getDraft } = useOnboardingDraft();

  /**
   * In-flight selection — initialised from the persisted draft so that
   * back-navigation from page 13 shows the prior selection as highlighted.
   */
  const [selectedLevel, setSelectedLevel] = useState<string | null>(
    getDraft().fields.education_level ?? null,
  );

  /**
   * Handles tapping an education level row.
   *
   * - No-op if the tapped level is already selected (matches story-4.1
   *   religion re-tap behavior).
   * - Otherwise: writes `education_level` to the draft, updates local
   *   selection state, advances to page 13, and navigates forward.
   *
   * @param level - The education level string that was tapped.
   */
  function handleLevelPress(level: string): void {
    // Re-tapping the currently-selected row is a no-op.
    if (level === selectedLevel) return;

    setSelectedLevel(level);
    update({ education_level: level });
    advance(13);
    navigation.navigate('Page13EducationCredentialsScreen');
  }

  return (
    <Screen>
      <WizardHeader
        currentPage={12}
        onBack={() => navigation.goBack()}
        canGoBack={navigation.canGoBack()}
      />
      <ScrollView>
        <Heading variant="display.md" color="primary">
          {t('onboarding.education.title')}
        </Heading>
        <Column gap="sm" paddingY="lg">
          {options.educationLevel.map((level) => (
            <ListRowSelectable
              key={level}
              label={level}
              selected={selectedLevel === level}
              onToggle={() => handleLevelPress(level)}
            />
          ))}
        </Column>
      </ScrollView>
    </Screen>
  );
}
