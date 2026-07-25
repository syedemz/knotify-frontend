# Phase 7 brainstorm — Family (parents + siblings, B6, pages 18-19)

## 2026-07-26 brainstorm

Scope reviewed: `implementationplan/phase-7-family-b6.md` — stories 7.1 (Page 18 parents, 6 fields) and 7.2 (Page 19 siblings dynamic list). Findings ordered by severity: item 1 is a hard blocker (schema mismatch); items 2–5 are unresolved UX/validation ambiguities the subagent should not be inventing answers to; the rest are drift/reminder items.

### Blockers (must resolve before dispatch)

1. **`SiblingDraft` type is missing `gender` and `profession` fields.** Story 7.2 AC-2 requires each sibling entry to capture `name`, `gender`, `sibling_age`, `marital_status`, `profession` — five fields. The current type at `src/features/onboarding/draftSchema.ts:45-56` only has three: `{ name, age, maritalStatus }`. `gender` and `profession` are not present in `SiblingDraft`, so `setSiblings([...])` cannot type-check with the shape the story mandates. The story must either (a) extend `SiblingDraft` in `draftSchema.ts` as part of story 7.2 (bumping `schemaVersion` from 1 → 2 with a migration decision, since the docstring at `draftSchema.ts:6-9` says migration policy is deferred and to "decide before merge whether to migrate, discard, or prompt"); or (b) drop `gender` and `profession` from the AC. Recommend (a) with **discard** on schemaVersion bump — the draft is client-only and any user mid-onboarding when this ships will be sent back to page 1, which is acceptable given the pre-launch phase. **Add this decision to the PRD notes before dispatch**, otherwise the subagent has to make a schema-migration policy call unilaterally.

### Gaps in acceptance criteria

2. **Back-nav rendering state for Page 19 is undefined.** If the user completes Page 19 with count=3, advances to Page 20, then back-navs to Page 19, does the screen open in Initial (empty count input) or Filling (with the 3 saved SiblingForms pre-populated)? The AC lists Initial/Filling/Complete as sequential states but says nothing about round-trip. Precedent from Page 13 (education credentials) is to re-hydrate from the draft on mount. **Suggested clarification:** on mount, if `draft.siblings.length > 0`, open in Filling (or Complete) with cards pre-populated from `draft.siblings`; if `draft.siblings` was explicitly set to `[]` (count=0 case), open in Complete with Continue enabled and count-input hidden.

3. **`SiblingForm.profession` "sanity rule" is vague.** AC-2 says `profession (max 35, sanity rule)`. The codebase has two nearby validators: `isValidName` (max 35, letters/spaces/hyphens/apostrophes — the `name` field will use this) and `isValidOfficeAddress` (max-length only, no character class). Profession is more like a job title than a name — `fathers_job` / `mothers_job` on Page 18 will likely use a job-title validator. **Suggested resolution:** reuse whichever validator story 7.1 picks for `fathers_job` / `mothers_job` (see item 4), and reference it explicitly in 7.2 AC-2.

4. **Story 7.1 does not name validators for `fathers_job` / `mothers_job`.** AC-1 says "each max 40 chars with letters/spaces/hyphens/apostrophes validation." That character class matches `isValidName` (max 35) but the length differs. Phase 4 introduced `MAX_JOB_TITLE_LENGTH` for `job_title` — reuse it if the constant is 40, or introduce `isValidParentJob` mirroring the pattern set by `isValidCity` in phase 6. **Also worth flagging:** the AC says "letters/spaces/hyphens/apostrophes" for **jobs**, but real-world job titles include ampersands, commas, and periods ("Ph.D. researcher", "Marketing & Sales"). Cross-check with `job_title` validation from phase 4 story 4.3 (`isValidWorkText` per prior context) — if that validator already exists and permits these, use it. Otherwise the ACs are unrealistically strict for a job field. Confirm before dispatch.

