phase: 16
title: Friend requests, friends, chat backend, blocks (real backend wiring)
last_updated: 2026-11-16 (story 16.FR3 complete — modal shape rewire + FriendshipProvider teardown + useProfileQuery)

context_summary: |
  Phase 16 is a **thin** post-onboarding phase per §11.2.8, merged on 2026-11-15
  from three originally-separate phases:

    - Original phase 16: Friends (GET /friends + FriendsListScreen).
    - Original phase 17: Chat - AppSync backend wiring (rooms + realtime messages).
    - Original phase 18: Blocks (GET/POST/DELETE /blocks + cross-cache purge + BlockedUsersScreen).

  They were merged because they share a single theme: wiring the real backend under
  the mock surfaces that phase 15 shipped for friend-requests + chat, and adding the
  related cross-cutting screens (friends list, blocked-users list, block entry
  points). After this phase the user can send, receive, accept, decline, cancel
  friend requests, chat in real time with full subscription coverage, and block /
  unblock other users — all backed by the real backend, no mocks.

  **Real-backend-only (post-brainstorm decision, 2026-11-15).** All new code added
  this phase targets the real backend directly. Stories do NOT extend the legacy
  mock dispatch at `src/services/api/mocks/mockRequest.ts`. Unit/integration tests
  may stub the service boundary (e.g. jest-mock the Amplify GraphQL client or the
  `request<T>` function), but no new JSON fixture handlers are to be authored under
  `src/services/api/mocks/`. The existing mock surfaces (`FriendshipProvider`,
  `ChatProvider`, `chatHistoryStorage.ts`, `requestsStorage.ts`, chat seed JSON)
  are deleted within this phase per the teardown stories below.

  **AppSync availability confirmed (Round 2, 2026-11-15).** The dev AppSync API
  is live at apiId `soj2c4gjjffa7aw5rcmzjstmgq` / URI subdomain
  `26ve3dcqxbh2zgd2hf2ylbn76q`, auth mode `AMAZON_COGNITO_USER_POOLS`.
  `src/config/backendConfig.dev.json` already carries the correct `graphqlUrl`
  and `realtimeUrl` values (populated on a prior run). `backendConfig.prod.json`
  still has `<FILL_APPSYNC_API_ID>` placeholders — that's a future prod rollout
  concern, out of phase-16 scope.

  **Real-schema anchors (from `aws appsync get-introspection-schema`, 2026-11-15).**
  The chat schema diverges from `architecture.md` in several places that the PRD
  stories below reference. Authoritative shapes to use:

  - Queries: `listMyRooms: [ChatRoom!]!` (NOT paginated), `messagesByChatRoom(roomId, createdAtGt, limit, nextToken): MessageConnection!` (paginated).
  - Mutations: `createOrGetRoom(otherUserId: ID!): ChatRoom!`, `sendMessage(content: String!, contentType: String, roomId: ID!): Message!` (contentType is `'text'|'gif'`; phase 16 only sends `'text'`), `markAsRead(lastMessageId: ID!, roomId: ID!): MessageRead!`, `setTyping(isTyping: Boolean!, roomId: ID!): TypingEvent!`.
  - Subscriptions: `onMessageInRoom(roomId): Message`, `onReadReceipt(roomId): MessageRead`, `onTypingInRoom(roomId): TypingEvent`, `onFriendRequestUpdated: Notification` (identity-scoped, no args), `onNotificationForMe: Notification` (identity-scoped, generic), `onRoomDeactivated(roomId): ChatRoom`, `onRoomReactivated(roomId): ChatRoom`.
  - `ChatRoom` has `userA` + `userB` (lexicographically ordered IDs) — NOT `participants: [User]`. Also carries `lastMessagePreview`, `lastMessageAt`, `lastMessageSenderId`, `lastMessageId` as top-level fields; no nested `latestMessage` object.
  - `Message` has NO explicit `status` field. Client synthesizes `'sending'|'sent'|'delivered'|'read'` from: optimistic-local (sending) → `Message` exists in cache (sent) → `Message.deliveredAt != null` (delivered) → counterpart `MessageRead.lastReadMessageId >= this.messageId` (read).
  - `Notification` has a `type` field: `'friend_request' | 'friend_request_accepted' | 'profile_view' | 'room_deactivated' | 'bookmark_received'`. Carries a stringified-JSON `payload: AWSJSON` that stories 16.8 will parse for `request_id` / `from_user_id` etc.

  **What phase 15 already shipped (do NOT rebuild here):**

  - `ChatStack` in `src/navigation/ChatStack.tsx` (`ChatListScreen` + `ChatRoomScreen`).
  - `ChatListScreen` at `src/features/chat/screens/ChatListScreen.tsx` — WhatsApp-style
    friends × last-message + timestamp list.
  - `ChatRoomScreen` at `src/features/chat/screens/ChatRoomScreen.tsx` — WhatsApp-style
    thread with tiled `bgDark.jpg`, mic↔send composer toggle, header back + avatar +
    name + triple-dot no-op.
  - `MessageBubble` component + `formatChatTimestamp` helper.
  - `ChatProvider` + `useChatHistory(friendUserId)` hook — mock-only, backed by
    `src/features/chat/storage/chatHistoryStorage.ts` + `assets/dummychat/chatMehvish.json`
    seed. **Deleted in this phase** per the teardown steps on story 16.5.
  - `FriendshipProvider` + `useFriendship()` hook — mock-only, backed by
    `src/features/friendRequests/storage/requestsStorage.ts` (`dummy.requests.outgoing`
    key) and an in-memory `friends` / `requests` / `acceptRequest` /
    `declineRequest` / `sendRequest` / `outgoingRequestIds` / `hasOutgoingRequest`
    surface. **Deleted in this phase** per the teardown steps on story 16.FR3.
  - `IncomingRequestModal` + `RequestAcceptedModal`, dev-triggered from
    `MyProfileScreen` Edit tab via `DevTriggersPanel`. Modal callback signatures
    are **rewritten** in story 16.FR3 (see below); `DevTriggersPanel` is deleted
    in story 16.8.
  - `BookmarksProvider` + star-button bookmark toggle on `MarriageLandingScreen` +
    bookmarks subtab in `ExploreHomeScreen` + `BookmarkDeckViewScreen`.

  **What phase 16 does (across all sub-areas):**

  1. **Friends.** Wire `GET /friends`, feed `FriendsListScreen` (new stub in this
     phase) + the Explore Friends subtab (already wired in phase 13 against the
     mock provider; hosts rewired to real query in story 16.FR3). (Stories 16.1,
     16.2.)

  2. **Friend requests.** Wire `GET /friend-requests` (incoming + outgoing),
     `POST /friend-requests`, `POST /friend-requests/{id}/accept`,
     `POST /friend-requests/{id}/decline`, `DELETE /friend-requests/{id}` with
     typed hooks. Rewrite `IncomingRequestModal` and `RequestAcceptedModal`
     callback signatures to carry the full backend-required data. Tear out
     `FriendshipProvider`, `requestsStorage.ts`, the `dummy.requests.outgoing`
     AsyncStorage key, and the `pendingToast` cross-screen handoff. (Stories
     16.FR1, 16.FR2, 16.FR3.)

  3. **Chat backend.** Wire the Amplify GraphQL / AppSync client with the JWT from
     `authStore`; refactor the Amplify singleton so `cognitoClient` and
     `appsyncClient` contribute to a single shared config call. Add
     `useRoomsQuery / useMessagesQuery / useCreateOrGetRoomMutation /
     useSendMessageMutation / useOnMessageInRoomSubscription` per §8.3 and the
     Real-schema anchors above.
     Replace `useChatHistory` in `ChatProvider` with the real hooks via a shape
     adapter; delete the mock storage helper + seed JSON per the phase-15
     teardown checklist. Switch `ChatStackParamList.ChatRoomScreen` route param
     from `{ friendUserId }` to `{ roomId }`; update `openChatRoom.ts` to resolve
     `userId → roomId` via `useCreateOrGetRoomMutation` before navigation.
     Wire the subscription-driven `IncomingRequestModal` + `RequestAcceptedModal`
     triggers via a new named component `FriendRequestSubscriptionListener`
     (mounted inside `AppTabs` just above `Tab.Navigator`) and delete
     `DevTriggersPanel` + its labels alongside. Add `useOnReadReceiptSubscription`
     and `useOnTypingInRoomSubscription` to cover the full chat subscription
     surface defined in architecture §7.5. The `ChatListScreen`, `ChatRoomScreen`,
     `MessageBubble`, modal components, and `formatChatTimestamp` helper all stay
     visually untouched except for a typing-indicator row and a 'read' status
     tick. (Stories 16.3, 16.4, 16.5, 16.6, 16.8, 16.CH1, 16.CH2.)

  4. **Blocks.** Wire GET /blocks, POST /blocks, DELETE /blocks/{userId} with hooks
     `useBlockedUsersQuery / useBlockUserMutation / useUnblockUserMutation`.
     `useBlockUserMutation.onSuccess` invalidates or surgically purges `['deck']`,
     `['search']`, `['bookmarks']`, `['friends']`, `['friend-requests','incoming']`,
     `['friend-requests','outgoing']`, `['rooms']`, and any `['messages', roomId]`
     cache where the blocked user is the counterpart. `useUnblockUserMutation.onSuccess`
     invalidates `['blocked-users']` only (no cross-cache work — unblock does not
     re-populate discovery). Stub `BlockedUsersScreen` + block-action entry points on
     `OtherProfileScreen` and `ChatRoomScreen` via a single-item action sheet.
     (Stories 16.9, 16.10.)

  **Scope deferred to phase 17 (post-brainstorm decision, 2026-11-15):**
  Deep-link registration was originally story 16.7 (`knotify://chat/room/:roomId`).
  The brainstorm surfaced that `src/navigation/linking.ts` has empty prefixes and
  no route table — bootstrapping deep-links means wiring prefixes, the full nested
  route map, AND resolving the pre-existing `knotify://profile/:userId` share
  links. Rather than inflate phase 16, this entire concern is moved to phase 17,
  which already owns `knotify://settings/notifications` and `knotify://settings/account`.
  Phase 17's story 17.5 is expanded to bootstrap the whole linking config in one
  shot (prefixes + chat + profile + settings routes).

  **Chat subscription scope (explicit, per Round-2 schema check):**
  - IN SCOPE: `onMessageInRoom(roomId)` (16.6), `onReadReceipt(roomId)` (16.CH1),
    `onTypingInRoom(roomId)` + outbound `setTyping(isTyping, roomId)` (16.CH2),
    `onFriendRequestUpdated` with branch on `Notification.type` (16.8).
  - OUT OF SCOPE (deferred to a later phase): `onRoomDeactivated`,
    `onRoomReactivated`, `onNotificationForMe`.
  - 'delivered' status DOES exist: comes from `Message.deliveredAt` populated in
    the server echo on the sendMessage response (and on `onMessageInRoom` events
    for incoming messages). Client renders the two-tick 'delivered' state when
    `deliveredAt` is non-null. 'read' overlays via the `MessageRead` reconciliation
    in 16.CH1.

  **Design cross-check for the chat-shape adapter:**

  `ChatRoomScreen` and `ChatListScreen` were built against a mock data shape
  (`ChatMessage` with `sender: 'me' | 'friend'`, local ids, `status`). Phase 16 must
  reconcile that shape with the real GraphQL `Message` type. The adapter lives in
  `src/features/chat/shapeAdapters.ts`, maps server → client shape, and preserves
  the existing screen contracts. The adapter needs the current user's `user_id`
  (from the decoded ID token in `authStore`) to compute `sender: 'me' | 'friend'`
  from the server's `senderUserId`. Adapter is pure and unit-tested.

  Visual layout for `FriendsListScreen` and `BlockedUsersScreen` is deferred to the
  /implement-phase brainstorm. Overflow-menu UX on `OtherProfileScreen` /
  `ChatRoomScreen` for the block action is scoped to a single-item action sheet
  for this phase; richer menus defer.

  **FriendRequestSubscriptionListener component (named here per brainstorm):**
  A new React component `src/features/friendRequests/FriendRequestSubscriptionListener.tsx`
  mounts inside `AppTabs` directly above `<Tab.Navigator>`. Returns `null`.
  Subscribes to ONE AppSync subscription: `onFriendRequestUpdated: Notification`
  (identity-scoped by the server — no args). Branches on the returned
  `Notification.type`:
    - `'friend_request'` → parse `payload` JSON for `request_id` + `from_user_id`,
      resolve sender profile via `useProfileQuery(from_user_id)`, open
      `IncomingRequestModal` with `(profile, requestId)`.
    - `'friend_request_accepted'` → parse `payload` JSON for `from_user_id` (the
      acceptor), resolve their profile, open `RequestAcceptedModal` with
      `(profile)`.
    - Other `type` values → no modal (may still trigger cache invalidation).
  Only activates when `useAuth().status === 'authenticated'`. Holds modal
  visibility + the currently-displayed profile in local `useState` (one state per
  modal). Mounts both modals as sibling children so they render above the tab
  shell regardless of focused tab. Multiple rapid events replace the currently-
  displayed profile (latest wins; prior modal dismisses). On `AppState === 'active'`
  after a background transition longer than the ~10 minute AppSync idle window,
  the listener re-subscribes AND invalidates `['friend-requests','incoming']` so
  requests that arrived during the background window are picked up by cache
  refetch rather than replayed as modal events. If the user is unauthenticated,
  the listener renders `null` with no subscription.

  **Phase-level teardown AC (added per brainstorm BLOCKING 9):**
  After every story in this phase has `done: true`, the following grep must
  return zero hits:
  `grep -r 'TODO(mock-only)' src/state/friendship src/state/chat src/features/chat src/features/friendRequests`
  Hits anywhere else in `src/` (e.g. registration-mock hits in
  `OnboardingCompletionProvider`, `httpClient.ts`'s `env.isMock` dispatch,
  `cognitoClient.ts`'s `isMockAuth` branches) are explicitly out of scope for
  phase 16 — those belong to the registration-mock teardown tracked in
  `context.md` "Before shipping."

stories:
  - id: 16.1
    title: Friends endpoint + hook
    agent: frontenddeveloper
    done: true
    tracking_issue: 145
    depends_on: []
    acceptance_criteria:
      - `src/features/friends/api.ts` exposes `useFriendsQuery()` returning a typed friend list.
      - `src/services/api/endpoints.ts` gains a `friendsApi.list()` helper that calls `GET /friends` via `request<T>` per §8.2.
      - Query key follows the tuple convention from §7.3 (`['friends']`).
      - Hook tests cover happy-path, empty, and error mapping. Tests stub the service boundary (jest-mock the `request<T>` function or the endpoint helper) — no fixtures authored under `src/services/api/mocks/`.
    notes: "Ex-16.1 (original phase 16, Friends). Real-backend-only; no mockRequest.ts handler added."

  - id: 16.2
    title: FriendsListScreen thin wire
    agent: frontenddeveloper
    done: false
    tracking_issue: 149
    depends_on: [16.1]
    acceptance_criteria:
      - `FriendsListScreen` renders the friend list via `FlatList` of `ListRow`; tapping a row navigates to `OtherProfileScreen` with `userId` typed through the ParamList.
      - Loading / ready / error / empty states use catalog `LoadingState`, `EmptyState`, `ErrorState` explicitly.
      - Screen wiring test covers each state and the row-tap navigation.
    notes: "Ex-16.2 (original phase 16, Friends). Visual layout deferred."

  - id: 16.FR1
    title: Friend-request REST endpoints + queries (real backend)
    agent: frontenddeveloper
    done: true
    tracking_issue: 146
    depends_on: []
    acceptance_criteria:
      - `src/services/api/endpoints.ts` gains a `friendRequestsApi` object with `listIncoming()`, `listOutgoing()` methods calling `GET /friend-requests?direction=incoming` and `GET /friend-requests?direction=outgoing` per architecture §11.2.8.
      - `src/features/friendRequests/api.ts` exposes `useIncomingRequestsQuery()` and `useOutgoingRequestsQuery()` keyed on `['friend-requests', 'incoming']` and `['friend-requests', 'outgoing']` per §7.3.
      - Query hooks return typed `FriendRequest` rows with `request_id`, `from_user_id`, `to_user_id`, `status`, `created_at` (shape per `db-schema.json` → `friend_requests` table).
      - Hook tests cover happy-path (populated list), empty list, and 500 error mapping. Tests stub `request<T>` at the service boundary; no mock fixtures added.
    notes: "NEW — added by phase-16 brainstorm 2026-11-15 per BLOCKING 1. Owns the GET side of friend-request wiring; mutations in 16.FR2."

  - id: 16.FR2
    title: Friend-request mutation hooks + cross-cache invalidation
    agent: frontenddeveloper
    done: true
    tracking_issue: 147
    depends_on: [16.FR1]
    acceptance_criteria:
      - `src/features/friendRequests/api.ts` gains `useSendFriendRequestMutation`, `useAcceptFriendRequestMutation`, `useDeclineFriendRequestMutation`, `useCancelOutgoingRequestMutation` wired to `POST /friend-requests`, `POST /friend-requests/{id}/accept`, `POST /friend-requests/{id}/decline`, `DELETE /friend-requests/{id}` respectively.
      - `useAcceptFriendRequestMutation.onSuccess` invalidates `['friend-requests', 'incoming']` AND `['friends']` (incoming count drops, friends row appears) per §11.2.8.
      - `useDeclineFriendRequestMutation.onSuccess` invalidates `['friend-requests', 'incoming']` only.
      - `useSendFriendRequestMutation.onSuccess` invalidates `['friend-requests', 'outgoing']`.
      - `useCancelOutgoingRequestMutation.onSuccess` invalidates `['friend-requests', 'outgoing']`.
      - `useSendFriendRequestMutation` on 409 Conflict surfaces a `'request already sent'` state (per §11.2.8), NOT an error banner. The callsite reads the mutation error, detects the 409 via `ApiError.code`, and renders the appropriate affordance (e.g. dim the Send button).
      - Accept/decline mutations use `onMutate` to optimistically remove the request from `['friend-requests', 'incoming']` so the modal dismisses instantly; `onError` rolls back.
      - Hook tests cover each mutation's success + cache-invalidation path, the 409 dedupe path on send, and the optimistic + rollback path on accept/decline.
    notes: "NEW — added by phase-16 brainstorm 2026-11-15 per BLOCKING 1."

  - id: 16.FR3
    title: Modal shape rewire + FriendshipProvider teardown
    agent: frontenddeveloper
    done: true
    tracking_issue: 148
    depends_on: [16.FR2, 16.1]
    acceptance_criteria:
      - `IncomingRequestModal.onAccept` and `.onDecline` signatures change to `(userId: string, requestId: string) => void`. The modal already has the full request row in its `profile` prop context; the host receives both values and calls `useAcceptFriendRequestMutation.mutate({ requestId })` / `useDeclineFriendRequestMutation.mutate({ requestId })`.
      - `RequestAcceptedModal.onSayHi` signature changes to `(acceptorUserId: string) => void`. The host uses `acceptorUserId` to navigate to the correct `ChatRoomScreen` (via `openChatRoom(acceptorUserId)` — resolves `roomId` internally per story 16.5).
      - `src/services/api/endpoints.ts` gains `profileApi.getProfileById(userId: string): Promise<UserProfile>` calling `GET /profiles/:userId` per architecture §8.3. `src/features/profile/api.ts` exposes `useProfileQuery(userId)` keyed `['profile', userId]` per §7.3. This replaces `FriendshipProvider.getFullProfile(userId)` as the single source of truth for `user_id → UserProfile` resolution and is consumed by `OtherProfileScreen`, `ChatListScreen`, `ChatRoomScreen` header, `IncomingRequestModal` listener host, and `RequestAcceptedModal` listener host.
      - `src/state/friendship/FriendshipProvider.tsx` and `useFriendship()` are DELETED. All callsites (`FriendsListScreen`, `ChatListScreen`, `ExploreHomeScreen` Requests subtab, `OtherProfileScreen`, both modals' hosts) rewired to direct query hooks (`useFriendsQuery`, `useIncomingRequestsQuery`, `useOutgoingRequestsQuery`, `useSendFriendRequestMutation`, `useAcceptFriendRequestMutation`, `useDeclineFriendRequestMutation`, `useProfileQuery`).
      - `src/features/friendRequests/storage/requestsStorage.ts` and the `dummy.requests.outgoing` AsyncStorage key are DELETED. `MarriageLandingScreen.handleRequestConfirmed` and `BookmarkDeckViewScreen.handleConfirmed` call `useSendFriendRequestMutation.mutateAsync` instead of the old `sendRequest` provider action.
      - `pendingToast` / `setPendingToast` / `consumePendingToast` cross-screen handoff is removed. `OtherProfileScreen` on Decline shows its own snackbar locally; ExploreHomeScreen's focus-effect consumer is deleted.
      - `src/features/profile/screens/MyProfileScreen.tsx` removes the modal-host logic for `IncomingRequestModal` and `RequestAcceptedModal` (moved to `FriendRequestSubscriptionListener` in story 16.8). The Edit tab reverts to a real "Coming soon" `EmptyState`.
      - `App.tsx` removes the `<FriendshipProvider>` mount.
      - Grep gate — `grep -r 'TODO(mock-only)' src/state/friendship src/features/friendRequests` returns zero hits.
      - Test coverage — modal callback signature tests updated to pass both args; MarriageLandingScreen + BookmarkDeckViewScreen send-request path tests re-wired to mock the new mutation hook; all deleted-file callsite tests removed; new ExploreHomeScreen / FriendsListScreen tests prove direct-query wiring; `useProfileQuery` hook tests cover happy/empty/404/500 paths.
    notes: |
      NEW — added by phase-16 Round-1 brainstorm per BLOCKING 1 and BLOCKING 7.
      Round-2 ADVISORY 22: this story's teardown touches ~16 source files + ~17
      test files (every importer of `useFriendship` / `FriendshipProvider` /
      `MEHVISH_USER_ID`). Budget for a broad touch-list, not a 2-file rewire.
      Round-2 BLOCKING 17: `profileApi.getProfileById` + `useProfileQuery` bullet
      added here because this story owns the `getFullProfile` teardown — the
      replacement must ship in the same story.

  - id: 16.3
    title: AppSync client + Amplify GraphQL wiring + shared Amplify config refactor
    agent: frontenddeveloper
    done: true
    tracking_issue: 150
    depends_on: []
    acceptance_criteria:
      - New `src/services/amplify/amplifyConfig.ts` module owns the single `Amplify.configure({ Auth: { Cognito: {...} }, API: { GraphQL: {...} } })` call. Both `src/services/auth/cognitoClient.ts` and `src/services/graphql/appsyncClient.ts` contribute their config blocks into this one call. The old `ensureConfigured()` guard in `cognitoClient.ts` is replaced with `ensureAmplifyConfigured()` from the new module; the new guard is idempotent and configures BOTH Auth and API on first call.
      - The real AppSync auth mode is `AMAZON_COGNITO_USER_POOLS` (confirmed via `aws appsync list-graphql-apis` on 2026-11-15). The Amplify API block uses `defaultAuthMode: 'userPool'` and derives the JWT from the active Cognito session. Amplify v6 handles the Authorization header automatically — no manual header injection needed.
      - `src/services/graphql/appsyncClient.ts` (existing stub path — do NOT move) exposes a configured Amplify GraphQL client (`generateClient()` from `aws-amplify/api`).
      - Backend-config values `appsync.graphqlUrl` and `appsync.realtimeUrl` are consumed from `env.ts`. If either is a `<FILL_...>` placeholder, `ensureAmplifyConfigured()` throws a descriptive error at app startup (same policy as the existing `env.ts` placeholder guard). The dev values are already real as of 2026-11-15.
      - Generated or hand-written TypeScript types for `ChatRoom`, `ChatRoomMembership`, `Message`, `MessageConnection`, `MessageRead`, `Notification`, `TypingEvent` live under `src/services/graphql/types/`. Shape must match the real AppSync schema (see context_summary "Real-schema anchors").
      - A smoke test asserts: (a) `ensureAmplifyConfigured()` is idempotent on repeated calls, (b) the configured Amplify API module reports the expected endpoint + auth mode (`userPool`), (c) a jest-mocked GraphQL call issues through the Amplify client (not raw fetch).
    notes: |
      Ex-17.1 (original phase 17, Chat backend). Updated per brainstorm 2026-11-15 —
      path fixed to `src/services/graphql/` (where the stub already is), Amplify
      singleton refactored into a shared module (BLOCKING 4). Real-backend-only;
      no mock AppSync client shipped.

  - id: 16.4
    title: Chat feature hooks + shape adapter (real backend)
    agent: frontenddeveloper
    done: false
    tracking_issue: 151
    depends_on: [16.3]
    acceptance_criteria:
      - `src/features/chat/api.ts` exposes `useRoomsQuery()`, `useMessagesQuery(roomId)`, `useCreateOrGetRoomMutation()`, `useSendMessageMutation()`, and `useOnMessageInRoomSubscription(roomId)`. Query keys follow §7.3 — `['rooms']`, `['messages', roomId]`.
      - `useRoomsQuery` wraps the GraphQL `listMyRooms` query (returns `[ChatRoom!]!` — NOT paginated).
      - `useMessagesQuery(roomId)` wraps `messagesByChatRoom(roomId, createdAtGt, limit, nextToken): MessageConnection`. Implement with `useInfiniteQuery` to handle the `nextToken`-based pagination; initial fetch uses `limit: 30`, subsequent pages fetched on scroll-to-top in `ChatRoomScreen` (story 16.6).
      - `useCreateOrGetRoomMutation` wraps `createOrGetRoom(otherUserId: ID!): ChatRoom!` — note the server arg is `otherUserId`, not `userId`.
      - `useSendMessageMutation` wraps `sendMessage(content: String!, contentType: String, roomId: ID!): Message!`. Phase 16 always passes `contentType: 'text'`. Server derives `senderId` from the JWT `sub` claim — client does NOT send it (schema enforces).
      - `useSendMessageMutation.onMutate` optimistically appends the pending message to `['messages', roomId]` cache with a locally-synthesized `ChatMessage { status: 'sending', timestamp: Date.now(), id: <local-uuid> }`; `onError` rolls back; `onSuccess` replaces the optimistic entry with the server-echoed `Message` (matched by local pending-id → server `messageId` reconciliation).
      - `useOnMessageInRoomSubscription(roomId)` reconciles incoming subscription events with the cached list (dedupes by server `messageId` — if the event matches a recently-sent optimistic entry that was already replaced on mutation success, skip; otherwise append).
      - Shape adapter — add `src/features/chat/shapeAdapters.ts`. The `Message → ChatMessage` adapter takes `currentUserId` as a parameter (from `authStore.session.idToken` sub claim) and computes `sender: 'me' | 'friend'` from the server's `senderId`. Synthesizes `status` per the rules in context_summary "Real-schema anchors": optimistic → 'sending'; server-cached → 'sent'; `Message.deliveredAt != null` → 'delivered'; counterpart `MessageRead.lastReadMessageId >= this.messageId` → 'read' (16.CH1 owns the read-reconciliation layer). Adapter is pure and unit-tested.
      - Hook tests cover optimistic append + rollback, subscription-driven cache update, dedupe, and the status-synthesis rules for each state transition. Tests stub the Amplify GraphQL client at the service boundary (jest-mock); no mock fixtures added.
    notes: "Ex-17.2 (original phase 17, Chat backend). Updated per brainstorm 2026-11-15 — real-backend-only, mock-GraphQL AC removed (BLOCKING 2/3)."

  - id: 16.5
    title: Wire real Rooms query into ChatListScreen + switch route param to roomId + delete mock chat
    agent: frontenddeveloper
    done: false
    tracking_issue: 152
    depends_on: [16.4]
    acceptance_criteria:
      - `ChatListScreen` replaces its `useFriendship().friends`-driven list with `useRoomsQuery()`. Each row renders one `ChatRoom`. Counterpart user_id derived from `ChatRoom.userA` + `ChatRoom.userB` with `currentUserId` (the one that is NOT currentUserId is the counterpart). Counterpart display name + avatar comes from either the `cachedOtherName` / `cachedOtherAvatar` on the matching `ChatRoomMembership` row (if the listMyRooms query returns them joined) OR via `useProfileQuery(counterpartUserId)` with the usual `['profile', userId]` cache. Last-message preview + timestamp come from `ChatRoom.lastMessagePreview` + `ChatRoom.lastMessageAt` top-level fields.
      - `ChatStackParamList.ChatRoomScreen` route param changes from `{ friendUserId: string }` to `{ roomId: string }` per Round 1 BLOCKING 5 decision.
      - `src/features/chat/navigation/openChatRoom.ts` is updated — `openChatRoom(userId)` still takes a `userId` at call signature (callers unchanged) but internally calls `useCreateOrGetRoomMutation.mutateAsync({ otherUserId: userId })` (note server arg name is `otherUserId`) to resolve `roomId`, then `navigate('ChatRoomScreen', { roomId })`. The `chatRoomExistsForUser(userId)` helper is deleted (the `createOrGetRoom` mutation is idempotent on the server side and makes a client-side existence check redundant).
      - DELETE `src/state/chat/ChatProvider.tsx`, `src/features/chat/storage/chatHistoryStorage.ts`, `assets/dummychat/chatMehvish.json`, and the `<ChatProvider>` mount in `App.tsx`. Delete the `useChatHistory` import + usage in `ChatRoomScreen` (replaced in story 16.6).
      - Grep verification — `grep -r 'TODO(mock-only)' src/features/chat src/state/chat` returns zero hits.
      - Loading / ready / error / empty states on `ChatListScreen` use catalog `LoadingState`, `ErrorState`, `EmptyState` explicitly.
      - Screen wiring test covers each state and the row-tap navigation to `ChatRoomScreen` with the real `roomId`.
    notes: |
      Ex-17.3 (original phase 17, Chat backend). Updated per brainstorm 2026-11-15 —
      route param switched to `roomId` per Round-1 BLOCKING 5. `openChatRoom`
      retains `userId` entry signature so phase-15 callers (`OtherProfileScreen`,
      `MyProfileScreen` via `RequestAcceptedModal.onSayHi`) do not need to be
      aware of the lookup. Round-2 ADVISORY 22: this story's teardown + rewire
      touches many files — `ChatListScreen`, `ChatRoomScreen` (partial — 16.6
      finishes it), `ChatListRow`, `openChatRoom.ts`, `App.tsx` provider mount,
      and all their test files. Budget for a broad touch-list, not a 2-file edit.

  - id: 16.6
    title: Wire real messages query + onMessageInRoom subscription into ChatRoomScreen
    agent: frontenddeveloper
    done: false
    tracking_issue: 153
    depends_on: [16.5]
    acceptance_criteria:
      - Replace the `useChatHistory` data source in `ChatRoomScreen` with `useMessagesQuery(roomId)` + `useOnMessageInRoomSubscription(roomId)`. `sendMessage` calls `useSendMessageMutation.mutate({ content, contentType: 'text', roomId })` (optimistic append + rollback per 16.4). Route param is now `roomId` (per 16.5) — update `useRoute<ChatRoomRoute>().params` destructure.
      - Friend-profile resolution for the header moves from `useFriendship().getFullProfile(friendUserId)` to deriving the counterpart `user_id` from `ChatRoom.userA`/`userB` (whichever is NOT `currentUserId`) via `useRoomsQuery` cache lookup, then calling `useProfileQuery(counterpartUserId)`.
      - Mount subscribes via `useOnMessageInRoomSubscription`; unmount tears the subscription down (no leaked subscription in a mount/unmount test).
      - Composer submit calls `useSendMessageMutation`. Preserve the existing visual design (theme-coloured bubbles, tiled background, mic↔send composer toggle, header with back + avatar + name + triple-dot).
      - Message status icons on sent bubbles — 'sending' shows a pending clock (optimistic local, pre-ack); 'sent' shows a single check (server-cached); 'delivered' shows two checks when `Message.deliveredAt != null` (server echo). 'read' state is layered in by story 16.CH1 (not this story).
      - On `AppState === 'active'` after a background transition, re-subscribe and invalidate `['messages', roomId]` so messages that arrived during the background window are fetched rather than replayed as subscription events.
      - Loading / ready / error / empty states are explicit via catalog components.
      - Screen wiring test covers subscription mount/unmount, optimistic send + subscription reconciliation, error rollback, the 'sending' → 'sent' → 'delivered' status transitions, and the AppState-resume refetch.
    notes: |
      Ex-17.4 (original phase 17, Chat backend). Updated per brainstorm 2026-11-15 —
      depends_on tightened to [16.5] per Round-1 BLOCKING 10 (ChatProvider must
      be deleted first). Round-2 update: 'delivered' tick re-added (schema has
      `Message.deliveredAt`); 'read' still ships in 16.CH1. AppState resubscribe
      AC added per Round-2 BLOCKING 18.

  - id: 16.CH1
    title: Read-receipt subscription + 'read' status tick
    agent: frontenddeveloper
    done: false
    tracking_issue: 154
    depends_on: [16.6]
    acceptance_criteria:
      - `src/features/chat/api.ts` adds `useOnReadReceiptSubscription(roomId)` wired to the AppSync `onReadReceipt(roomId): MessageRead` subscription.
      - Incoming read-receipt events deliver a `MessageRead { roomId, userId, lastReadMessageId, lastReadAt }` payload. On arrival, patch every sent message in `['messages', roomId]` cache whose `messageId <= lastReadMessageId` (lexicographic compare on ULID/UUID is NOT safe — use the sort-key `createdAt` embedded in the message as the comparator, OR match by the server's `messageId` with a running tally of "last-known read id" per room). Set `status: 'read'` on matched messages.
      - `useMarkReadMutation` wraps `markAsRead(lastMessageId: ID!, roomId: ID!): MessageRead!` — note two args: `lastMessageId` (of the most-recent received message to mark as read) AND `roomId`.
      - `ChatRoomScreen` on focus/visibility fires `useMarkReadMutation.mutate({ roomId, lastMessageId: <latest received message id> })`. Debounce to avoid spam — one call per focus event, not one per render.
      - `MessageBubble` renders a 'read' status icon (two blue checks or theme equivalent) when `message.status === 'read'`. Sent bubbles only; received bubbles ignore the status field.
      - Mount subscribes to `onReadReceipt`; unmount tears down (no leaked subscription in a mount/unmount test).
      - Hook tests cover inbound receipt → cache update for the correct message range, outbound mark-read on focus, debounce behaviour, and the unsubscribe path.
      - Screen test covers 'delivered' → 'read' icon transition on an inbound receipt.
    notes: "NEW — added by phase-16 Round-1 brainstorm per BLOCKING 8 and refined in Round-2 per ADVISORY 20 (markAsRead arg shape confirmed from live schema: two args, not one)."

  - id: 16.CH2
    title: Typing-indicator subscription + chat-room typing row
    agent: frontenddeveloper
    done: false
    tracking_issue: 155
    depends_on: [16.6]
    acceptance_criteria:
      - `src/features/chat/api.ts` adds `useOnTypingInRoomSubscription(roomId)` wired to `onTypingInRoom(roomId): TypingEvent`, AND `useSetTypingMutation` wired to the outbound mutation `setTyping(isTyping: Boolean!, roomId: ID!): TypingEvent!` (confirmed present on the real schema, 2026-11-15).
      - `ChatRoomScreen` composer sends a typing event on input-change: on first non-empty keystroke calls `setTyping({ isTyping: true, roomId })`; schedules a 2-second idle timer; if the user keeps typing within 2s the timer resets; after 2s of no input calls `setTyping({ isTyping: false, roomId })`. Throttle outbound: at most one "typing: true" call every ~2s regardless of keystroke frequency (via `useRef` + timestamp check — no new library).
      - Incoming typing events (counterpart's `TypingEvent { isTyping, roomId, userId }` with `userId !== currentUserId`) show a lightweight "{friend} is typing..." row above the composer. `isTyping: true` shows the row; `isTyping: false` OR 4 seconds of silence auto-dismisses.
      - `MessageBubble` is unchanged; the typing row is a sibling of the message `FlatList`, not a special message.
      - Mount subscribes; unmount tears down subscription AND fires a final `setTyping({ isTyping: false, roomId })` so the counterpart sees the row dismiss immediately when the user leaves the screen.
      - Hook tests cover inbound typing → row visible → auto-dismiss on silence; outbound throttle (keystroke storm produces one `setTyping(true)` not many); mount/unmount's final `setTyping(false)`.
      - Screen test covers the full round-trip (typing arrives, row shows, row dismisses after inactivity).
    notes: "NEW — added by phase-16 Round-1 brainstorm per BLOCKING 8. Round-2 update: setTyping mutation EXISTS on the real schema (confirmed via appsync get-introspection-schema 2026-11-15), so outbound typing is in scope — supersedes Round-2 BLOCKING 19 which incorrectly deferred the send side."

  - id: 16.8
    title: Subscription-driven modal triggers + FriendRequestSubscriptionListener + DevTriggersPanel teardown
    agent: frontenddeveloper
    done: false
    tracking_issue: 156
    depends_on: [16.FR2, 16.FR3]
    acceptance_criteria:
      - New component `src/features/friendRequests/FriendRequestSubscriptionListener.tsx` — returns `null`. Subscribes to the SINGLE AppSync subscription `onFriendRequestUpdated: Notification` when `useAuth().status === 'authenticated'`; renders nothing otherwise. Branches on the returned `Notification.type` to decide which modal to open (see context_summary "FriendRequestSubscriptionListener" for the full branch spec). Holds two independent `useState` fields for `incomingProfile` and `acceptedProfile` plus their visibility booleans. Mounts both `IncomingRequestModal` and `RequestAcceptedModal` as siblings.
      - `Notification.payload` is `AWSJSON` (stringified JSON). Parse with `JSON.parse(notification.payload)` to extract `request_id` and `from_user_id` for `friend_request`, or `from_user_id` for `friend_request_accepted`. If parse fails or required fields are missing, log a warning and skip the modal (defensive guard; should never fire in production).
      - `AppTabs` mounts `<FriendRequestSubscriptionListener />` directly above `<Tab.Navigator>` so the modals render over the tab shell on every tab.
      - `IncomingRequestModal`'s host (now the listener) calls `useAcceptFriendRequestMutation.mutate({ requestId })` on accept and `useDeclineFriendRequestMutation.mutate({ requestId })` on decline. Both use the modal's new `(userId, requestId)` callback signature from 16.FR3.
      - `RequestAcceptedModal`'s host (now the listener) calls `openChatRoom(acceptorUserId)` on `onSayHi` using the modal's new `(acceptorUserId)` callback signature from 16.FR3.
      - Multiple rapid subscription events replace the currently-displayed profile (latest wins); the prior modal dismisses before the new one opens.
      - On `AppState === 'active'` after a background transition, re-subscribe to `onFriendRequestUpdated` AND invalidate `['friend-requests','incoming']` so requests that arrived during the ~10-minute AppSync idle window are picked up by cache refetch rather than replayed as modal events.
      - DELETE `src/features/profile/components/DevTriggersPanel.tsx` and its labels under `menu.myProfile.editTab.devTriggers.*` from `labels.en.json` + `labels.ur.json`. Restore `MyProfileScreen` Edit tab to a real "Coming soon" `EmptyState` (any phase-16 edit-screen scope would be a separate story; this AC only reverts the dev-trigger scaffold).
      - Grep verification — `grep -r 'DevTriggersPanel' src/` returns zero hits.
      - Tests cover — subscription event fires and the correct modal opens based on `Notification.type` branching; multiple rapid events replace the displayed profile; modal dismissal does not leak the subscription callback; listener renders `null` when unauthenticated; AppState resume path re-subscribes + invalidates.
    notes: "Ex-17.6 (original phase 17). Updated per Round-2 — subscription name corrected to onFriendRequestUpdated with Notification.type branching (BLOCKING 15); AppState resubscribe + invalidate AC added (BLOCKING 18)."

  - id: 16.9
    title: Blocks endpoints + hooks + cross-cache purge
    agent: frontenddeveloper
    done: false
    tracking_issue: 157
    depends_on: [16.FR1]
    acceptance_criteria:
      - `src/services/api/endpoints.ts` gains a `blocksApi` object with `list()`, `block(userId)`, `unblock(userId)` methods calling `GET /blocks`, `POST /blocks`, `DELETE /blocks/{userId}` per §11.2.8.
      - `src/features/blocks/api.ts` exposes `useBlockedUsersQuery()`, `useBlockUserMutation()`, `useUnblockUserMutation()`. Query key `['blocked-users']`.
      - `useBlockUserMutation.onSuccess` invalidates `['deck']`, `['search']`, `['bookmarks']`, `['friends']`, `['friend-requests','incoming']`, `['friend-requests','outgoing']`, `['rooms']`, and any `['messages', roomId]` cache where the blocked user is a participant.
      - `useUnblockUserMutation.onSuccess` invalidates `['blocked-users']` only. Unblock does NOT re-populate discovery caches.
      - Hook tests cover the cross-cache purge on block (assert each listed key gets invalidated), the narrow invalidation on unblock, and error paths. Tests stub `request<T>` at the service boundary; no mock fixtures added.
    notes: "Ex-18.1 (original phase 18, Blocks). Updated per brainstorm 2026-11-15 — mock-handler AC removed (BLOCKING 2), depends_on added for 16.FR1 (BLOCKING 1 ripple — the purge list references friend-request query keys)."

  - id: 16.10
    title: BlockedUsersScreen thin wire + block toggle entry points (single-item action sheet)
    agent: frontenddeveloper
    done: false
    tracking_issue: 158
    depends_on: [16.9]
    acceptance_criteria:
      - `BlockedUsersScreen` renders blocked users via `FlatList` of `ListRow`; each row exposes an Unblock `Button` wired to `useUnblockUserMutation`.
      - `OtherProfileScreen` and `ChatRoomScreen` gain a Block action in a single-item action sheet (triggered by existing overflow-menu triple-dot on `ChatRoomScreen` and a new overflow icon on `OtherProfileScreen`). Tap "Block" → confirm dialog → `useBlockUserMutation.mutate(userId)` on confirm. Richer menu UX is explicitly deferred.
      - Loading / ready / error / empty states on `BlockedUsersScreen` are explicit via catalog components.
      - Screen wiring test covers the list states, the unblock action, and the OtherProfile/ChatRoomScreen block-action flow (open sheet → confirm → mutation fires → user redirected away from blocked content).
    notes: "Ex-18.2 (original phase 18, Blocks). Updated per brainstorm 2026-11-15 — single-item action sheet scope per ADVISORY 12. Visual layout deferred."
