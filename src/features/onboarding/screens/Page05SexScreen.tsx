/**
 * Page 5 — Sex tile picker.
 *
 * Renders two tappable tiles (Male, Female). Tapping a tile writes `sex` to
 * the onboarding draft, advances the draft's `currentPage` pointer to 6, and
 * navigates to `Page06NameScreen`. No explicit Continue button — the tile tap
 * is the action.
 *
 * Back-navigating to this screen after a prior selection leaves both tiles
 * tappable. Tapping the opposite tile overwrites the draft value and
 * re-navigates. No locked-tile UX, no confirmation dialog.
 *
 * @module features/onboarding/screens/Page05SexScreen
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, WizardHeader, Column, Row, SelectionTile } from '@/components';
import { t } from '@/labels';
import { images } from '@/config/images';
import { options } from '@/config/options';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';
import type { DraftSex } from '@/features/onboarding/draftSchema';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page05SexScreen'>;

/**
 * Extracts the two sex values from `options.gender`.
 *
 * `options.gender` is `["Male", "Female"]` per `gender.json`. Using
 * `find()` instead of index access avoids the `string | undefined` returned
 * by `noUncheckedIndexedAccess` while still sourcing the values from the
 * options registry (never inlined) per the AC requirement.
 *
 * The non-null assertions below are safe: the gender.json contract guarantees
 * 'Male' and 'Female' are present; any deviation is a build-time authoring
 * error in the JSON file, not a runtime condition.
 */
const GENDER_MALE: DraftSex = options.gender.find((g) => g === 'Male') as DraftSex;
const GENDER_FEMALE: DraftSex = options.gender.find((g) => g === 'Female') as DraftSex;

/**
 * Sex-selection screen for onboarding page 5.
 *
 * Displays Male and Female tiles sourced from `options.gender` via
 * `@/config/options`. Selecting either tile immediately writes the value,
 * advances the draft, and navigates forward.
 */
export function Page05SexScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance } = useOnboardingDraft();

  function handleSelect(sex: DraftSex): void {
    update({ sex });
    advance(6);
    navigation.navigate('Page06NameScreen');
  }

  return (
    <Screen>
      <WizardHeader onBack={() => navigation.goBack()} />
      <Column flex align="center" justify="center" gap="xxl">
        <Row gap="xl" justify="center">
          <SelectionTile
            imageSource={images.onboarding.genderMale}
            imageWidth={120}
            imageHeight={120}
            label={t('onboarding.sex.male')}
            onPress={() => handleSelect(GENDER_MALE)}
            accessibilityLabel={t('onboarding.sex.male')}
          />
          <SelectionTile
            imageSource={images.onboarding.genderFemale}
            imageWidth={120}
            imageHeight={120}
            label={t('onboarding.sex.female')}
            onPress={() => handleSelect(GENDER_FEMALE)}
            accessibilityLabel={t('onboarding.sex.female')}
          />
        </Row>
      </Column>
    </Screen>
  );
}
