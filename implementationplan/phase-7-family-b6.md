phase: 7
title: Family - parents + siblings (B6, pages 18-19)
last_updated: 2026-07-26 (7.2 done — phase complete)

context_summary: |
  Phase 7 captures parents (page 18) and the dynamic sibling list (page 19). Introduces the `SiblingForm` sub-form pattern with count-then-fill-then-cancel-discards UX per §11.2.3.

  Brainstorm resolutions (2026-07-26, see `phasebrainstorms/phase-7-family-b6-brainstorm.md`):
    - Story 7.2 extends `SiblingDraft` with `gender` + `profession` and bumps `schemaVersion` 1 → 2 with a DISCARD load-policy (pre-launch; no real users to migrate).
    - Page 18 uses two distinct validators: `isValidParentName` (strict, letters/spaces/hyphens/apostrophes, max 40) for parent names, and `isValidParentJob` (loose, adds ampersands/periods/digits, max 40) for parent jobs. Both new to `validationHelper.ts`.
    - Page 19 sibling name uses `isValidName` (existing, max 35). Sibling profession uses a new `isValidProfession` validator (letters/spaces/hyphens/apostrophes/ampersands/periods/digits, max 35).
    - Page 19 re-hydrates on back-nav from `draft.siblings` + `draft.currentPage`: if page 19 was previously completed (`currentPage >= 20`), open in Filling (pre-populated) if siblings non-empty or Complete if siblings is `[]` (the 0-case); otherwise open in Initial.
    - Page 19 Cancel resets only in-progress local state; it never touches `draft.siblings`.
    - Page 19 value-0 write happens on Continue tap only, matching every other page. "Immediately" refers to the button-enable state.
    - `SiblingForm` lives at `src/features/onboarding/components/SiblingForm.tsx` (folder introduced in phase 6).
    - `options.yesNo` uppercase casing (`["YES","NO"]`) is an unvalidated assumption against the backend — see note on phase-11 PRD.

