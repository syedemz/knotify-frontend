# Phase 5 brainstorm — Education + second checkpoint (B4, pages 12-14)

## 2026-07-24 17:00 addendum — minor items resolved

The three minor open items called out in the 16:45 verdict have been addressed inline in the PRD:

1. **English copy for every enumerated label key** — Story 5.1 title, all 22 Story 5.2 keys (title + 7 field-sets × triple), and all 4 Story 5.3 second-checkpoint keys now have explicit English strings in the PRD. Implementer writes idiomatic Urdu equivalents; CI enforces key parity.
2. **Page 14 button styling** — locked to `WizardHeader hideProgress` + centered content + `WizardFooter` single primary button, mirroring `Page08FirstCheckpointScreen`. Only the label and `onPress` change based on state; no separate button component or custom visual variant. AC updated accordingly.
3. **Mount-reconciliation `useEffect` timing** — locked to a three-state model (`'prompt' | 'continue' | 'loading'`). On mount, `mode` starts at `'loading'`, `Promise.all` calls `Notifications.getPermissionsAsync()` + `Location.getPermissionsAsync()`, writes both statuses through the new setters (respecting `canAskAgain`), then flips to `'prompt'` or `'continue'`. Continue is disabled while `loading` to prevent flicker and double-tap. Rationale captured in the PRD.

**Verdict: PRD is ready to execute. No open blockers, no open minor items.**

## 2026-07-24 16:45 brainstorm (re-run after PRD update)

Re-audit against the updated PRD (`implementationplan/phase-5-education-b4.md`) after the QA cycle resolved all 15 items as Option A.

Verification pass:

- **Blocker 1 (expo-location)**: Story 5.3 AC 0 spells out `npx expo install expo-location` + iOS/Android native config with the exact user-facing copy. ✓
- **Blocker 2 (duplicate `requestNotificationPermission`)**: Story 5.3 has an explicit AC to refactor `expoPush.ts` to import from `services/permissions` and asserts "only ONE implementation exists in the codebase after this story." ✓
- **Blocker 3 (draft-field naming)**: Story 5.3 AC calls out camelCase names (`notificationPermissionStatus` / `locationPermissionStatus`) and adds two top-level setters on `useOnboardingDraft` modeled on `setSiblings`, with test-mock updates. ✓
- **Story 5.1**: `depends_on: []` correct (5.1 doesn't need 5.2's code). AC 3 rephrased to nav-wiring only. ListRowSelectable specified. Length-assertion pattern (`options.educationLevel.length`) matches phase-4's story-4.2 convention. Re-tap no-op added. `onboarding.education.title` label key enumerated. ✓
- **Story 5.2**: `depends_on: [5.1]` correct (needs `education_level` in draft). AC 5 split into three separate testable bullets. Boundary tests enumerated for both text and year fields. Apostrophe added to char class. DB-schema verification note. Per-field inline errors. 15 label keys enumerated. Year sentinel `0` deliberate — flagged so implementer doesn't second-guess. ✓
- **Story 5.3**: `depends_on: []` correct (independent from pages 12-13). Advance target `Page15ResidenceCountryScreen` stated. Return type `Promise<'granted' | 'denied' | 'undetermined'>` specified. Re-prompt rule spelled out for all 6 combinations with mount-reconciliation via `getPermissionsAsync`. 5 test scenarios enumerated + unit test for the helpers themselves. 4 label keys enumerated. ✓

No new drift since the previous brainstorm — nothing has landed on `development` since the resume-race fix that would change any story's premise. Phase 4 is done and tagged; `advanceWithCheckpoint` is polymorphic and ready for `secondCheckpoint`; page 15 placeholder is registered.

Minor open items (not blockers — implementer decides at write-time):

- The exact English + Urdu copy for each enumerated label key. All keys are declared; only the string values are up to the implementer.
- The exact color/spacing on the Page 14 "Enable Notifications" button vs. plain Continue button — visual choice, no test target.
- Story 5.3's mount-reconciliation `useEffect` timing (fire-and-forget vs. await before render). The AC allows either; test coverage of "no prompts fire on resumed-both-granted" catches the wrong behavior.

**Verdict: PRD is ready to execute. No open blockers.**

## 2026-07-24 16:20 addendum — QA cycle resolved

User answered all 15 issues from the QA cycle (`QA/explanations.txt`) — every answer was **Option A** (the recommended fix). For issue 1, the location-prompt copy is: "Knotify uses your approximate location to show you compatible matches nearby".

