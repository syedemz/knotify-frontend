/**
 * Navigation ParamList type declarations for every navigator in the app.
 *
 * Every `useNavigation` and `useRoute` call in the codebase must be typed
 * against one of these param lists. New navigators added in later phases
 * must declare their param list here and import it via `@/navigation/types`.
 *
 * @module navigation/types
 */

import type { OnboardingRouteName } from "@/features/onboarding/pageMap";

// ---------------------------------------------------------------------------
// Auth Stack
// ---------------------------------------------------------------------------

/**
 * Route params for the `AuthStack` navigator.
 *
 * Routes: `Login`, `ForgotPassword`, `ResetPassword`.
 * All screens are currently placeholder-only; param shapes are `undefined`
 * until real screens are wired in later phases.
 */
export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

// ---------------------------------------------------------------------------
// Onboarding Stack
// ---------------------------------------------------------------------------

/**
 * Route params for the `OnboardingStack` navigator.
 *
 * Keys are typed against `OnboardingRouteName` imported from
 * `src/features/onboarding/pageMap.ts` — the single source of truth for all
 * 31 route names. This import guarantees `types.ts` and `pageMap.ts` cannot
 * drift: adding or renaming a route in `pageMap.ts` is immediately reflected
 * here via the mapped type.
 *
 * All routes carry `undefined` params (no required navigation params on any
 * onboarding screen); real param shapes are added per-screen as needed.
 */
export type OnboardingStackParamList = {
  [K in OnboardingRouteName]: undefined;
};

// ---------------------------------------------------------------------------
// App Tabs
// ---------------------------------------------------------------------------

/**
 * Route params for the `AppTabs` bottom-tab navigator.
 *
 * Tabs: `Discover`, `Requests`, `Chat`, `Menu`.
 * Each tab will eventually host a nested stack; params are `undefined`
 * until those stacks are wired in their respective phases.
 */
export type AppTabsParamList = {
  Discover: undefined;
  Requests: undefined;
  Chat: undefined;
  Menu: undefined;
};

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

/**
 * Root-level param list.
 *
 * Used by `RootNavigator`. The root navigator itself does not expose routes
 * directly — it delegates to `AuthStack`, `OnboardingStack`, or `AppTabs`
 * based on the auth-gate condition (§6.2). This type exists as the canonical
 * anchor for any cross-navigator type reference.
 */
export type RootParamList = {
  AuthStack: undefined;
  OnboardingStack: undefined;
  AppTabs: undefined;
};
