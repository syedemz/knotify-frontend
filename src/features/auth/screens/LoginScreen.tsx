/**
 * LoginScreen — sign-in path for returning users.
 *
 * Collects email + password, calls `auth.signIn()` (which delegates to
 * `cognitoClient.signIn`), and lets state-driven navigation take over:
 * - `profileComplete === true` → `RootNavigator` renders `AppTabs`.
 * - `profileComplete === false` → `RootNavigator` keeps `OnboardingStack` and
 *   `useCheckpointResume` drops the user at their last-saved page.
 *
 * Error mapping:
 * - `NotAuthorizedException` → "Incorrect email or password"
 * - `UserNotFoundException`  → "No account found for that email"
 * - `UserNotConfirmedException` → "Please confirm your account first —
 *   check your inbox for the code" (no auto-nav per 2026-11-13 decision)
 * - Network / unknown → generic
 *
 * Mounted inside `OnboardingStack`, not `AuthStack` — `AuthStack` is a
 * sibling navigator of `OnboardingStack` and cross-navigator transitions
 * across the auth-gate require a RootNavigator swap. Placing login inside
 * OnboardingStack lets Page 1 navigate to it with a single stack push.
 *
 * @module features/auth/screens/LoginScreen
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
import type { LabelKey } from "@/labels";
import type { OnboardingStackParamList } from "@/navigation/types";
import { useAuth } from "@/state/auth/AuthProvider";
import { isValidEmail } from "@/Helper/validationHelper";
import { useTheme } from "@/theme";

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, "LoginScreen">;

// ── Error mapping ──────────────────────────────────────────────────────────────

/**
 * Maps a thrown Cognito signIn error to a login-screen label key.
 *
 * Mirrors the pattern in Page03's `confirmCodeErrorLabelKey` — the base
 * `cognitoErrorToLabelKey` targets the signUp screen and doesn't know about
 * these signIn-specific cases.
 */
function loginErrorLabelKey(err: unknown): LabelKey {
  if (err !== null && typeof err === "object") {
    const e = err as { name?: unknown; message?: unknown };
    const name = typeof e.name === "string" ? e.name : "";
    const message = typeof e.message === "string" ? e.message : "";

    switch (name) {
      case "NotAuthorizedException":
        return "auth.login.errors.notAuthorized";
      case "UserNotFoundException":
        return "auth.login.errors.userNotFound";
      case "UserNotConfirmedException":
        return "auth.login.errors.userNotConfirmed";
      case "PasswordResetRequiredException":
        return "auth.login.errors.passwordResetRequired";
      case "NetworkError":
        return "auth.login.errors.network";
      default:
        break;
    }

    if (message.toLowerCase().includes("network")) {
      return "auth.login.errors.network";
    }
  }

  return "auth.login.errors.generic";
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Login screen for returning users with an existing Cognito account.
 *
 * Continue is disabled until the email passes validation AND the password
 * is non-empty. Password-policy validation is intentionally NOT enforced
 * here — the user's existing password may have been created under an older
 * policy and we must let them sign in regardless.
 */
export function LoginScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { signIn } = useAuth();

  // ── Field state ──────────────────────────────────────────────────────────────

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /** `true` once the user has typed into the email field. */
  const [emailTouched, setEmailTouched] = useState(false);

  /** API error shown below both fields. Cleared on any edit. */
  const [apiError, setApiError] = useState<string | null>(null);

  /** Loading + disabled state during the signIn call. */
  const [loading, setLoading] = useState(false);

  // ── Derived state ────────────────────────────────────────────────────────────

  const emailValid = isValidEmail(email);
  const continueEnabled = emailValid && password.length > 0 && !loading;

  const emailError: string | undefined =
    emailTouched && email.length > 0 && !emailValid
      ? t("auth.login.errors.invalidEmail")
      : undefined;

  // ── Continue handler ─────────────────────────────────────────────────────────

  const handleContinue = useCallback(async (): Promise<void> => {
    if (!continueEnabled) return;

    setApiError(null);
    setLoading(true);

    try {
      await signIn({ username: email, password });
      // Success: no navigation.navigate call — AuthProvider flips status to
      // 'authenticated' and RootNavigator re-renders the correct stack based
      // on profileComplete. Resume logic (useCheckpointResume) drops the user
      // at their last saved page if they're not yet complete.
    } catch (err) {
      setApiError(t(loginErrorLabelKey(err)));
      setLoading(false);
    }
  }, [continueEnabled, email, password, signIn]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader hideProgress onBack={() => navigation.goBack()} />

      <View style={styles.header}>
        <RNText
          style={[styles.title, { color: theme.colors.text.primary }]}
          accessibilityRole="header"
        >
          {t("auth.login.title")}
        </RNText>
        <RNText style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          {t("auth.login.subtitle")}
        </RNText>
      </View>

      <View style={styles.fields}>
        <FormField
          label={t("auth.login.emailLabel")}
          error={emailError}
        >
          <TextInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (!emailTouched) setEmailTouched(true);
              setApiError(null);
            }}
            placeholder={t("auth.login.emailPlaceholder")}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            textContentType="emailAddress"
            autoComplete="email"
            error={!!emailError}
            accessibilityLabel={t("auth.login.emailLabel")}
          />
        </FormField>

        <FormField label={t("auth.login.passwordLabel")}>
          <PasswordInput
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setApiError(null);
            }}
            placeholder={t("auth.login.passwordPlaceholder")}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="password"
            accessibilityLabel={t("auth.login.passwordLabel")}
          />
        </FormField>

        {apiError !== null && (
          <RNText
            style={[styles.apiError, { color: theme.colors.status.error }]}
            accessibilityRole="alert"
            testID="login-error-message"
          >
            {apiError}
          </RNText>
        )}
      </View>

      <WizardFooter
        onContinue={() => { void handleContinue(); }}
        disabled={!continueEnabled}
        loading={loading}
        continueLabel={t("auth.login.submitButton")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 24,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
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
