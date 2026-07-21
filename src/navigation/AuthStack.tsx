/**
 * Authentication navigator.
 *
 * Registers the three auth routes: `Login`, `ForgotPassword`, `ResetPassword`.
 * All screens are placeholder `EmptyState` components — real implementations
 * land in the auth phases.
 *
 * @module navigation/AuthStack
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { EmptyState } from "@/components";
import { t } from "@/labels";
import type { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

// ---------------------------------------------------------------------------
// Placeholder screens
// ---------------------------------------------------------------------------

/**
 * Placeholder for the Login screen.
 *
 * Renders the `EmptyState` catalog component with the `auth.login.title`
 * label so the auth-gate test can positively identify this stack.
 */
function LoginScreen(): React.JSX.Element {
  return (
    <EmptyState
      title={t("auth.login.title")}
      description={t("common.notImplemented")}
    />
  );
}

/**
 * Placeholder for the ForgotPassword screen.
 */
function ForgotPasswordScreen(): React.JSX.Element {
  return (
    <EmptyState
      title={t("auth.forgotPassword.title")}
      description={t("common.notImplemented")}
    />
  );
}

/**
 * Placeholder for the ResetPassword screen.
 */
function ResetPasswordScreen(): React.JSX.Element {
  return (
    <EmptyState
      title={t("auth.resetPassword.title")}
      description={t("common.notImplemented")}
    />
  );
}

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

/**
 * Native-stack navigator for the unauthenticated flow.
 *
 * Routes: `Login` → `ForgotPassword` → `ResetPassword`.
 * All screens are placeholders; real screen implementations arrive in the
 * auth feature phases.
 *
 * @see {@link AuthStackParamList} for typed navigation.
 */
export function AuthStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
