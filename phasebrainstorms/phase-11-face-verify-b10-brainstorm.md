# Phase 11 brainstorm — Face verification + final PATCH (B10, pages 30-31)

## 2026-08-03 14:00 brainstorm

Focused review of the two stories in `implementationplan/phase-11-face-verify-b10.md` for missing/non-testable AC, scope smuggling, wrong dependencies, drift since the plan was written, and unvalidated external assumptions. Findings ordered by severity.

### HIGH — likely to block dispatch or cause rework

1. **`expo-camera` is not installed.** `package.json` deps stop at `expo-updates` (~56.0.23); there is no `expo-camera`, no `expo-face-detector`, no `react-native-vision-camera`. Both stories assume `expo-camera` is present. Story 11.2 additionally assumes a "face-detection add-on" — that add-on does not exist in Expo SDK 56 (see #2). Installing `expo-camera` is a **native module** — merging phase 11 will require the same full APK reinstall dance as phase 10's `expo-image-picker` on device 000323572000090 (READ_MEDIA_IMAGES → CAMERA permission activates on new APK install).

2. **The "expo-camera face-detection add-on" per §17.24 does not exist as a shippable package on Expo SDK 56.** `expo-face-detector` was deprecated and removed from Expo modules years ago; there is no first-party face detector in the Expo managed workflow today. Real options:
   - `react-native-vision-camera` + `vision-camera-face-detector` (accurate, heavy, requires prebuild — already implied by Expo dev-build workflow the project uses)
   - `@react-native-ml-kit/face-detection` (ML Kit, requires Google Play Services)
   - `expo-camera` alone (no face detection — the auto-capture behaviour AC would need a different trigger)

   §17.24 in `architecture.md` is still **[Open]**; the PRD phrases the choice as decided (it isn't). **User must pick one** before story 11.2 is dispatched, otherwise the subagent will either invent a package or block. Recommended: `react-native-vision-camera` + `vision-camera-face-detector`, since the project is already off Expo Go and on a dev build.

3. **`isImmutable()` is stricter than the PRD claims.** PRD AC (v) says "currently `sex`". `src/Helper/immutableFieldHelper.ts` currently marks **six** fields immutable: `sex`, `first_name`, `last_name`, `birthday`, `religion`, `subsect`. The runtime behaviour is correct (the helper is source of truth). But:
   - The PRD's parenthetical is stale and will mislead the subagent.
   - The unit test for the "retry strips immutable" path must exercise more than one field to be meaningful; a single-field test won't catch a regression that only frees `subsect`.

   Fix in PRD: replace "(currently `sex`)" with "(currently the six fields listed in `src/Helper/immutableFieldHelper.ts`)". Add explicit test expectation that all six are stripped on retry.

4. **`AuthProvider.profileComplete` is still stubbed to `false` — `RootNavigator` will NOT swap to `AppTabs` on refresh alone.** `src/state/auth/AuthProvider.tsx` lines 122-129 have a `useMemo` that returns `false` unconditionally, with a `TODO(phase-2)` to decode `custom:profile_complete` from the ID token. Story 11.2 AC (iv) claims the PATCH success flow ends with "`RootNavigator` swaps in `AppTabs`" — that CANNOT happen without wiring up the claim decode. Two paths:
   - **(a)** Include the claim-decode fix inside story 11.2 (scope smuggling from phase-2 debt, but small and directly required — arguably the right call).
   - **(b)** Split off a story 11.3 "wire `custom:profile_complete` decode in `AuthProvider`" (or backfill into a phase-2 follow-up).

   Related: verify that `cognitoClient.refreshSession()` actually re-fetches the ID token from Cognito, not just re-uses cached claims. If Amplify caches, `refresh()` after PATCH success won't see the new claim and we need an explicit sign-out/sign-in or a manual `/oauth2/token` call.

5. **`onboardingDraft.faceSelfieUri` does not exist in `draftSchema.ts` today (schemaVersion 3).** Adding it is a shape change → **schemaVersion 3→4 bump with DISCARD policy** (same pattern as phase 10 story 10.2's `phone_number` addition). Currently unmentioned in AC. Add: "story 11.2 bumps `schemaVersion` to 4, adds `faceSelfieUri: string | null` to `OnboardingDraft`, updates `createEmptyDraft()`, and updates every fixture in the test suite that constructs a draft."

### MEDIUM — clarify before dispatch

6. **§17.21 sibling contract is still [Open] — PRD assumes "embedded array" but the acceptance criterion doesn't nail down the key name or shape.** Architecture line 966 leaves this open; PRD says "plus `siblings` per current §17.21 assumption of embedded array". Since the backend is mock-only, this is decidable client-side. Add explicit AC: **PATCH body contains a `siblings` array under exactly that key, each entry shaped as `SiblingDraft` (name, age, maritalStatus, gender, profession)**. Document the DB-column-name mapping (draft uses camelCase `maritalStatus`; backend column is `marital_status`) — do we transform at PATCH-build or is the backend expected to accept camelCase? Assumption needs to be pinned so the mock handler matches whatever the real backend will accept later.

7. **PATCH-body composition is under-specified.** "Derive full PATCH body from `onboardingDraft.fields` (plus siblings)" is not enough. `onboardingDraft` contains client-only values that MUST NOT go in the PATCH body:
   - `photoPreviewUris` — photo upload is deferred per §17.14
   - `notificationPermissionStatus` / `locationPermissionStatus` — client telemetry
   - `faceSelfieUri` — deferred per §17.14 (client-only in v1)
   - `phone_number` — verify: is this a `UserProfileWritable` column, or a separate flow?
   - `lastCheckpoint`, `currentPage`, `timestamps`, `schemaVersion` — draft-local bookkeeping

   Add AC: "PATCH-body builder is a pure function `buildPatchBody(draft, { isRetry: boolean }): PatchBody` with unit tests asserting (a) allowlist of included fields; (b) exclusion of client-only values; (c) immutable-field stripping on retry; (d) sibling array is embedded under key `siblings`."

8. **"Regenerate the trailing 4-digit alphanumeric segment" (AC vi) is imprecise vs `usernameHelper.generateUsername()`.** The current helper generates **4 digits, not 4 alphanumerics** (`Math.floor(Math.random() * 10000).toString().padStart(4, '0')` → `0000..9999`). And it regenerates the WHOLE username (name-part + suffix) — there is no suffix-only regen path. Options:
   - Add a new helper `regenerateUsernameSuffix(current: string): string` that keeps the letters and re-rolls just the suffix.
   - Just call `generateUsername(firstName, lastName)` again — the letters are deterministic from the same names, only the suffix rerolls anyway. Simplest; probably the right call. Update AC to say "regenerate the username via `generateUsername(first, last)`" and drop "trailing 4-digit alphanumeric" wording.

9. **Auto-capture ("N consecutive frames" logic) is not directly testable in Jest.** No real camera exists in the test environment. Factor the "N consecutive detections → fire capture" into a pure state machine (`useAutoCaptureController` or a plain reducer function) that consumes a stream of `faceInsideOval: boolean` events and emits `shouldCapture: boolean`. Unit-test that; leave the actual camera event plumbing for a screen-wiring test with mocked `expo-camera`. Add AC: "the N-frame threshold lives in a pure, unit-tested state machine independent of the camera module."

10. **No AC for the "face never enters the oval" case.** What happens after 30s / 60s of no detection? Manual capture fallback? Timeout error state? Give-up-and-continue button? Architecture line 923 is silent. Common face-verify UX has an escape hatch — user decision needed. If no escape, add an explicit "session times out after Ns → show retry with manual shutter" AC.

11. **Story 11.1 permanent-deny UX is stricter than phase 10's precedent.** AC (iii) says "permanent deny keeps Continue disabled" — the user is permanently stuck. In phase 10 (commit 48a13c3), permanent-deny for photos opened the OS settings deep link so the user could recover. Camera is the same class of blocker (arguably worse — no camera means no completion, ever). Suggested: add an "Open Settings" button (via `Linking.openSettings()`) on the permanent-deny inline error, mirroring phase 10's pattern. Otherwise a user who mis-taps once has to reinstall.

### LOW — good-to-verify / cosmetic

12. **Jest mocks for `expo-camera` and the face-detector package do not exist yet.** When the packages are added, they need `__mocks__/expo-camera.ts` (and equivalent for the face-detector) so unit tests don't try to load native modules. Add as an implicit dependency of story 11.1's screen-wiring test.

13. **`requestCameraPermission()` location.** Story 11.1 AC (ii) says "added here" without specifying where. Convention (from `src/services/permissions/index.ts`) is one file, one exported helper per permission. New helper wraps `expo-camera`'s `getCameraPermissionsAsync()` / `requestCameraPermissionsAsync()` following the exact `granted | denied | undetermined` union pattern already in place. Trivial; just make it explicit in the AC.

14. **YES/NO backend casing still unvalidated (per PRD's own callout).** Moot for this phase because the mock handler will accept anything, but re-open when the real backend lands. Add a phase-19 or post-onboarding follow-up: "verify `father_retired`, `mother_retired`, `has_children` (bool coerced already), `move_abroad` (bool coerced already) accept the shape sent by `buildPatchBody`". Not a phase 11 blocker.

15. **`context.md` `Before shipping` block already lists mock-mode teardown for `env.isMockAuth` and `dummydummy` sentinels — nothing about the PATCH mock handler.** After phase 11 lands, teardown will also need to remove the `PATCH /profile/me` MSW handler from `services/api/mocks/handlers.ts`. Add a bullet to `context.md → Before shipping` at story 11.2 completion (mock/prod parity list).

### Dependencies check
- `depends_on: [11.1]` on story 11.2 is correct — 11.2 needs the camera permission granted to open the capture screen.
- Story 11.1's `depends_on: []` is correct — it's the phase entry point.
- No cross-phase dependencies missed.

### Drift summary
- Six items are stale relative to on-disk reality: (1) expo-camera absence, (2) face-detector option is a live [Open] not a decided default, (3) immutable-field count, (4) profileComplete claim decode still stubbed, (5) faceSelfieUri needs draft schema bump, (13) permission helper location convention.

### Recommended edits before proceeding
- Bump AC in the PRD to reflect items 1-5 (high-severity) and pick a resolution for items 6-11 (medium).
- Add a new story or fold into 11.2 the `custom:profile_complete` claim decode wiring.
- Confirm face-detector choice (§17.24) before dispatch.

## 2026-08-03 15:30 brainstorm (re-run after PRD updates from QA/explanations.txt answers)

The PRD was rewritten to reflect user answers on all 15 concerns from `QA/explanations.txt`. Key shifts from v1:
- Face-detector library decided: `react-native-vision-camera` + `vision-camera-face-detector` (concern #2 answered A).
- **Backend integration deferred entirely** (concern #3): no real PATCH, no `AuthProvider` changes, no `custom:profile_complete` claim decode. New client-side bypass via `OnboardingCompletionProvider` + `dummy.onboarding.complete` and `dummy.profile` secure-store keys. Enumerated teardown in `context.md → Before shipping`.
- `expo-camera` NOT installed. vision-camera also provides the permission API — `requestCameraPermission()` wraps `Camera.getCameraPermissionStatus()` / `Camera.requestCameraPermission()`.
- Concerns #1, #4, #5, #6, #7, #8, #9, #10 (Option B — always-visible shutter), #11 (mirror phase 10 + modal/toast) all folded into AC.

New gaps surfaced by the updated PRD (medium-severity — worth pinning before dispatch, none are blockers):

### MEDIUM

A. **`OnboardingCompletionProvider` first-mount race.** The provider reads `dummy.onboarding.complete` from secure-store on mount (async). During that async read `complete` is `false` by default, so a returning user who completed onboarding on a prior launch will briefly see `OnboardingStack` for one render before it flips to `AppTabs`. Two options:
   - **A1:** Accept the flicker. Cheapest. Real-world users won't perceive one frame of the wrong stack.
   - **A2:** Add a `loading: boolean` to the provider; extend `RootNavigator`'s splash guard to `if (status === 'loading' || onboardingCompletion.loading) return splash`. Cleaner UX, tiny code cost.
   Recommended: A2. Splash is already the pattern for the auth-loading branch; extending it is consistent.

B. **Order of side-effects on mock-submit success.** Story 11.2 AC lists the sequence 1-5 (build body → submit → snapshot `dummy.profile` → set `dummy.onboarding.complete` → clear draft). Explicit ordering isn't stated as a **hard requirement** in the AC. It should be: if the sequence is `set complete → snapshot profile → clear draft` and the snapshot step throws, the user ends up with `complete=true` but no `dummy.profile` to render → phase 12 shows a 404. If the sequence is `snapshot profile → set complete → clear draft` and any step throws, we abort before `clear draft` and the user can retry with the draft intact. Add explicit ordering + abort-on-throw semantics to AC.

C. **Additive check location in `RootNavigator`.** PRD says "minimal additive check `if (status === 'authenticated' && (profileComplete || dummyOnboardingComplete)) return <AppTabs />`". Correct spot to modify is the existing `if (!profileComplete)` branch (line 71-73 of `RootNavigator.tsx`) — change to `if (!profileComplete && !dummyOnboardingComplete)`. This preserves the outer `status === 'authenticated'` gate. Should be pinned in AC so the subagent doesn't introduce a duplicate branch.

D. **Test coverage for the new gate.** No AC explicitly covers `RootNavigator` behavior for the `(authenticated=true, profileComplete=false, dummyOnboardingComplete=true) → AppTabs` case. Add a `RootNavigator` test that mounts with a mocked `OnboardingCompletionProvider` and asserts the render swap.

E. **User must be `status === 'authenticated'` at page 31 for the additive check to fire.** In `isMockAuth` mode (already active, per `context.md → Before shipping`), pages 2-3 do produce a fake-authenticated session, so this holds. Good, but worth noting: the mock-only bypass DEPENDS on `isMockAuth` producing an authenticated status by the time the user reaches page 30. If someone later disables `isMockAuth` without also removing the mock-only bypass, the bypass silently stops working (user stays on OnboardingStack). Add a sanity assertion in `OnboardingCompletionProvider` or a runtime warning: "dummy.onboarding.complete=true but status !== 'authenticated' — likely a stale mock-mode teardown".

F. **Scope of test-fixture updates (schemaVersion 3 → 4).** Every fixture that constructs an `OnboardingDraft` needs `faceSelfieUri: null` added. Rough count based on grep in phase 10: 20-30 files. Not a blocker, but the story owner should expect meaningful test-file churn. Worth adding a note: "expect ~20-30 test-fixture files to require `faceSelfieUri: null` addition; use grep for `createEmptyDraft` and `schemaVersion: 3` to find them."

G. **`vision-camera-face-detector` API shape varies by version.** The Jest mock AC says "face-detector hook or utility function" — deliberately loose. That's fine, but pin the version at install time (`~x.y.z`) and note it in the PR body so a future upgrade is a conscious choice, not a silent drift.

H. **`Camera.getCameraPermissionStatus()` API shape.** In `react-native-vision-camera` v3+, this is a static method returning `'granted' | 'not-determined' | 'denied' | 'restricted'`. Our `PermissionStatus` union is `'granted' | 'denied' | 'undetermined'`. Map `'not-determined' → 'undetermined'`, `'restricted' → 'denied'`. Trivial but explicitly call out the mapping in the helper.

I. **`useOnboardingCompletion()` needs to be resilient to `SecureStore.getItemAsync` throwing.** Unlikely (secure-store rarely throws), but if it does, the provider should degrade to `complete: false` rather than propagating the throw and crashing the app. Add: "on read error, log and default to `complete: false`."

### LOW

J. Consider renaming `dummyOnboardingComplete` → `mockOnboardingComplete` for consistency with the existing `env.isMockAuth` naming. Cosmetic — either works.

K. Copy key `onboarding.faceIntro.permissionRequiredMessage` (from story 11.1 AC on permanent-deny) should be paired with a title/heading for the modal (if we go with a modal rather than a toast). If the subagent picks a toast, no title needed. Leaving the "modal-or-toast" choice to the subagent is fine but note that if modal → add title copy key.

L. Story 11.2's `submitError` and `submitRetry` copy keys should also include the 409 retry-attempt flow — probably one label like "checking availability…" during the second attempt. Not blocking; subagent can add during implementation.

### Dependencies (unchanged from v1 brainstorm)
- `depends_on: [11.1]` on story 11.2 correct — 11.2 needs vision-camera installed by 11.1.
- Story 11.1's `depends_on: []` correct.

### Drift check
- v1 drift items (expo-camera missing, deprecated face-detector, immutable-field list, profileComplete stub, faceSelfieUri missing) are now resolved in the updated PRD text.
- No new drift introduced.

### Verdict
The updated PRD is coherent and dispatchable. The 9 medium items above are quality-of-implementation refinements — none should block the phase from starting. I'd fold **A2** (loading splash), **B** (explicit ordering), **C** (pin the RootNavigator branch), **D** (RootNavigator test AC), and **H** (permission-status mapping) into the PRD before dispatch; the rest are subagent-discoverable during implementation.

## 2026-08-03 16:45 brainstorm (post-A-L fixes, verification pass)

Re-read the PRD after folding in every A-L item from the previous brainstorm. Verifying (a) each item is actually addressed in the AC text (not just alluded to), and (b) the additions didn't introduce new gaps.

### A-L coverage check

| Item | Status | Where in PRD |
|------|--------|--------------|
| A2 (loading splash) | ✓ | Story 11.2 — `loading` semantics block + RootNavigator splash-guard extension |
| B (explicit ordering + abort-on-throw) | ✓ | Story 11.2 — 6-step numbered sequence with "MUST happen before" + rationale paragraph |
| C (pin RootNavigator branch location) | ✓ | Story 11.2 — "Modify the EXISTING `if (!profileComplete)` branch … lines 71-73" |
| D (RootNavigator test AC) | ✓ | Story 11.2 — two named tests (mockOnboardingComplete=true, loading=true) |
| E (runtime sanity warning) | ✓ | Story 11.2 — `console.warn('[mock-only] onboarding completion flag is set but auth session is missing …')` |
| F (~20-30 fixture files) | ✓ | Story 11.2 — explicit heads-up with grep hint |
| G (pin vision-camera version) | ✓ | Story 11.1 — "Pin exact minor versions … record resolved versions in PR body" |
| H (permission-status mapping) | ✓ | Story 11.1 — `mapVisionCameraStatus(raw)` private helper + explicit 4-way mapping table |
| I (SecureStore resilience) | ✓ | Story 11.2 — "Resilience: if `SecureStore.getItemAsync` throws, log and default to `complete: false`" |
| J (mockOnboardingComplete naming) | ✓ | Story 11.2 — "Naming" block: `complete` exposed, `mockOnboardingComplete` at destructure |
| K (toast copy) | ✓ | Story 11.1 — `permissionRequiredMessage` key + explicit "toast not modal, no title" |
| L (409 retry copy) | ✓ | Story 11.2 — `onboarding.faceCapture.usernameRegenerating` copy key |

All 12 items materially addressed.

### New gaps introduced by the fixes

Read the additions with fresh eyes. Three small ambiguities worth pinning before dispatch, none blocking:

M. **`OnboardingCompletionProvider` mount point wording.** Story 11.2 AC says "Mounted in `App.tsx` above `RootNavigator` (as a sibling or child of `AuthProvider` — either works, as long as `RootNavigator` is inside both)." — but the provider's own AC says it emits `console.warn` referencing `useAuth().status`. `useAuth()` requires the provider to be a **descendant** of `AuthProvider`, so "sibling" is NOT actually a valid option. Fix wording: "MUST be mounted as a descendant of `AuthProvider` so it can consume `useAuth()`. Recommended tree: `<AuthProvider><OnboardingCompletionProvider><RootNavigator/></OnboardingCompletionProvider></AuthProvider>`."

N. **Runtime sanity warning fires spuriously during first-mount transient.** The warning triggers whenever `complete === true && useAuth().status !== 'authenticated'`. On every launch for a completed user, there's a window where `AuthProvider.status === 'loading'` while `OnboardingCompletionProvider` has already resolved `complete: true` (or vice versa). Naive check will log a warning on every cold launch. Fix: only warn when `status === 'unauthenticated'` (a real mismatch), not `'loading'` (transient). One-line clarification in the AC.

O. **`markComplete()` vs step 4 responsibility split is fuzzy.** Story 11.2 lists step 4 as "Set expo-secure-store key `dummy.onboarding.complete = "true"`" and step 5 as "Call `mockOnboardingCompletion.markComplete()` to flip the in-memory context flag." — but a reader could reasonably assume `markComplete()` itself does the secure-store write (it's a natural encapsulation). If both step 4 AND `markComplete()` write, there's a redundant call (harmless but confusing). If only step 4 writes and `markComplete()` is a pure state setter, that's a leaky abstraction — future callers who invoke `markComplete()` without the caller-side secure-store write will get an inconsistent state on next launch. Cleanest fix: `markComplete()` OWNS the secure-store write; step 4 is folded into step 5. New sequence becomes 5 steps: build → PATCH → snapshot `dummy.profile` → `markComplete()` (writes secure-store AND flips in-memory) → clear draft.

### Not-blockers noted for the subagent (already implicit in AC)

- The `reset()` method on `OnboardingCompletionProvider` has no caller in phase 11. Kept in the interface for future logout flow; the subagent should implement it (deletes both secure-store keys + flips in-memory back to `false`) but not wire any UI caller in this phase. If YAGNI is preferred, subagent can omit reset entirely — either choice is fine.

- The 409 fixture-toggle mechanism (query param? env flag? test-only override?) is not spelled out. Subagent picks whatever is idiomatic in the existing MSW handlers.

### Verdict

PRD is dispatchable. Recommend applying the three fixes M, N, O inline before dispatching story 11.1 — all are one-line clarifications with no scope impact. After that, proceed to dispatch.

