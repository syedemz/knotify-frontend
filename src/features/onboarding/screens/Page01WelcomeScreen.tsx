/**
 * Page 1 — Welcome screen (placeholder).
 *
 * Renders the wizard chrome (WizardHeader with hideProgress) and a Text
 * placeholder. Real content (language toggle, logo, email/Google buttons)
 * lands in story 2.4.
 *
 * @module features/onboarding/screens/Page01WelcomeScreen
 */

import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Screen, WizardHeader, Text } from "@/components";
import { t } from "@/labels";
import type { OnboardingStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Page01WelcomeScreen">;

/**
 * Placeholder welcome screen for onboarding page 1.
 *
 * Shows `WizardHeader` with `hideProgress` per architecture §6.3.
 * Full implementation (language toggle sheet, logo, CTA buttons) ships in story 2.4.
 */
export function Page01WelcomeScreen({ navigation }: Props): React.JSX.Element {
  return (
    <Screen paddingX="lg">
      <WizardHeader hideProgress onBack={() => navigation.goBack()} />
      <Text variant="body.md">{t("common.notImplemented")}</Text>
    </Screen>
  );
}
