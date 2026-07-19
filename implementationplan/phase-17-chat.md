phase: 17
title: Chat - AppSync rooms + realtime messages
last_updated: 2026-07-19

context_summary: |
  Phase 17 is a **thin** post-onboarding phase per §11.2.8, but heavier than the other thin phases because it wires AppSync GraphQL + subscriptions. Stubs `RoomsListScreen` and `RoomScreen`; wires `createOrGetRoom`, `listRooms`, `listMessages`, `sendMessage`, and the `onMessageAdded` subscription per §8.3. Deep-link route `knotify://chat/room/:roomId` (per §11.3.5) is registered here. Visual layout of the room list and the message thread is deferred to /implement-phase brainstorm.

stories:
  - id: 17.1
    title: AppSync client + Amplify GraphQL wiring
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/services/api/appsyncClient.ts` exposes a configured Amplify GraphQL client using the JWT from `authStore` per §8.3.
      - Generated types for `Room`, `Message`, `RoomConnection`, `MessageConnection` live under `src/services/api/graphql/`.
      - A smoke test mounts the client under MSW-like GraphQL mocking and asserts an authenticated request carries the expected header shape.
    notes: ""

  - id: 17.2
    title: Chat feature hooks + fixtures
    agent: frontenddeveloper
    done: false
    depends_on: [17.1]
    acceptance_criteria:
      - `src/features/chat/api.ts` exposes `useRoomsQuery()`, `useMessagesQuery(roomId)`, `useCreateOrGetRoomMutation()`, `useSendMessageMutation()`, and `useOnMessageAddedSubscription(roomId)`.
      - `useSendMessageMutation.onMutate` optimistically appends the pending message to `['messages', roomId]`; `onError` rolls back.
      - `useOnMessageAddedSubscription` reconciles incoming subscription events with the optimistic cache (dedupes by `messageId`).
      - GraphQL fixtures cover happy-path room list, room-with-messages, subscription event, and a duplicate-event dedupe case.
      - Hook tests cover optimistic append + rollback, subscription-driven cache update, and dedupe.
    notes: ""

  - id: 17.3
    title: RoomsListScreen thin wire
    agent: frontenddeveloper
    done: false
    depends_on: [17.2]
    acceptance_criteria:
      - `RoomsListScreen` renders rooms via `FlatList` of `ListRow`; each row shows the counterpart display name and the last message preview.
      - Loading / ready / error / empty states are explicit.
      - Tapping a row navigates to `RoomScreen` with `roomId` typed through the ParamList.
      - Screen wiring test covers each state and the navigation.
    notes: "Visual layout deferred."

  - id: 17.4
    title: RoomScreen thin wire + subscription lifecycle
    agent: frontenddeveloper
    done: false
    depends_on: [17.2]
    acceptance_criteria:
      - `RoomScreen` renders the message thread via `FlatList` (inverted) of catalog message bubbles pending the design brainstorm.
      - Mount subscribes via `useOnMessageAddedSubscription`; unmount tears the subscription down (no leaked subscription in a mount/unmount test).
      - Composer uses catalog `TextInput` + `Button`; submit calls `useSendMessageMutation`.
      - Loading / ready / error / empty states are explicit.
      - Screen wiring test covers subscription mount/unmount, optimistic send + subscription reconciliation, and error rollback.
    notes: "Visual layout deferred."

  - id: 17.5
    title: Chat deep-link route registration
    agent: frontenddeveloper
    done: false
    depends_on: [17.3, 17.4]
    acceptance_criteria:
      - `knotify://chat/room/:roomId` resolves through the linking config in `AppTabs`/`ChatStack` to `RoomScreen` with `roomId` typed through the ParamList.
      - A cold-start deep-link (link opened while app was not running) lands on `RoomScreen` after the tab shell mounts.
      - Deep-link test covers cold-start and warm-start paths.
    notes: ""
