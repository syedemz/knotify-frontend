phase: 12
title: Profile - my profile + edit
last_updated: 2026-08-03

context_summary: |
  Phase 12 is a **thin** post-onboarding phase per §11.2.8 - it wires GET/PATCH /profile/me endpoints and stubs `MyProfileScreen` + `EditProfileScreen` with catalog-component composition. Visual and interaction design (layout of profile fields, how immutable-after-set fields are surfaced, how edit sections are grouped, username-rename cool-down UX) is delivered by the user at /implement-phase Step-0 brainstorm time and added to this PRD then.

  === MOCK-ONLY PROFILE PIPELINE (temporary, per user 2026-08-03) ===

  The backend (Cognito + AWS API + DB) is intentionally NOT stood up yet. Phase 11 introduced a client-side registration-completion bypass and snapshotted the assembled PATCH body to expo-secure-store under key `dummy.profile` before clearing the onboarding draft. Phase 12 builds MyProfileScreen and EditProfileScreen against THAT snapshot rather than a hardcoded fixture:

    - MSW `GET /profile/me` reads and returns the JSON stored under `dummy.profile`. If the key is missing (edge case: user somehow got here without completing onboarding), the handler returns a 404 that the screens surface as an `ErrorState`.
    - MSW `PATCH /profile/me` merges the request body into the stored `dummy.profile` snapshot in secure-store and echoes the merged result back with a 200. This gives the edit-flow a real feel — changes persist across app restarts, immutable fields can be tested, etc. — without touching a real backend.
    - Immutable-field violations (409) are still simulated via a fixture-toggle so tests exercise that path.
    - Everything added as part of this mock-only pipeline is tech-debt. Enumerated in `context.md → Before shipping`. All new call sites are marked `// TODO(mock-only)` for grep-ability.
    - When the real backend ships, the MSW handlers get deleted, the `dummy.profile` and `dummy.onboarding.complete` secure-store keys are wiped on next launch (a one-shot migration), and the screens automatically talk to the real backend via the same TanStack Query hooks (`useMyProfileQuery`, `useUpdateMyProfileMutation`) — no screen-side changes required.

stories:
  - id: 12.1
    title: Profile endpoints + hooks + MSW fixtures
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/features/profile/api.ts` exposes typed hooks `useMyProfileQuery()` (wrapping `profileApi.getMe`) and `useUpdateMyProfileMutation()` (wrapping `profileApi.updateMe`).
      - `useUpdateMyProfileMutation` invalidates `['profile', 'me']` on success.
      - `services/api/mocks/handlers.ts` gains handlers for GET /profile/me and PATCH /profile/me. Per the mock-only pipeline described in `context_summary`, the GET handler reads the JSON stored under expo-secure-store key `dummy.profile` (set by phase 11 story 11.2 on mock-registration completion) and returns it verbatim; the PATCH handler merges the request body into that stored snapshot and echoes it back. Both are marked `// TODO(mock-only)`.
      - Fixtures under `services/api/mocks/fixtures/profile.ts` cover: (a) a fallback happy-path profile used when `dummy.profile` is missing (dev-mode convenience); (b) an immutable-field-violation (409) triggered via a fixture-toggle; (c) a 500 triggered via a fixture-toggle.
      - Hook tests cover happy-path, immutable-field violation, and cache invalidation on success.
    notes: ""

  - id: 12.2
    title: MyProfileScreen thin wire (display-only, immutable fields greyed)
    agent: frontenddeveloper
    done: false
    depends_on: [12.1]
    acceptance_criteria:
      - `MyProfileScreen` renders every field on the profile grouped by section using catalog `Section` / `ListRow` components; visual grouping is a placeholder pending the design brainstorm.
      - Fields matched by `Helper/immutableFieldHelper.ts` render greyed-out (via `Text color='tertiary'`) with an accessible label indicating they cannot be edited.
      - Loading / ready / error states from `useMyProfileQuery` are explicit (`LoadingState`, `ErrorState`, ready render); no blank screen.
      - Screen wiring test asserts loading/error/ready render paths and that at least one known immutable field renders in the greyed variant.
    notes: "Visual layout deferred to /implement-phase brainstorm."

  - id: 12.3
    title: EditProfileScreen thin wire (writable fields, PATCH on save)
    agent: frontenddeveloper
    done: false
    depends_on: [12.1]
    acceptance_criteria:
      - `EditProfileScreen` renders every field on `UserProfileWritable` using catalog inputs; immutable fields do not appear.
      - Save calls `useUpdateMyProfileMutation` with only the diff between original and edited values.
      - On mutation error, an `ErrorState` surfaces the mapped label; on success, `MyProfileScreen` re-renders with fresh data (via cache invalidation).
      - Screen wiring test covers diff computation for a two-field edit, error rendering, and successful save navigation.
    notes: "Visual layout deferred to /implement-phase brainstorm."
