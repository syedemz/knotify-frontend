/**
 * Page 7 — Birthday date picker with age preview and validation.
 *
 * Collects the user's `birthday` (ISO date string `'YYYY-MM-DD'`). A live age
 * preview is shown below the DatePicker. Continue is gated on
 * `validateBirthday(iso)` returning `null`.
 *
 * On Continue:
 * - Writes `birthday` to the onboarding draft via `useOnboardingDraft().update`.
 * - Advances the draft's `currentPage` pointer to 8.
 * - Navigates to `Page08FirstCheckpointScreen`.
 *
 * @module features/onboarding/screens/Page07BirthdayScreen
 */

import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Column,
  DatePicker,
  FormField,
  Image,
  Screen,
  Text,
  WizardFooter,
  WizardHeader,
} from '@/components';
import { t } from '@/labels';
import { images } from '@/config/images';
import { age, validateBirthday } from '@/Helper/dateHelper';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page07BirthdayScreen'>;

/** Earliest selectable birthday: 1 Jan 1900. */
const MIN_DATE = '1900-01-01';

/**
 * Computes the latest selectable birthday as today's ISO date string.
 * Called at render time so it is always accurate to the current date.
 *
 * @returns Today's date as `'YYYY-MM-DD'`.
 */
function getTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Birthday collection screen for onboarding page 7.
 *
 * Renders the onboarding banner image, a labeled DatePicker, a live age
 * preview (in whole years), and a Continue button gated on birthday validity.
 * All strings are resolved through the label registry — no free strings.
 */
export function Page07BirthdayScreen({ navigation }: Props): React.JSX.Element {
  const [birthday, setBirthday] = useState<string | undefined>(undefined);
  const { update, advance } = useOnboardingDraft();

  const todayIso = getTodayIso();
  const errorKey = birthday !== undefined ? validateBirthday(birthday, todayIso) : null;
  const canContinue = birthday !== undefined && errorKey === null;

  function handleContinue(): void {
    if (birthday === undefined) return;
    update({ birthday });
    advance(8);
    navigation.navigate('Page08FirstCheckpointScreen');
  }

  return (
    <Screen>
      <WizardHeader onBack={() => navigation.goBack()} />
      <Column flex gap="lg" padding="lg">
        <Column align="center">
          <Image
            source={images.onboarding.banner}
            width={200}
            height={200}
            contentFit="contain"
            accessibilityLabel={t('onboarding.birthday.title')}
          />
        </Column>
        <FormField
          label={t('onboarding.birthday.pickerLabel')}
          error={errorKey !== null ? t(errorKey) : undefined}
        >
          <DatePicker
            value={birthday}
            onChange={setBirthday}
            min={MIN_DATE}
            max={todayIso}
            placeholder={t('onboarding.birthday.pickerLabel')}
            accessibilityLabel={t('onboarding.birthday.pickerLabel')}
          />
        </FormField>
        {birthday !== undefined && errorKey === null && (
          <Text variant="body.md" color="secondary" align="center">
            {t('onboarding.birthday.agePreview').replace('{age}', String(age(birthday, todayIso)))}
          </Text>
        )}
      </Column>
      <WizardFooter
        onContinue={handleContinue}
        disabled={!canContinue}
        onBack={() => navigation.goBack()}
      />
    </Screen>
  );
}
