phase: 4
title: Religion + work (B3, pages 9-11)
last_updated: 2026-07-24 (story 4.3)

context_summary: |
  Phase 4 captures religion + subsect (with a dynamic Islam-only subsect list), professional category, and work details (employment type, job title, employer, office address, salary range). It introduces the first dynamic-branch pattern (page 9's Islam-conditional subsect list) and the first multi-field validated form (page 11's work details).

  All option lists (`religion`, `islamicSubsect`, `professionalCategory`, `employmentType`, `salaryRange`) are already registered in `src/config/options/index.ts` and MUST be imported from `@/config/options` — never inlined in a screen.

  Screens `Page09ReligionSubsectScreen`, `Page10ProfessionalCategoryScreen`, `Page11WorkDetailsScreen`, and the phase-5 target `Page12EducationLevelScreen` are already registered as placeholders in `src/navigation/OnboardingStack.tsx`. Use these exact screen names.

  `religion` and `subsect` are already listed in `IMMUTABLE_FIELDS` (see `src/Helper/immutableFieldHelper.ts`). That predicate is metadata consumed by phase 11's PATCH-builder to skip already-frozen fields at server-submit time; it is NOT a draft-writer guard. The onboarding draft remains freely editable during the wizard — back-navigation may overwrite any draft field.

  Tile labels on pages 9 and 10 display the raw English option values regardless of active locale, per architecture §5.3 (options are literal DB values). Urdu translation of option values is out of scope for phase 4.

