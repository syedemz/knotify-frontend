/**
 * Page 16 — Current residence city.
 *
 * Renders a single `TextInput` for the user to enter their current city of
 * residence. Continue is disabled until the value passes `isValidCity()`.
 * On tap, `current_residence_city` is written to the draft and the wizard
 * advances to `Page17KashmirDistrictScreen`.
 *
 * Inline field errors mirror the Page 02 / Page 11 pattern: errors appear only
 * after the user has interacted with the field (touched-flag guard).
 *
 * @module features/onboarding/screens/Page16ResidenceCityScreen
 */

import React, { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { FormField, Heading, Screen, TextInput, WizardFooter, WizardHeader } from '@/components';
import { t } from '@/labels';
import { isValidCity, MAX_CITY_NAME_LENGTH } from '@/Helper/validationHelper';
import { useOnboardingDraft } from '../hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page16ResidenceCityScreen'>;

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 16: current residence city entry.
 *
 * A single text field for the city name. Only letters, spaces, hyphens, and
 * apostrophes are accepted (1–40 characters). Inline error hints render only
 * after the field has been touched. Continue writes `current_residence_city`
 * to the draft and navigates to `Page17KashmirDistrictScreen`.
 */
export function Page16ResidenceCityScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance } = useOnboardingDraft();

  // ── Field state ──────────────────────────────────────────────────────────────

  const [city, setCity] = useState('');
  const [touched, setTouched] = useState(false);

  // ── Derived validation ───────────────────────────────────────────────────────

  const cityValid = isValidCity(city);
  const continueEnabled = cityValid;

  /**
   * Inline error message shown below the text field after the user has touched
   * the field. Mirrors the phase-11 pattern: tooLong is checked first so the
   * user sees "too long" rather than "invalid chars" when they are over the
   * length limit.
   */
  const cityError: string | undefined = (() => {
    if (!touched || city.length === 0) return undefined;
    if (city.length > MAX_CITY_NAME_LENGTH) {
      return t('onboarding.residenceCity.errors.tooLong');
    }
    if (!isValidCity(city)) {
      return t('onboarding.residenceCity.errors.invalidCharacters');
    }
    return undefined;
  })();

  // ── Continue handler ─────────────────────────────────────────────────────────

  const handleContinue = useCallback((): void => {
    if (!continueEnabled) return;
    update({ current_residence_city: city });
    advance(17);
    navigation.navigate('Page17FamilyResidenceScreen');
  }, [continueEnabled, city, update, advance, navigation]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={16} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Heading variant="display.md" color="primary">
          {t('onboarding.residenceCity.title')}
        </Heading>

        <FormField
          label={t('onboarding.residenceCity.label')}
          error={cityError}
          required
        >
          <TextInput
            value={city}
            onChangeText={(text) => {
              setCity(text);
              if (!touched) setTouched(true);
            }}
            placeholder={t('onboarding.residenceCity.placeholder')}
            // maxLength = MAX_CITY_NAME_LENGTH + 1 so the user can type past the
            // limit and see the "tooLong" inline error rather than a silent hard-stop.
            maxLength={MAX_CITY_NAME_LENGTH + 1}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            error={!!cityError}
            accessibilityLabel={t('onboarding.residenceCity.label')}
          />
        </FormField>
      </ScrollView>

      <WizardFooter
        onContinue={handleContinue}
        disabled={!continueEnabled}
      />
    </Screen>
  );
}
