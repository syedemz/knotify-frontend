/**
 * Page 3 — Confirm email code screen (placeholder).
 *
 * Renders the wizard chrome (WizardHeader with hideProgress) and a Text
 * placeholder. Real content (6-digit code input, Cognito confirmSignUp +
 * auto-signIn) lands in story 2.6.
 *
 * @module features/onboarding/screens/Page03ConfirmCodeScreen
 */

import React from "react";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Screen, WizardHeader, Text } from "@/components";
import { t } from "@/labels";
import type { OnboardingStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<OnboardingStackParamList, "Page03ConfirmCodeScreen">;

/**
 * Placeholder confirm-code screen for onboarding page 3.
 *
 * Shows `WizardHeader` with `hideProgress` per architecture §6.3.
 * Full implementation (code input, confirmSignUp, auto-signIn) ships in story 2.6.
 */
export function Page03ConfirmCodeScreen({ navigation }: Props): React.JSX.Element {
  return (
    <Screen paddingX="lg">
      <WizardHeader hideProgress onBack={() => navigation.goBack()} />
      <Text variant="body.md">{t("common.notImplemented")}</Text>
    </Screen>
  );
}