stories:
  - id: 4.1
    title: Page 9 - Religion + dynamic subsect (Islam-only branch)
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 22
    acceptance_criteria:
      - `Page09ReligionSubsectScreen` (exact name — matches the placeholder already registered in `src/navigation/OnboardingStack.tsx`) reads `options.religion` from `@/config/options` and renders a selectable list where the selected row shows a pink tick (per 12.jpeg pattern). Screen title uses label key `onboarding.religion.title`; subsect section heading (when Islam is picked) uses `onboarding.religion.subsectTitle`. Both keys are added to `labels.en.json` and `labels.ur.json` with Urdu parity.
      - When `Islam` is selected, `options.islamicSubsect` from `@/config/options` slides in below via a catalog `ListRowSelectable` group; picking a subsect writes both `religion='Islam'` and `subsect=<pick>` to the draft and auto-advances to `Page10ProfessionalCategoryScreen`.
      - When any other religion is selected, `subsect` is set to `"Not Applicable"` in the draft and the screen auto-advances immediately to `Page10ProfessionalCategoryScreen`.
      - Re-tapping the currently-selected religion row is a no-op (no draft write, no navigation, no subsect reset).
      - Tapping a different religion row on the same screen (forward-nav — user has picked Islam + a subsect, then taps Christianity without leaving the screen) clears any previously-picked subsect from the draft; if the newly-tapped religion is non-Islam, `subsect` is set to `"Not Applicable"` and the screen auto-advances to `Page10ProfessionalCategoryScreen`; if the newly-tapped religion is Islam again, the subsect list re-appears empty of selection.
      - Back-navigating to Page 9 and changing from `Islam` + subsect to a non-Islam religion force-resets `subsect` to `"Not Applicable"` before advancing (reactive sanity check).
      - Draft-level editability: religion + subsect are freely writable in the draft during phase 4. Their entries in `IMMUTABLE_FIELDS` (`src/Helper/immutableFieldHelper.ts`) are metadata consumed by phase 11's PATCH-builder only — no draft-writer guard is added in phase 4.
      - Screen wiring tests cover: (a) Islam+subsect happy path with correct advance target, (b) non-Islam auto-advance with correct advance target, (c) back-nav Islam→Christianity subsect reset, (d) forward-nav re-tap of same religion is a no-op, (e) forward-nav Islam+subsect→Christianity clears subsect and auto-advances.
    notes: ""

  - id: 4.2
    title: Page 10 - Professional category (auto-advance list)
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 23
    acceptance_criteria:
      - `Page10ProfessionalCategoryScreen` reads `options.professionalCategory` from `@/config/options` and renders every entry (do NOT hardcode the count in code or tests). Screen title uses label key `onboarding.professionalCategory.title`, added to `labels.en.json` and `labels.ur.json` with Urdu parity.
      - Selected row is highlighted per 12.jpeg; tap writes `professional_category` to the draft and auto-advances to `Page11WorkDetailsScreen`.
      - No manual Continue button.
      - On back-navigation to page 10, tapping any row overwrites `professional_category` in the draft with the new value and auto-advances as normal. (`professional_category` is NOT in `IMMUTABLE_FIELDS`, so overwrite is a plain replace.)
      - Screen wiring test asserts list length via `expect(items).toHaveLength(options.professionalCategory.length)` (not a hardcoded number), covers selection highlight, and covers auto-advance to the correct target with correct draft write.
    notes: ""

  - id: 4.3
    title: Page 11 - Work details (5 fields, all-required form)
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 24
    acceptance_criteria:
      - `Page11WorkDetailsScreen` renders `employment_type` (catalog `Select` component driven by `options.employmentType` via `@/config/options` — tap opens a `BottomSheet` picker so the form stays compact), `job_title` (`TextInput`), `employer_name` (`TextInput`), `office_address` (multiline `TextInput`), `salary_range` (catalog `Select` component driven by `options.salaryRange` via `@/config/options` — same BottomSheet-picker pattern).
      - Label keys for page 11 (all added to `labels.en.json` and `labels.ur.json` with Urdu parity): `onboarding.work.title`, `onboarding.work.employmentType.label`, `onboarding.work.employmentType.placeholder`, `onboarding.work.jobTitle.label`, `onboarding.work.jobTitle.placeholder`, `onboarding.work.employerName.label`, `onboarding.work.employerName.placeholder`, `onboarding.work.officeAddress.label`, `onboarding.work.officeAddress.placeholder`, `onboarding.work.salaryRange.label`, `onboarding.work.salaryRange.placeholder`, and per-field error keys `onboarding.work.errors.jobTitle.tooLong`, `onboarding.work.errors.jobTitle.invalidChars`, `onboarding.work.errors.jobTitle.required`, `onboarding.work.errors.employerName.tooLong`, `onboarding.work.errors.employerName.invalidChars`, `onboarding.work.errors.employerName.required`, `onboarding.work.errors.officeAddress.tooLong`, `onboarding.work.errors.officeAddress.required`, `onboarding.work.errors.employmentType.required`, `onboarding.work.errors.salaryRange.required`.
      - **Field maxLengths MUST be verified against `knotify-backend/db-schema.json` during implementation.** Target values: `job_title` = 40, `employer_name` = 50, `office_address` = 150. If the db-schema column widths differ, use the schema values and update this PRD's `notes:` with the corrected numbers before flipping `done: true`.
      - Character rule for `job_title` and `employer_name`: allow `[A-Za-z]`, digits, spaces, hyphen (`-`), period (`.`), comma (`,`), ampersand (`&`), apostrophe (`'`). Reject leading/trailing whitespace. This rule accommodates real employers like `P&G`, `AT&T`, `Macy's`, `O'Reilly Media`.
      - Character rule for `office_address`: any printable character (no character restriction beyond `maxLength`).
      - Field-level validation rules ship in `src/Helper/validationHelper.ts` with named exports (one per rule). Unit tests cover boundary cases (empty, at-max, over-max by one) for **each length-limited field** (job_title 40/41, employer_name 50/51, office_address 150/151) and invalid-character rejection for the two fields with character rules.
      - Inline per-field validation errors are rendered (matching the Page 02 email/password pattern) — each field displays its own error `LabelKey` beneath it when invalid, so the user knows why Continue is disabled.
      - Continue is disabled until all five fields validate; on tap, all five values write to the draft and the screen advances to `Page12EducationLevelScreen`.
      - Screen wiring test covers: disabled-until-all-valid, inline error rendering per field, successful advance to `Page12EducationLevelScreen` on tap with all fields written to the draft.
    notes: |
      db-schema.json verified 2026-07-24: all string columns are TEXT (unbounded) — the schema explicitly states
      "All string columns are TEXT (unbounded); frontend imposes its own max lengths". No column-level max widths
      exist for job_title, employer_name, or office_address. The PRD target values (job_title=40, employer_name=50,
      office_address=150) are therefore the authoritative frontend limits and were used as-is.
