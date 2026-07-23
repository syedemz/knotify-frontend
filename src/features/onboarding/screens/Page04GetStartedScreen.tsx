/**
 * Page 4 — Get started screen.
 *
 * Shows the onboarding banner image centrally and a "Get started" footer
 * button that is always enabled. Tapping it navigates to `Page05SexScreen`.
 * No checkpoint is advanced here — the first checkpoint is page 9.
 *
 * @module features/onboarding/screens/Page04GetStartedScreen
 */

import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Screen, WizardHeader, WizardFooter, Image, Column } from "@/components";
import { t } from "@/labels";
import { images } from "@/config/images";
import type { OnboardingStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Page04GetStartedScreen">;

/**
 * Get-started screen for onboarding page 4.
 *
 * Renders the wizard chrome (WizardHeader with hideProgress), the onboarding
 * banner image centered in the available space, and a WizardFooter with
 * "Get started" as the Continue label (always enabled). Navigation proceeds
 * to `Page05SexScreen` on tap — no checkpoint is written.
 */
export function Page04GetStartedScreen({ navigation }: Props): React.JSX.Element {
  return (
    <Screen>
      <WizardHeader hideProgress onBack={() => navigation.goBack()} />
      <Column flex align="center" justify="center">
        <Image
          source={images.onboarding.banner}
          width={280}
          height={280}
          contentFit="contain"
          accessibilityLabel="Onboarding banner"
        />
      </Column>
      <WizardFooter
        onContinue={() => navigation.navigate("Page05SexScreen")}
        continueLabel={t("onboarding.getStarted.button")}
      />
    </Screen>
  );
}
