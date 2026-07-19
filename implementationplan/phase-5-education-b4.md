phase: 5
title: Education + second checkpoint (B4, pages 12-14)
last_updated: 2026-07-19

context_summary: |
  Phase 5 captures education level (page 12), the dynamic education credentials form driven by page 12's selection (page 13), and the second checkpoint that also collects notification + location permissions (page 14). Introduces the education branch matrix from §11.2.3 and the centralized permissions surface from §11.2.5.

stories:
  - id: 5.1
    title: Page 12 - Education level (drives page 13's branch)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page12EducationLevelScreen` reads `options.educationLevel` (5 entries) and renders a selectable list.
      - Tap writes `education_level` to the draft and auto-advances to `Page13EducationCredentialsScreen`.
      - Back-navigation from page 13 to page 12 is supported; changing the selection triggers page 13's re-mount reconciliation (implemented in 5.2).
      - Screen wiring test covers auto-advance and write.
    notes: ""

  - id: 5.2
    title: Page 13 - Dynamic education credentials form
    agent: frontenddeveloper
    done: false
    depends_on: [5.1]
    acceptance_criteria:
      - `Page13EducationCredentialsScreen` renders the fields for the selected `education_level` per the branch matrix in §11.2.3; hidden branches are set to their default sentinels (`"Not Applicable"`, `0`).
      - Text-field validation (letters/digits/spaces/-/./&/,, max 40) and year-field validation (numeric, 4 digits, 1950 ≤ y ≤ current year) live in `Helper/validationHelper.ts` with unit tests at boundary values.
      - Continue is disabled until every visible field validates.
      - On mount, if the draft's `education_level` maps to a lesser level than what page 13's current field-set represents (user went back and downgraded), the now-irrelevant fields (`highest_degree`, `graduation_year`, `college_name`, etc.) reset to defaults before the screen re-mounts.
      - Screen wiring test covers each of the 5 branch matrix rows including auto-default of hidden fields, the back-nav downgrade reset, and Continue navigation to `Page14SecondCheckpointScreen`.
    notes: ""

  - id: 5.3
    title: Page 14 - Second checkpoint + notification + location permissions
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page14SecondCheckpointScreen` renders no background image and a prompt "Enable Notifications".
      - `src/services/permissions/index.ts` is created with a typed `requestNotificationPermission()` (`expo-notifications`) and `requestLocationPermission()` (`expo-location`, whenInUse). No screen calls the SDKs directly.
      - Tap on "Enable Notifications" sequentially requests notification then location permission; both results are written to draft (`notification_permission_status`, `location_permission_status`) whether granted or denied.
      - On resume when both permissions are already granted, the screen shows a plain Continue button without re-prompting.
      - On advance the draft's `lastCheckpoint` is set to `secondCheckpoint`; killing and relaunching mounts the stack at the page after 14.
      - Screen wiring test covers first-time grant flow, first-time deny flow (Continue still allowed), and resumed-already-granted state.
    notes: ""
