# Phase 3 brainstorm — Identity - sex, name, birthday, first checkpoint (B2, pages 5-8)

## 2026-07-23 15:00 brainstorm

Audit of `implementationplan/phase-3-identity-b2.md` against the current codebase (post-phase-2 merge at `88c2fe6`). PRD version dated `2026-07-19`.

### Blocking drift (must fix before dispatch)

**F-1 — Story 3.4 references a non-existent API signature.**
AC says: `useOnboardingDraft().advance(firstCheckpoint)`.
The actual hook (from story 2.2, `src/features/onboarding/hooks/useOnboardingDraft.ts:226-266`) exposes two methods:
- `advance(nextPage: number)` — advances page pointer only, no checkpoint.
- `advanceWithCheckpoint(nextPage: number, checkpoint: 'firstCheckpoint' | 'secondCheckpoint' | null)` — advances page pointer AND sets the checkpoint (with non-regression via `resolveCheckpoint`).

For page 8's Start button to (a) set `lastCheckpoint = 'firstCheckpoint'` and (b) move `currentPage` to 9, the call must be `advanceWithCheckpoint(9, 'firstCheckpoint')`. Rewrite the AC.

**F-2 — Story 3.4 targets the wrong route name.**
AC says: "navigates to `Page09ReligionScreen`".
Actual route registered in `PAGE_MAP` (story 2.2) and `useCheckpointResume` (`src/features/onboarding/hooks/useCheckpointResume.ts:7`) is `Page09ReligionSubsectScreen`. Rename in the AC — otherwise the screen wiring test cannot pass without silently drifting the route name.

### Under-specified (pick a rule before dispatch, else the subagent guesses)

**F-3 — Story 3.2 `sanitize()` is undefined.**
AC prescribes `username = sanitize(first_name) + sanitize(last_name) + <4-digit alphanumeric>` but never specifies:
- Casing (lowercase? preserve? title-case?)
- Whether internal spaces/hyphens/apostrophes are dropped vs. preserved
- Whether diacritics are stripped (NFD normalize)
- The exact charset of "4-digit alphanumeric" — `[0-9]{4}`? `[a-zA-Z0-9]{4}`? `[a-z0-9]{4}`?

Recommend: lowercase + strip everything non-`[a-z]` from each name (drops spaces, hyphens, apostrophes) + 4 chars from `[a-z0-9]`. Yields a Cognito-safe username token. Codify as `Helper/usernameHelper.ts` with `sanitizeNamePart(s: string): string` and `generateUsername(first: string, last: string): string` — both testable independently. Add to Story 3.2 AC.

**F-4 — Story 3.2 missing name-validator export.**
Existing `Helper/validationHelper.ts` (from story 2.5) exports email/6-digit-code/password validators only. AC describes name validation rules but never names the function. Recommend: add `isValidName(s: string): boolean` (parallel to `isValidEmail`) to `validationHelper.ts` and list it explicitly in the AC. Rules per AC: only `[A-Za-z]`, space, `-`, `'`; no leading/trailing whitespace; length 1-35.

**F-5 — Story 3.3 missing `age()` in exports.**
AC lists `isAtLeast18 / isNotFuture / isYearReasonable / validateBirthday` but the live-preview clause references `dateHelper.age(iso)`. Add `age(iso: string, today?: string): number` to the exports list explicitly.

**F-6 — Story 3.3 `validateBirthday` needs injectable `today`.**
`isAtLeast18(iso, today)` and `isNotFuture(iso, today)` take `today` (good for boundary tests). The composite `validateBirthday(iso)` per AC does not — makes the 17y364d/18y0d boundary tests non-deterministic. Change signature to `validateBirthday(iso: string, today?: string): LabelKey | null`; default `today` to `new Date().toISOString().slice(0, 10)`.

**F-7 — Story 3.1 `options.gender` access pattern undefined.**
File exists at `src/config/options/gender.json` (`["Male", "Female"]`), but there's no `src/config/options/index.ts` barrel yet. AC says "never inlined in the screen" but doesn't say how the screen imports it. Recommend: create `src/config/options/index.ts` re-exporting `gender` (and any future option lists) so screens do `import { options } from '@/config/options'`. Add a small AC to Story 3.1 or split into 3.1a.

### Scope creep to strike

**F-8 — Story 3.1 "not sent as writable on retry navigation" clause has no phase-3 consumer.**
The PATCH-payload filter that would honor the immutable-field predicate lives in phase 11 (final PATCH). In phase 3 the predicate has no call site. Recommend: keep the AC "introduce `Helper/immutableFieldHelper.ts` predicate with `isImmutable(field: keyof UserProfileWritable): boolean` returning true for `sex` (and any other frozen-post-first-write fields already known)" and its unit tests; strike the "not sent as writable on retry navigation to this page" clause. Re-introduce that behavior as a phase 11 AC where the PATCH-builder actually consumes the predicate.

### Missing acceptance criteria