PRD (`implementationplan/phase-5-education-b4.md`) has been rewritten to bake in all 15 resolutions:

- **Blockers**: `expo-location` install + native config added as story-5.3 AC 0 with the exact copy. `services/permissions` extract-and-unify (removing the private duplicate in `expoPush.ts`) added as an explicit AC. Draft-field naming corrected to camelCase (`notificationPermissionStatus` / `locationPermissionStatus`), and top-level setter creation on `useOnboardingDraft` (with test-mock updates) added as an explicit AC.
- **Story 5.1**: AC 3 rephrased to only cover nav wiring (reconciliation is 5.2's concern). `ListRowSelectable` specified. Assert-via-length pattern (`options.educationLevel.length`) added. Re-tap no-op added. Label key `onboarding.education.title` enumerated.
- **Story 5.2**: AC 5 split into three separate bullets (branch-matrix rendering, back-nav downgrade reset, Continue navigation). Boundary tests enumerated for both text (40/41) and year (1949/1950/currentYear/currentYear+1) fields. Apostrophe added to the character class. DB-schema verification note added. Per-field inline errors added. All 15 label keys enumerated (1 title + 7 × triple).
- **Story 5.3**: advance target `Page15ResidenceCountryScreen` stated explicitly. Return type `Promise<'granted' | 'denied' | 'undetermined'>` specified. Re-prompt rule spelled out for all combinations (mount-reconciliation `getPermissionsAsync` covers granted/revoked-in-Settings between sessions). Test coverage split into 5 scenarios (grant, deny, resumed-both-granted, resumed-one-denied-terminal, mount reconciliation) + unit test for the permissions helpers themselves. 4 label keys enumerated.

**Verdict: PRD is ready to execute. No open blockers.**

## 2026-07-24 15:45 brainstorm

Audit of `implementationplan/phase-5-education-b4.md` against the current codebase (post-phase-4 merge + onboarding-resume-race fix on `development`).

### Blockers (must resolve before dispatch)

1. **`expo-location` is not installed.** Story 5.3 requires `requestLocationPermission()` using `expo-location`. `package.json` has `expo-notifications ~56.0.22` and `expo-image` but no `expo-location`. Implementer must run `npx expo install expo-location` and add `NSLocationWhenInUseUsageDescription` (iOS) + `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` (Android) entries in `app.json` / `app.config.ts` before writing story 5.3. The PRD should call this out as the first sub-task of story 5.3, otherwise the tests will pass with a null implementation and the app will crash on-device.

2. **Duplicate `requestNotificationPermission`.** `src/services/push/expoPush.ts:34` already has a private `requestNotificationPermission()` — it wraps `expo-notifications` exactly the way story 5.3's centralized helper is supposed to. Story 5.3 says to create `src/services/permissions/index.ts` with the "typed `requestNotificationPermission()`." The PRD is silent on what to do with the existing function. Options:
   - (recommended) Extract the existing helper into `services/permissions/index.ts`, then have `expoPush.ts` import it. Single source of truth, no drift.
   - Duplicate the function in two places (bad — future changes go out of sync).
   - Re-export from `expoPush.ts` (wrong direction; permissions is the lower-level primitive).
   PRD needs an explicit "extract-and-unify" instruction, or the implementer will invent one of the three answers.

3. **Draft-field name/shape mismatch.** Story 5.3 AC 3 says "both results are written to draft (`notification_permission_status`, `location_permission_status`)." But `draftSchema.ts:116-130` defines these as **top-level draft fields in camelCase**: `notificationPermissionStatus` and `locationPermissionStatus` — siblings of `fields`, not inside it. Two things:
   - The names in the PRD are snake_case; the actual fields are camelCase. Update PRD to match code, or update code to match PRD (camelCase is more idiomatic for a client-only draft field).
   - The current `useOnboardingDraft` exposes `setSiblings` as the only top-level setter. Story 5.3 needs new top-level setters (e.g., `setNotificationPermissionStatus`, `setLocationPermissionStatus`) — this is an implicit sub-task not mentioned in the AC. Add a bullet.

### External dependencies — validated

- `options.educationLevel` exists in `src/config/options/index.ts` and has exactly 5 entries matching the branch matrix in architecture §11.2.3 ✓
- All UserProfile columns referenced by story 5.2 exist in `src/types/api/UserProfile.ts`: `education_level`, `highest_degree`, `high_school`, `high_school_passing_year`, `higher_secondary`, `higher_secondary_passing_year`, `graduation_year`, `college_name` ✓
- `Page12EducationLevelScreen`, `Page13EducationCredentialsScreen`, `Page14SecondCheckpointScreen`, `Page15ResidenceCountryScreen` all registered as placeholders in `OnboardingStack.tsx` ✓
- `Helper/validationHelper.ts` exists ✓; story 5.2 will append text and year validators. `Helper/dateHelper.ts` exists — year validation may want to reuse `currentYear()` if defined there.
- Catalog components `ListRowSelectable`, `TextInput`, `WizardHeader`, `WizardFooter`, `Screen`, `Column`, `Heading` all in `src/components` ✓
- Checkpoint mechanism supports `secondCheckpoint` — `advanceWithCheckpoint` is polymorphic (used in `Page08FirstCheckpointScreen` as `advanceWithCheckpoint(9, 'firstCheckpoint')`); story 5.3 will call `advanceWithCheckpoint(15, 'secondCheckpoint')` ✓
- Resume race for `secondCheckpoint` is already handled by the `fix/onboarding-resume-race` PR merged on 2026-07-24 — `OnboardingStack` gates on `isLoading` before mounting, so Page 15 will be the initial route correctly when `lastCheckpoint === 'secondCheckpoint'` ✓

### Story 5.1 gaps

- **AC 3 is a forward reference.** "Back-navigation from page 13 to page 12 is supported; changing the selection triggers page 13's re-mount reconciliation (implemented in 5.2)." The reconciliation logic lives in 5.2, not 5.1. Recommend splitting: keep "back-navigation from page 13 to page 12 is supported" as 5.1's AC (verifies the nav wiring / no navigator errors) and move "changing the selection triggers page 13's re-mount reconciliation" into 5.2's AC set (already effectively covered by 5.2 AC 4).
- **Component choice unspecified.** "Renders a selectable list" — is this `ListRowSelectable` (phase 4 religion pattern) or `SelectionTile` (phase 3 sex pattern)? Given education is a text list of 5 items (not a 2-tile pick), `ListRowSelectable` matches the phase-4 pattern. State it explicitly.
- **Label keys unspecified.** Needs at least `onboarding.education.title` (screen title). Urdu parity required.
- **Advance target explicit ✓** (AC 2 says `Page13EducationCredentialsScreen`).

### Story 5.2 gaps

- **AC 5 bundles three assertions.** "Screen wiring test covers each of the 5 branch matrix rows including auto-default of hidden fields, the back-nav downgrade reset, and Continue navigation to `Page14SecondCheckpointScreen`." Break into three bullets so failure of one doesn't hide the others:
  1. For each of the 5 education-level values, the correct field set renders and hidden fields are auto-defaulted to their sentinels in the draft.
  2. Back-navigating to page 12 and picking a lesser level triggers `useEffect` reconciliation that force-resets the now-irrelevant fields to defaults before page 13 re-mounts.
  3. Continue is only enabled when every visible field validates; tapping it navigates to `Page14SecondCheckpointScreen`.
- **Boundary tests unspecified.** Story 4.3 required "boundary tests for each length-limited field." Story 5.2 has 4 text fields (max 40) and 3 year fields (4 digits, 1950 ≤ y ≤ current year). Add: "Boundary tests: 40/41 chars for each text field; 1949/1950/current-year/current-year+1 for each year field."
- **Character rule for text fields.** Architecture §11.2.3 says "letters/digits/spaces/-/./&/, sanity check." Phase 4 story 4.3 added `'` to that class for real-world names. `college_name` and `high_school` names commonly include `'` (e.g., "St. Mary's High School"). Recommend adding `'` for consistency.
- **Year sentinel `0` is deliberate.** `UserProfile.ts:123` types `graduation_year: number | null` — the DB allows null. The PRD's `0` sentinel is a design choice, not a bug. Flag this in the story notes so the implementer doesn't second-guess: "year sentinel `0` is deliberate; do not use `null`."
- **DB-schema verification.** Similar to story 4.3, verify max-40 against `knotify-backend/db-schema.json` for `college_name`, `high_school`, `higher_secondary`, `highest_degree`. If TEXT (unbounded), 40 is a UI choice; if `VARCHAR(N)`, must match `N`. Add a "verify during implementation" note.
- **Inline validation errors per field.** Same pattern as story 4.3 — each field should show an inline error keyed off a `LabelKey`. Add explicitly.
- **Label-key inventory unspecified.** ~15 keys needed (1 title, 4 text-field label+placeholder+error triples, 3 year-field label+placeholder+error triples). Enumerate in the PRD to guarantee Urdu parity.

### Story 5.3 gaps

- **Advance target not stated.** "On advance the draft's `lastCheckpoint` is set to `secondCheckpoint`" — but not "and navigates to `Page15ResidenceCountryScreen`." Add.
- **Ambiguous re-prompt logic.** "On resume when both permissions are already granted, the screen shows a plain Continue button without re-prompting." What about:
  - Only notification granted, location denied?
  - Both denied but `canAskAgain: true`?
  - Either denied with `canAskAgain: false` (iOS after single denial)?
  On iOS, `Notifications.requestPermissionsAsync()` returns immediately with `denied` after the first denial — the OS won't re-prompt. The screen needs to handle this: if either status is `'denied'`, show plain Continue (can't re-prompt). If either is `null`/`undetermined`, show "Enable Notifications" flow. Otherwise (both granted), plain Continue. Spell this out.
