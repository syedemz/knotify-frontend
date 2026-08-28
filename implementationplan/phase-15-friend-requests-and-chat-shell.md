phase: 15
title: Friend requests + chat UI shell
last_updated: 2026-08-27 (story 15.6 complete — IncomingRequestModal + DevTriggersPanel + MyProfileScreen Edit-tab dev trigger)

context_summary: |
  Phase 15 was originally scoped as a thin backend-first phase (REST + MSW + React Query
  cross-cache invalidation) delivering three stub screens: `IncomingRequestsScreen`,
  `OutgoingRequestsScreen`, `RequestDetailScreen`. That scope is **obsolete**. Phases 13
  and 14 already shipped the friend/request UI surfaces on top of a mock-only
  `FriendshipProvider`:

  - `ExploreHomeScreen` already has Friends + Requests + Bookmarks subtabs (13.5 / 14.3).
  - `OtherProfileScreen` is the current full-profile viewer with Accept/Decline for
    `source='request'` (13.4).
  - `SendRequestModal` is already the send-request UI, wired from `MarriageLandingScreen`
    (13.3) and `BookmarkDeckViewScreen` (14.4) but currently fires a snackbar with no
    persistence — a `TODO(mock-only)` grep-tag lives at both callsites.

  Phase 15 is now a **mock-only bridging phase** that does three things:

  1. **Persistence layer for sent friend requests.** Backs the "I sent Aisha a request"
     side of the friend-request lifecycle with an `AsyncStorage` helper and a
     `FriendshipProvider.sendRequest()` extension. `SendRequestModal.onConfirmed`
     handlers at the two callsites above are wired to actually persist the request
     ID. Nothing user-visible changes about the send flow itself. Incoming requests
     stay fixture-driven (unchanged from phase 13).

  2. **Two new event-triggered modals** for surfacing request lifecycle events that
     will (in phase 17) be driven by AppSync GraphQL subscriptions:

     - `IncomingRequestModal` — pops when someone sends me a friend request.
     - `RequestAcceptedModal` — pops when someone accepts a request I sent.

     Both modals are dev-triggered for phase 15 via two temporary buttons on the
     `MyProfileScreen` Edit-tab shell (currently a "Coming soon" `EmptyState`). Both
     are grep-tagged `TODO(mock-only)`; phase 17 wires them to real subscription events
     and removes the dev triggers alongside the Edit-shell placeholder.

  3. **Chat UI shell** built end-to-end against an AsyncStorage-backed mock chat history:

     - `ChatHistoryStorage` AsyncStorage helper (per-friend key, JSON-shaped messages,
       add/update/delete/clear methods matching the surface a real backend + optimistic
       cache will hit in phase 17).
     - Seed JSON `assets/dummychat/chatMehvish.json` (~18 messages between me and
       Mehvish). Hydrated into AsyncStorage on first read if the key is empty.
     - `ChatProvider` + `useChatHistory(friendUserId)` hook — mirrors the shape of
       `BookmarksProvider`. Exposes `messages`, `loading`, `sendMessage`,
       `updateMessage`, `deleteMessage`.
     - `ChatStack` replaces the Chat-tab `EmptyState` placeholder in `AppTabs`.
     - `ChatListScreen` — WhatsApp-style list of friends × last-message + timestamp.
     - `ChatRoomScreen` — WhatsApp-style thread with tiled dark background image,
       theme-coloured message bubbles, header (back + avatar + name + triple-dot no-op),
       composer with mic↔send toggle on non-empty input, no camera icon.

  Background image asset: `C:\Users\syede\Claude-Master\animations\images\BGDark.jpg`
  is external to the project. Story 15.2 copies it into `assets/chat/bgDark.jpg`.

  Provider tree after this phase (App.tsx):
  ```
  GestureHandlerRootView -> SafeAreaProvider -> ThemeProvider -> LanguageProvider ->
  QueryProvider -> AuthProvider -> OnboardingCompletionProvider -> FriendshipProvider ->
  BookmarksProvider -> ChatProvider -> NavigationContainer
  ```

  Dev-only mock surfaces added by this phase are all grep-tagged `TODO(mock-only)`.
  Teardown checklist added to context.md before shipping (see `teardown_additions`
  block below).

  This phase overlaps with the original phase-17 scope. Phase 17 is patched in the
  same commit to reflect the shifted responsibilities:
    - 17.3 (RoomsListScreen) — "wire real Rooms query to the existing `ChatListScreen`"
    - 17.4 (RoomScreen) — "wire real messages query + subscription to the existing
      `ChatRoomScreen`; replace `useChatHistory` mock with `useMessagesQuery`"
    - 17.5 (deep-link) — unchanged; deep-link target is `ChatRoomScreen`.

