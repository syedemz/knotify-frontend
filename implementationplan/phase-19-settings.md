phase: 19
title: Settings - notifications, theme, language, account deletion
last_updated: 2026-07-19

context_summary: |
  Phase 19 is the final **thin** post-onboarding phase per §11.2.8. Owns the settings hub, notification preferences + push token registration (folded in per §11.2.8 cross-phase decision), theme toggle, language toggle (which triggers `I18nManager.forceRTL` + `Updates.reloadAsync()` per §17.26), and account deletion with the polling flow per §17.19. Deep-link routes `knotify://settings/notifications` and `knotify://settings/account` are registered here. Visual layout is deferred to /implement-phase brainstorm.

stories:
  - id: 19.1
    title: SettingsScreen thin wire (hub)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `SettingsScreen` renders a `Section` list linking to Notifications, Theme, Language, and Account Deletion sub-screens via catalog `ListRow`.
      - Sign-out `Button` calls `AuthProvider.signOut()`; on success `RootNavigator` swaps in `AuthStack`.
      - Screen wiring test covers navigation to each sub-screen and the sign-out path.
    notes: "Visual layout deferred."

  - id: 19.2
    title: NotificationSettingsScreen + push token registration
    agent: frontenddeveloper
    done: false
    depends_on: [19.1]
    acceptance_criteria:
      - `NotificationSettingsScreen` renders the notification-preference toggles (categories placeholder pending design brainstorm) via catalog `Switch`/`ListRow`.
      - On first entry, calls `src/services/permissions/requestNotificationPermission()` (added here) using `expo-notifications`; on grant, registers the Expo push token via POST /users/me/devices per §8.2.
      - Toggle changes PATCH the preference set via `useUpdateNotificationPrefsMutation`.
      - `services/api/mocks/handlers.ts` gains handlers + fixtures for POST /users/me/devices and PATCH /users/me/notification-prefs including permission-denied and 500 paths.
      - Screen wiring test covers grant + register, deny path, and toggle persistence.
    notes: "Visual layout deferred."

  - id: 19.3
    title: ThemeSettingsScreen + LanguageSettingsScreen (RTL reload)
    agent: frontenddeveloper
    done: false
    depends_on: [19.1]
    acceptance_criteria:
      - `ThemeSettingsScreen` renders light/dark/system options via catalog `RadioGroup`; selection persists via `useThemeStore` and applies immediately without reload.
      - `LanguageSettingsScreen` renders EN/UR options; selecting Urdu calls `I18nManager.forceRTL(true)` then `Updates.reloadAsync()` per §17.26; selecting English calls `I18nManager.forceRTL(false)` + `reloadAsync()`.
      - Language selection surfaces an explicit "app will restart to apply" confirm step before triggering the reload (per §17.26 [Open] resolution — the phase brainstorm may refine copy but the confirm gate is mandatory).
      - Screen wiring test covers theme persistence, the confirm-then-reload path, and cancel-from-confirm.
    notes: "Language reload UX pending §17.26 resolution — the confirm gate is fixed; copy is a brainstorm concern."

  - id: 19.4
    title: AccountDeletionScreen + polling flow
    agent: frontenddeveloper
    done: false
    depends_on: [19.1]
    acceptance_criteria:
      - `AccountDeletionScreen` renders an explainer body, a confirm `TextInput` (user types their username), and a Delete `Button` per §17.19.
      - Delete POSTs to /account/deletion-requests and enters the polling state — GET /account/deletion-requests/me every 3 seconds until status is `completed` or `failed` (max 60 s per §17.19).
      - `completed` signs the user out and swaps in `AuthStack`; `failed` surfaces an `ErrorState` with a retry action; timeout keeps the polling state with a "still processing — check back later" label.
      - `services/api/mocks/handlers.ts` gains POST /account/deletion-requests and GET /account/deletion-requests/me handlers with fixtures covering completed, failed, still-processing, and 500.
      - Screen wiring test covers each of the four polling outcomes.
    notes: ""

  - id: 19.5
    title: Settings deep-link route registration
    agent: frontenddeveloper
    done: false
    depends_on: [19.2, 19.4]
    acceptance_criteria:
      - `knotify://settings/notifications` resolves to `NotificationSettingsScreen`; `knotify://settings/account` resolves to `AccountDeletionScreen`.
      - Both routes work cold-start (link opened while app was not running) and warm-start.
      - Deep-link test covers cold-start and warm-start for both routes.
    notes: ""
