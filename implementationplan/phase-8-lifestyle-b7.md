phase: 8
title: Lifestyle + marital status (B7, pages 20-24)
last_updated: 2026-07-26

context_summary: |
  Phase 8 captures marriage intentions timeline (page 20), the user's religious level (page 21), the partner's religious level (page 22), current marital status + children (page 23), and willingness to move abroad after marriage (page 24). Page 23 introduces a reactive branch (children question appears only for Divorced/Widowed). All screens use auto-advance on user tap; no Continue button. Auto-advance MUST be tap-triggered (event handler), never effect-driven on draft state, otherwise back-navigation rubber-bands the user forward. On re-visit, previously-selected options are visually highlighted (preselected) but must not re-fire auto-advance. All new user-visible strings must be added to `src/labels/labels.en.json` and `src/labels/labels.ur.json` under `onboarding.<page>.*` with full parity — this convention applies to every story below even though it is not repeated in each AC list.

  Type note: `has_children` and `move_abroad` in `src/types/api/UserProfile.ts` are declared `boolean | null`. yesNo option taps must be coerced at write time: `has_children: tapped === 'YES'`, `move_abroad: tapped === 'YES'`. Do NOT write the raw strings — tsc will reject. Re-hydration reads the boolean and lights the correct row.

stories:
  - id: 8.1
    title: Page 20 - Marriage timeline (2 pick-ones, first is client-local)
    agent: frontenddeveloper
    done: true
    tracking_issue: 98
    depends_on: []
    acceptance_criteria:
      - `Page20MarriageTimelineScreen` renders header "What are your intentions for marriage?" with two stacked pick-one groups.
      - First pick-one: subheader "I'd like to know someone on knotify for"; options `["1-2 months", "3-4 months", "4-12 months", "1-2 years"]` (hardcoded in the screen — no catalog entry, no draft field, no DB mapping). Selection stored in local `useState` under `marriageTimelinePrimary`; NOT persisted to draft or SecureStore. Loss on back-nav past page 20 or app-kill is acceptable.
      - Second pick-one: subheader "I'd like to be married within"; reads `options.marriageTime` and writes to `draft.fields.marriage_time` on tap. Update `src/config/options/marriageTime.json` to `["1-2 months", "3-4 months", "4-12 months", "1-2 years", "3-4 years", "4+ years", "Agree together"]` as part of this story (retires the previous "Within N months" list — no live users on that data pre-launch).
      - Auto-advance to `Page21OwnReligiousLevelScreen` fires only when BOTH selections are made AND the user's most recent action was a tap (not a rehydrate). Guard against effect-driven advance by wiring the advance call inside the tap handler, not inside a `useEffect` watching state.
      - On re-visit (back-nav from page 21), `marriage_time` rehydrates the second pick-one's highlighted row from the draft. The first pick-one starts empty (local state was discarded). Auto-advance MUST NOT re-fire on mount.
      - New labels added under `onboarding.marriageTimeline.*` (title, primary.label, secondary.label) in both `labels.en.json` and `labels.ur.json` with full parity.
      - Screen wiring tests cover: (i) both selections tapped → advance; (ii) only first tapped → no advance; (iii) only second tapped → no advance; (iv) re-visit with only marriage_time set → second row highlighted, no auto-advance.
    notes: ""

  - id: 8.2
    title: Page 21 - Own religious level
    agent: frontenddeveloper
    done: true
    tracking_issue: 99
    depends_on: []
    acceptance_criteria:
      - `Page21OwnReligiousLevelScreen` renders header "How religious are you?" and reads `options.religiousLevel` (main dark label only; smaller subtext from the reference is intentionally skipped).
      - Tap writes `religious_level` and auto-advances to `Page22PartnersReligiousLevelScreen`. Auto-advance is tap-triggered only — not effect-driven.
      - On re-visit (back-nav from page 22), the previously-selected row rehydrates as highlighted but auto-advance MUST NOT re-fire.
      - New labels added under `onboarding.ownReligiousLevel.*` in `labels.en.json` and `labels.ur.json` with full parity.
      - Screen wiring test covers: tap writes + advances; re-visit shows highlight + does NOT re-advance.
    notes: ""

  - id: 8.3
    title: Page 22 - Partner's religious level
    agent: frontenddeveloper
    done: true
    tracking_issue: 100
    depends_on: []
    acceptance_criteria:
      - `Page22PartnersReligiousLevelScreen` reuses the same layout as page 21 with header "How Religious would you like your partner to be?" and the same `options.religiousLevel` list.
      - Tap writes `partners_religious_level` and auto-advances to `Page23MaritalStatusScreen`. Auto-advance is tap-triggered only.
      - On re-visit (back-nav from page 23), the previously-selected row rehydrates as highlighted but auto-advance MUST NOT re-fire.
      - New labels added under `onboarding.partnersReligiousLevel.*` in `labels.en.json` and `labels.ur.json` with full parity.
      - Screen wiring test covers: tap writes + advances; re-visit shows highlight + does NOT re-advance.
    notes: ""

  - id: 8.4
    title: Page 23 - Marital status + reactive children question
    agent: frontenddeveloper
    done: false
    tracking_issue: 101
    depends_on: []
    acceptance_criteria:
      - `Page23MaritalStatusScreen` reads `options.maritalStatus` and renders three rows (Never Married, Divorced, Widowed).
      - Tapping `Never Married` writes `marital_status='Never Married'` AND `has_children=false` in a single atomic `update({...})` call, then auto-advances to `Page24MoveAbroadScreen`.
      - Tapping `Divorced` or `Widowed` reveals a second row "Do you have children?" from `options.yesNo`. The screen does NOT save anything yet — waits for the Yes/No tap. If the user does nothing, the page stays put (no toast, no nag). Back button still returns to page 22 normally.
      - On tap of Yes or No, the screen writes `marital_status` (Divorced or Widowed) AND `has_children` (coerced: `tapped === 'YES'` → true, `'NO'` → false) in a single atomic update, then auto-advances.
      - **Reset rule (symmetric):** any transition TO `Never Married` from a prior selection — regardless of what `marital_status` or `has_children` were previously — writes `has_children=false` in the same atomic update as `marital_status='Never Married'`. This covers Divorced+Yes → Never Married, Divorced+No → Never Married, Widowed+Yes → Never Married, and Widowed+No → Never Married. In practice this is trivial: the Never Married tap handler always writes `{ marital_status: 'Never Married', has_children: false }` without inspecting prior state.
      - On re-visit (back-nav from page 24), the previously-selected marital status row is highlighted. If it was Divorced or Widowed, the "Do you have children?" row is visible with the previously-chosen Yes/No highlighted. Auto-advance MUST NOT re-fire.
      - Auto-advance is tap-triggered only — never effect-driven on draft state.
      - New labels added under `onboarding.maritalStatus.*` (title, hasChildren.label) in `labels.en.json` and `labels.ur.json` with full parity.
      - Screen wiring tests cover: (i) Never Married tap → atomic write of both fields, advances; (ii) Divorced tap → reveals children row, no write yet, no advance; (iii) Divorced then Yes → atomic write of both, advances; (iv) Divorced then No → atomic write of both, advances; (v) Divorced+Yes selected, then tap Never Married → has_children resets to false in same atomic write; (vi) re-visit with Divorced+Yes hydrated → both rows visible with correct highlights, no auto-advance; (vii) re-visit with Never Married hydrated → only marital-status row shown, no auto-advance.
    notes: ""

  - id: 8.5
    title: Page 24 - Move abroad after marriage
    agent: frontenddeveloper
    done: false
    tracking_issue: 102
    depends_on: []
    acceptance_criteria:
      - `Page24MoveAbroadScreen` renders header "Would you be willing to move abroad after marriage?" with `options.yesNo`.
      - On first visit (no prior value in `draft.fields.move_abroad`), YES is visually preselected (highlighted). The visual preselect does NOT write to the draft — the user must tap to trigger both the write and the advance.
      - On tap, coerce the selection: `move_abroad = tapped === 'YES'` (boolean). Write to draft and auto-advance to `Page25Preferences1Screen`. Auto-advance is tap-triggered only.
      - On re-visit (back-nav from page 25), the previously-saved boolean rehydrates the highlighted row: `true` → YES highlighted, `false` → NO highlighted. Auto-advance MUST NOT re-fire.
      - New labels added under `onboarding.moveAbroad.*` in `labels.en.json` and `labels.ur.json` with full parity.
      - Screen wiring tests cover: (i) first-visit renders with YES highlighted, no draft write on mount; (ii) tap YES → writes `move_abroad=true`, advances; (iii) tap NO → writes `move_abroad=false`, advances; (iv) re-visit with `move_abroad=true` in draft → YES highlighted, no auto-advance; (v) re-visit with `move_abroad=false` in draft → NO highlighted, no auto-advance.
    notes: ""
