/**
 * Page 2 — Email + password input + Cognito signUp.
 *
 * Collects the user's email address and a Cognito-policy-compliant password,
 * writes the password to secure-store (BEFORE calling signUp — resolution D
 * from the phase-2 brainstorm), registers the account via
 * `cognitoClient.signUp`, persists the email into the onboarding draft, then
 * navigates to page 3.
 *
 * OS password-manager hints (`textContentType='newPassword'`,
 * `autoComplete='password-new'`, `textContentType='emailAddress'`,
 * `autoComplete='email'`) are applied per resolution E so iOS and Android
 * offer to save the credential at account-creation time.
 *
 * @module features/onboarding/screens/Page02EmailScreen
 */

import React, { useCallback, useState } from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  FormField,
  PasswordInput,
  Screen,
  TextInput,
  WizardFooter,
  WizardHeader,
} from "@/components";
import { t } from "@/labels";
import type { OnboardingStackParamList } from "@/navigation/types";
import { cognitoClient } from "@/services/auth/cognitoClient";
import { secureStorage, SecureStorageKey } from "@/services/auth/secureStorage";
import { useOnboardingDraft } from "../hooks/useOnboardingDraft";
import {
  isValidEmail,
  passwordMeetsCognitoPolicy,
  type PasswordRequirement,
} from "@/Helper/validationHelper";
import { cognitoErrorToLabelKey } from "@/Helper/errorHelper";
import { useTheme } from "@/theme";

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, "Page02EmailScreen">;

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Maps the first unmet password requirement to its display label.
 */
function passwordErrorForRequirement(req: PasswordRequirement): string {
  switch (req) {
    case "length":
      return t("onboarding.email.errors.passwordTooShort");
    case "upper":
      return t("onboarding.email.errors.passwordMissingUpper");
    case "lower":
      return t("onboarding.email.errors.passwordMissingLower");
    case "digit":
      return t("onboarding.email.errors.passwordMissingNumber");
    case "symbol":
      return t("onboarding.email.errors.passwordMissingSymbol");
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 2: email + password entry and Cognito account creation.
 *
 * Continue is disabled until both email and password pass validation.
 * Inline error hints appear only after the user has typed something into a
 * field (touched); empty untouched fields show no errors.
 */
export function Page02EmailScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();

  // ── Field state ──────────────────────────────────────────────────────────────

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /** `true` once the user has typed into the email field. */
  const [emailTouched, setEmailTouched] = useState(false);
  /** `true` once the user has typed into the password field. */
  const [passwordTouched, setPasswordTouched] = useState(false);

  /** API / secure-store error shown as a standalone message below both fields. */
  const [apiError, setApiError] = useState<string | null>(null);

  /** Controls the WizardFooter loading + disabled state during the signUp call. */
  const [loading, setLoading] = useState(false);

  // ── Draft hook ───────────────────────────────────────────────────────────────
  const { update } = useOnboardingDraft();

  // ── Derived validation ───────────────────────────────────────────────────────

  const emailValid = isValidEmail(email);
  const passwordPolicy = passwordMeetsCognitoPolicy(password);
  const continueEnabled = emailValid && passwordPolicy.ok && !loading;

  const emailError: string | undefined =
    emailTouched && email.length > 0 && !emailValid
      ? t("onboarding.email.errors.invalidEmail")
      : undefined;

  // Show only the first unmet requirement to keep the hint concise.
  // `passwordPolicy.missing[0]` is safe when `!passwordPolicy.ok` because
  // `ok === false` implies `missing.length > 0`.
  const passwordError: string | undefined =
    passwordTouched && password.length > 0 && !passwordPolicy.ok &&
    passwordPolicy.missing.length > 0
      ? passwordErrorForRequirement(passwordPolicy.missing[0] as PasswordRequirement)
      : undefined;

  // ── Continue handler ─────────────────────────────────────────────────────────

  const handleContinue = useCallback(async (): Promise<void> => {
    if (!continueEnabled) return;

    setApiError(null);
    setLoading(true);

    // ── Step 1: Write bootstrap password to secure-store BEFORE signUp ────────
    // If the keychain is unavailable and we call signUp first, the Cognito
    // account will exist but page 3 won't be able to auto-signIn (no password
    // captured). We fail fast here to keep the user unblocked.
    try {
      await secureStorage.set(SecureStorageKey.OnboardingBootstrapPassword, password);
    } catch {
      setApiError(t("onboarding.email.errors.secureStorageUnavailable"));
      setLoading(false);
      return;
    }

    // ── Step 2: Call Cognito signUp ───────────────────────────────────────────
    // Cognito is configured with `username_attributes = ["email"]` per
    // knotify-backend/infrastructure/modules/cognito/main.tf, so the username
    // IS the email address. We pass email as `username` and also as the `email`
    // user attribute so Cognito uses it for both login identity and verification.
    try {
      await cognitoClient.signUp({ username: email, password, email });
    } catch (err) {
      // ── Step 4 (signUp failure): best-effort delete the bootstrap password ──
      // Ignoring delete failure keeps the retry path unblocked.
      secureStorage.del(SecureStorageKey.OnboardingBootstrapPassword).catch(() => {});

      const labelKey = cognitoErrorToLabelKey(err);
      setApiError(t(labelKey));
      setLoading(false);
      return;
    }

    // ── Step 3: Persist email to draft, navigate to page 3 ───────────────────
    // `update` from useOnboardingDraft takes Partial<UserProfileWritable> directly.
    update({ email });
    setLoading(false);
    navigation.navigate("Page03ConfirmCodeScreen");
  }, [continueEnabled, email, password, update, navigation]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader hideProgress onBack={() => navigation.goBack()} />

      <View style={styles.fields}>
        <FormField
          label={t("onboarding.email.emailLabel")}
          error={emailError}
        >
          <TextInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (!emailTouched) setEmailTouched(true);
              setApiError(null);
            }}
            placeholder={t("onboarding.email.emailPlaceholder")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            textContentType="emailAddress"
            autoComplete="email"
            error={!!emailError}
            accessibilityLabel={t("onboarding.email.emailLabel")}
          />
        </FormField>

        <FormField
          label={t("onboarding.email.passwordLabel")}
          error={passwordError}
        >
          <PasswordInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (!passwordTouched) setPasswordTouched(true);
              setApiError(null);
            }}
            placeholder={t("onboarding.email.passwordPlaceholder")}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            autoComplete="password-new"
            error={!!passwordError}
            accessibilityLabel={t("onboarding.email.passwordLabel")}
          />
        </FormField>

        {apiError !== null && (
          <RNText
            style={[styles.apiError, { color: theme.colors.status.error }]}
            accessibilityRole="alert"
          >
            {apiError}
          </RNText>
        )}
      </View>

      <WizardFooter
        onContinue={() => {
          void handleContinue();
        }}
        disabled={!continueEnabled}
        loading={loading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fields: {
    gap: 16,
    flex: 1,
    paddingTop: 24,
  },
  apiError: {
    fontSize: 14,
    lineHeight: 20,
  },
});
