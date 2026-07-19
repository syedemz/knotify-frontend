phase: 8
title: Lifestyle + marital status (B7, pages 20-24)
last_updated: 2026-07-19

context_summary: |
  Phase 8 captures marriage timeline (page 20), the user's religious level (page 21), the partner's religious level (page 22), current marital status + children (page 23), and willingness to move abroad after marriage (page 24). Page 23 introduces a reactive branch (children question appears only for Divorced/Widowed).

stories:
  - id: 8.1
    title: Page 20 - Marriage timeline (2 pick-ones)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page20MarriageTimelineScreen` renders two pick-one groups; the first is a placeholder list (no DB field mapping yet, [Open] in draft as `marriageTimelinePrimary` client-only) and the second reads `options.marriageTime` and writes to `marriage_time`.
      - Auto-advance triggers only when both selections are made.
      - Screen wiring test covers both selections + auto-advance and the "only first selected" no-advance state.
    notes: ""

  - id: 8.2
    title: Page 21 - Own religious level
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page21OwnReligiousLevelScreen` renders header "How religious are you?" and reads `options.religiousLevel` (main dark label only; smaller subtext from the reference is intentionally skipped).
      - Tap writes `religious_level` and auto-advances to `Page22PartnersReligiousLevelScreen`.
      - Screen wiring test covers write and auto-advance.
    notes: ""

  - id: 8.3
    title: Page 22 - Partner's religious level
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page22PartnersReligiousLevelScreen` reuses the same layout as page 21 with header "How Religious would you like your partner to be?" and the same `options.religiousLevel` list.
      - Tap writes `partners_religious_level` and auto-advances to `Page23MaritalStatusScreen`.
      - Screen wiring test covers write and auto-advance.
    notes: ""

  - id: 8.4
    title: Page 23 - Marital status + reactive children question
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page23MaritalStatusScreen` reads `options.maritalStatus` and renders three rows.
      - Selecting `Never Married` writes `marital_status='Never Married'` and `has_children='NO'` atomically and auto-advances.
      - Selecting `Divorced` or `Widowed` reveals a second row "Do you have children?" from `options.yesNo`; on tap of a Yes/No, both `marital_status` and `has_children` write atomically and page auto-advances.
      - Back-navigating from a `Divorced` + `Yes` selection to `Never Married` force-resets `has_children` to `NO` before advancing (reactive sanity check).
      - Screen wiring test covers each of the four selection paths and the back-nav reset.
    notes: ""

  - id: 8.5
    title: Page 24 - Move abroad after marriage
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page24MoveAbroadScreen` renders header "Would you be willing to move abroad after marriage?" with `options.yesNo` and preselects `YES`.
      - Tap writes `move_abroad` and auto-advances to `Page25Preferences1Screen`.
      - Screen wiring test covers default preselect and auto-advance.
    notes: ""