stories:
  - id: 7.1
    title: Page 18 - Parents (6 fields)
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 31
    acceptance_criteria:
      - Two new validators are added to `src/Helper/validationHelper.ts` alongside constants `MAX_PARENT_NAME_LENGTH = 40` and `MAX_PARENT_JOB_LENGTH = 40` - (a) `isValidParentName(input: string): boolean` allows letters, spaces, hyphens, apostrophes only (mirrors `isValidName` character class but with the 40-char cap); (b) `isValidParentJob(input: string): boolean` allows letters, spaces, hyphens, apostrophes, ampersands, periods, digits (cap 40). Both trim leading/trailing whitespace before validating and reject empty strings.
      - `Page18ParentsScreen` renders four catalog `TextInput`s - `fathers_name` and `mothers_name` gated by `isValidParentName`; `fathers_job` and `mothers_job` gated by `isValidParentJob`. Each field renders inline error messages under the touched-flag pattern established in phase 4 (tooLong / invalidCharacters).
      - Two pick-ones from `options.yesNo` capture `father_retired` and `mother_retired`. Written as the literal string values `"YES"` / `"NO"` to the draft (backend casing acceptance is an open assumption tracked on phase 11).
      - Continue is disabled until all six fields validate; on tap all six write to the draft in a single `update({...})` call and navigate to `Page19SiblingsScreen`.
      - Back-nav from page 19 re-hydrates all six fields from `draft.fields`.
      - Screen wiring test covers each field's validation gate, the aggregate Continue enable, both pick-ones toggling, single-update semantics on Continue, and back-nav re-hydration. Unit tests cover both new validators at boundary lengths (0, 1, 40, 41) and each allowed/rejected character class.
      - New labels under `onboarding.parents.*` in both `labels.en.json` and `labels.ur.json` with full parity (title, per-field label/placeholder/errors, pick-one prompts).
    notes: ""

  - id: 7.2
    title: Page 19 - Siblings dynamic list (0-4 count then N sub-forms)
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 32
    acceptance_criteria:
      - Extend `SiblingDraft` in `src/features/onboarding/draftSchema.ts` to add `gender: 'Male' | 'Female' | null` and `profession: string | null` fields alongside the existing `name` / `age` / `maritalStatus`. Bump `schemaVersion` from `1` to `2`. Update the JSDoc on `SiblingDraft.age` to keep the TEXT-in-DB caveat; add JSDoc for the two new fields matching the file's tone.
      - Implement the schemaVersion-2 DISCARD load policy in `useOnboardingDraft` - on hydration from secure-store, if the loaded draft's `schemaVersion !== 2`, discard it and call `createEmptyDraft()` instead. Add unit tests covering (a) v1 draft on disk → discarded → fresh empty draft returned; (b) v2 draft on disk → loaded as-is; (c) missing / corrupt draft → fresh empty draft. Update the migration-policy comment at the top of `draftSchema.ts` to state the current policy is "discard on version mismatch (pre-launch)."
      - Add `isValidProfession(input: string): boolean` and `MAX_SIBLING_PROFESSION_LENGTH = 35` to `src/Helper/validationHelper.ts` - allows letters, spaces, hyphens, apostrophes, ampersands, periods, digits; trims before length check; rejects empty. Unit tests cover boundary lengths and each character class.
      - New feature-local component `src/features/onboarding/components/SiblingForm.tsx` renders a single sibling's five fields - `name` (gated by existing `isValidName`, max 35), `gender` (pick-one from `options.gender`), `sibling_age` (0-99 integer input; non-integers and out-of-range rejected inline; the UI label is `sibling_age` matching the DB column, but on write it maps to `SiblingDraft.age` per the existing type shorthand), `marital_status` (pick-one from `options.maritalStatus`), `profession` (gated by `isValidProfession`, max 35). Emits an `onChange(index, siblingDraft)` and reports validity via an `onValidityChange(index, valid)` callback.
      - `Page19SiblingsScreen` implements a three-state machine per §11.2.3 - Initial (count input 0-4 inclusive; negatives, non-integers, and >4 blocked); Filling (count hidden; N `<SiblingForm />` cards in a `ScrollView`; Continue disabled until every card is valid; a Cancel button); Complete (Continue enabled). Cancel from Filling returns to Initial with the count input cleared and in-progress local state discarded; it MUST NOT modify `draft.siblings`.
      - The Initial state has exactly one primary action - the Continue button, which does double duty based on the current count value. When `count === 0`, Continue writes `draft.siblings = []` via `setSiblings([])`, calls `advance(20)`, and navigates to `Page20MarriageTimeScreen` (the 0-case handled entirely in Initial). When `count >= 1`, Continue transitions the screen to Filling state (renders N SiblingForm cards, hides the count input, exposes Cancel), performs NO draft write, and does NOT navigate. There is no separate "Add siblings" button - one Continue button, behavior switches on count value. This matches the single-Continue-per-page convention across the wizard.
      - Back-nav / mount-time state resolution reads both `draft.siblings` and `draft.currentPage` - (a) if `currentPage < 20` (page 19 never completed), open in Initial with blank count; (b) if `currentPage >= 20` AND `draft.siblings.length === 0`, open in Complete state with Continue enabled and count-input hidden (the 0-case); (c) if `currentPage >= 20` AND `draft.siblings.length > 0`, open in Filling state with cards pre-populated from `draft.siblings` and Continue enabled if all cards are valid. Editing a pre-populated card and hitting Cancel returns to Initial (count cleared) without wiping `draft.siblings`.
      - Value `0` in the count input enables the Continue button immediately (button-state only, no draft write). The write to `draft.siblings = []` happens ONLY on Continue tap, matching every other page's on-Continue write semantics.
      - On Continue tap in Filling→Complete transition, the assembled `SiblingDraft[]` (matching the current in-progress card values) is serialized to `draft.siblings` via the existing `setSiblings` hook. `advance(20)` + `navigate('Page20MarriageTimeScreen')` follows the write.
      - Screen wiring test covers - Initial→Filling on non-zero count; Cancel from Filling→Initial with blank count and `draft.siblings` unchanged; count=0 immediate Continue-enable with write happening only on tap; each per-field validation inside `SiblingForm`; final serialization shape (all 5 fields present); back-nav re-hydration for both the 0-case (opens Complete) and the N>0 case (opens Filling pre-populated); the schemaVersion-2 discard path via a v1-on-disk fixture.
      - New labels under `onboarding.siblings.*` (page title, count prompt, add/cancel/continue) and `siblingForm.*` (per-field labels/placeholders/errors) in both `labels.en.json` and `labels.ur.json` with full parity.
    notes: "Actual sibling submission contract (embedded in PATCH vs. separate POST) is [Open] per §17.21; the client persists to draft and lets phase 11 wire the request."