teardown_additions: |
  Add to context.md before shipping when phase 15 lands:

  ### Mock-only friend requests + chat pipeline (added phase 15)

  1. **Delete `src/features/friendRequests/storage/requestsStorage.ts`** and its
     tests. Wipe AsyncStorage key `dummy.requests.outgoing` on next launch.
  2. **Delete the `sendRequest` / `outgoingRequestIds` / `hasOutgoingRequest` surface
     from `FriendshipProvider`** — replace with real `useSendRequestMutation` per
     phase-17 scope (or the real REST endpoint if backend split lands there).
  3. **Delete the two dev-trigger buttons** on `MyProfileScreen` Edit tab (the
     `DevTriggersPanel` component + its labels under `menu.myProfile.editTab.devTriggers.*`).
     The Edit tab returns to a real "Coming soon" or the real edit UX.
  4. **Wire IncomingRequestModal + RequestAcceptedModal to real subscription events**
     from AppSync (`onFriendRequestReceived`, `onFriendRequestAccepted`). The modal
     components themselves stay — only their trigger source changes.
  5. **Delete `src/features/chat/storage/chatHistoryStorage.ts`** and
     `assets/dummychat/chatMehvish.json`. Replace `useChatHistory` in `ChatProvider`
     with the real `useMessagesQuery` + `useOnMessageAddedSubscription` from phase 17.
     The screen components (`ChatListScreen`, `ChatRoomScreen`) stay untouched — only
     their data source swaps.
  6. **Keep `assets/chat/bgDark.jpg`** — it's a real UI asset, not mock-only.
  7. **Grep verification**: `grep -r 'TODO(mock-only)' src/features/friendRequests`
     and `grep -r 'TODO(mock-only)' src/features/chat` and
     `grep -r 'TODO(mock-only)' src/state/chat` should all return zero hits after
     teardown.

open_decisions_locked_by_user:
  - question: "Do we surface sent (outgoing) friend requests anywhere in the UI, or just persist the IDs for later?"
    answer: "Just persist the IDs. No outgoing-list UI in phase 15. Detailed 'already sent' UX (deck card indicator, disabled Like, banner in SendRequestModal) is deferred — will be tackled in a dedicated pass later with detailed checks."
    applies_to: [15.1]
  - question: "Should the IncomingRequestModal replace the current Requests-row-tap navigating to OtherProfileScreen?"
    answer: "No. Do not change what has already shipped in phase 13. The existing Explore/Requests row-tap OtherProfileScreen flow stays. The new modal is an additive surface driven by a receive-request event (dev button today, GraphQL subscription later)."
    applies_to: [15.6]
  - question: "Do we also need a modal for the 'someone accepted my request' event?"
    answer: "Yes. Add RequestAcceptedModal alongside IncomingRequestModal. Both are dev-triggered from the MyProfileScreen Edit tab in phase 15."
    applies_to: [15.7]
  - question: "Where do the two dev-trigger buttons live?"
    answer: "On the MyProfileScreen Edit tab, replacing the current 'Coming soon' EmptyState with a DevTriggersPanel. Removed at teardown."
    applies_to: [15.6, 15.7]
  - question: "Which fixture profile does each modal use for the dev-trigger?"
    answer: "IncomingRequestModal uses Qurat (already the pending-request fixture in assets/dummyrequests.json). RequestAcceptedModal uses Mehvish (already a friend with a full profile and seed chat history — 'Say hi' navigates cleanly to her ChatRoomScreen)."
    applies_to: [15.6, 15.7]
  - question: "Should the ChatRoomScreen background image be pulled directly from C:\\Users\\syede\\Claude-Master\\animations\\images\\BGDark.jpg?"
    answer: "No — that path is outside the project. Copy the file into the project at assets/chat/bgDark.jpg."
    applies_to: [15.2]
  - question: "Which friends get seeded chat history?"
    answer: "Mehvish only. Any other friend (including Qurat if her incoming request is accepted via the modal test) starts with an empty chat thread. That's a natural test of the empty-thread state."
    applies_to: [15.2]
  - question: "How WhatsApp-like should the ChatRoomScreen composer be?"
    answer: "Mic icon when input is empty, send icon when input has text (single trailing circular button that swaps icon). No camera icon. No attachment/sticker icons. Use theme colours — not WhatsApp green."
    applies_to: [15.5]

