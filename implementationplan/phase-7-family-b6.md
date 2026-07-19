phase: 7
title: Family - parents + siblings (B6, pages 18-19)
last_updated: 2026-07-19

context_summary: |
  Phase 7 captures parents (page 18) and the dynamic sibling list (page 19). Introduces the `SiblingForm` sub-form pattern with count-then-fill-then-cancel-discards UX per §11.2.3.

stories:
  - id: 7.1
    title: Page 18 - Parents (6 fields)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page18ParentsScreen` renders four catalog `TextInput`s (`fathers_name`, `fathers_job`, `mothers_name`, `mothers_job`) each max 40 chars with letters/spaces/hyphens/apostrophes validation.
      - Two pick-ones from `options.yesNo` capture `father_retired` and `mother_retired`.
      - Continue is disabled until all six fields validate; on tap all six write to the draft and advance to `Page19SiblingsScreen`.
      - Screen wiring test covers each field's validation gate and the aggregate Continue enable.
    notes: ""

  - id: 7.2
    title: Page 19 - Siblings dynamic list (0-4 count then N sub-forms)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page19SiblingsScreen` state machine matches §11.2.3 - Initial (count input, 0-4 inclusive, negatives/>4 blocked), Filling (count hidden, N `<SiblingForm />` cards in a `ScrollView`, Continue disabled until all valid, Cancel returns to Initial with blank count), Complete (Continue enabled, on tap serializes to `onboardingDraft.siblings`).
      - `SiblingForm` (feature-local component) captures `name` (max 35, letters/spaces/hyphens/apostrophes), `gender` (pick-one from `options.gender`), `sibling_age` (0-99), `marital_status` (pick-one from `options.maritalStatus`), `profession` (max 35, sanity rule).
      - Value `0` in the count input immediately enables Continue and writes an empty siblings array.
      - Screen wiring test covers each state transition (Initial->Filling, Cancel from Filling->Initial with cleared draft, count=0 immediate advance), all field validations, and final serialization shape.
    notes: "Actual sibling submission contract (embedded in PATCH vs. separate POST) is [Open] per §17.21; the client persists to draft and lets phase 11 wire the request."
