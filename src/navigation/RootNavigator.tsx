/**
 * Root navigator — auth-gate branching logic.
 *
 * Reads `useAuth()` and renders exactly one of:
 * - Loading splash (`LoadingState`) while `status === 'loading'`.
 * - `OnboardingStack` when `status === 'unauthenticated'` (new sign-up flow).
 * - `OnboardingStack` when `status === 'authenticated' && !profileComplete`
 *   (user authenticated during wizard but has not completed their profile).
 * - `AppTabs` when `status === 'authenticated' && profileComplete`.
 *
 * `AuthStack` remains in the codebase for returning users who explicitly opt
 * to sign in (out of scope for phase 2 — the auth-gate does not route to it
 * in this phase). It is kept exported so the existing `AuthStack` tests pass
 * and future phases can wire it back in.
 *
 * Transitions are driven by state changes in `AuthProvider`, not by
 * imperative `navigation.navigate()` calls across boundaries. This makes
 * the auth-gate fully testable via render-tree assertions (§6.2).
 *
 * @module navigation/RootNavigator
 */

import React from "react";
import { View, StyleSheet } from "react-native";

import { LoadingState } from "@/components";
import { t } from "@/labels";
import { useAuth } from "@/state/auth/AuthProvider";

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
 * - `'unauthenticated'` → {@link OnboardingStack} (new sign-up flow starts at page 1).
 * - `'authenticated'` + `profileComplete === false` → {@link OnboardingStack} (resumes from checkpoint).
 * - `'authenticated'` + `profileComplete === true` → {@link AppTabs}.
 *
 * `AuthStack` is not mounted by the auth-gate in phase 2. It remains exported
 * for future phases that add explicit sign-in entry points.
 */
export function RootNavigator(): React.JSX.Element {
  const { status, profileComplete } = useAuth();

  if (status === "loading") {
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
  if (!profileComplete) {
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
