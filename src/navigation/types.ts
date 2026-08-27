/**
 * Navigation ParamList type declarations for every navigator in the app.
 *
 * Every `useNavigation` and `useRoute` call in the codebase must be typed
 * against one of these param lists. New navigators added in later phases
 * must declare their param list here and import it via `@/navigation/types`.
 *
 * @module navigation/types
 */

import type { NavigatorScreenParams } from "@react-navigation/native";

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
 * Keys 1–31 are typed against `OnboardingRouteName` imported from
 * `src/features/onboarding/pageMap.ts` — the single source of truth for the
 * numbered wizard flow. Adding or renaming a numbered route in `pageMap.ts`
 * is immediately reflected here via the mapped type.
 *
 * `Page32ConfirmSelfieScreen` sits *outside* the numbered wizard — it is a
 * post-capture confirmation step, not part of the progress bar — so it is
 * declared as an intersection here rather than added to `PAGE_MAP`. It
 * carries the captured selfie's `file://` URI as a required param.
 */
export type OnboardingStackParamList = {
  [K in OnboardingRouteName]: undefined;
} & {
  Page32ConfirmSelfieScreen: { faceSelfieUri: string };
};

// ---------------------------------------------------------------------------
// Menu Stack
// ---------------------------------------------------------------------------

/**
 * Route params for the `MenuStack` nested navigator.
 *
 * Screens: `MenuHomeScreen` (initial) and `MyProfileScreen`.
 * `MyProfileScreen` accepts an optional `initialTab` to open directly on
 * the Preview or Edit segment.
 */
export type MenuStackParamList = {
  MenuHomeScreen: undefined;
  MyProfileScreen: { initialTab?: 'preview' | 'edit' } | undefined;
};

// ---------------------------------------------------------------------------
// Chat Stack
// ---------------------------------------------------------------------------

/**
 * Route params for the `ChatStack` nested navigator (story 15.4).
 *
 * Screens:
 * - `ChatListScreen` (initial) — WhatsApp-style list of friends with last message + timestamp.
 * - `ChatRoomScreen` — per-friend message thread (story 15.5 replaces the placeholder).
 *
 * `ChatRoomScreen` receives the `user_id` of the friend whose thread to open.
 */
export type ChatStackParamList = {
  ChatListScreen: undefined;
  ChatRoomScreen: { friendUserId: string };
};

// ---------------------------------------------------------------------------
// Explore Stack
// ---------------------------------------------------------------------------

/**
 * Route params for the `ExploreStack` nested navigator (story 13.5).
 *
 * Screens:
 * - `ExploreHomeScreen` (initial) — Friends + Requests + Bookmarks subtabs.
 * - `OtherProfileScreen` — full profile view, pushed from list rows.
 * - `BookmarkDeckViewScreen` — full deck view for a bookmarked profile (story 14.3
 *   registers the type + placeholder; story 14.4 ships the real screen).
 *
 * `OtherProfileScreen` receives a `userId` to look up via the friendship
 * registry and a `source` discriminant controlling the access guard and
 * ContactActionsSection visibility.
 *
 * `BookmarkDeckViewScreen` receives the `userId` of the bookmarked profile,
 * resolved via `useBookmarks().getBookmark(userId)`.
 */
export type ExploreStackParamList = {
  ExploreHomeScreen: undefined;
  OtherProfileScreen: { userId: string; source: 'friend' | 'request' };
  BookmarkDeckViewScreen: { userId: string };
};

// ---------------------------------------------------------------------------
// App Tabs
// ---------------------------------------------------------------------------

/**
 * Route params for the `AppTabs` bottom-tab navigator.
 *
 * Tabs: `Marriage`, `Explore`, `Chat`, `Menu`.
 * `Menu` hosts a nested `MenuStack`; `Explore` hosts a nested `ExploreStack`
 * (story 13.5); `Chat` hosts a nested `ChatStack` (story 15.4).
 */
export type AppTabsParamList = {
  Marriage: undefined;
  Explore: NavigatorScreenParams<ExploreStackParamList>;
  Chat: NavigatorScreenParams<ChatStackParamList>;
  Menu: NavigatorScreenParams<MenuStackParamList>;
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