stories:
  - id: 15.1
    title: Requests AsyncStorage helper + FriendshipProvider.sendRequest wiring
    agent: frontenddeveloper
    done: true
    depends_on: []
    acceptance_criteria:
      - Add `src/features/friendRequests/storage/requestsStorage.ts` (zero React imports; mirror shape of `src/features/bookmarks/storage/bookmarksStorage.ts`). Exports named consts + functions - `OUTGOING_REQUESTS_STORAGE_KEY = 'dummy.requests.outgoing'`, `getOutgoingRequests(): Promise<string[]>`, `saveOutgoingRequests(ids: string[]): Promise<void>`, `addOutgoingRequest(userId: string): Promise<void>` (dedupes on user_id), `removeOutgoingRequest(userId: string): Promise<void>` (idempotent), `hasOutgoingRequest(userId: string): Promise<boolean>`, `clearOutgoingRequests(): Promise<void>`. Fail-open JSON parse (return `[]` on parse error with `console.warn`). Grep-tag file header with `TODO(mock-only): remove when real send-request endpoint ships`.
      - Extend `src/state/friendship/FriendshipProvider.tsx` with an outgoing-requests mirror. Add to the context value - `outgoingRequestIds: readonly string[]`, `sendRequest(userId: string): Promise<void>` (writes AsyncStorage via `addOutgoingRequest`, then updates the in-memory mirror), `hasOutgoingRequest(userId: string): boolean` (synchronous read from the mirror). Hydrate the mirror once on provider mount via `getOutgoingRequests()`. Do NOT modify friendship (`friends`, `isFriend`) or incoming-request (`requests`, `receivedRequestFrom`, `acceptRequest`, `declineRequest`) surfaces — those are already correct.
      - Wire `SendRequestModal.onConfirmed` at both existing callsites to persist the request id before the existing next-step logic runs. At `src/features/landing/screens/MarriageLandingScreen.tsx` - inside the existing `handleLike` mock-theatre callback, call `sendRequest(currentDeck.user_id).catch((e) => console.warn('sendRequest failed', e))` before firing the `landing.likeSent` snackbar. Deck index advance behaviour is unchanged. At `src/features/bookmarks/screens/BookmarkDeckViewScreen.tsx` - inside `handleConfirmed`, call `sendRequest(userId).catch(console.warn)` before the existing `navigation.goBack()`. Both callsites keep their existing `TODO(mock-only)` comments — the mock now persists the request id, but the real backend integration is still outstanding.
      - No teardown work on the send-flow UI itself. The existing snackbar text (`landing.likeSent`) and navigation behaviour remain unchanged.
      - Hook tests cover - cold hydration returns empty array; adding twice with the same userId does not duplicate; `hasOutgoingRequest(id)` flips true after `sendRequest(id)`; provider re-renders on mirror update; AsyncStorage key survives provider unmount + remount (persistence check via mock storage state).
    notes: |
      Verbatim-decoupled from acceptRequest / declineRequest. Friendship state and incoming
      requests remain in-memory + fixture-driven; only sent-request IDs persist across
      cold start. That's enough to satisfy "we need them later" without touching phase-13
      surfaces.
    tracking_issue: 127

  - id: 15.2
    title: ChatHistory AsyncStorage helper + Mehvish seed JSON + BGDark asset move
    agent: frontenddeveloper
    done: true
    depends_on: []
    acceptance_criteria:
      - Copy `C:\Users\syede\Claude-Master\animations\images\BGDark.jpg` into the project at `assets/chat/bgDark.jpg`. Create the `assets/chat/` directory if it does not exist. Verify with `ls assets/chat/`. Do NOT reference the source path anywhere in code — the file must be self-contained inside the project.
      - Add `src/types/ChatMessage.ts` exporting `interface ChatMessage { readonly id: string; readonly sender: 'me' | 'friend'; readonly text: string; readonly timestamp: number; readonly status: 'sent' | 'delivered' | 'read'; readonly editedAt?: number; }`. Timestamps are unix milliseconds. `id` is a locally-generated string (`crypto.randomUUID()` if available at runtime, else fallback to a `${Date.now()}-${Math.random().toString(36).slice(2)}` shape — mock-only anyway).
      - Add `assets/dummychat/chatMehvish.json` with **exactly 18** seed messages between me and Mehvish. Mix of `sender - 'me'` and `sender - 'friend'` in a natural conversation. JSON shape - top-level object `{ "_meta": { "base_timestamp_ms": <number>, "description": "Base date for stable test timestamps." }, "messages": [ ... ] }`. The `_meta` block documents the base date IN the JSON (matches the `__mutability_notes` precedent in `assets/dummyprofile.json` — no `.md` sidecar). Storage / provider code reads `.messages`, not the root. Message timestamps span the last 3-4 days relative to `_meta.base_timestamp_ms`. Cover status states - at least one `'sent'`, one `'delivered'`, and multiple `'read'`. Include at least one message with `editedAt` set (proves the update path). Content is matrimonial-context small talk (introductions, work, weekend plans, meeting up) — keep it PG-rated. Note - when phase 17 wires the real backend, whichever timestamp format the backend uses will replace this `_meta` block. That's fine — the mock lives inside this fixture only.
      - Add `src/features/chat/storage/chatHistoryStorage.ts` (zero React imports; mirror shape of `bookmarksStorage.ts`). Exports - `CHAT_HISTORY_KEY_PREFIX = 'dummy.chat.'`, `chatHistoryKey(friendUserId: string): string` (returns prefix + friendUserId), `getHistory(friendUserId: string): Promise<ChatMessage[]>`, `saveHistory(friendUserId: string, messages: ChatMessage[]): Promise<void>`, `appendMessage(friendUserId: string, message: ChatMessage): Promise<void>` (dedupes on `message.id`), `updateMessage(friendUserId: string, messageId: string, patch: Partial<Omit<ChatMessage, 'id'>>): Promise<void>` (no-op if id not found; `console.warn` on miss), `deleteMessage(friendUserId: string, messageId: string): Promise<void>` (hard delete — removes from array; idempotent), `clearHistory(friendUserId: string): Promise<void>`. Fail-open JSON parse. Grep-tag `TODO(mock-only): remove when real messages endpoint ships`.
      - Storage helper is NOT responsible for seed hydration. Seed hydration lives in the provider (story 15.3) so tests can decouple the two.
      - Bundled-asset routing for BGDark - do NOT add an entry to `src/assets/dummyPhotoRegistry.ts`. That registry is for user-photo lookups keyed by profile paths. Import BGDark directly at the `ChatRoomScreen` call site via `require('../../../../assets/chat/bgDark.jpg')` (relative path validated against actual file layout). Document this choice in a short header comment above the require.
      - Tests - `chatHistoryStorage.test.ts` covers roundtrip (save then get), key uniqueness (write friend A, read friend B returns empty), append idempotent by id, update patches only provided fields and preserves others, update no-op on missing id, delete removes exactly one message, delete idempotent on missing id, clear wipes, fail-open on corrupt JSON. `chatHistoryFixtures.test.ts` verifies the seed JSON parses to a valid `ChatMessage[]`, spans the expected timestamp range, has at least one `editedAt`, has at least one of each status.
    notes: |
      Deleted messages are hard-removed for mock simplicity. If the real backend uses
      soft delete (`deleted: true` marker), phase 17 flips this behaviour when swapping
      the mock provider for the real hook. Not a phase-15 concern.
    tracking_issue: 128

  - id: 15.3
    title: ChatProvider + useChatHistory hook
    agent: frontenddeveloper
    done: true
    depends_on: [15.2]
    acceptance_criteria:
      - Add `src/state/chat/ChatProvider.tsx`. Exports named - `ChatProvider` component + `useChatHistory(friendUserId: string)` hook + module-scope `MEHVISH_USER_ID` constant (derived once from `assets/dummymehvish.json`).
      - `useChatHistory(friendUserId)` returns `{ messages: readonly ChatMessage[]; loading: boolean; sendMessage: (text: string) => Promise<void>; updateMessage: (id: string, patch: Partial<Omit<ChatMessage, 'id'>>) => Promise<void>; deleteMessage: (id: string) => Promise<void>; }`.
      - Hydration behaviour - on first `useChatHistory(friendUserId)` mount for a given friendUserId, read AsyncStorage via `getHistory(friendUserId)`. If the result is empty AND `friendUserId === MEHVISH_USER_ID`, seed from `assets/dummychat/chatMehvish.json` — read `seedJson.messages` (NOT the JSON root; the root is `{ _meta, messages }` per story 15.2) — call `saveHistory(friendUserId, seedJson.messages)`, then re-read into memory. If the result is empty AND friendUserId is not Mehvish, initialize to empty array (no seed). Subsequent hooks for the same friendUserId hit the in-memory mirror. The `_meta` block is not persisted to AsyncStorage — it lives in the fixture file only.
      - Per-friend in-memory cache lives at the provider level (not per hook instance). Multiple `useChatHistory('mehvish')` consumers see the same messages array (referential stability across renders).
      - `sendMessage(text)` creates a new `ChatMessage` with `sender: 'me'`, `status: 'sent'`, `timestamp: Date.now()`, a locally-generated id (see 15.2 spec). Trims input; empty-after-trim is a no-op + `console.warn`. Calls `appendMessage` on storage, then updates the in-memory mirror.
      - `updateMessage(id, patch)` and `deleteMessage(id)` delegate to storage helpers and update the in-memory mirror.
      - Mount `ChatProvider` in `App.tsx` between `BookmarksProvider` and `NavigationContainer`. Preserve the existing `TODO(mock-only)` comment convention. Provider tree becomes `... -> BookmarksProvider -> ChatProvider -> NavigationContainer`.
      - Hook tests cover - first mount for Mehvish seeds 18 messages; second mount for Mehvish reads from cache (no re-seed); first mount for a non-Mehvish friend returns empty; `sendMessage('hello')` appends a message with `sender: 'me'` and status `'sent'`; `sendMessage` on empty/whitespace-only input is a no-op and does not append; `updateMessage(id, { text: 'x', editedAt: 12345 })` patches only those fields; `deleteMessage(id)` removes exactly one message; multiple consumers of the same hook see the same array.
    notes: |
      `loading` is true only during the initial hydration read for that friend. Once the
      in-memory mirror is populated it stays false. This is a mock — no re-fetch semantics.
      Phase 17 replaces this hook wholesale.
    tracking_issue: 129

  - id: 15.4
    title: ChatStack + ChatListScreen (WhatsApp-style friends with last-message list)
    agent: frontenddeveloper
    done: true
    depends_on: [15.3]
    acceptance_criteria:
      - Add `src/navigation/ChatStack.tsx` using `createNativeStackNavigator`. Mirror `ExploreStack.tsx`/`MenuStack.tsx` pattern - `headerShown: false`, `ChatListScreen` as initial route + `ChatRoomScreen` as second route. `ChatRoomScreen` is a placeholder that renders `null` in this story; story 15.5 replaces it.
      - Add `ChatStackParamList` to `src/navigation/types.ts` - `ChatListScreen: undefined`, `ChatRoomScreen: { friendUserId: string }`. Extend `AppTabsParamList.Chat` from `undefined` to `NavigatorScreenParams<ChatStackParamList>` (mirror the `Explore` and `Menu` treatment).
      - Replace the Chat-tab `EmptyState` placeholder in `src/navigation/AppTabs.tsx` with `ChatStack` (mirror how `Explore` and `Menu` tabs are wired).
      - Add `src/features/chat/screens/ChatListScreen.tsx`. Header - title-only "Chat" via new label `chat.list.headerTitle`, safe-area padding, matches `ExploreHomeScreen` header shape. Body - `FlatList` of `friends` from `useFriendship()`, with `renderItem={({ item }) => <ChatListRow friend={item} onPress={...} />}`.
      - Add `src/features/chat/components/ChatListRow.tsx` as a standalone component (not inlined). This component holds the `useChatHistory(friend.user_id)` hook call at its TOP LEVEL — hooks must NEVER be called inside `FlatList.renderItem` (Rules-of-Hooks). Row structure - `Row` with `ProfileThumbnailCircle` size=48 on the left, Column (grows) with `Heading` variant `heading.sm` (`first_name last_name`, `numberOfLines={1}`) + `Text` variant `body.sm` colour `text.secondary` (last-message preview, `numberOfLines={1}`), timestamp `Text` variant `label.sm` colour `text.secondary` on the right. Wrapping component is a `TouchableArea` calling `onPress` — the parent (`ChatListScreen`) supplies `onPress={() => navigation.navigate('ChatRoomScreen', { friendUserId: friend.user_id })}` per row.
      - Inside `ChatListRow`, last-message preview is derived from `useChatHistory(friend.user_id).messages` - if messages array is non-empty, show `messages[messages.length - 1].text` as the preview (truncated by `numberOfLines`). If empty, show `t('chat.list.noMessagesYet')` in muted tone (variant `body.sm` colour `text.secondary`). If `loading`, show a lightweight placeholder skeleton (or fall back to the "no messages yet" text — pick one, document the choice).
      - Timestamp formatting - format the last-message timestamp as "HH:mm" if today, "Yesterday" if yesterday, and "MMM D" (e.g. "Aug 24") otherwise. Add a pure helper `src/features/chat/formatChatTimestamp.ts` with unit tests covering today/yesterday/older, plus edge cases at midnight boundaries. Do NOT use `date-fns` or `luxon` — write it inline against `new Date()` primitives to avoid dependency creep for a mock phase.
      - Empty state (no friends at all) - render `EmptyState` with `chat.list.emptyTitle` + `chat.list.emptyDescription`. Currently only Mehvish is a friend, so the empty state is unlikely to trigger in normal use but should still be covered by a test that mocks `useFriendship` returning an empty friends array.
      - Labels - `chat.list.headerTitle`, `chat.list.noMessagesYet`, `chat.list.emptyTitle`, `chat.list.emptyDescription`, `chat.list.rowAccessibility` (interpolated first/last name) added to EN + UR with full parity.
      - Tests - `ChatListRow.test.tsx` covers - renders friend name + seeded last-message preview + formatted timestamp; empty messages array renders `chat.list.noMessagesYet`; press calls the `onPress` prop; a11y `accessibilityRole="button"` + interpolated `accessibilityLabel` from `chat.list.rowAccessibility`. `ChatListScreen.test.tsx` covers - Mehvish row rendered with correct props (mock ChatListRow to assert prop pass-through); row press navigates to `ChatRoomScreen` with correct `friendUserId`; empty friends list renders EmptyState (mock `useFriendship` to return `friends: []`). Timestamp helper unit tests (today, yesterday, older, midnight boundary) live at `__tests__/features/chat/formatChatTimestamp.test.ts`.
    notes: |
      Chat list doesn't own tabBarHidden (unlike Marriage / Bookmarks). No collapsing
      behaviour required in phase 15 — the ChatRoomScreen owns its own header. Skip
      the shared value read entirely.
    tracking_issue: 130

  - id: 15.5
    title: ChatRoomScreen (WhatsApp-style thread + composer)
    agent: frontenddeveloper
    done: true
    depends_on: [15.4]
    acceptance_criteria:
      - Replace the `ChatRoomScreen` placeholder in `ChatStack` with the real screen at `src/features/chat/screens/ChatRoomScreen.tsx`.
      - Route wiring - read `friendUserId` from `useRoute<RouteProp<ChatStackParamList, 'ChatRoomScreen'>>()`. Resolve `profile` via `useFriendship().getFullProfile(friendUserId)`. If profile is null, render `EmptyState` with `chat.room.missingTitle` + `chat.room.missingDescription` (no header, no composer).
      - Layout - `KeyboardAvoidingView` wrapping the whole screen (`behavior: Platform.OS === 'ios' ? 'padding' : 'height'`). Inside - stacked `Header` (top, `theme.colors.bg.surface` background, `theme.shadows.sm`), `MessageThread` (grows), `Composer` (bottom, above safe-area).
      - Header - `Row` with safe-area top padding. Back button (lucide `ArrowLeft`, 40×40 `TouchableArea`, `onPress={() => navigation.goBack()}`, `accessibilityLabel` from `chat.room.backAccessibility`) + `ProfileThumbnailCircle` size=32 + Column with `Heading` variant `heading.sm` `first_name last_name` (`numberOfLines={1}`, truncated). Push-right - triple-dot icon button (lucide `MoreVertical`, 40×40 `TouchableArea`, `onPress` is a no-op logging `console.log('chat room menu — not implemented yet')`, `testID='chat-room-menu-btn'`, `accessibilityLabel` from `chat.room.menuAccessibility`). No camera icon. No video-call icon. No phone-call icon.
      - MessageThread - `ImageBackground` (from `react-native`, `resizeMode='repeat'`) with `source={require('../../../../assets/chat/bgDark.jpg')}` absolute-filling the message area. `FlatList` inverted (`inverted={true}`) rendering messages latest-at-bottom by RN convention. Row - `MessageBubble` component (feature-local at `src/features/chat/components/MessageBubble.tsx`).
      - MessageBubble props - `readonly message: ChatMessage`. Structure - `View` with `testID={message.sender === 'me' ? 'bubble-sent' : 'bubble-received'}` (semantic testID drives tests — see tests block below), `alignSelf: sender === 'me' ? 'flex-end' : 'flex-start'`, `maxWidth: '75%'`, `padding: theme.spacing.sm` vertical + `theme.spacing.md` horizontal, `marginVertical: theme.spacing.xs`, `marginHorizontal: theme.spacing.md`. Sent (`sender === 'me'`) - `backgroundColor: theme.colors.accent.primary`, text colour `text.inverse`. Received - `backgroundColor: theme.colors.bg.surface`, text colour `text.primary`. Border radius `theme.radii.lg`, with the corner nearest the screen-edge tail (bottom-right for me, bottom-left for friend) reduced to `theme.radii.sm` for the WhatsApp-like tail effect. Timestamp `HH:mm` in `Text` variant `label.sm` bottom-right inside the bubble; when `sender === 'me'` also render a status icon (`Check` for `'sent'`, `CheckCheck` for `'delivered'`, `CheckCheck` tinted `theme.colors.status.info` for `'read'`). If `editedAt` is set, render "· edited" after the timestamp.
      - Composer - Bottom-anchored `Row` with safe-area bottom padding. `TextInput` variant `body.md` inside a rounded-full pill (`borderRadius: 999`, `backgroundColor: theme.colors.bg.surface`, `paddingHorizontal: theme.spacing.md`), placeholder from `chat.room.composerPlaceholder`, `multiline={true}`, `maxLength=1000`, controlled by local `useState`. Trailing single circular button (56×56, `borderRadius: 28`, `backgroundColor: theme.colors.accent.primary`) — icon toggles based on `text.trim().length`. If length is 0, render lucide `Mic` (no-op onPress, `accessibilityLabel` from `chat.room.micAccessibility`). If length > 0, render lucide `Send` — onPress calls `sendMessage(text)` from `useChatHistory(friendUserId)`, then clears the local input state. No camera icon. No attachment icon.
      - Data - `const { messages, sendMessage } = useChatHistory(friendUserId)`. Rendered in inverted order (latest at bottom by RN convention).
      - Labels - `chat.room.composerPlaceholder`, `chat.room.sendAccessibility`, `chat.room.micAccessibility`, `chat.room.menuAccessibility`, `chat.room.backAccessibility`, `chat.room.missingTitle`, `chat.room.missingDescription`, `chat.room.editedSuffix` added to EN + UR with full parity.
      - Cross-tab navigation prep - since `RequestAcceptedModal.onSayHi` (story 15.7) will call `navigation.navigate('Chat', { screen: 'ChatRoomScreen', params: { friendUserId } })` from inside the Menu stack, verify the ChatStack type surface supports this nested navigation without a type error. Add an integration test at `__tests__/navigation/ChatStack.crossTab.test.tsx` that follows the phase-14 `MenuStack.test.tsx` / `ExploreStack.test.tsx` pattern - build a real `NavigationContainer` + real `createBottomTabNavigator` + real Chat + Menu stacks with lightweight stub screens; the Menu stub screen exposes a button whose `onPress` fires the exact nested navigate call; the test presses it and asserts the Chat stub screen renders with the expected `friendUserId` param. No `jest.fn()` spy — this is an end-to-end verification through the actual navigator.
      - Tests - renders friend name in header with `numberOfLines={1}`; renders Mehvish's 18 seed messages in the thread; sent messages queryable by `testID='bubble-sent'` and received messages queryable by `testID='bubble-received'` (semantic testID asserts sender-branch; do NOT assert literal style values — RNTL flattens styles unpredictably); empty input shows Mic icon (no Send icon rendered); typing a character shows Send icon (no Mic icon); tapping Send with non-empty input calls `sendMessage` with the trimmed text and clears the input; tapping the triple-dot button hits the no-op and does not crash (testID `chat-room-menu-btn` present); missing friend (getFullProfile returns null) renders EmptyState with no composer or header; back button calls `navigation.goBack()`; `editedAt` suffix renders "edited" tag; message status icons render for sent / delivered / read states.
    notes: |
      No message read-receipt bookkeeping in phase 15. Seed statuses are static; user-sent
      messages start at 'sent' and stay there. Phase 17 wires real delivery / read
      receipts via subscription.

      Composer height auto-grows with content up to about 4 lines then scrolls internally.
      Do not add a fixed line-count cap unless React Native TextInput default behaviour
      is not acceptable — treat that as a follow-up polish concern, not a phase-15 blocker.
    tracking_issue: 131

  - id: 15.6
    title: IncomingRequestModal + MyProfileScreen Edit-tab dev trigger
    agent: frontenddeveloper
    done: true
    depends_on: [15.1]
    acceptance_criteria:
      - Add `src/features/friendRequests/components/IncomingRequestModal.tsx`. **Fully presentation-only** — no `useFriendship()` calls inside the modal. Props - `readonly visible: boolean`, `readonly profile: DummyFullProfile | null`, `readonly onClose: () => void`, `readonly onAccept: (userId: string) => void`, `readonly onDecline: (userId: string) => void`. The modal fires the callbacks; the HOST calls `acceptRequest` / `declineRequest` on `FriendshipProvider` AND owns the snackbar. This matches the shape of `RequestAcceptedModal.onSayHi` in story 15.7. The `pendingToast` cross-screen handoff is NOT used for this surface — the toast fires locally on the host (`MyProfileScreen`) because the user stays on that screen after tapping Accept / Decline.
      - Layout - RN `Modal` with `visible`, `transparent={true}`, `animationType='fade'`, `onRequestClose={onClose}`. Dimmed backdrop (`rgba(0,0,0,0.55)`) that dismisses the modal on tap. Centered `Column` card - `backgroundColor: theme.colors.bg.surface`, `borderRadius: theme.radii.lg`, `padding: theme.spacing.lg`, `width: '86%'`, `maxWidth: 360`, `theme.shadows.md`.
      - Card content (in order) - avatar circle (about 96px) via `resolveDummyPhoto(profile.photos[0] ?? profile.photo_url)`; `Heading` variant `heading.md` centered `${profile.first_name} ${profile.last_name}`; subtitle `Text` variant `label.sm` colour `text.secondary` centered - `${age} · ${city}` with the same null guards used in `BookmarkCard`; optional AboutMe teaser (`Text` variant `body.sm`, `numberOfLines={2}`, only rendered if `profile.about_me` is non-empty); `Row` with Accept (variant `primary`) + Decline (variant `ghost`) side by side, equal flex; and a View-full-profile `TouchableArea` at the bottom rendering `Text` variant `label.sm` colour `accent.primary` — onPress calls `onClose()` then `navigation.navigate('Explore', { screen: 'OtherProfileScreen', params: { userId: profile.user_id, source: 'request' } })`.
      - Modal handlers - Accept calls `onAccept(profile.user_id)` + `onClose()`. Decline calls `onDecline(profile.user_id)` + `onClose()`. Backdrop tap calls `onClose()` (no request action fired). The modal does NOT invoke `acceptRequest` / `declineRequest` or render a snackbar — those responsibilities belong to the host.
      - Host wiring on `MyProfileScreen` - the screen mounts a local `Snackbar` (feature-local `useState<string | null>` visible / message) and passes `onAccept={(userId) => { acceptRequest(userId); setSnackbar(t('friendRequests.incoming.acceptedToast', { firstName: profile.first_name })); }}` and `onDecline={(userId) => { declineRequest(userId); setSnackbar(t('friendRequests.incoming.declinedToast')); }}` into the modal. `acceptRequest` / `declineRequest` come from `useFriendship()` on the host. The snackbar auto-dismisses after ~3s per existing Snackbar behaviour. `pendingToast` is NOT touched by this surface.
      - Replace the "Coming soon" `EmptyState` on `MyProfileScreen` Edit tab with `DevTriggersPanel` at `src/features/profile/components/DevTriggersPanel.tsx`. **Panel is slot-based**: props are `{ readonly title?: string; readonly description?: string; readonly children: React.ReactNode }`. Panel renders a section heading `Text` variant `label.sm` (defaults to "Dev triggers — remove before ship") + a brief description + `{children}` inside a Column with appropriate spacing. All trigger buttons are composed AS CHILDREN by `MyProfileScreen`, not by the panel itself. Grep-tag the component file with `TODO(mock-only): remove when subscription-driven modal triggers ship in phase 17`. Story 15.7 appends its trigger button as a second child sibling — zero edits to `DevTriggersPanel.tsx` required from 15.7.
      - MyProfileScreen composes the first child as a `Button` with label from `menu.myProfile.editTab.devTriggers.incomingButtonLabel`. Its onPress - resolves Qurat's `DummyFullProfile` via `getFullProfile(QURAT_USER_ID)` where `const QURAT_USER_ID = require('../../../../assets/dummyqurat.json').user_id` is defined at the top of `MyProfileScreen.tsx` (one source of truth per fixture). Sets local `useState` to open the modal. `IncomingRequestModal` mounts on the `MyProfileScreen` at the screen level (not inside the panel) so it renders above the whole screen.
      - Labels - `friendRequests.incoming.title`, `friendRequests.incoming.subtitle`, `friendRequests.incoming.acceptLabel`, `friendRequests.incoming.declineLabel`, `friendRequests.incoming.viewFullProfileLabel`, `friendRequests.incoming.acceptedToast` (interpolated first-name), `friendRequests.incoming.declinedToast`, plus `menu.myProfile.editTab.devTriggers.sectionHeading`, `menu.myProfile.editTab.devTriggers.sectionDescription`, `menu.myProfile.editTab.devTriggers.incomingButtonLabel` — all added to EN + UR with full parity.
      - Tests - `IncomingRequestModal.test.tsx` covers - renders profile fields correctly; tapping Accept calls `onAccept(profile.user_id)` + `onClose`; tapping Decline calls `onDecline(profile.user_id)` + `onClose`; tapping View-full-profile calls navigation + `onClose`; backdrop press calls `onClose` only (no `onAccept` / `onDecline` firing); renders nothing when `profile` is null; `visible={false}` renders nothing. `DevTriggersPanel.test.tsx` covers - renders section heading + description + arbitrary children (pass a fixture child and assert it's rendered); title prop overrides default heading. `MyProfileScreen.editTab.test.tsx` (or extended existing MyProfileScreen suite) - the Incoming trigger button is rendered inside the panel; initial state is closed; tapping the trigger opens the modal; Accept path invokes `acceptRequest` on the mocked `FriendshipProvider` AND renders the interpolated `friendRequests.incoming.acceptedToast` snackbar with Qurat's first name; Decline path invokes `declineRequest` AND renders `friendRequests.incoming.declinedToast`.
    notes: |
      This is the surface phase 17 will wire to the real `onFriendRequestReceived`
      subscription event. The modal component stays untouched at teardown — only its
      trigger source changes (from dev button to subscription callback).

      Cross-tab navigation from MyProfileScreen (in Menu stack) to OtherProfileScreen
      (in Explore stack) - use `navigation.navigate('Explore', { screen: 'OtherProfileScreen', ... })`.
      Confirm this works with `NavigationContainer` linking + native-stack. If a type
      error surfaces on the nested navigate, verify the nested-params type via
      `NavigatorScreenParams<ExploreStackParamList>` (already applied to
      `AppTabsParamList.Explore` in phase 13.5, so this should type-check).
    tracking_issue: 132

  - id: 15.7
    title: RequestAcceptedModal + MyProfileScreen Edit-tab dev trigger
    agent: frontenddeveloper
    done: false
    depends_on: [15.5, 15.6]
    acceptance_criteria:
      - Add `src/features/friendRequests/components/RequestAcceptedModal.tsx`. Presentation-only. Props identical to IncomingRequestModal - `readonly visible: boolean`, `readonly profile: DummyFullProfile | null`, `readonly onClose: () => void` — plus `readonly onSayHi: () => void` for the parent to handle the navigation (rather than the modal owning cross-tab knowledge).
      - Modal shell - same `Modal` + backdrop + centered card treatment as `IncomingRequestModal`. If the two modals share enough shell code to make it worth extracting, add a `RequestModalCard` shared component at `src/features/friendRequests/components/RequestModalCard.tsx` and refactor `IncomingRequestModal` to use it in the same PR. If the shell diverges enough to make sharing awkward, keep them independent — developer's judgement.
      - Card content - avatar circle (about 96px); `Heading` variant `heading.md` centered - `t('friendRequests.accepted.title', { firstName: profile.first_name })` becoming "You and {firstName} are now connected!"; subtitle `Text` variant `body.sm` colour `text.secondary` centered - `t('friendRequests.accepted.subtitle')` becoming "You can start a chat now."; `Row` with Say-hi (variant `primary`) + Not-now (variant `ghost`) side by side, equal flex.
      - Handlers - Say hi calls `onSayHi()` (parent decides destination) then `onClose()`. Not now calls `onClose()` only. Backdrop tap calls `onClose()`.
      - Append the second trigger button as a **sibling child** of `DevTriggersPanel` in `MyProfileScreen`'s JSX (no edits to `DevTriggersPanel.tsx` — the panel is slot-based per 15.6). Button label from `menu.myProfile.editTab.devTriggers.acceptedButtonLabel`. Button onPress - resolves Mehvish's full profile via `getFullProfile(MEHVISH_USER_ID)` (imported from `ChatProvider` — the constant is already exported per story 15.3), opens the RequestAcceptedModal via local `useState`. The IncomingRequestModal trigger from 15.6 keeps working unchanged.
      - Host-owned `onSayHi` handler on `MyProfileScreen` - calls `navigation.navigate('Chat', { screen: 'ChatRoomScreen', params: { friendUserId: MEHVISH_USER_ID } })`. This is the exact cross-tab navigation pattern validated by the integration test in story 15.5 (`__tests__/navigation/ChatStack.crossTab.test.tsx`).
      - Labels - `friendRequests.accepted.title` (interpolated firstName), `friendRequests.accepted.subtitle`, `friendRequests.accepted.sayHiLabel`, `friendRequests.accepted.notNowLabel`, plus `menu.myProfile.editTab.devTriggers.acceptedButtonLabel` — added to EN + UR with full parity.
      - Tests - `RequestAcceptedModal.test.tsx` covers - renders interpolated title with Mehvish's first name; tapping Say hi calls `onSayHi` + `onClose`; tapping Not now calls `onClose` only; backdrop press calls `onClose`; renders nothing when profile is null. If a shared `RequestModalCard` was extracted, it has its own smoke test covering the shared shell rendering. `MyProfileScreen.editTab.test.tsx` (extend the existing suite from 15.6) - both trigger buttons are rendered as children of `DevTriggersPanel`; opening one modal does not open the other (independent state); tapping the RequestAcceptedModal Say-hi button triggers the nested navigation with the correct params (integration-style via a real `NavigationContainer` + stubbed Chat stack, matching the pattern from `ChatStack.crossTab.test.tsx` in 15.5).
    notes: |
      Nadia was the originally-proposed dev-trigger fixture for this modal but she is
      only a `DummyDeckProfile` (no full profile registered in `FriendshipProvider`).
      Using Mehvish gives us a full profile plus a real chat history to land into,
      making Say hi navigate to a populated ChatRoomScreen — the happy path we want
      to observe. This is a mock-fidelity trade-off, documented explicitly.

      In production, "someone accepted my request" would fire against a person who was
      NOT already a friend at the moment the modal opens — but the modal only reads
      display fields (name, avatar, city), so the semantic mismatch during dev testing
      is cosmetic.
    tracking_issue: 133

# Deferred to phase 17 (called out here to prevent re-scoping drift):
#
# The original phase-15 scope (backend endpoints + MSW + React Query
# cross-cache invalidation) is deferred to phase 17 where AppSync + real
# subscriptions land. Phase 17 stories 17.3 and 17.4 are being edited in the
# same commit as this rewrite to reflect the shifted UI ownership:
#
#   - 17.3 (RoomsListScreen) becomes "wire real Rooms query + last-message
#     subscription to the existing ChatListScreen shipped in phase 15."
#   - 17.4 (RoomScreen) becomes "wire real messages query + onMessageAdded
#     subscription to the existing ChatRoomScreen shipped in phase 15;
#     replace useChatHistory mock with useMessagesQuery + optimistic send."
#   - 17.5 (deep-link) unchanged; target is ChatRoomScreen.
#
# Phase 16 (Friends endpoint) is untouched by this rewrite — it wires a real
# GET /friends query to feed FriendshipProvider.friends, but the UI surface
# is already handled by the Explore Friends subtab shipped in phase 13.
