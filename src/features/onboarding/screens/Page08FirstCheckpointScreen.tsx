/**
 * Page 8 — First checkpoint marker.
 *
 * Renders the onboarding banner image and a "Start" button that is always
 * enabled. On tap, calls `advanceWithCheckpoint(9, 'firstCheckpoint')` — which
 * both sets `lastCheckpoint` to `'firstCheckpoint'` (non-regressing) and
 * advances `currentPage` to 9 — then navigates to `Page09ReligionSubsectScreen`.
 *
 * After this screen the app can be killed and relaunched; `useCheckpointResume`
 * will return `Page09ReligionSubsectScreen` and the navigator will mount there
 * directly, with all phase-3 fields (`sex`, `first_name`, `last_name`,
 * `username`, `birthday`) still present in the persisted draft.
 *
 * @module features/onboarding/screens/Page08FirstCheckpointScreen
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Screen, WizardHeader, WizardFooter, Image, Column } from '@/components';
import { t } from '@/labels';
import { images } from '@/config/images';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page08FirstCheckpointScreen'>;

/**
 * First-checkpoint screen for onboarding page 8.
 *
 * Renders the wizard chrome (WizardHeader with hideProgress), the onboarding
 * banner image centered in the available space, and a WizardFooter with
 * "Start" as the Continue label (always enabled). On tap, commits the
 * first-checkpoint boundary via `advanceWithCheckpoint(9, 'firstCheckpoint')`
 * and navigates to `Page09ReligionSubsectScreen`.
 */
export function Page08FirstCheckpointScreen({ navigation }: Props): React.JSX.Element {
  const { advanceWithCheckpoint } = useOnboardingDraft();

  function handleStart(): void {
    advanceWithCheckpoint(9, 'firstCheckpoint');
    navigation.navigate('Page09ReligionSubsectScreen');
  }

  return (
    <Screen>
      <WizardHeader hideProgress onBack={() => navigation.goBack()} />
      <Column flex align="center" justify="center">
        <Image
          source={images.onboarding.banner}
          width={280}
          height={280}
          contentFit="contain"
          accessibilityLabel={t('onboarding.firstCheckpoint.title')}
        />
      </Column>
      <WizardFooter
        onContinue={handleStart}
        continueLabel={t('onboarding.firstCheckpoint.start')}
      />
    </Screen>
  );
}
