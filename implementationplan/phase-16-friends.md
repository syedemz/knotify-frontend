phase: 16
title: Friends
last_updated: 2026-07-19

context_summary: |
  Phase 16 is a **thin** post-onboarding phase per §11.2.8. Wires GET /friends and stubs `FriendsListScreen`. This is the read-only counterpart to phase 15's friend-request accept path — accepted requests land here via the cross-cache invalidation wired in 15.1. Visual layout is deferred to /implement-phase brainstorm.

stories:
  - id: 16.1
    title: Friends endpoint + hook + MSW fixtures
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/features/friends/api.ts` exposes `useFriendsQuery()` returning a typed friend list.
      - Query key follows the tuple convention from §7.3 (`['friends']`).
      - `services/api/mocks/handlers.ts` gains a GET /friends handler with fixtures for happy-path list, empty list, and 500.
      - Hook tests cover happy-path, empty, and error mapping.
    notes: ""

  - id: 16.2
    title: FriendsListScreen thin wire
    agent: frontenddeveloper
    done: false
    depends_on: [16.1]
    acceptance_criteria:
      - `FriendsListScreen` renders the friend list via `FlatList` of `ListRow`; tapping a row navigates to `OtherProfileScreen` with `userId` typed through the ParamList.
      - Loading / ready / error / empty states use catalog `LoadingState`, `EmptyState`, `ErrorState` explicitly.
      - Screen wiring test covers each state and the row-tap navigation.
    notes: "Visual layout deferred."
