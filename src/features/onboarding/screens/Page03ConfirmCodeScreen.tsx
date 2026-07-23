/**
 * Page 3 — Confirm email code + Cognito confirmSignUp + auto-signIn.
 *
 * Collects the 6-digit verification code sent to the user's email, calls
 * `cognitoClient.confirmSignUp`, reads the bootstrap password from
 * secure-store (written on page 2), then auto-signs the user in via
 * `useAuth().signIn` so that AuthProvider state updates to 'authenticated'.
 * The bootstrap password is deleted from secure-store immediately after
 * signIn succeeds.
 *
 * Resolution F from the phase-2 brainstorm: the Continue button is locked
 * (`loading={true} disabled={true}`) for the entire confirmSignUp → signIn
 * chain to prevent double-tap from firing a second confirmSignUp, which
 * would fail with a code-already-used error.
 *
 * No countdown timer is rendered (per architecture §11.2.1 row 3).
 *
 * @module features/onboarding/screens/Page03ConfirmCodeScreen
 */

import React, { useCallback, useState } from "react";
import { StyleSheet, Text as RNText, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
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
import { isSixDigitCode } from "@/Helper/validationHelper";
import { useAuth } from "@/state/auth/AuthProvider";
import { useTheme } from "@/theme";

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, "Page03ConfirmCodeScreen">;

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Maps confirmSignUp/signIn-specific Cognito error names to their label keys
 * for the confirm-code screen.
 *
 * The base `cognitoErrorToLabelKey` in errorHelper.ts maps code-screen errors
 * to generic email-screen keys because it was designed for page 2. This
 * function provides the confirm-code-specific overrides.
 *
 * @param err - The caught value.
 * @returns A label key string for the confirm-code screen.
 */
function confirmCodeErrorLabelKey(err: unknown): string {
  if (err !== null && typeof err === "object") {
    const e = err as { name?: unknown };
    const name = typeof e.name === "string" ? e.name : "";

    switch (name) {
      case "CodeMismatchException":
        return "onboarding.confirmCode.errors.invalidCode";
      case "ExpiredCodeException":
        return "onboarding.confirmCode.errors.codeExpired";
      case "LimitExceededException":
        return "onboarding.confirmCode.errors.limitExceeded";
    }
  }

  return "onboarding.confirmCode.errors.generic";
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 3: 6-digit code entry, Cognito confirmSignUp, and auto-signIn.
 *
 * Continue is enabled only when `isSixDigitCode(code) === true` AND no
 * request is in flight. The button re-enables only on error (success navigates
 * away).
 */
export function Page03ConfirmCodeScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const { signIn: authSignIn } = useAuth();
  const { getDraft } = useOnboardingDraft();

  // Read the email from the onboarding draft (persisted on page 2).
  const email = getDraft().fields.email ?? "";

  // ── Field state ──────────────────────────────────────────────────────────────

  const [code, setCode] = useState("");

  /** Error shown inline when a Cognito call fails. */
  const [error, setError] = useState<string | null>(null);

  /**
   * True while the confirmSignUp → read-secure-store → signIn → delete chain
   * is in flight. Locks the Continue button to prevent double-tap (resolution F).
   */
  const [loading, setLoading] = useState(false);

  // ── Derived state ─────────────────────────────────────────────────────────────

  const continueEnabled = isSixDigitCode(code) && !loading;

  // Runtime replacement for subtitle interpolation. The labels resolver does
  // not support interpolation, so we substitute {email} at render time.
  const subtitle = t("onboarding.confirmCode.subtitle").replace("{email}", email);

  // ── Continue handler ─────────────────────────────────────────────────────────

  const handleContinue = useCallback(async (): Promise<void> => {
    if (!continueEnabled) return;

    setError(null);
    setLoading(true);

    // ── Step 1: Confirm the sign-up code with Cognito ─────────────────────────
    // Cognito username_attributes = ["email"], so username IS the email address.
    try {
      await cognitoClient.confirmSignUp({ username: email, code });
    } catch (err) {
      const labelKey = confirmCodeErrorLabelKey(err);
      setError(t(labelKey as Parameters<typeof t>[0]));
      setLoading(false);
      return;
    }

    // ── Step 2: Read bootstrap password from secure-store ─────────────────────
    // Written on page 2 BEFORE cognitoClient.signUp. If missing (edge case:
    // user uninstalled/reinstalled or keychain cleared between pages), we
    // cannot sign the user in automatically.
    const password = await secureStorage.get(SecureStorageKey.OnboardingBootstrapPassword);

    if (password === null) {
      setError(t("onboarding.confirmCode.errors.bootstrapMissing"));
      setLoading(false);
      return;
    }

    // ── Step 3: Auto-sign the user in via AuthProvider ────────────────────────
    // Route through useAuth().signIn (not cognitoClient.signIn directly) so
    // AuthProvider's internal state flips to 'authenticated'. This is required
    // for RootNavigator to render Page04GetStartedScreen via the
    // `authenticated && !profileComplete → OnboardingStack` branch (story 2.3).
    try {
      await authSignIn({ username: email, password });
    } catch {
      // confirmSignUp succeeded but signIn failed — rare but recoverable.
      // Do NOT delete the bootstrap password here (the user may retry).
      setError(t("onboarding.confirmCode.errors.signInAfterConfirm"));
      setLoading(false);
      return;
    }

    // ── Step 4: Delete the bootstrap password from secure-store ──────────────
    // Best-effort — a failure here is non-fatal (the user is already signed in).
    // The password will be scrubbed on the next app-launch resume (future story).
    await secureStorage.del(SecureStorageKey.OnboardingBootstrapPassword).catch(() => {});

    // ── Step 5: Navigate to page 4 ────────────────────────────────────────────
    // RootNavigator keeps the user in OnboardingStack because profileComplete
    // is still false (set by the backend after full profile completion).
    navigation.navigate("Page04GetStartedScreen");
  }, [continueEnabled, email, code, authSignIn, navigation]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader hideProgress onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <RNText
          style={[styles.title, { color: theme.colors.text.primary }]}
          accessibilityRole="header"
        >
          {t("onboarding.confirmCode.title")}
        </RNText>

        <RNText
          style={[styles.subtitle, { color: theme.colors.text.secondary }]}
        >
          {subtitle}
        </RNText>

        <View style={styles.inputWrapper}>
          <TextInput
            value={code}
            onChangeText={(text) => {
              setCode(text);
              setError(null);
            }}
            placeholder={t("onboarding.confirmCode.codePlaceholder")}
            keyboardType="number-pad"
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => {
              if (continueEnabled) {
                void handleContinue();
              }
            }}
            error={error !== null}
            accessibilityLabel={t("onboarding.confirmCode.title")}
          />
        </View>

        {error !== null && (
          <RNText
            style={[styles.errorText, { color: theme.colors.status.error }]}
            accessibilityRole="alert"
          >
            {error}
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
  content: {
    flex: 1,
    paddingTop: 32,
    gap: 16,
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
  inputWrapper: {
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
