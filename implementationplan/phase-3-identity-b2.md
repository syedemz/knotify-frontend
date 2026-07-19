phase: 3
title: Identity - sex, name, birthday, first checkpoint (B2, pages 5-8)
last_updated: 2026-07-19

context_summary: |
  Phase 3 delivers the first identity fields (`sex`, `first_name`, `last_name`, `username`, `birthday`) and the first checkpoint marker. It also introduces the cross-platform DatePicker validation surface for birthday. After this phase the wizard progress bar becomes visible from page 5 onward, and the first-checkpoint boundary is durable across app kills so a resumed session lands directly on page 9.

stories:
  - id: 3.1
    title: Page 5 - Sex tile picker (auto-advance, immutable)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page05SexScreen` renders two tappable tiles using `images.onboarding.genderMale` + label "Male" and `images.onboarding.genderFemale` + label "Female" per §11.2.1 row 5.
      - Values `Male` and `Female` come from `options.gender` (never inlined in the screen).
      - Selecting a tile writes `sex` to the onboarding draft and auto-advances to `Page06NameScreen` with no explicit Continue button.
      - Once selected, the field is treated as immutable-after-set in the draft (recorded by `Helper/immutableFieldHelper.ts` predicate; not sent as writable on retry navigation to this page).
      - Screen wiring test covers tile rendering, draft update on select, and auto-advance.
    notes: ""

  - id: 3.2
    title: Page 6 - Name inputs + client-side username generation
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page06NameScreen` renders two catalog `TextInput`s for `first_name` and `last_name`, each with `maxLength=35`.
      - Validation via `Helper/validationHelper.ts` rejects digits, special characters, and leading/trailing whitespace; only letters, spaces, hyphens, apostrophes pass.
      - `username` is generated on Continue as `sanitize(first_name) + sanitize(last_name) + <4-digit alphanumeric>` and written to the draft.
      - Continue is disabled until both names pass validation.
      - Screen wiring test covers validation rejection cases, username generation format (regex check), and Continue navigation to `Page07BirthdayScreen`.
    notes: "Username uniqueness is enforced by the backend on final PATCH; a 409 on collision triggers regeneration on the final page (phase 11)."

  - id: 3.3
    title: Page 7 - Birthday DatePicker + age preview + validation
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page07BirthdayScreen` renders `images.onboarding.banner` and uses the catalog `DatePicker` from phase 1.
      - `Helper/dateHelper.ts` exports `isAtLeast18(iso, today)`, `isNotFuture(iso, today)`, `isYearReasonable(iso)`, and a `validateBirthday(iso)` composite returning `LabelKey | null`.
      - Live age preview below the picker calls `dateHelper.age(iso)`.
      - Continue is disabled while `validateBirthday` returns a non-null LabelKey; enabled otherwise; on tap writes `birthday` to the draft and advances to `Page08FirstCheckpointScreen`.
      - Unit tests cover each dateHelper predicate at boundary cases (17y364d, 18y0d, today, 1899, 1900).
      - Screen wiring test covers valid-birthday advance and invalid-birthday inline error.
    notes: ""

  - id: 3.4
    title: Page 8 - First checkpoint marker
    agent: frontenddeveloper
    done: false
    depends_on: [3.3]
    acceptance_criteria:
      - `Page08FirstCheckpointScreen` renders `images.onboarding.banner` with no taglines and a `Start` button enabled by default.
      - On tap, the draft's `lastCheckpoint` is updated to `firstCheckpoint` via `useOnboardingDraft().advance(firstCheckpoint)` and the screen navigates to `Page09ReligionScreen`.
      - Killing and relaunching the app after passing this checkpoint mounts the stack directly at the page after 8 with all captured fields pre-filled (verified by an integration test that seeds the draft and remounts the navigator).
      - Screen wiring test covers checkpoint write on advance and non-regression of `lastCheckpoint` on subsequent back navigation.
    notes: ""
