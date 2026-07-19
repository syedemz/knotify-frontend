phase: 12
title: Profile - my profile + edit
last_updated: 2026-07-19

context_summary: |
  Phase 12 is a **thin** post-onboarding phase per §11.2.8 - it wires GET/PATCH /profile/me endpoints and stubs `MyProfileScreen` + `EditProfileScreen` with catalog-component composition. Visual and interaction design (layout of profile fields, how immutable-after-set fields are surfaced, how edit sections are grouped, username-rename cool-down UX) is delivered by the user at /implement-phase Step-0 brainstorm time and added to this PRD then.

stories:
  - id: 12.1
    title: Profile endpoints + hooks + MSW fixtures
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `src/features/profile/api.ts` exposes typed hooks `useMyProfileQuery()` (wrapping `profileApi.getMe`) and `useUpdateMyProfileMutation()` (wrapping `profileApi.updateMe`).
      - `useUpdateMyProfileMutation` invalidates `['profile', 'me']` on success.
      - `services/api/mocks/handlers.ts` gains handlers for GET /profile/me and PATCH /profile/me with fixtures under `services/api/mocks/fixtures/profile.ts`.
      - Fixtures cover a happy-path profile, an immutable-field-violation (409), and a 500.
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
