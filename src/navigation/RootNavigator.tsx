/**
 * Root navigator — auth-gate branching logic.
 *
 * Reads `useAuth()` and `useOnboardingCompletion()` and renders exactly one of:
 * - Loading splash (`LoadingState`) while `status === 'loading'` OR while the
 *   onboarding completion flag is being read from secure-store.
 * - `OnboardingStack` when `status === 'unauthenticated'` (new sign-up flow).
 * - `OnboardingStack` when `status === 'authenticated' && !profileComplete && !mockOnboardingComplete`
 *   (user authenticated during wizard but has not completed their profile).
 * - `AppTabs` when `status === 'authenticated' && (profileComplete || mockOnboardingComplete)`.
 *
 * The `mockOnboardingComplete` bypass is a temporary mock-only addition.
 * When the real backend ships, delete the `onboardingCompletion.loading` check
 * and the `!mockOnboardingComplete` branch — see context.md → Before shipping.
 *
 * `AuthStack` remains in the codebase for returning users who explicitly opt
 * to sign in (out of scope for phase 2 — the auth-gate does not route to it
 * in this phase). It is kept exported so the existing `AuthStack` tests pass
 * and future phases can wire it back in.
 *
 * Transitions are driven by state changes in `AuthProvider` and
 * `OnboardingCompletionProvider`, not by imperative `navigation.navigate()`
 * calls across boundaries. This makes the auth-gate fully testable via
 * render-tree assertions (§6.2).
 *
 * @module navigation/RootNavigator
 */

import React from "react";
import { View, StyleSheet } from "react-native";

import { LoadingState } from "@/components";
import { t } from "@/labels";
import { useAuth } from "@/state/auth/AuthProvider";
// TODO(mock-only): remove when real backend + JWT claim decode ship
import { useOnboardingCompletion } from "@/state/onboardingCompletion/OnboardingCompletionProvider";

import { OnboardingStack } from "./OnboardingStack";
import { AppTabs } from "./AppTabs";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Root navigator that enforces the auth-gate branching described in §6.2.
 *
 * This component must be mounted inside a `NavigationContainer`. It reads
 * the current auth state from `AuthProvider` (via `useAuth()`) and mounts
 * the appropriate sub-navigator — no direct `navigation.navigate()` calls
 * cross the auth boundary.
 *
 * Auth-gate mapping:
 * - `'loading'` → full-screen {@link LoadingState} (splash).
 * - `onboardingCompletion.loading` → full-screen {@link LoadingState} (splash).
 * - `'unauthenticated'` → {@link OnboardingStack} (new sign-up flow starts at page 1).
 * - `'authenticated'` + `profileComplete === false` + `mockOnboardingComplete === false`
 *   → {@link OnboardingStack} (resumes from checkpoint).
 * - `'authenticated'` + (`profileComplete === true` OR `mockOnboardingComplete === true`)
 *   → {@link AppTabs}.
 *
 * `AuthStack` is not mounted by the auth-gate in phase 2. It remains exported
 * for future phases that add explicit sign-in entry points.
 *
 * TODO(mock-only): when real backend ships, remove the `onboardingCompletion` loading
 * check and the `!mockOnboardingComplete` branch from the profileComplete gate.
 */
export function RootNavigator(): React.JSX.Element {
  const { status, profileComplete } = useAuth();
  // TODO(mock-only): remove when real backend + JWT claim decode ship
  const onboardingCompletion = useOnboardingCompletion();

  // Destructure as `mockOnboardingComplete` per PRD naming convention
  // (matches `env.isMockAuth` naming pattern — local name is mock-explicit).
  // TODO(mock-only): remove when real backend + JWT claim decode ship
  const mockOnboardingComplete = onboardingCompletion.complete;

  // Show loading splash while auth is resolving OR while the mock completion
  // flag is being read from secure-store (prevents flicker on cold launch).
  // TODO(mock-only): remove `|| onboardingCompletion.loading` when real backend ships
  if (status === "loading" || onboardingCompletion.loading) {
    return (
      <View style={styles.splash}>
        <LoadingState message={t("common.loading")} />
      </View>
    );
  }

  // New sign-up flow: unauthenticated users start at page 1 of the wizard.
  if (status === "unauthenticated") {
    return <OnboardingStack />;
  }

  // status === 'authenticated'
  // Additive check: `!mockOnboardingComplete` bypasses the profileComplete gate
  // when the mock-only completion flag is set. Delete this condition when the
  // real backend ships and profileComplete is driven by a real JWT claim.
  // TODO(mock-only): remove `&& !mockOnboardingComplete` when real backend ships
  if (!profileComplete && !mockOnboardingComplete) {
    return <OnboardingStack />;
  }

  return <AppTabs />;
}

// Minimal structural styles — no visual styling, only full-screen flex layout
// needed for the loading splash. LoadingState handles its own appearance.
const styles = StyleSheet.create({
  splash: {
    flex: 1,
  },
});
