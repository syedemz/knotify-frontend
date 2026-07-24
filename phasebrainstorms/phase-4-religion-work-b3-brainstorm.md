# Phase 4 brainstorm — Religion + work (B3, pages 9-11)

## 2026-07-24 11:20 brainstorm (re-run after PRD update)

User answered all 11 open questions from the QA cycle (all Option A). The PRD (`implementationplan/phase-4-religion-work-b3.md`) has been updated to:

- Fix screen name to `Page09ReligionSubsectScreen` (matches OnboardingStack placeholder).
- Reconcile the draft-vs-server immutability contradiction — draft is editable in phase 4; `IMMUTABLE_FIELDS` is phase-11 PATCH-builder metadata only.
- State explicit advance targets on stories 4.1 (`Page10ProfessionalCategoryScreen`) and 4.2 (`Page11WorkDetailsScreen`).
- Widen the story-4.3 character rule for `job_title`/`employer_name` to include `&` and `'`.
- Mark story-4.3 maxLengths (40/50/150) as db-schema-verified during implementation, with instruction to update `notes:` if the schema differs.
- Require inline per-field validation errors on story 4.3 (Page 02 pattern).
- Extend story-4.3 boundary tests to `employer_name` (50/51) and `office_address` (150/151), not just `job_title`.
- Assert story-4.2 list length via `options.professionalCategory.length`, never a hardcoded count.
- Add story-4.2 back-nav overwrite behavior.
- Add story-4.1 same-religion re-tap = no-op, and forward-nav religion swap clears subsect.
- Spell out import path `@/config/options` throughout.
- Clarify Urdu-locale tile display (English strings, per architecture §5.3).

Re-audit against the updated PRD:

- Screen names, import paths, advance targets, character rules, maxLength policy, inline-error policy, boundary tests, back-nav behavior, and forward-nav edge cases are all now explicit and testable.
- All three stories remain `depends_on: []` — structurally sound (each screen's placeholder is already registered in `OnboardingStack.tsx`, so navigation-target tests work independently).
- No smuggling of phase-5+ scope — `Page12EducationLevelScreen` is referenced only as a navigation target (its placeholder is enough for phase-4 tests).
- Minor open items (not blockers): label keys for screen titles / field labels / error messages are not enumerated — implementer will invent them and add Urdu parity, consistent with the pattern established in phases 2–3. `salary_range` and `employment_type` render mode (RadioGroup vs. BottomSheet vs. Select) is not stated — implementer picks a catalog component.

**Verdict: PRD is ready to execute. No open blockers.**

### 2026-07-24 11:35 addendum — minor items resolved

User asked to address the two minor items called out above. PRD now includes:

- Story 4.1: label keys `onboarding.religion.title` and `onboarding.religion.subsectTitle` (Urdu parity required).
- Story 4.2: label key `onboarding.professionalCategory.title` (Urdu parity required).
- Story 4.3: render mode fixed — `employment_type` and `salary_range` both use catalog `Select` component (opens a `BottomSheet` picker), keeping the 5-field form compact. Full label-key inventory enumerated for page 11: 1 title, 10 field label+placeholder pairs, 10 per-field error keys.

No further gaps. Proceeding to Step 1.

## 2026-07-24 10:00 brainstorm

Audit of `implementationplan/phase-4-religion-work-b3.md` against the current codebase (post-phase-3 merge).

### Screen-name drift (blocker)

- **Story 4.1** calls the screen `Page09ReligionScreen`, but the placeholder registered in `src/navigation/OnboardingStack.tsx` (line 67, 134) is `Page09ReligionSubsectScreen`. Implementer must use `Page09ReligionSubsectScreen` to avoid a divergent second screen. Update the PRD to match.

### External dependencies — all validated

- `options.religion`, `options.islamicSubsect`, `options.professionalCategory`, `options.employmentType`, `options.salaryRange` all exist in `src/config/options/index.ts`. **Note:** the PRD says "reads `options.religion`" without an import path; the correct import is `@/config/options`, not `@/labels`. Worth calling out in acceptance criteria so the implementer does not guess.
- Catalog components `ListRowSelectable`, `SelectionTile`, `TextInput`, `WizardHeader/Footer` all exist ✓
- `Page09ReligionSubsectScreen`, `Page10ProfessionalCategoryScreen`, `Page11WorkDetailsScreen`, `Page12EducationLevelScreen` all registered as placeholders in `OnboardingStack.tsx` ✓
- `Helper/validationHelper.ts` exists (isValidEmail, isSixDigitCode, passwordMeetsCognitoPolicy, isValidName). Story 4.3 will append field-level validators.
- `DraftFields` (Partial<Omit<UserProfileWritable,'sex'>> & {sex?}) already permits writes to religion, subsect, professional_category, employment_type, job_title, employer_name, office_address, salary_range ✓
- `IMMUTABLE_FIELDS` in `src/Helper/immutableFieldHelper.ts` already includes `religion` + `subsect` (added in phase 3) ✓ — nothing new to add.

### Contradiction to reconcile (story 4.1)

Story 4.1 has **two acceptance criteria that pull in opposite directions**:

1. "Back-navigating and changing from Islam + subsect to a non-Islam religion **force-resets subsect to Not Applicable** before advancing (reactive sanity check)."
2. "Both fields are **treated as immutable-after-set** in the draft."

If religion + subsect are immutable in the draft, the user cannot back-nav and change them, so criterion (1) is unreachable. The consistent model per phase-3's design intent is: **`isImmutable()` metadata is for phase-11's PATCH-builder** (skips frozen fields at server-submit time), **not a draft-writer guard**. So the draft is still mutable in-session. Recommend rewording criterion (2) to something like: "religion + subsect participate in `isImmutable()` metadata used by phase 11's PATCH-builder — no in-draft enforcement in phase 4."

If the intent was actually "draft-level lock once written," criterion (1) must be dropped and back-nav to page 9 must be blocked (currently isn't).

### Missing advance targets

- Story 4.1: "auto-advances" → to `Page10ProfessionalCategoryScreen` (implied, not stated).
- Story 4.2: "auto-advances" → to `Page11WorkDetailsScreen` (implied, not stated).
- Story 4.3: does state `Page12EducationLevelScreen` ✓.

Explicit is better — one-line fix per story.

### Story 4.1 additional gaps

- No stated behavior for **re-tapping the same religion** (idempotent no-op vs. reset). Recommend: no-op.
- No stated behavior for **tapping a different religion while a subsect is already selected in a *forward* nav flow** (e.g. Islam + subsect A → user taps Sunni again vs. taps Christianity). The Christianity-reset bullet covers back-nav; forward-nav flow deserves its own bullet.
- Islamic subsect list appearance ("slides in below") is aesthetic — implementer can pick reasonable animation; no test target. Fine as-is.

### Story 4.2 additional gaps

- No stated behavior on **back-nav overwrite** of `professional_category`. `professional_category` is NOT in `IMMUTABLE_FIELDS` (per `immutableFieldHelper.ts`), so overwrite should be a plain replace. Add a sentence.
- "27 entries" — this is a magic number that depends on `options.professionalCategory.json`. Story test should be `expect(items).toHaveLength(options.professionalCategory.length)` rather than hardcoding 27, otherwise adding an entry to the JSON silently breaks the test.

### Story 4.3 additional gaps

- **Field maxLengths (40/50/150) are asserted without source citation.** `db-schema.json` is the source of truth for column widths. If DB uses `TEXT` these numbers are UI-choice-only; if `VARCHAR(N)`, they must match `N`. Cite the source in the PRD or spot-check `knotify-backend/db-schema.json` before implementation.
- **Allowed-character rule** for `job_title` / `employer_name` is `letters/digits/spaces/-/./,`. Real employer names commonly include `&` (P&G, Johnson & Johnson) and `'` (Macy's). This rule will reject valid inputs. Recommend adding `&` and `'` (matching `isValidName` for apostrophe).
- `office_address` has no character rule stated, only `maxLength=150`. Confirm intent: any printable character allowed?
- **Boundary tests are only specified for `job_title` (empty, 40, 41).** Should say "boundary tests for each length-limited field."
- No mention of **inline error-message rendering per field** (Page02 pattern with labels). Continue is disabled — that's the gate — but users need to see *why*. Consistency call: add "each field shows inline validation error keyed off a `LabelKey`."
- Label keys are unspecified. Story 4.3 will need `onboarding.work.*` keys (title, five field labels + placeholders + error messages). PRD does not enumerate — implementer will invent, which is fine but worth flagging so Urdu parity gets added in the same commit.

### depends_on review

- All three stories are `depends_on: []`. Structurally correct: the three screens are already registered as placeholders in `OnboardingStack.tsx`, so navigation between them works before implementation. In-story order (4.1 → 4.2 → 4.3) matches user flow but no story depends on another's exported code.
- No smuggling from future phases: story 4.3 references `Page12EducationLevelScreen` only as a navigation target — the actual screen implementation is phase 5, and the current placeholder is enough for phase-4 tests to assert "navigate was called with Page12EducationLevelScreen."

### Localization gap (not necessarily a blocker)

- Options come from `src/config/options/*.json` as raw English strings (per architecture §5.3). On the Urdu locale, tile labels will display in English. Phase 4 does not mention this — is it intentional (phase-4 English-only for tiles, deferred localization)? If yes, no action; if no, story 4.1 / 4.2 need an Urdu-tile-label plan.

### Summary — pick one

- **address** — resolve the story 4.1 contradiction (immutable vs. reset), fix screen name to `Page09ReligionSubsectScreen`, add explicit advance targets, expand character rule for job_title/employer_name (`&` + `'`), decide on inline-error rendering for page 11, decide on localization stance for tile options. Then re-run `/implement-phase 4`.
- **proceed** — I will dispatch subagents against the current PRD; each subagent will resolve ambiguities locally and I will surface those decisions in the completion summary. Screen-name drift will be corrected at dispatch time in the brief.
