/**
 * Page 4 — Get started screen (placeholder).
 *
 * Renders the wizard chrome (WizardHeader with hideProgress) and a Text
 * placeholder. Real content (banner image, "Get started" CTA) lands in
 * story 2.7.
 *
 * @module features/onboarding/screens/Page04GetStartedScreen
 */

import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Screen, WizardHeader, Text } from "@/components";
import { t } from "@/labels";
import type { OnboardingStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Page04GetStartedScreen">;

/**
 * Placeholder get-started screen for onboarding page 4.
 *
 * Shows `WizardHeader` with `hideProgress` per architecture §6.3.
 * Full implementation (banner image, "Get started" button → Page05SexScreen) ships in story 2.7.
 */
export function Page04GetStartedScreen({ navigation }: Props): React.JSX.Element {
  return (
    <Screen paddingX="lg">
      <WizardHeader hideProgress onBack={() => navigation.goBack()} />
      <Text variant="body.md">{t("common.notImplemented")}</Text>
    </Screen>
  );
}
