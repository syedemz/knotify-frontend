/**
 * Page 2 — Email + password screen (placeholder).
 *
 * Renders the wizard chrome (WizardHeader with hideProgress) and a Text
 * placeholder. Real content (email/password inputs, Cognito signUp) lands
 * in story 2.5.
 *
 * @module features/onboarding/screens/Page02EmailScreen
 */

import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Screen, WizardHeader, Text } from "@/components";
import { t } from "@/labels";
import type { OnboardingStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Page02EmailScreen">;

/**
 * Placeholder email screen for onboarding page 2.
 *
 * Shows `WizardHeader` with `hideProgress` per architecture §6.3.
 * Full implementation (email/password inputs, Cognito signUp) ships in story 2.5.
 */
export function Page02EmailScreen({ navigation }: Props): React.JSX.Element {
  return (
    <Screen paddingX="lg">
      <WizardHeader hideProgress onBack={() => navigation.goBack()} />
      <Text variant="body.md">{t("common.notImplemented")}</Text>
    </Screen>
  );
}
