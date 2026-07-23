/**
 * Page 6 — First and last name inputs with client-side username generation.
 *
 * Collects `first_name` and `last_name` from the user. On Continue:
 * - Generates a username via `generateUsername(first_name, last_name)`.
 * - Writes `first_name`, `last_name`, and `username` to the onboarding draft.
 * - Advances the draft's `currentPage` pointer to 7.
 * - Navigates to `Page07BirthdayScreen`.
 *
 * Continue is disabled until both fields pass `isValidName()`.
 *
 * @module features/onboarding/screens/Page06NameScreen
 */

import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Column,
  FormField,
  Screen,
  TextInput,
  WizardFooter,
  WizardHeader,
} from '@/components';
import { t } from '@/labels';
import { isValidName } from '@/Helper/validationHelper';
import { generateUsername } from '@/Helper/usernameHelper';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page06NameScreen'>;

/**
 * Name collection screen for onboarding page 6.
 *
 * Renders two TextInput fields for first and last name, each constrained to
 * 35 characters. Continue is gated on both fields passing `isValidName`.
 * On Continue, a username is generated and all three fields are written to the
 * draft before advancing to page 7.
 */
export function Page06NameScreen({ navigation }: Props): React.JSX.Element {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const { update, advance } = useOnboardingDraft();

  const firstNameValid = isValidName(firstName);
  const lastNameValid = isValidName(lastName);
  const canContinue = firstNameValid && lastNameValid;

  function handleContinue(): void {
    const username = generateUsername(firstName, lastName);
    update({ first_name: firstName, last_name: lastName, username });
    advance(7);
    navigation.navigate('Page07BirthdayScreen');
  }

  return (
    <Screen>
      <WizardHeader onBack={() => navigation.goBack()} />
      <Column flex gap="lg" padding="lg">
        <FormField
          label={t('onboarding.name.firstNameLabel')}
          error={firstName.length > 0 && !firstNameValid ? t('onboarding.name.errors.invalidName') : undefined}
        >
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('onboarding.name.firstNamePlaceholder')}
            maxLength={35}
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="givenName"
            autoComplete="given-name"
            error={firstName.length > 0 && !firstNameValid}
            accessibilityLabel={t('onboarding.name.firstNameLabel')}
          />
        </FormField>
        <FormField
          label={t('onboarding.name.lastNameLabel')}
          error={lastName.length > 0 && !lastNameValid ? t('onboarding.name.errors.invalidName') : undefined}
        >
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('onboarding.name.lastNamePlaceholder')}
            maxLength={35}
            autoCapitalize="words"
            autoCorrect={false}
            textContentType="familyName"
            autoComplete="family-name"
            error={lastName.length > 0 && !lastNameValid}
            accessibilityLabel={t('onboarding.name.lastNameLabel')}
          />
        </FormField>
      </Column>
      <WizardFooter
        onContinue={handleContinue}
        disabled={!canContinue}
        onBack={() => navigation.goBack()}
      />
    </Screen>
  );
}
