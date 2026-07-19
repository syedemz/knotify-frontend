phase: 9
title: Preferences + relation (B8, pages 25-27)
last_updated: 2026-07-19

context_summary: |
  Phase 9 delivers the two long preference multi-selects (pages 25 + 26) and the profile-for-whom relation picker (page 27). Preference field mapping to `users.preferences` JSONB is deferred per §11.2.6 / §17.20 - the multi-select UIs write to `onboardingDraft.preferencesDraft` only and are omitted from the final PATCH body until the mapping is resolved.

stories:
  - id: 9.1
    title: Page 25 - Preferences multi-select #1
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page25Preferences1Screen` renders a long scrollable multi-select using catalog `ListRowSelectable`; the option list is a JSON file under `src/config/options/preferences1.json` (raw list values acceptable at this stage since the field mapping is deferred).
      - Continue is enabled at >=1 selection; on tap writes the selected values array to `onboardingDraft.preferencesDraft.list1` and advances to `Page26Preferences2Screen`.
      - Screen wiring test covers >=1 selection gate, multi-select accumulate, and advance.
    notes: "Field mapping to `users.preferences` JSONB is [Open] per §17.20; do not add to the PATCH body."

  - id: 9.2
    title: Page 26 - Preferences multi-select #2
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page26Preferences2Screen` mirrors page 25's structure using `src/config/options/preferences2.json`.
      - Continue is enabled at >=1 selection; on tap writes the selected values array to `onboardingDraft.preferencesDraft.list2` and advances to `Page27RelationScreen`.
      - Screen wiring test covers >=1 selection gate and advance.
    notes: "Same [Open] as 9.1."

  - id: 9.3
    title: Page 27 - Relation (profile-for-whom)
    agent: frontenddeveloper
    done: false
    depends_on: []
    acceptance_criteria:
      - `Page27RelationScreen` renders header "Who are you creating this profile for?" and reads `options.relation` (Myself, Son, Daughter, Sibling, Friend, Ward).
      - Tap writes `relation` to the draft and auto-advances to `Page28PhotosScreen`.
      - Screen wiring test covers write and auto-advance.
    notes: ""