- **`services/permissions` public API details unspecified.** Return type not stated. Match `expoPush.ts` pattern: `Promise<'granted' | 'denied' | 'undetermined'>`.
- **Package install + native config sub-task.** Add explicit AC 0: "Install `expo-location` via `npx expo install expo-location`. Add `NSLocationWhenInUseUsageDescription` to iOS config and `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` to Android config."
- **Existing `expoPush.ts` extraction sub-task.** Add AC: "The existing private `requestNotificationPermission` in `src/services/push/expoPush.ts` is moved to `services/permissions/index.ts` and re-imported from `expoPush.ts` — no duplicate implementations."
- **Sequential prompt order stated ✓** — notification then location.
- **Draft writer sub-task.** Add: "`useOnboardingDraft` exposes top-level setters `setNotificationPermissionStatus(status)` and `setLocationPermissionStatus(status)` — modeled on the existing `setSiblings`."
- **Label keys.** ~4 needed (`onboarding.secondCheckpoint.title`, `onboarding.secondCheckpoint.enableNotifications`, `onboarding.secondCheckpoint.continue`, plus maybe a subtitle). Enumerate.
- **Test coverage of native-module boundaries.** The test needs to mock `expo-notifications` and `expo-location`. Add: "Tests mock both native modules and assert the sequential order of calls plus draft writes for both grant and deny paths."

