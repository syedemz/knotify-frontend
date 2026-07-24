/**
 * Page 10 — Professional category picker.
 *
 * Renders a selectable list of professional category options sourced from
 * `options.professionalCategory`. Tapping any row writes `professional_category`
 * to the draft and auto-advances to `Page11WorkDetailsScreen`. There is no
 * manual Continue button.
 *
 * On back-navigation, tapping a row overwrites the previously-written
 * `professional_category` with the new value and auto-advances as normal.
 * `professional_category` is not in `IMMUTABLE_FIELDS` so the overwrite is
 * a plain replace.
 *
 * @module features/onboarding/screens/Page10ProfessionalCategoryScreen
 */

import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, WizardHeader, Heading, ListRowSelectable, Column } from '@/components';
import { t } from '@/labels';
import { options } from '@/config/options';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page10ProfessionalCategoryScreen'>;

/**
 * Professional category selection screen for onboarding page 10.
 *
 * All options are sourced dynamically from `options.professionalCategory` —
 * the count is never hardcoded. Tapping a row writes the value to the draft
 * and auto-advances; no manual Continue button is shown.
 */
export function Page10ProfessionalCategoryScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance } = useOnboardingDraft();

  /**
   * In-flight selection — tracks which category the user tapped on this
   * screen. Drives the selected highlight state on the rows.
   */
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  /**
   * Handles tapping a professional category row.
   *
   * Writes the value to the draft and auto-advances to
   * `Page11WorkDetailsScreen`. Any subsequent tap on a different row
   * (back-nav scenario) performs a plain overwrite — `professional_category`
   * is not in `IMMUTABLE_FIELDS`.
   */
  function handleCategoryPress(category: string): void {
    setSelectedCategory(category);
    update({ professional_category: category });
    advance(11);
    navigation.navigate('Page11WorkDetailsScreen');
  }

  return (
    <Screen>
      <WizardHeader currentPage={10} onBack={() => navigation.goBack()} />
      <ScrollView>
        <Heading variant="display.md" color="primary">
          {t('onboarding.professionalCategory.title')}
        </Heading>
        <Column gap="sm" paddingY="lg">
          {options.professionalCategory.map((category) => (
            <ListRowSelectable
              key={category}
              label={category}
              selected={selectedCategory === category}
              onToggle={() => handleCategoryPress(category)}
            />
          ))}
        </Column>
      </ScrollView>
    </Screen>
  );
}