5. **`options.yesNo = ["YES", "NO"]` (uppercase) — DB acceptance not verified.** Story 7.1 AC-2 uses `options.yesNo` for `father_retired` / `mother_retired`. `UserProfile.ts:112-114` and `:159-161` document these as TEXT columns (not boolean). The client will PATCH the literal strings `"YES"` / `"NO"`. No validation constraint on the backend has been checked against this casing. If the DB has a CHECK constraint expecting `"Yes"` / `"No"` or `"Retired"` / `"Working"`, phase 11's PATCH will fail. This is not a blocker for phase 7 (no PATCH happens here — writes go to the draft only), but it is an **unvalidated assumption** worth surfacing so it can be checked before phase 11 wires the request. Cross-reference: `has_children` and `move_abroad` also use `options.yesNo` in later phases but are stored as boolean, so those two will need string→boolean coercion at PATCH time regardless.

6. **Cancel semantics vs. previously-saved siblings.** AC for Page 19 says "Cancel returns to Initial with blank count" — this clearly describes the in-progress local state. What about `draft.siblings` if the user had previously completed the page (count=3), back-navved, then hit Cancel? Two readings: (a) Cancel discards only the in-progress edit and leaves `draft.siblings` intact (previous 3 preserved); (b) Cancel wipes both local state and `draft.siblings`. Option (a) matches user expectation ("cancel my edit, not my prior data"). **Suggested clarification:** Cancel resets in-progress form state without touching `draft.siblings`; only the final Continue (in Filling→Complete transition or count=0 immediate advance) writes.

7. **Value `0` write timing.** AC-3 says "value `0` in the count input immediately enables Continue and writes an empty siblings array." "Immediately" — is the write triggered on input change (count typed as 0) or on Continue tap? If on input change, then a user who types `0`, then changes their mind and types `2`, has an interim `setSiblings([])` write that is then followed by a per-sibling flow. This is fine but noisy. Recommend the write happens **on Continue tap only** for the 0 case (matching every other page's on-Continue write semantics); "immediately enables Continue" refers only to the button state, not the draft write.

### Dependency graph

8. **Both stories declare `depends_on: []`.** Technically correct — Page 19 does not read anything Page 18 wrote — but wizard order is 18→19 and the smoke-check story order matters. Not a plan defect (execution is serial per workspace rule). Flagging so the subagent does not treat the empty array as license to reorder.

9. **Story 7.2 has no explicit dependency on schemaVersion bump (item 1).** If item 1 is resolved by extending `SiblingDraft` inside story 7.2 itself, then 7.2 also touches `draftSchema.ts` and `useOnboardingDraft.tsx` (the `setSiblings` typing will propagate). Story 7.1 does NOT touch the draft schema. No inter-story dependency, but the subagent for 7.2 needs to understand the schema change is in-scope.

### Drift since plan authored

10. **Draft-store refactor (2026-07-25, PR #92).** Same as phase 6 — `useOnboardingDraft` is a Context/Provider; all screen wiring tests must mock `OnboardingDraftProvider: ({ children }) => children` passthrough. Not in the PRD. The subagent will discover it by pattern-matching against `Page17FamilyResidenceScreen.test.tsx`.

11. **Android dev-build workflow (2026-07-25, PR #91).** On-device verification uses `npx expo run:android` and `adb shell pm clear com.knotify.app` to wipe secure-store. Covered by CLAUDE.md/context.md load — reminder only.

12. **`src/features/onboarding/components/` exists as of phase 6.** Story 7.2's `SiblingForm` should live at `src/features/onboarding/components/SiblingForm.tsx` (or a subfolder if the form is decomposed into row components). The PRD calls it "feature-local" — good; the folder is already there.

### Downstream navigation

13. **Story 7.1 advances to `Page19SiblingsScreen`; story 7.2 advances to `Page20MarriageTimeScreen`.** Page 20 does not exist yet — it is a phase-8 story. `OnboardingStack` has a placeholder for Page 20 (per phase-2 pattern), so `navigation.navigate('Page20MarriageTimeScreen')` will resolve to the placeholder without crashing. Flagging so the subagent does not chase a missing route.

### Labels

14. **No phase-7 labels exist yet.** `onboarding.parents.*`, `onboarding.siblings.*` (and any sub-form field labels like `siblingForm.name.label`, `siblingForm.gender.title`, etc.) are all absent from `labels.en.json` and `labels.ur.json`. The parity Jest test enforces every EN key has a UR key. Standard reminder.
