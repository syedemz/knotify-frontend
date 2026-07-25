/**
 * Page 15 — Current residence country picker.
 *
 * Renders a searchable country list (flag + name + dial code) sourced from
 * `src/config/countries.ts`. Tapping a row writes BOTH `current_residence_country`
 * (display name) and `resident_country_code` (ISO-2) to the draft in a single
 * atomic update, then auto-advances to `Page16ResidenceCityScreen`.
 *
 * No default pre-selection — the picker opens scrolled to the top with no
 * country highlighted. Device-locale detection is out of scope.
 *
 * @module features/onboarding/screens/Page15CountryScreen
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, WizardHeader, Heading, CountryPicker } from '@/components';
import { t } from '@/labels';
import { countries } from '@/config/countries';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  'Page15ResidenceCountryScreen'
>;

/**
 * Residence country selection screen for onboarding page 15.
 *
 * Tapping a country row atomically writes `current_residence_country` (the
 * display name) and `resident_country_code` (the ISO-2 code, per the DB field
 * name in `UserProfile.ts`) to the draft in a single `update({...})` call,
 * then navigates forward to `Page16ResidenceCityScreen`. There is no separate
 * Continue button — the advance fires immediately on row tap.
 */
export function Page15CountryScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance } = useOnboardingDraft();

  /**
   * Handles selecting a country row.
   *
   * Writes both draft fields atomically and auto-advances.
   *
   * @param name - The country's human-readable display name.
   * @param iso2 - The ISO 3166-1 alpha-2 country code.
   */
  function handleSelect(name: string, iso2: string): void {
    update({
      current_residence_country: name,
      resident_country_code: iso2,
    });
    advance(16);
    navigation.navigate('Page16ResidenceCityScreen');
  }

  return (
    <Screen>
      <WizardHeader
        currentPage={15}
        onBack={() => navigation.goBack()}
        canGoBack={navigation.canGoBack()}
      />
      <Heading variant="display.md" color="primary">
        {t('onboarding.country.title')}
      </Heading>
      <CountryPicker
        countries={countries}
        onSelect={handleSelect}
        selectedIso={null}
        searchPlaceholder={t('onboarding.country.searchPlaceholder')}
        searchAccessibilityLabel={t('onboarding.country.searchPlaceholder')}
      />
    </Screen>
  );
}