### `depends_on` review

- 5.1 → `depends_on: []` ✓
- 5.2 → `depends_on: [5.1]` ✓ (needs `education_level` in draft for the branch matrix)
- 5.3 → `depends_on: []` ✓ (independent screen + services layer; doesn't touch pages 12/13)

Structural sound. No cycle. No smuggling of phase-6+ scope — Page 15 is only referenced as a nav target (its placeholder is already registered).

### Localization for options

Same stance as phase 4: `options.educationLevel` values are English. On Urdu locale, tile labels display in English. Consistent with the architecture §5.3 decision. No action.

### Non-blockers / minor items

- `services/push/` and `services/permissions/` will both exist post-phase-5. `expoPush.ts` remains the push-token registration file; `permissions/index.ts` becomes the OS-permission helper file. Clean separation.
- `Page14SecondCheckpointScreen` mirrors Page 8's shape (hideProgress WizardHeader, centered content, WizardFooter with Continue). Implementer can crib the structure.
- The "no background image" instruction on Page 14 is aesthetic — trivial.
- `checkpoints.ts` helper (`resolveCheckpoint`) already correctly never regresses. No changes needed for story 5.3.

### Summary — pick one

- **address** — resolve the three blockers (install `expo-location`, decide `expoPush.ts` extraction, unify draft-field naming). Fix story 5.1 AC 3 forward reference. Break story 5.2 AC 5 into three bullets and add character-rule/boundary-test/label-key/inline-error details. Add story 5.3's package-install sub-task, permissions-extraction sub-task, draft-setter sub-task, advance target, and re-prompt logic. Enumerate label keys across all three stories. Then re-run `/implement-phase 5`.
- **proceed** — dispatch subagents against the current PRD; each subagent resolves the ambiguities locally. I will inject the three blockers (package install, extract existing helper, camelCase draft-field names) into the story 5.3 dispatch brief so nothing crashes, and will note all ambiguity resolutions in the completion summary.
