phase: 15
title: Friend requests
last_updated: 2026-07-19

context_summary: |
  Phase 15 is a **thin** post-onboarding phase per §11.2.8. Wires the friend-request lifecycle endpoints and stubs `IncomingRequestsScreen`, `OutgoingRequestsScreen`, `RequestDetailScreen`. Cross-cache invalidation between `friend-requests` and `friends` on accept is enforced here. Visual design (how the incoming/outgoing UI is laid out, how the accept/decline/cancel actions surface) is deferred to /implement-phase brainstorm.

stories:
  - id: 15.1
    title: Friend-request endpoints + hooks + MSW + cross-cache invalidation
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/features/friendRequests/api.ts` exposes `useIncomingRequestsQuery()`, `useOutgoingRequestsQuery()`, `useSendRequestMutation()`, `useAcceptRequestMutation()`, `useDeclineRequestMutation()`, `useCancelRequestMutation()`.
      - `useAcceptRequestMutation.onSuccess` invalidates both `['friend-requests', 'incoming']` and `['friends']`.
      - 409 on `useSendRequestMutation` surfaces a mapped "request already sent" label rather than a generic error banner.
      - `services/api/mocks/handlers.ts` gains handlers with fixtures covering pending/accepted/declined/cancelled statuses and the 409 duplicate-send case.
      - Hook tests cover the accept-invalidates-friends behavior and the 409 label mapping.
    notes: ""

  - id: 15.2
    title: IncomingRequestsScreen thin wire
    agent: frontenddeveloper
    done: false
    depends_on: [15.1]
    acceptance_criteria:
      - `IncomingRequestsScreen` renders incoming requests via `FlatList` of `ListRow`; each row has Accept + Decline `Button` actions.
      - Loading / ready / error / empty states are explicit.
      - Screen wiring test covers each state and the accept action wiring.
    notes: "Visual layout deferred."

  - id: 15.3
    title: OutgoingRequestsScreen thin wire
    agent: frontenddeveloper
    done: false
    depends_on: [15.1]
    acceptance_criteria:
      - `OutgoingRequestsScreen` renders outgoing requests via `FlatList` of `ListRow`; each row has a Cancel `Button` action.
      - Loading / ready / error / empty states are explicit.
      - Screen wiring test covers each state and the cancel action wiring.
    notes: "Visual layout deferred."

  - id: 15.4
    title: RequestDetailScreen thin wire
    agent: frontenddeveloper
    done: false
    depends_on: [15.1]
    acceptance_criteria:
      - `RequestDetailScreen` renders the requesting profile summary + action buttons scoped to the request status (pending shows Accept/Decline; cancelled/declined show read-only banner).
      - Navigation param is `requestId` typed through the ParamList.
      - Screen wiring test covers each status branch.
    notes: "Visual layout deferred."