**F-9 — Story 3.1 draft page pointer not tracked.**
Auto-advance to page 6 should update the draft's `currentPage` field (so checkpoint-resume math and progress-bar reads stay coherent), but no AC says so. Add: "After writing `sex`, call `useOnboardingDraft().advance(6)` before `navigation.navigate('Page06NameScreen')`." The same rule applies to stories 3.2 and 3.3 for pages 7 and 8 respectively — bundle a single "each screen advances the draft page pointer on continue" AC into the phase's shared conventions, or add a line to each story.

**F-10 — Story 3.1 draft `sex` field type not verified.**
`OnboardingDraft` (from story 2.2) has a `sex` slot but the union type must be `'Male' | 'Female' | undefined` to match `options.gender`. If it's currently typed `string`, story 3.1 silently widens the schema. Add an AC: "verify `OnboardingDraft.sex` is typed `'Male' | 'Female' | undefined`; tighten if needed."

### Feasibility spot-checks (no action required — noted for confidence)

- `DatePicker` catalog component exists at `src/components/DatePicker.tsx` with `value / onChange / min / max` API — story 3.3 has no infra blocker.
- `images.onboarding.genderMale`, `images.onboarding.genderFemale`, `images.onboarding.banner` all present in `src/config/images.ts` — story 3.1 and 3.3 assets are ready.
- `useCheckpointResume` already reads `lastCheckpoint === 'firstCheckpoint'` and returns `Page09ReligionSubsectScreen` as the initial route — story 3.4's kill-and-relaunch integration test can seed `secureStorage` with a draft carrying `lastCheckpoint: 'firstCheckpoint'` and assert the mounted route. Existing test in `OnboardingStack.test.tsx` covers a similar pattern.
- `resolveCheckpoint` in `useOnboardingDraft.ts:254` already prevents `firstCheckpoint → null` regression on back-navigation — story 3.4's non-regression AC is a wiring test, not a new invariant.

### Summary

Two blocking drifts (F-1, F-2 in story 3.4 — wrong API and wrong route name), five under-specifications (F-3 through F-7), one scope-creep clause to remove (F-8), and two missing ACs (F-9, F-10). None of the four stories has a fundamentally broken shape — they're one PRD edit pass away from being dispatch-ready.

## 2026-07-23 16:30 brainstorm (re-run after PRD update)

PRD `implementationplan/phase-3-identity-b2.md` was updated (last_updated: 2026-07-23) and phase 11 PRD was updated with the F-8 deferred consumer AC. Re-audit against the updated PRD confirms all 11 resolutions from the prior brainstorm + user Q&A landed cleanly:

- **F-1 resolved** — Story 3.4 now calls `advanceWithCheckpoint(9, 'firstCheckpoint')`.
- **F-2 resolved** — Target route renamed to `Page09ReligionSubsectScreen`.
- **F-3 resolved** — Story 3.2 specifies new `src/Helper/usernameHelper.ts` with `sanitizeNamePart` (lowercase + NFD-normalize-then-strip + `[a-z]`-only) and `generateUsername` (name parts + `[0-9]{4}` suffix).
- **F-4 resolved** — `isValidName` added to `validationHelper.ts` with concrete accept/reject fixtures.
- **F-5 resolved** — `age(iso, today?)` added to `dateHelper` exports.
- **F-6 resolved** — All time-reading dateHelper functions (including `validateBirthday`) take injectable `today?`.
- **F-7 resolved** — New `src/config/options/index.ts` barrel exports `gender` as `string[]` (kept as plain `string[]`, not const enum).
- **F-8 resolved** — Story 3.1 introduces `immutableFieldHelper.ts` predicate only; phase 11 story 11.2 got the deferred consumer AC (`isImmutable` filters retry-PATCH bodies).
- **F-9 resolved** — Per-story `advance(nextPage)` calls added (3.1→6, 3.2→7, 3.3→8); 3.4's `advanceWithCheckpoint(9, ...)` subsumes the page-pointer advance.
- **F-10 resolved** — Story 3.1 has the `OnboardingDraft.sex` type-tightening AC.
- **F-11 resolved** — Story 3.1 explicitly states back-nav leaves both tiles tappable and the wiring test covers seeded-Male → tap-Female overwrite.

### Nits (informational only — not blocking dispatch)

- Story 3.2 regex assertion `/^[a-z]+[a-z]+[0-9]{4}$/` is functionally equivalent to `/^[a-z]{2,}[0-9]{4}$/` — two `[a-z]+` chunks collapse. Doesn't reject any valid output; subagent will infer intent.
- Story 3.3 age-preview label `"{age} years"` relies on the runtime `.replace('{token}', value)` interpolation pattern established in story 2.6 (labels resolver has no built-in interpolation). Established convention; no PRD change needed.

### Nit fixes applied (2026-07-23 16:45)

- Story 3.2: regex simplified to `/^[a-z]{2,}[0-9]{4}$/` with an explanatory clause ("at least two lowercase letters total across the two sanitized name parts, followed by exactly 4 digits").
- Story 3.3: age-preview AC now names the label key explicitly (`onboarding.birthday.agePreview` with source `"{age} years"`, Urdu parity required) and calls out the `.replace('{age}', String(age))` render-time interpolation pattern established in story 2.6.

### Verdict

PRD is dispatch-ready. Proceeding to Step 1 (tracking issue creation) on user `proceed` confirmation.
