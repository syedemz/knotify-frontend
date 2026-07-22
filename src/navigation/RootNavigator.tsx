/**
 * Root navigator — auth-gate branching logic.
 *
 * Reads `useAuth()` and renders exactly one of:
 * - Loading splash (`LoadingState`) while `status === 'loading'`.
 * - `AuthStack` when `status === 'unauthenticated'`.
 * - `OnboardingStack` when `status === 'authenticated' && !profileComplete`.
 * - `AppTabs` when `status === 'authenticated' && profileComplete`.
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

import { AuthStack } from "./AuthStack";
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
 * - `'unauthenticated'` → {@link AuthStack}.
 * - `'authenticated'` + `profileComplete === false` → {@link OnboardingStack}.
 * - `'authenticated'` + `profileComplete === true` → {@link AppTabs}.
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

  if (status === "unauthenticated") {
    return <AuthStack />;
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
