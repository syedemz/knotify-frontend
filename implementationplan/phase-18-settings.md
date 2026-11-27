phase: 18
title: Settings + deep-link scaffolding - notifications, theme, language, account deletion, all app deep-links
last_updated: 2026-11-27 (renumbered from phase 17 → phase 18 on creation of the new phase-17-core-features PRD; story contents unchanged — but see story-17.2 note below: the push-token registration bootstrap is now delivered by phase 17 F2.3, so this phase only owns the notification-preference toggle UI)

context_summary: |
  Phase 18 is the final **thin** post-onboarding phase per §11.2.8. Renumbered
  from phase 17 → 18 on 2026-11-27 when the new phase 17 "Core feature round-up"
  PRD was created. Story content is unchanged from its previous phase-17
  incarnation; story IDs (17.1 → 17.5) are preserved verbatim to avoid churn in
  existing cross-references. (This phase still exports `phase: 18` as its index
  entry; story IDs retain their historical `17.x` numbering purely as labels —
  do NOT read `17.1` as "story 1 of phase 17".) Owns the settings hub,
  notification preferences, theme toggle, language toggle (which triggers
  `I18nManager.forceRTL` + `Updates.reloadAsync()` per §17.26), and account
  deletion with the polling flow per §17.19.

  **Push-token registration overlap with phase 17 (2026-11-27).** The original
  story 17.2 ("NotificationSettingsScreen + push token registration") included
  calling `registerForPushNotifications()` on first entry to the settings
  notification screen. That bootstrap is now delivered earlier by phase-17
  story 17.F2.3 — registration fires on first authenticated boot inside
  `AuthProvider`, not on first entry to settings. By the time this phase runs,
  device tokens are already registered. Story 17.2 in this PRD now effectively
  only owns the notification-preference toggle UI + `PATCH
  /users/me/notification-prefs` wiring. Treat the "On first entry, calls
  requestNotificationPermission()" acceptance criterion in that story as
  satisfied-by-phase-17 — do not re-wire it here.

  **Deep-link scope absorbed from phase 16 (post-brainstorm decision 2026-11-15).**
  Phase 16 originally owned a single chat deep-link story (ex-16.7,
  `knotify://chat/room/:roomId`). The phase-16 brainstorm surfaced that
  `src/navigation/linking.ts` currently exports `{ prefixes: [], config: { screens: {} } }`
  — there is NO functional linking config yet. Wiring one deep-link means
  bootstrapping the whole thing: the `knotify://` prefix, the full nested route
  table through the authenticated tab hierarchy (AppTabs → each tab's nested
  stack), AND resolving the pre-existing `knotify://profile/:userId` share links
  emitted by `buildShareMessage.ts` (phase 12) which nothing currently resolves.
  Rather than inflate phase 16 with a second scaffolding concern, the entire
  deep-link scope is consolidated here. Story 17.5 (originally "Settings
  deep-link route registration") is expanded to own the whole bootstrap: chat +
  profile + settings routes, cold-start + warm-start, in one shot.

  Visual layout for every screen in this phase is deferred to /implement-phase
  brainstorm.

stories:
  - id: 17.1
    title: SettingsScreen thin wire (hub)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `SettingsScreen` renders a `Section` list linking to Notifications, Theme, Language, and Account Deletion sub-screens via catalog `ListRow`.
      - Sign-out `Button` calls `AuthProvider.signOut()`; on success `RootNavigator` swaps in `AuthStack`.
      - Screen wiring test covers navigation to each sub-screen and the sign-out path.
    notes: "Ex-19.1. Visual layout deferred."

  - id: 17.2
    title: NotificationSettingsScreen + push token registration
    agent: frontenddeveloper
    done: false
    depends_on: [17.1]
    acceptance_criteria:
      - `NotificationSettingsScreen` renders the notification-preference toggles (categories placeholder pending design brainstorm) via catalog `Switch`/`ListRow`.
      - On first entry, calls `src/services/permissions/requestNotificationPermission()` (added here) using `expo-notifications`; on grant, registers the Expo push token via POST /users/me/devices per §8.2.
      - Toggle changes PATCH the preference set via `useUpdateNotificationPrefsMutation`.
      - `services/api/mocks/handlers.ts` gains handlers + fixtures for POST /users/me/devices and PATCH /users/me/notification-prefs including permission-denied and 500 paths.
      - Screen wiring test covers grant + register, deny path, and toggle persistence.
    notes: "Ex-19.2. Visual layout deferred."

  - id: 17.3
    title: ThemeSettingsScreen + LanguageSettingsScreen (RTL reload)
    agent: frontenddeveloper
    done: false
    depends_on: [17.1]
    acceptance_criteria:
      - `ThemeSettingsScreen` renders light/dark/system options via catalog `RadioGroup`; selection persists via `useThemeStore` and applies immediately without reload.
      - `LanguageSettingsScreen` renders EN/UR options; selecting Urdu calls `I18nManager.forceRTL(true)` then `Updates.reloadAsync()` per §17.26; selecting English calls `I18nManager.forceRTL(false)` + `reloadAsync()`.
      - Language selection surfaces an explicit "app will restart to apply" confirm step before triggering the reload (per §17.26 [Open] resolution — the phase brainstorm may refine copy but the confirm gate is mandatory).
      - Screen wiring test covers theme persistence, the confirm-then-reload path, and cancel-from-confirm.
    notes: "Ex-19.3. Language reload UX pending §17.26 resolution — the confirm gate is fixed; copy is a brainstorm concern."

  - id: 17.4
    title: AccountDeletionScreen + polling flow
    agent: frontenddeveloper
    done: false
    depends_on: [17.1]
    acceptance_criteria:
      - `AccountDeletionScreen` renders an explainer body, a confirm `TextInput` (user types their username), and a Delete `Button` per §17.19.
      - Delete POSTs to /account/deletion-requests and enters the polling state — GET /account/deletion-requests/me every 3 seconds until status is `completed` or `failed` (max 60 s per §17.19).
      - `completed` signs the user out and swaps in `AuthStack`; `failed` surfaces an `ErrorState` with a retry action; timeout keeps the polling state with a "still processing — check back later" label.
      - `services/api/mocks/handlers.ts` gains POST /account/deletion-requests and GET /account/deletion-requests/me handlers with fixtures covering completed, failed, still-processing, and 500.
      - Screen wiring test covers each of the four polling outcomes.
    notes: "Ex-19.4."

  - id: 17.5
    title: Deep-link scaffolding + all route registration (chat + profile + settings)
    agent: frontenddeveloper
    done: false
    depends_on: [17.2, 17.4]
    acceptance_criteria:
      - `src/navigation/linking.ts` is rewritten end-to-end. `prefixes` includes `['knotify://']` (and an https universal-link prefix placeholder commented out pending App Store / Play Store domain verification — add as a `TODO(universal-link)` comment rather than a working entry).
      - Nested `config.screens` mirrors the authenticated navigator shape — `AppTabs → Chat → ChatStack → ChatRoomScreen`, `AppTabs → Explore → ExploreStack → OtherProfileScreen`, `AppTabs → Menu → MenuStack → SettingsScreen → NotificationSettingsScreen | AccountDeletionScreen`.
      - `knotify://chat/room/:roomId` resolves to `ChatRoomScreen` with `roomId` typed through `ChatStackParamList` (phase 16 switched the param from `friendUserId` to `roomId`).
      - `knotify://profile/:userId` resolves to `OtherProfileScreen` in the Explore stack with `userId` typed through `ExploreStackParamList`. This picks up the share links emitted by `src/features/profile/buildShareMessage.ts` (phase 12) which previously had no resolver.
      - `knotify://settings/notifications` resolves to `NotificationSettingsScreen`.
      - `knotify://settings/account` resolves to `AccountDeletionScreen`.
      - All four routes work cold-start (link opened while the app was not running) and warm-start (link opened while the app is already running).
      - Cold-start behaviour correctly lands on the target screen AFTER the auth gate — unauthenticated users see `AuthStack`, then land on the deep-link target once `RootNavigator` swaps in `AppTabs`. Add `getInitialState` plumbing if React Navigation's default doesn't cover this out-of-the-box.
      - Deep-link test covers cold-start and warm-start for every route; also covers the unauthenticated → authenticated → deep-link-target flow.
    notes: |
      Ex-19.5 + absorbed ex-16.7 (originally scoped to phase 16, moved here per
      phase-16 brainstorm 2026-11-15 BLOCKING 6). Also owns the
      `knotify://profile/:userId` resolver for the pre-existing share links.
      Visual layout deferred (deep-link resolution is a navigation concern, not a
      visual one).
