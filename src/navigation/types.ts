/**
 * Navigation ParamList type declarations for every navigator in the app.
 *
 * Every `useNavigation` and `useRoute` call in the codebase must be typed
 * against one of these param lists. New navigators added in later phases
 * must declare their param list here and import it via `@/navigation/types`.
 *
 * @module navigation/types
 */

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
 * Pages 01-31 cover the multi-step sign-up wizard.
 * Screens are placeholder-only in phase 1; real screens and params
 * are added by the onboarding phases (B1-B10, phases 2-11).
 */
export type OnboardingStackParamList = {
  Page01: undefined;
  Page02: undefined;
  Page03: undefined;
  Page04: undefined;
  Page05: undefined;
  Page06: undefined;
  Page07: undefined;
  Page08: undefined;
  Page09: undefined;
  Page10: undefined;
  Page11: undefined;
  Page12: undefined;
  Page13: undefined;
  Page14: undefined;
  Page15: undefined;
  Page16: undefined;
  Page17: undefined;
  Page18: undefined;
  Page19: undefined;
  Page20: undefined;
  Page21: undefined;
  Page22: undefined;
  Page23: undefined;
  Page24: undefined;
  Page25: undefined;
  Page26: undefined;
  Page27: undefined;
  Page28: undefined;
  Page29: undefined;
  Page30: undefined;
  Page31: undefined;
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
