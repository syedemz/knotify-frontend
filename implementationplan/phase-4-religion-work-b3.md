phase: 4
title: Religion + work (B3, pages 9-11)
last_updated: 2026-07-19

context_summary: |
  Phase 4 captures religion + subsect (with a dynamic Islam-only subsect list), professional category, and work details (employment type, job title, employer, office address, salary range). It introduces the first dynamic-branch pattern (page 9's Islam-conditional subsect list) and the first multi-field validated form (page 11's work details).

stories:
  - id: 4.1
    title: Page 9 - Religion + dynamic subsect (Islam-only branch)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page09ReligionScreen` reads `options.religion` and renders a selectable list where the selected row shows a pink tick (per 12.jpeg pattern).
      - When `Islam` is selected, `options.islamicSubsect` slides in below via a catalog `ListRowSelectable` group; picking a subsect writes both `religion='Islam'` and `subsect=<pick>` and auto-advances.
      - When any other religion is selected, `subsect` is set to `"Not Applicable"` and the screen auto-advances immediately.
      - Back-navigating and changing from `Islam` + subsect to a non-Islam religion force-resets `subsect` to `"Not Applicable"` before advancing (reactive sanity check).
      - Both fields are treated as immutable-after-set in the draft.
      - Screen wiring test covers each of the four transitions - Islam+subsect happy path, non-Islam auto-advance, back-nav Islam-to-Christianity reset, forward-nav re-select same religion.
    notes: ""

  - id: 4.2
    title: Page 10 - Professional category (27-entry auto-advance list)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page10ProfessionalCategoryScreen` reads `options.professionalCategory` and renders all 27 entries.
      - Selected row is highlighted per 12.jpeg; tap writes `professional_category` to the draft and auto-advances to `Page11WorkDetailsScreen`.
      - No manual Continue button.
      - Screen wiring test covers list rendering count, selection highlight, and auto-advance.
    notes: ""

  - id: 4.3
    title: Page 11 - Work details (5 fields, all-required form)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page11WorkDetailsScreen` renders `employment_type` (pick-one from `options.employmentType`), `job_title` (`TextInput`, max 40, letters/digits/spaces/-/./,), `employer_name` (`TextInput`, max 50, same rule), `office_address` (multiline `TextInput`, max 150), `salary_range` (pick-one from `options.salaryRange`).
      - Field-level validation rules ship in `Helper/validationHelper.ts` with named exports covering each rule; unit tests cover boundary cases (empty, 40, 41 chars; invalid character rejection).
      - Continue is disabled until all five fields validate; on tap, all five write to the draft and the screen advances to `Page12EducationLevelScreen`.
      - Screen wiring test covers disabled-until-all-valid and successful advance.
    notes: ""
