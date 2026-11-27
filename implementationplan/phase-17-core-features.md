phase: 17
title: Core feature round-up — notifications, chat pagination, blocking UX, filtering, deck shuffle, profile edit, registration S3 uploads
last_updated: 2026-11-27 (phase created from `docs/superpowers/specs/2026-11-27-phase-17-core-features-design.md`; renumbered previous phase 17 Settings → phase 18)

context_summary: |
  Phase 17 consolidates seven user-facing feature slices into a single phase per
  user directive in `QA/nextsteps.txt`:

    1. Expo notifications end-to-end (push fan-out + in-app bell/badge surfaces).
    2. Chat message pagination (20 initial / 30 subsequent via `onEndReached`).
    3. Blocking UX surfaces + preflight + inbound-request block.
    4. Sophisticated filtering (age/religion/country/district/education/marital
       status/professional area) with profession-first tiered sort + opt-in
       inbound-request profession gate.
    5. Deck shuffle + endless-loop fallback (delete "come back later" copy).
    6. Profile edit UX (section pencils, modals, mutability matrix,
       optimistic updates).
    7. S3 image upload during registration (page 29 photos + page 31 selfie),
       with two sex-partitioned buckets.

  **Renumbering (2026-11-27).** The previous phase 17 (Settings) was renumbered
  to **phase 18**. Its 5 stories (ex-17.1 → ex-17.5) are preserved verbatim at
  `implementationplan/phase-18-settings.md`. Inside that renamed PRD, story 17.2
  (ex-19.2, NotificationSettingsScreen + push token registration) carries an
  annotation noting that the push-token registration bootstrap is actually
  delivered by phase 17's story 17.F2.3 — by the time phase 18 runs, device
  tokens are already registered. Phase 18's 17.2 only owns the
  notification-preference toggle UI + `PATCH /users/me/notification-prefs`
  wiring.

  **Sequencing (foundations first, then vertical slices).** Eight story groups
  F1–F8. F1 is shared foundations (S3 Terraform, filter schema migration, push
  device table, professional-category JSON split, deck shuffle) — nothing in F1
  is user-visible on its own. F2–F8 are vertical slices that each ship a
  demo-able user-facing capability on top of F1. Group execution is strictly
  serial per the workspace non-parallelism rule. Within each group, stories are
  ordered by `depends_on`.

  **Scope non-goals.**
    - **Photo gallery section on profile edit** (editing / removing photos
      post-registration) is explicitly deferred to a future phase. The
      `PhotoBlockSection` does NOT get a pencil icon in this phase.
    - **Backfill for the professional-category MBBS/MD vs PhD split**. No existing
      users are affected (user confirmed).
    - **Full notifications-history screen** behind a "See all" link in the bell
      dropdown. The dropdown truncates at the latest 10.
    - **Username editing from profile edit** — username stays immutable in this
      phase.
    - **Settings-tab notification-preference toggles** — those remain with the
      renamed phase 18 Settings PRD.

  **Pre-existing WIP memory cleanup.** The user-level memory note
  `memory/wip_deck_backend_wiring.md` is stale — real-deck backend wiring is
  live and verified. The first story of phase 17 (story 17.F1.1) deletes that
  memory note as part of its housekeeping.

  **Design spec of record.**
  `docs/superpowers/specs/2026-11-27-phase-17-core-features-design.md` is the
  authoritative design document for every decision captured below. When a story
  underspecifies something, defer to the spec.

  **Backend counterpart.** All backend-owned stories in this phase live in
  `knotify-backend/implementationplan/phase-15-core-features.md`. Frontend
  stories that depend on new backend endpoints have a `depends_on` entry like
  `backend:F1.2` to signal that the backend-phase-15 story must land first.

  **Visual layout** for every new screen in this phase (FilterScreen,
  NotificationsDropdown, edit modals, deck block-button placement, etc.) is
  deferred to the `/implement-phase` brainstorm per project convention.

