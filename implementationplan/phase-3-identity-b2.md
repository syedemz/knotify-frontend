phase: 3
title: Identity - sex, name, birthday, first checkpoint (B2, pages 5-8)
last_updated: 2026-07-23

context_summary: |
  Phase 3 delivers the first identity fields (`sex`, `first_name`, `last_name`, `username`, `birthday`) and the first checkpoint marker. It also introduces the cross-platform DatePicker validation surface for birthday. After this phase the wizard progress bar becomes visible from page 5 onward, and the first-checkpoint boundary is durable across app kills so a resumed session lands directly on page 9.

  During onboarding, all fields (including `sex`) remain freely editable via back-navigation — a user who mis-taps Male on page 5 can back-navigate and tap Female. Backend-side immutability (fields the API treats as write-once, e.g. `sex`) is enforced at phase 11's final PATCH via `Helper/immutableFieldHelper.ts` (introduced here) — phase 3 only introduces the predicate; the PATCH-builder that consumes it is built in phase 11.

stories:
  - id: 3.1
    title: Page 5 - Sex tile picker (auto-advance, editable on back-nav)
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 82
    acceptance_criteria:
      - `Page05SexScreen` renders two tappable tiles using `images.onboarding.genderMale` + label "Male" and `images.onboarding.genderFemale` + label "Female" per §11.2.1 row 5.
      - Values `Male` and `Female` are imported via a new `src/config/options/index.ts` barrel that re-exports the existing `src/config/options/gender.json` as `options.gender` (`string[]`). Screen imports as `import { options } from '@/config/options'` and reads `options.gender` — never inlined.
      - Selecting a tile writes `sex` to the onboarding draft (via `useOnboardingDraft().update`), calls `useOnboardingDraft().advance(6)` to advance the draft's `currentPage` pointer, and then navigates to `Page06NameScreen`. No explicit Continue button.
      - Back-navigating to page 5 after a prior selection leaves BOTH tiles tappable. Tapping the opposite tile overwrites `sex` in the draft and re-triggers `advance(6)` + navigation. No confirmation dialog, no locked-tile UX.
      - Verify `OnboardingDraft.sex` is typed `'Male' | 'Female' | undefined` in `draftSchema.ts`. If it is currently typed `string` or wider, tighten it (and update any consumer that breaks).
      - Introduce `src/Helper/immutableFieldHelper.ts` exporting `isImmutable(field: keyof UserProfileWritable): boolean`. Returns `true` for `sex` (and any other fields already known to be frozen post-first-write in the profile schema); `false` otherwise. This predicate has no consumer in phase 3 — it is consumed by phase 11's PATCH-builder. Unit tests cover `sex → true` and a representative mutable field → `false`.
      - Screen wiring tests cover: (a) both tiles render with the correct label + image; (b) tapping a tile writes `sex`, advances `currentPage` to 6, and navigates to `Page06NameScreen`; (c) seeding the draft with `sex=Male`, mounting the screen, and tapping Female overwrites the draft and re-navigates.
    notes: ""

  - id: 3.2
    title: Page 6 - Name inputs + client-side username generation
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 83
    acceptance_criteria:
      - `Page06NameScreen` renders two catalog `TextInput`s for `first_name` and `last_name`, each with `maxLength=35`.
      - `Helper/validationHelper.ts` gains `isValidName(s: string): boolean`. Rules: only `[A-Za-z]`, space, hyphen, apostrophe; no leading/trailing whitespace; length 1-35. Unit tests cover accept (`"Marie"`, `"Marie-Claire"`, `"O'Brien"`, `"Van Der Berg"`) and reject (`" Marie"`, `"Marie "`, `""`, `"Marie1"`, `"Marie!"`, 36-char string) cases.
      - Create `src/Helper/usernameHelper.ts` exporting: (a) `sanitizeNamePart(s: string): string` — lowercases input and strips everything not in `[a-z]` (drops spaces, hyphens, apostrophes, and diacritics via NFD-normalize-then-strip); (b) `generateUsername(first: string, last: string): string` — returns `sanitizeNamePart(first) + sanitizeNamePart(last) + <4 random digits from [0-9]>`. Unit tests cover: `"Marie-Claire"` → `"marieclaire"`, `"O'Brien"` → `"obrien"`, `"Zoë"` → `"zoe"`, and a regex assertion that `generateUsername` output matches `/^[a-z]{2,}[0-9]{4}$/` (i.e., at least two lowercase letters total across the two sanitized name parts, followed by exactly 4 digits).
      - On Continue: call `generateUsername(first_name, last_name)`, write all three fields (`first_name`, `last_name`, `username`) to the draft via `useOnboardingDraft().update`, call `useOnboardingDraft().advance(7)`, and navigate to `Page07BirthdayScreen`.
      - Continue is disabled unless BOTH `isValidName(first_name)` AND `isValidName(last_name)` return `true`.
      - Screen wiring tests cover: (a) invalid input keeps Continue disabled; (b) valid input enables Continue; (c) tap Continue writes `first_name` + `last_name` + `username` to draft, advances `currentPage` to 7, and navigates to `Page07BirthdayScreen`; (d) generated `username` matches the regex above.
    notes: "Username uniqueness is enforced by the backend on final PATCH; a 409 on collision triggers regeneration on the final page (phase 11)."

  - id: 3.3
    title: Page 7 - Birthday DatePicker + age preview + validation
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 84
    acceptance_criteria:
      - `Page07BirthdayScreen` renders `images.onboarding.banner` and uses the catalog `DatePicker` from phase 1 (`src/components/DatePicker.tsx`).
      - Create `src/Helper/dateHelper.ts` exporting `isAtLeast18(iso: string, today?: string): boolean`, `isNotFuture(iso: string, today?: string): boolean`, `isYearReasonable(iso: string): boolean` (year in `[1900, current_year]`), `age(iso: string, today?: string): number` (completed years), and `validateBirthday(iso: string, today?: string): LabelKey | null` (composite that returns the first failing label key, or `null` if all pass). Every function that reads "today" MUST accept an optional `today` parameter (defaulting to `new Date().toISOString().slice(0, 10)`) so tests can inject boundary dates deterministically.
      - Live age preview below the DatePicker displays `dateHelper.age(iso)` using a new label key (e.g. `onboarding.birthday.agePreview`) with source string `"{age} years"` (Urdu parity required). Interpolation is done at render time via `.replace('{age}', String(age))` per the established convention from story 2.6 (labels resolver has no built-in interpolation). No free strings in the screen.
      - Continue is disabled while `validateBirthday(iso)` returns a non-null LabelKey (inline error rendered from the LabelKey); enabled otherwise. On tap: write `birthday` to the draft via `useOnboardingDraft().update`, call `useOnboardingDraft().advance(8)`, and navigate to `Page08FirstCheckpointScreen`.
      - Unit tests cover each dateHelper predicate at boundary cases with injected `today`: `isAtLeast18` at 17y364d (false), 18y0d (true); `isNotFuture` at today (true), today+1 (false); `isYearReasonable` at 1899 (false), 1900 (true); `age` at 17y364d (17), 18y0d (18); `validateBirthday` returns the correct LabelKey for each failure mode and `null` for valid input.
      - Screen wiring test covers valid-birthday continue (advances draft + navigates) and invalid-birthday inline error rendering.
    notes: ""

  - id: 3.4
    title: Page 8 - First checkpoint marker
    agent: frontenddeveloper
    done: true
    depends_on: [3.3]
    tracking_issue: 85
    acceptance_criteria:
      - `Page08FirstCheckpointScreen` renders `images.onboarding.banner` with no taglines and a `Start` button enabled by default.
      - On tap: call `useOnboardingDraft().advanceWithCheckpoint(9, 'firstCheckpoint')` (this both sets `lastCheckpoint` to `'firstCheckpoint'` — with non-regression already enforced by `resolveCheckpoint` in `useOnboardingDraft.ts` — AND advances the draft's `currentPage` to 9, so no separate `advance()` call is required), then navigate to `Page09ReligionSubsectScreen`.
      - Killing and relaunching the app after passing this checkpoint mounts the stack directly at `Page09ReligionSubsectScreen` (via the existing `useCheckpointResume` initial-route wiring) with all captured fields (`sex`, `first_name`, `last_name`, `username`, `birthday`) pre-filled in the draft. Verified by an integration test that seeds `secureStorage` with a draft carrying `lastCheckpoint: 'firstCheckpoint'` plus all phase 3 fields, remounts the navigator, and asserts (a) mounted route === `Page09ReligionSubsectScreen`, (b) `useOnboardingDraft().getDraft()` returns the seeded values.
      - Screen wiring test covers: (a) tap Start calls `advanceWithCheckpoint(9, 'firstCheckpoint')` and navigates to `Page09ReligionSubsectScreen`; (b) subsequent back-navigation from a downstream page does NOT regress `lastCheckpoint` (relies on existing `resolveCheckpoint` invariant — this is a wiring test, not a new invariant).
    notes: ""