stories:

  # ─── F1: SHARED FOUNDATIONS ───────────────────────────────────────────────

  - id: 17.F1.1
    title: Professional-category dropdown split (MBBS/MD vs PhD) + stale-memory housekeeping
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/config/options/professionalCategory.json` has `"Medicine"` removed and two new entries added in its place `"Medicine — Doctor (MBBS / MD / MS / DM)"` and `"Medicine — PhD / Research"`.
      - Audit callsites rendering `professional_category` for overflow — at minimum `src/features/profile-sections/sections/ProfessionalCareerSection.tsx`, `src/features/landing/components/DeckCard.tsx`, `src/features/landing/components/CandidateHero.tsx`, `src/features/onboarding/screens/Page10ProfessionalCategoryScreen.tsx`. Where the new longer labels overflow or line-wrap awkwardly, add `numberOfLines`/ellipsis styling or adjust layout.
      - `src/features/onboarding/screens/Page10ProfessionalCategoryScreen.tsx` continues to pass its existing unit tests; add two new tests asserting both new Medicine options are present and selectable.
      - Housekeeping — delete `C:\Users\syede\.claude\projects\C--Users-syede-Claude-Master-knotify-frontend\memory\wip_deck_backend_wiring.md` (stale per user Q9 confirmation — the deck is already real-backend-wired). Remove its entry from `memory/MEMORY.md`.
    notes: "No DB backfill required — user confirmed no existing doctors."

  # F1.2 – F1.7 live in the backend PRD (knotify-backend phase-15 F1.x). Frontend
  # stories F2.3 onwards carry `backend:F1.<n>` cross-refs where appropriate.

  # ─── F2: EXPO NOTIFICATIONS END-TO-END ────────────────────────────────────

  - id: 17.F2.3
    title: Push-token registration on first authenticated boot + OS notification handler
    agent: frontenddeveloper
    done: false
    depends_on: [backend:F1.7]
    acceptance_criteria:
      - `src/state/auth/AuthProvider.tsx` calls `registerForPushNotifications()` (already defined in `src/services/push/expoPush.ts`) exactly once per auth session the moment `status` flips to `'authenticated'`. Guard with a `useRef<boolean>` sentinel to avoid double-fires across remounts.
      - `src/services/push/expoPush.ts`'s `request<void>` POST body is extended to include `platform: 'ios' | 'android'` (derived from `Platform.OS`) matching the backend contract for `POST /v1/push-tokens`.
      - `App.tsx` calls `Notifications.setNotificationHandler` globally at module scope so foreground pushes still render a system banner (defaults are silent otherwise). Config `{ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }`.
      - Android — register a notification channel on `android.setNotificationChannelAsync('default', { name: 'Default', importance: 'MAX', lightColor: theme.colors.notification.dot })`. Logo asset stub with `TODO(asset)` tag for the real icon.
      - New unit tests in `__tests__/state/auth/AuthProvider.test.tsx` verify the registration is called once on `authenticated` transition and NOT called again on remount.
      - New unit tests in `__tests__/services/push/expoPush.test.ts` verify the new `platform` field is included in POST body.
    notes: "Builds on existing expoPush.ts helper. User-visible only via push delivery itself."

  - id: 17.F2.4
    title: Deep-link tap handler + foreground-event handler for incoming notifications
    agent: frontenddeveloper
    done: false
    depends_on: [17.F2.3]
    acceptance_criteria:
      - New module `src/services/push/notificationHandlers.ts` exports `useNotificationTapListener()` that mounts `Notifications.addNotificationResponseReceivedListener` (backgrounded/killed-app taps) and `addNotificationReceivedListener` (foreground delivery) and cleans up on unmount.
      - Dispatch by `notification.request.content.data.type`:
          - `chat_message` → `navigate('Chat', { screen: 'ChatRoomScreen', params: { roomId } })`; invalidate `['messages', roomId]` and `['rooms']`.
          - `friend_request` → `navigate('Explore', { screen: 'OtherProfileScreen', params: { userId, source: 'request' } })`; invalidate `['friend-requests','incoming']`.
          - `friend_request_accepted` → call `useCreateOrGetRoomMutation` to resolve the room, then navigate to `ChatRoomScreen { roomId }`.
      - Unknown `type` values are logged and ignored.
      - `useNotificationTapListener()` is mounted inside `AppTabs.tsx` (only when `useAuth().status === 'authenticated'`).
      - New tests in `__tests__/services/push/notificationHandlers.test.tsx` cover each `type`, cache invalidation, and the unknown-type log path. Navigation is asserted via jest-mocked navigation ref.
    notes: ""

  - id: 17.F2.5
    title: Bell icon dropdown + unread-dot wiring on landing header
    agent: frontenddeveloper
    done: false
    depends_on: [backend:F2.2, 17.F2.4]
    acceptance_criteria:
      - New module `src/features/notifications/api.ts` exports `NOTIFICATIONS_QUERY_KEY = ['notifications'] as const`, `useNotificationsQuery()` (`GET /v1/notifications?limit=10`), and `useMarkAllNotificationsReadMutation()` (`POST /v1/notifications/mark-all-read`; invalidates `['notifications']` on success + optimistically sets every `read_at` to `now()` in the cache so the bell dot disappears instantly).
      - `src/features/notifications/components/NotificationsDropdown.tsx` — new component. Renders a positioned panel (absolute top-right; implementation detail: RN `Modal` with transparent backdrop or `View` with `position:absolute` — pick whichever handles safe-area correctly). Lists newest-first the 10 rows from `useNotificationsQuery`, shows avatar + body (interpolated from `t('notifications.<type>.body')`) + relative timestamp. Empty state: `t('notifications.empty')`.
      - `src/features/landing/components/HeaderBar.tsx` — replace the no-op bell `onPress` with a `setDropdownVisible(true)` trigger. On dropdown open, the mutation from the first AC fires (mark-all-read). Replace the current `hasUnreadNotifications` prop (fed from `dummyfemale.__dummy_display_only`) with a derived boolean from `useNotificationsQuery`: `data?.some(n => n.read_at === null)`.
      - On dropdown item tap, the shared deep-link helper from story 17.F2.4 is invoked (NOT a separate copy) and the dropdown closes.
      - New label keys in `labels.en.json` + `labels.ur.json`: `notifications.empty`, `notifications.friend_request.body`, `notifications.friend_request_accepted.body`, `notifications.chat_message.body`, `notifications.timestamp.justNow` / `minutesAgo` / `hoursAgo` / `daysAgo`.
      - Full test coverage: dropdown opens on bell tap, mark-all-read fires once on open, dot disappears on open, item tap deep-links correctly, empty state renders when `data.length === 0`.
      - MEHVISH-dummy coupling in `HeaderBar.tsx` is removed. The prop `hasUnreadNotifications` in `HeaderBarProps` is deleted. Callsites (grep `HeaderBar(`) stop passing it.
    notes: "Replaces dummy-fed unread-dot with real notification-query-driven unread dot."

  - id: 17.F2.6
    title: Chat tab count badge + Explore tab dot + per-chat-row unread pill
    agent: frontenddeveloper
    done: false
    depends_on: [backend:F2.2, 17.F2.5]
    acceptance_criteria:
      - `src/navigation/AppTabs.tsx` — Chat tab icon renders a small count badge pill (circle, `theme.colors.notification.dot` bg, white text, positioned top-right of the icon) when `useRoomsQuery()` has at least one room with `unreadCount > 0`. Badge content = sum of all rooms' `unreadCount`. Hidden when total = 0.
      - Explore tab icon renders a plain dot (no number, same `theme.colors.notification.dot` color) when **either** `useIncomingRequestsQuery().data.length > 0` **or** `useNotificationsQuery()` has an unread row with `type === 'friend_request_accepted'`. Dot clears when the Explore tab is focused (invalidate `['friend-requests','incoming']` + optimistic update of `['notifications']` to mark friend_request_accepted entries read).
      - `src/features/chat/components/ChatListRow.tsx` — add a small pill on the right of each row showing `room.unreadCount` (hidden when zero). Styling matches the tab badge. Clears when the row is tapped (invalidation happens naturally via phase-16 read-receipt flow).
      - Rooms list continues to sort by `last_message_at DESC` (no change — this is already implemented).
      - New tests in `__tests__/navigation/AppTabs.test.tsx`: chat badge visible when summed `unreadCount > 0`, hidden when 0; explore dot visible when incoming requests non-empty, hidden when empty; tab-focus clears each.
      - New tests in `__tests__/features/chat/components/ChatListRow.test.tsx`: unread pill visible when `unreadCount > 0`, hidden when 0.
    notes: "Uses existing phase-16 unreadCount field on rooms."

  # ─── F3: CHAT MESSAGE PAGINATION ──────────────────────────────────────────

  - id: 17.F3.1
    title: Chat message pagination UX — asymmetric 20/30 via onEndReached
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/features/chat/api.ts` — `useMessagesQuery(roomId)` adjusts the `limit` per call:
          - First page (pageParam === undefined): `limit=20`.
          - Subsequent pages: `limit=30`.
          Implementation: read `pageParam` in `queryFn` and ternary the limit.
      - `src/features/chat/screens/ChatRoomScreen.tsx` — wire `onEndReached={fetchNextPage}` on the inverted `FlatList`, with `onEndReachedThreshold={0.2}`. Guard the handler: skip if `isFetchingNextPage` OR `!hasNextPage`.
      - Render a small "That's the beginning of your conversation" label (new label key `chatRoom.conversationStart`) at the top of the message list when `!hasNextPage && data.pages.flat().length > 0`.
      - New / updated tests in `__tests__/features/chat/useChatHooks.test.tsx`: assert the first-page request uses `limit=20`, subsequent requests use `limit=30`.
      - New / updated tests in `__tests__/features/chat/ChatRoomScreen.test.tsx`: `onEndReached` triggers `fetchNextPage`, duplicate fires are suppressed, "conversation start" label appears when no more pages.
    notes: "Leverages existing phase-16 useInfiniteQuery + nextToken pagination. Backend contract-lock test lives in backend phase-15 F3.2."

  # ─── F4: BLOCKING UX SURFACES ─────────────────────────────────────────────

  - id: 17.F4.4
    title: Block button on OtherProfileScreen (ContactActionsSection)
    agent: frontenddeveloper
    done: false
    depends_on: [backend:F4.1]
    acceptance_criteria:
      - `src/features/profile-sections/sections/ContactActionsSection.tsx` — add a `BlockActionButton` row. Rendered only when the props indicate `source: 'friend' | 'request'` (NOT on deck preview, NOT on self-profile).
      - Icon `Ban` from `lucide-react-native`. Label `t('otherProfile.actions.block')`.
      - Tap → two-step `Alert.alert` (action sheet → confirmation dialog), identical pattern to the phase-16 story 16.10 triple-dot menu entry.
      - Confirm → `useBlockUserMutation.mutate({ userId })` from the existing phase-16 `src/features/blocks/api.ts`. On success, `navigation.goBack()`.
      - New labels `otherProfile.actions.block`, `otherProfile.actions.blockConfirmTitle`, `otherProfile.actions.blockConfirmBody`, `otherProfile.actions.blockConfirmYes`, `otherProfile.actions.blockConfirmCancel` (EN + UR parity).
      - Tests in `__tests__/features/profile/OtherProfileScreen.test.tsx`: block button visible only for `source: 'friend' | 'request'`, hidden on `source: 'deck'`; two-step confirm fires mutation + goBack on confirm; cancels on dismiss.
    notes: ""

  - id: 17.F4.5
    title: Block button on deck swipe card
    agent: frontenddeveloper
    done: false
    depends_on: [backend:F4.1]
    acceptance_criteria:
      - `src/features/landing/components/DeckCard.tsx` — add a small ghost icon button in the **bottom-left corner** of the card, inside card bounds.
      - Icon: `Ban` from `lucide-react-native`, no label.
      - `hitSlop` tuned so the swipe gesture does not accidentally trigger the button; `Pressable` scoped `pointerEvents` or `zIndex` as needed to beat the pan responder.
      - Tap → same two-step `Alert.alert` confirm pattern as 17.F4.4.
      - Confirm → `useBlockUserMutation.mutate({ userId })` → on success, trigger the existing deck-card exit animation (reuse the "pass" direction if present, or add a dedicated downward slide) + invalidate `['deck']`.
      - Tests in `__tests__/features/landing/components/DeckCard.test.tsx`: block button rendered, tap fires confirm, confirm fires mutation + exit animation, swipe gesture across the full card still works (block button hit area is bounded).
    notes: ""

  - id: 17.F4.6
    title: Blocked subtab on ExploreHomeScreen + shared ProfileCardTile component
    agent: frontenddeveloper
    done: false
    depends_on: [backend:F4.1]
    acceptance_criteria:
      - Extract the `BookmarkCard` styling into a new reusable component `src/components/catalog/ProfileCardTile.tsx` (portrait 3:4, scrim, avatar, name overlay, border, shadow). Props accept `profile`, `onPress`, `testID`. Replace the existing `BookmarkCard` usage with `ProfileCardTile` (or keep `BookmarkCard` as a thin wrapper — your call, but the new tile must be reusable by the Blocked tab).
      - `src/features/explore/screens/ExploreHomeScreen.tsx` — add a 4th subtab `Blocked` after Bookmarks. Subtab order becomes `Friends | Requests | Bookmarks | Blocked`.
      - Blocked tab content: 2-column grid of `ProfileCardTile` rendered from `useBlockedUsersQuery()` (existing from phase 16 story 16.9). Loading / empty / error states use the catalog `LoadingState` / `EmptyState` / `ErrorState`.
      - Tile tap → confirm-unblock modal (NOT profile navigation): `Alert.alert` with title `t('explore.blocked.unblockConfirmTitle')` and body `t('explore.blocked.unblockConfirmBody')` interpolated with `{firstName}`. Confirm → `useUnblockUserMutation.mutate({ userId })` → tile disappears from grid on cache invalidation.
      - New labels EN + UR: `explore.blocked.tab`, `explore.blocked.emptyTitle`, `explore.blocked.emptyDescription`, `explore.blocked.unblockConfirmTitle`, `explore.blocked.unblockConfirmBody`, `explore.blocked.unblockConfirmYes`, `explore.blocked.unblockConfirmCancel`.
      - Phase-16's `BlockedUsersScreen` (reached from profile triple-dot menu) is NOT deleted — remains as a secondary entry point.
      - Tests in `__tests__/features/explore/screens/ExploreHomeScreen.test.tsx`: 4-tab layout, Blocked tab renders tiles from query, tile tap opens confirm dialog, confirm fires unblock mutation.
    notes: ""

  - id: 17.F4.7
    title: Preflight can-request check wired into SendRequestModal
    agent: frontenddeveloper
    done: false
    depends_on: [backend:F4.3]
    acceptance_criteria:
      - `src/features/friendRequests/api.ts` gains `useCanRequestQuery(userId)` keyed `['can-request', userId]`, 30-second `staleTime`. Fetches `GET /v1/users/:userId/can-request`. Return shape: `{ can_request: true } | { can_request: false, reason: 'blocked' | 'criteria_not_met' | 'already_friends' | 'request_pending' }`.
      - `src/features/landing/components/SendRequestModal.tsx` — on modal `visible` transition to `true`, fire `useCanRequestQuery(userId)`. States:
          - Loading: show spinner inside modal card.
          - `can_request: true` → existing confirmation flow (Send button → `useSendFriendRequestMutation`).
          - `can_request: false, reason: 'blocked'` → render dismiss-only variant with `t('sendRequest.blockedTitle')` + `t('sendRequest.blockedBody')` ("You can't send this request" / "This user has blocked you"). No identity leak.
          - `can_request: false, reason: 'criteria_not_met'` → dismiss-only variant with `t('sendRequest.criteriaNotMetTitle')` + `t('sendRequest.criteriaNotMetBody')` ("You don't match this user's criteria" / "no more details").
          - `can_request: false, reason: 'already_friends'` → dismiss-only, `t('sendRequest.alreadyFriendsTitle')` + `t('sendRequest.alreadyFriendsBody')`.
          - `can_request: false, reason: 'request_pending'` → dismiss-only, `t('sendRequest.requestPendingTitle')` + `t('sendRequest.requestPendingBody')`.
      - On any `can_request: false` branch, also invalidate `['deck']` so the user doesn't re-see this profile immediately.
      - New labels for all four reason copies, EN + UR parity.
      - Tests in `__tests__/features/landing/components/SendRequestModal.test.tsx`: each of the 5 branches renders the right content, Send button only wires `sendRequest` on `true` branch, `['deck']` invalidation fires on each `false` branch.
    notes: "Requires backend:F4.3 for the endpoint."

  # ─── F5: FILTERING ────────────────────────────────────────────────────────

  - id: 17.F5.4
    title: FilterScreen UI with 7 filter sections + inbound-profession switch
    agent: frontenddeveloper
    done: false
    depends_on: [17.F1.1, 17.F5.5]
    acceptance_criteria:
      - New dependency `@miblanchard/react-native-slider` added to `package.json` (used for the age range dual-thumb slider). If an alternative RN-only slider in the existing catalog works, use it instead and skip the new dep (record decision in story completion notes).
      - New file `src/config/options/kashmirDistricts.json` listing Kashmir districts (Srinagar, Baramulla, Anantnag, Kupwara, Pulwama, Bandipora, Budgam, Ganderbal, Shopian, Kulgam — confirm final list against backend reference table in story 17.F5.5). Imported through `src/config/options/index.ts`.
      - New screen `src/features/filter/screens/FilterScreen.tsx`. Pushed as a modal stack from the Marriage landing tab when the user taps the `landing-header-filter-button` (replaces its current no-op `onPress`).
      - Sections rendered in this order, each with "All" as the default:
          1. Age — dual-thumb slider, range 23–65.
          2. Religion + Sect — nested selector. Religion multiselect; selecting a religion reveals its sect sub-list (multiselect).
          3. Current country of residence — single `Select` sheet, options from existing `countries.json`.
          4. District in Kashmir — multiselect checkbox list, options from new `kashmirDistricts.json`.
          5. Minimum education — single `Select` sheet from existing education-level options (filter is "at or above this level").
          6. Marital status — multiselect checkbox list from existing marital-status options.
          7. Professional area — multiselect from `professionalCategory.json` (post-F1.1 split). Max 3 selections; 4th tap triggers toast `t('filter.professionsCapToast')`.
      - Below section 7: a `Switch` row `t('filter.onlyReceiveRequestsFromTheseProfessions')`. When ON, the saved professional-area multiselect also becomes `inbound_profession_filter_values` + `inbound_profession_filter_enabled = TRUE` at save time. When OFF, `inbound_profession_filter_enabled = FALSE` regardless of the professional-area selection.
      - Header buttons: Reset (resets all fields to "All" / defaults) + Apply (calls the Save mutation from 17.F5.5 → `navigation.goBack()` on success).
      - Form state stored in `useReducer` local to `FilterScreen`; initialized from `useDeckFiltersQuery` cache on mount.
      - New labels EN + UR for every section title, the switch row, the toast, Reset, Apply, and the empty-state copies.
      - Detailed visual layout (spacing, colors, iconography, animations) deferred to `/implement-phase` brainstorm per project convention. Reference images in `muzzscreenshots/filter*`.
      - Tests: each section renders with defaults from empty cache; selecting items updates local state; cap-3 toast fires on 4th profession tap; Apply tapping mutation fires with the correct payload; Reset resets local state.
    notes: ""

  - id: 17.F5.5
    title: Filter state persistence hook (GET + PATCH /v1/profile/filters)
    agent: frontenddeveloper
    done: false
    depends_on: [backend:F5.2]
    acceptance_criteria:
      - New module `src/features/filter/api.ts` exports:
          - `DECK_FILTERS_QUERY_KEY = ['deck-filters'] as const`.
          - `useDeckFiltersQuery()` → `GET /v1/profile/filters`.
          - `useUpdateDeckFiltersMutation()` → `PATCH /v1/profile/filters`. On success, invalidate `['deck']` and `['deck-filters']`. On error, surface a toast with the backend error code (e.g. `invalid_filter_value`).
      - `src/services/api/endpoints.ts` gains `filtersApi.get()` and `filtersApi.update(payload)`.
      - Full type for the request/response body: `{ deck_filter_preferences: DeckFilterPreferences, inbound_profession_filter_enabled: boolean, inbound_profession_filter_values: string[] }`. `DeckFilterPreferences` is a new type under `src/types/api/DeckFilterPreferences.ts` matching the backend JSONB shape.
      - Tests in `__tests__/features/filter/api.test.tsx`: happy-path GET + PATCH, PATCH `onSuccess` invalidates the right query keys, PATCH `onError` surfaces toast, `['deck']` invalidation visible via mock queryClient.
    notes: ""

  - id: 17.F5.6
    title: Deck query includes filter signature so Apply refreshes the deck
    agent: frontenddeveloper
    done: false
    depends_on: [17.F5.5]
    acceptance_criteria:
      - Locate the existing `useDeckQuery` (likely in `src/features/landing/api.ts` or similar). Extend its `queryKey` from `['deck']` to `['deck', filterSignature]` where `filterSignature` is a deterministic hash of the current `useDeckFiltersQuery().data` (stable `JSON.stringify` with sorted keys, SHA-1 or simpler deterministic string — SHA-1 preferred via `crypto-js` if already in deps, otherwise a plain sort-and-stringify is acceptable).
      - On filter Apply, the signature changes → new query key → React Query auto-refetches.
      - All sibling invalidations of `['deck']` in the codebase (grep `queryKey: ['deck']` or `invalidateQueries({ queryKey: ['deck']`) are updated to predicate-match the tuple prefix `['deck']` so they still invalidate across all signatures (e.g. `invalidateQueries({ predicate: q => q.queryKey[0] === 'deck' })`).
      - Tests: filter change triggers a refetch; `['deck']` invalidation across all signatures works.
    notes: ""

  - id: 17.F5.7
    title: FilterScreen empty-state when filters exclude every candidate
    agent: frontenddeveloper
    done: false
    depends_on: [17.F5.6, 17.F6.1]
    acceptance_criteria:
      - `src/features/landing/screens/MarriageLandingScreen.tsx` — when `useDeckQuery` returns `deck.length === 0 && !isLoading && !isFetchingNextPage`, render a dedicated empty state:
          - Title `t('deck.filteredOutTitle')` = "No profiles match your filters"
          - Body `t('deck.filteredOutBody')` = "Try broadening your filters to see more people."
          - Button `t('deck.filteredOutCta')` = "Open filters" → navigates to `FilterScreen`.
      - This empty state is visually distinct from the between-deck loading animation (story 17.F6.2) by the data check: `deck.length === 0 && !isLoading`.
      - New labels EN + UR.
      - Tests: empty data + not-loading renders this empty state; empty data + loading does NOT render it (shows loading animation instead); CTA button navigates to FilterScreen.
    notes: ""

  # ─── F6: DECK SHUFFLE + ENDLESS LOOP ──────────────────────────────────────

  - id: 17.F6.1
    title: Delete "come back later" copy; auto-fetch next page when current deck exhausts
    agent: frontenddeveloper
    done: false
    depends_on: [backend:F1.3]
    acceptance_criteria:
      - Locate the current deck-exhausted copy in `MarriageLandingScreen` (grep "come back later" or "SEEN ALL PROFILES"). Delete the branch entirely — remove the empty-state component mount at that location and delete the strings from `labels.en.json` + `labels.ur.json`.
      - When `useDeckQuery` returns a page with fewer than N items (N = current deck page size from backend — confirm during implementation), auto-fire the next page fetch via `fetchNextPage()`. Guard against double-fires (standard React Query guards apply).
      - While the next-page fetch is in-flight, render the catalog `LoadingState` component in the card slot (replaced by a polished animation in 17.F6.2).
      - Tests: fewer-than-N triggers next fetch; loading state renders during fetch; "come back later" copy no longer resolves via `t()` (asserting the key removal).
    notes: ""

  - id: 17.F6.2
    title: Themed between-deck loading animation (DeckRefreshingAnimation)
    agent: frontenddeveloper
    done: false
    depends_on: [17.F6.1]
    acceptance_criteria:
      - New component `src/features/landing/components/DeckRefreshingAnimation.tsx`. Pure RN implementation — three dots pulsing in `theme.colors.accent.primary`, staggered 150ms, infinite loop while mounted. Uses `Animated.View` + `useNativeDriver: true`. No new animation library.
      - Replaces the generic `LoadingState` placement from 17.F6.1 in the between-deck state.
      - Centered in the card slot.
      - Tests: component renders without error; animations use native driver (assert via `Animated.timing` mock); renders only while `isFetchingNextPage` is true in `MarriageLandingScreen`.
    notes: ""

  # ─── F7: PROFILE EDIT ─────────────────────────────────────────────────────

  - id: 17.F7.2
    title: EditModal shell + SectionPencil icons on MyProfileScreen
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - New dependency `expo-blur` added to `package.json` (used by `EditModal` backdrop). Recorded in the PRD teardown section if ever reverted.
      - New reusable component `src/components/catalog/EditModal.tsx`. Props: `{ title: string, visible: boolean, onSave: () => void | Promise<void>, onCancel: () => void, saving: boolean, dirty: boolean, children: React.ReactNode }`. Full-height sheet modal. Backdrop uses `BlurView` from `expo-blur` at `intensity={30}` with fallback `rgba(0,0,0,0.4)` solid overlay. Scrollable body. Footer: Cancel (ghost) + Save (filled, disabled while `saving === true || !dirty`).
      - New component `src/components/catalog/SectionPencil.tsx`. `Pencil` icon from `lucide-react-native`, 20px, `theme.colors.text.secondary`. Props: `{ onPress: () => void, testID: string }`.
      - `src/features/profile/screens/MyProfileScreen.tsx` — renders a `SectionPencil` in the top-right corner of each **editable** section header (not on HeroBlock, not on VerifiedProfileSection, not on PhotoBlockSection — the last stays pencil-free per scope decision, deferred to future gallery section). Owns the dispatch map `Record<SectionId, () => React.ReactNode>` for the edit modals.
      - Pencil tap sets local state identifying which section's modal is open; the dispatch map renders the corresponding `<SpecificEditModal />` (modals themselves land in 17.F7.3 / 17.F7.4 / 17.F7.5).
      - `OtherProfileScreen` does NOT get `SectionPencil` icons.
      - Tests in `__tests__/components/catalog/EditModal.test.tsx`: Save disabled when not dirty; Save disabled during saving; Cancel fires onCancel; Save fires onSave.
      - Tests in `__tests__/features/profile/MyProfileScreen.test.tsx`: pencils render only on editable sections; tap opens the right modal.
    notes: ""

  - id: 17.F7.3
    title: Fully-editable section modals (AboutMe, MarriageIntentions, FuturePlans, Personality, ProfessionalCareer, Address)
    agent: frontenddeveloper
    done: false
    depends_on: [17.F7.2, 17.F7.6]
    acceptance_criteria:
      - Six new modal components, co-located with their sections:
          - `src/features/profile-sections/sections/AboutMeEditModal.tsx` — single multiline `TextArea` for `preferences.about_me`, 500-char counter.
          - `src/features/profile-sections/sections/MarriageIntentionsEditModal.tsx` — `marriage_time` dropdown (`marriageTime.json`), `relation` dropdown (`relation.json`).
          - `src/features/profile-sections/sections/FuturePlansEditModal.tsx` — `move_abroad` yes/no, `has_children` yes/no, `marital_status` dropdown (`maritalStatus.json`).
          - `src/features/profile-sections/sections/PersonalityEditModal.tsx` — the `preferences.*` personality keys surfaced in `PersonalitySection`.
          - `src/features/profile-sections/sections/ProfessionalCareerEditModal.tsx` — `professional_category` dropdown (post-F1.1 split), `job_title` (text), `employer_name` (text), `employment_type` dropdown, `office_address` (text), `salary_range` dropdown.
          - `src/features/profile-sections/sections/AddressEditModal.tsx` — country picker (writes `current_residence_country` + `resident_country_code`), `current_residence_city` (text), `district` (free text, NOT restricted to Kashmir — that restriction only applies to the deck filter), `family_residence_address` (multiline text).
      - Every modal uses `EditModal` as its shell.
      - Every modal calls `useUpdateProfileMutation()` from 17.F7.6 on Save and closes on success.
      - Every modal validates against the same JSON option lists as onboarding.
      - Tests per modal: open with current values from `['profile','me']` cache; edit fields; Save fires mutation with the right diff; cancel does not fire mutation.
    notes: "Six section modals. Visual layout deferred to /implement-phase brainstorm."

  - id: 17.F7.4
    title: Mixed-section edit modals (Parents, Education, Faith) with locked rows
    agent: frontenddeveloper
    done: false
    depends_on: [17.F7.2, 17.F7.6]
    acceptance_criteria:
      - Three new modal components:
          - `src/features/profile-sections/sections/ParentsEditModal.tsx` — reads (locked): `fathers_name`, `mothers_name`. Writes: `fathers_job`, `mothers_job`, `father_retired`, `mother_retired`.
          - `src/features/profile-sections/sections/EducationEditModal.tsx` — reads (locked): `college_name`, `higher_secondary`, `high_school`, their passing years. Writes: `education_level`, `highest_degree`, `graduation_year`.
          - `src/features/profile-sections/sections/FaithEditModal.tsx` — reads (locked): `religion`, `subsect`. Writes: `religious_level`, `partners_religious_level`.
      - "Locked" rows render with `Lock` icon from `lucide-react-native`, text styled with `theme.colors.text.muted`, and tap-to-show tooltip rendering `t('profileEdit.immutableTooltip')` = "This can't be changed after registration." Tooltip implementation: dismissable inline note or `Tooltip` catalog component if present.
      - Save fires `useUpdateProfileMutation` with only the editable diff — locked fields are never sent.
      - Tests: locked rows render; locked rows display the correct values; tooltip shows on tap; editable fields fire mutation; Save button disabled when no editable field is dirty.
    notes: ""

  - id: 17.F7.5
    title: Siblings list editor modal (add/edit/remove)
    agent: frontenddeveloper
    done: false
    depends_on: [17.F7.2, 17.F7.6]
    acceptance_criteria:
      - New component `src/features/profile-sections/sections/SiblingsEditModal.tsx`.
      - Renders a list of siblings from the current `preferences.siblings` (or wherever phase 7 persisted siblings — honor the existing field name). Each row: avatar / name summary + Edit button (expands to inline form) + Trash button (2-step confirm delete).
      - Add button at the bottom adds a new blank inline-form row (name, age, education, occupation, marital status — matching the phase-7 wire shape exactly).
      - Save → full-array PATCH (idempotent, replaces not merges), consistent with 17.F5.5's full-shape pattern.
      - Tests: add new sibling updates local list; edit existing sibling updates local list; delete fires 2-step confirm; Save fires mutation with full array; mutation payload matches phase-7 wire shape.
    notes: ""

  - id: 17.F7.6
    title: useUpdateProfileMutation with optimistic update + cross-surface cache invalidation
    agent: frontenddeveloper
    done: false
    depends_on: [backend:F7.1]
    acceptance_criteria:
      - New hook in `src/features/profile/api.ts`:
          - `useUpdateProfileMutation()` — accepts a partial `UserProfileWritable` body; calls `PATCH /v1/profile/me`.
          - `onMutate`: optimistic update of `['profile','me']` cache via `setQueryData(prev => ({ ...prev, ...patch }))`. Returns context `{ previous: prev }` for rollback.
          - `onError(error, variables, context)`: rollback via `setQueryData(['profile','me'], context.previous)`. Surface a toast: generic error, with a special-case branch for backend error code `immutable_field` that renders `t('profileEdit.immutableFieldError')`.
          - `onSuccess`: invalidate `['profile','me']`, `['deck']` (predicate-match on tuple prefix per 17.F5.6), `['profile', <any userId>]` (predicate-match), `['friends']`, `['rooms']`.
      - Tests in `__tests__/features/profile/api.test.tsx`: optimistic cache write + rollback on error; immutable_field error code renders distinct toast; all five invalidation targets fire on success.
    notes: ""

  # ─── F8: S3 UPLOAD DURING REGISTRATION ────────────────────────────────────

  - id: 17.F8.3
    title: Frontend upload service (presign + PUT + typed errors)
    agent: frontenddeveloper
    done: false
    depends_on: [backend:F1.5]
    acceptance_criteria:
      - New module `src/services/uploads/photoUpload.ts`. Exports `uploadPhoto(file: { uri: string, contentType: string, fileName: string }, kind: 'selfie' | 'profile_image'): Promise<string>` — returns the S3 object key on success.
      - Implementation:
          1. POST to `/v1/profile/selfie` (for `kind === 'selfie'`) or `/v1/profile/photos` (for `kind === 'profile_image'`) via `request<T>` with body `{ contentType, fileName }`. Receive `{ uploadUrl, objectKey, expiresAt }`.
          2. Read `file.uri` as a blob via RN's `fetch(uri).then(r => r.blob())`.
          3. `fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': contentType, 'x-amz-server-side-encryption': 'AES256' } })`.
          4. On non-2xx S3 response or network failure, throw a typed `PhotoUploadError` with `code: 'presign_failed' | 's3_put_failed' | 'file_too_large'`.
          5. Return `objectKey`.
      - Optional 4th parameter `onProgress?: (fraction: number) => void` — stubbed signature; implementation deferred (RN `fetch` doesn't expose upload progress reliably; mark with `TODO(progress)`).
      - New type file `src/types/PhotoUploadError.ts` defining the error class.
      - Tests in `__tests__/services/uploads/photoUpload.test.ts`: happy-path returns objectKey; 400 presign fails with `presign_failed`; S3 503 fails with `s3_put_failed`; S3 413 fails with `file_too_large`; `kind='selfie'` POSTs to `/v1/profile/selfie`, `kind='profile_image'` POSTs to `/v1/profile/photos`.
    notes: ""

  - id: 17.F8.4
    title: Page 29 profile-image upload integration
    agent: frontenddeveloper
    done: false
    depends_on: [17.F8.3]
    acceptance_criteria:
      - `src/features/onboarding/draftSchema.ts` — add two new fields: `selfie_key: string | null` and `profile_image_keys: string[]` (default `[]`).
      - `src/features/onboarding/buildPatchBody.ts` — include `selfie_key` and `profile_image_keys` in the final PATCH payload when non-null / non-empty.
      - `src/features/onboarding/screens/Page29PhotosScreen.tsx`:
          - On each image pick, immediately call `uploadPhoto(file, 'profile_image')`. Show a per-tile inline spinner overlay while in flight.
          - On upload success, push `objectKey` into `draft.profile_image_keys`. Clear the tile's spinner.
          - On upload failure, show a toast with the error code + a retry button on the tile. Do NOT push to `draft.profile_image_keys`.
          - User cannot proceed to Page 30 until every picked image has an `objectKey` (i.e. no pending upload). The Continue button is disabled while any tile is uploading or in an error state.
          - User-removed images: remove the `objectKey` from `draft.profile_image_keys`. No S3 delete call — orphaned S3 objects are cleaned by the lifecycle rule in backend F1.4.
      - Tests in `__tests__/features/onboarding/screens/Page29PhotosScreen.test.tsx`: image pick triggers upload; success writes `draft.profile_image_keys`; failure shows toast + retry; Continue disabled while uploading; remove drops the key from draft.
    notes: ""

  - id: 17.F8.5
    title: Page 31 selfie upload integration (coexists with mock-only secure-store)
    agent: frontenddeveloper
    done: false
    depends_on: [17.F8.3]
    acceptance_criteria:
      - `src/features/onboarding/screens/Page31FaceCaptureScreen.tsx`:
          - On successful capture, immediately call `uploadPhoto(selfieFile, 'selfie')`.
          - Store returned `objectKey` in `draft.selfie_key`.
          - Retain the existing `TODO(mock-only)` secure-store write — the mock surface lives alongside the real upload until phase-11/12 teardown fully retires the mock pipeline. Teardown remains in `context.md` → "Before shipping" checklist.
          - Upload failure: stay on Page 31 with a retry button. No partial progression. The Continue button is disabled while uploading or in an error state.
      - Final onboarding PATCH (phase-11 story) already sends the full draft; now the draft includes `selfie_key` which backend F8.2 accepts.
      - Tests in `__tests__/features/onboarding/screens/Page31FaceCaptureScreen.test.tsx`: capture triggers upload; success writes `draft.selfie_key`; failure shows retry button; Continue disabled while uploading.
    notes: ""
