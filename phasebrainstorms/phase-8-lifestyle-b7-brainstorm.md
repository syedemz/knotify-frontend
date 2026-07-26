# Phase 8 brainstorm — Lifestyle + marital status (B7, pages 20-24)

## 2026-07-26 11:27 brainstorm

Pre-dispatch sanity check on `implementationplan/phase-8-lifestyle-b7.md`. Cross-referenced against current code state on `development` (as of commit 7c453bb, post phase-7 merge). Five stories (8.1-8.5) all `depends_on: []`, all `frontenddeveloper`, all AC lists non-empty — structural validation passes.

### 1. Type drift: `has_children` and `move_abroad` are `boolean`, not string (BLOCKER for stories 8.4 and 8.5)

`src/types/api/UserProfile.ts` declares:
- `has_children: boolean | null` (line 126)
- `move_abroad: boolean | null` (line 171)

But the PRD ACs specify:
- Story 8.4: "writes `marital_status='Never Married'` and `has_children='NO'` atomically" — `'NO'` is a string literal from `options.yesNo`, not `false`.
- Story 8.4: "on tap of a Yes/No, both `marital_status` and `has_children` write atomically" — implies raw `options.yesNo` value flows straight through.
- Story 8.5: "renders header ... with `options.yesNo` and preselects `YES`" — again raw string.

Contrast with phase 7: `father_retired` / `mother_retired` are declared `string | null` in UserProfile, so `Page18ParentsScreen` writes `"YES"` / `"NO"` directly (see lines 107, 210 of `Page18ParentsScreen.tsx`). Because `DraftFields = Partial<Omit<UserProfileWritable, 'sex'>>`, a straight `update({ has_children: 'NO' })` will fail tsc.

**Resolution options for the subagent:**
- **(a)** Coerce at write time: `has_children: selected === 'YES'`, `move_abroad: selected === 'YES'`. Preselect logic reads `draft.fields.has_children === false ? 'NO' : 'YES'` (or default YES if undefined). Keeps the DB contract intact. Most consistent with the field's declared boolean semantics.
- **(b)** Widen UserProfile so `has_children` and `move_abroad` become `string | null` to match phase 7's pattern — larger blast radius, touches types/api.
- **(c)** Amend PRD ACs to say "writes `has_children=false` atomically" and "preselects `true`" — bookkeeping-only fix, still requires (a) at the code level.

Recommend **(a) coerce at write time** and update the PRD ACs (option c) to reflect the coercion — smallest change, matches the declared type. Note the coercion decision in the subagent brief.

### 2. Story 8.1: "placeholder pick-one with no DB field mapping" needs a concrete drafting home

Story 8.1 says the first pick-one is "a placeholder list (no DB field mapping yet, `[Open]` in draft as `marriageTimelinePrimary` client-only)". `DraftFields` today is exactly `Partial<Omit<UserProfileWritable, 'sex'>> & { sex?: DraftSex }` — there is no client-only extension slot. Writing `marriageTimelinePrimary` will fail tsc unless we:
- add the key to `DraftFields` as an optional client-only field with a comment marking it non-persisted intent, OR
- keep it purely local to the screen (`useState`, not persisted across back-nav / app restart).

The AC doesn't say the first selection must persist across restarts, only that both selections gate auto-advance. **Recommend: local `useState` only, no draft persistence** — the field has no DB target and back-nav / app-kill loss is acceptable for a placeholder. If the user disagrees, extend `DraftFields` with a documented client-only key.

Also missing from AC: what are the actual visible options for the placeholder list? Story says "placeholder" but doesn't enumerate. Subagent will need a fill-in from the user or a stub like `['Placeholder A', 'Placeholder B', 'Placeholder C']`.

### 3. Story 8.4: "back-navigating from Divorced+Yes to Never Married" wording is ambiguous

The AC reads: "Back-navigating from a `Divorced` + `Yes` selection to `Never Married` force-resets `has_children` to `NO` before advancing."

This isn't a back-nav (`Page24` → `Page23`) — it's a **re-selection on Page 23 within the same visit**: user had picked Divorced+Yes, then taps `Never Married` instead. The AC should say "changing the marital-status selection from Divorced/Widowed to Never Married" to avoid the subagent implementing a stack-listener. Rehydration case (back-nav from Page 24 to Page 23 with prior selection intact) is not covered — assume the row and Yes/No stay hydrated from draft.

Additionally: what happens if the user picks Divorced (revealing the children row) but never answers Yes/No? AC implies auto-advance only fires after both, but does Continue-gating apply? The pattern in this phase is auto-advance (not a Continue button), so presumably staying on the page is fine — but state it explicitly.

### 4. Story 8.4 has_children reset symmetry

The reset rule is only stated for "Divorced+Yes → Never Married". What about "Widowed+Yes → Never Married"? And "Divorced+No → Never Married" (currently `has_children=false`, would need reset to also-false — a no-op but worth stating)? Recommend the rule as: "any transition to `Never Married` sets `has_children=false` regardless of prior state, atomically with the marital_status write". Cleaner and tsc-safe under option (a) above.

### 5. Auto-advance re-visit behavior (all 5 stories)

Every story specifies auto-advance on selection. None specify whether the auto-advance re-fires on back-nav / rehydration when the value is already set. Phase 7 precedent (Page 18, 19) is: rehydration populates form state without triggering advance. Recommend the subagent explicitly guards auto-advance behind "user just tapped" (an event handler, not a `useEffect` on draft state) — otherwise back-nav becomes a rubber band.

### 6. Labels and Urdu parity

None of the AC lists mention adding labels to `labels.en.json` / `labels.ur.json`. Every prior phase (see phase 6 story 6.1, phase 7 story 7.1) has added `onboarding.<page>.*` labels with UR parity. This is implicit convention but easy to miss — subagent brief should call it out for each story.

### 7. `marriage_time` option list vs the placeholder pick-one

`options.marriageTime` currently reads `["Within 3 months", "Within 6 months", "Within a year", "Within 2 years", "Not sure yet"]`. That's the second pick-one on page 20 (the one that writes `marriage_time`). The first pick-one has no options list in the catalog — confirming §2 above (subagent must invent or receive placeholder options).

### 8. Test coverage precedent

Phase 7 dropped ~55 tests per story. Phase 8 stories are simpler (single or double pick-ones, no dynamic list) — expect ~15-25 tests per screen. Coverage thresholds must not regress (currently 88.73/85.43/88.6/89.77 lines/branches/funcs/statements).

### Summary of items to address before dispatch

**High priority (blocks tsc / correctness):**
1. Type mismatch: `has_children` and `move_abroad` are boolean. Decide coercion strategy (recommend option a) and amend stories 8.4 & 8.5 AC wording.
2. Story 8.1 `marriageTimelinePrimary`: pick storage strategy (recommend local state, no draft persistence).

**Medium priority (ambiguity):**
3. Story 8.1: define the placeholder pick-one options (or explicitly stub).
4. Story 8.4: rewrite "back-navigating" AC to describe in-page re-selection; extend reset rule to cover Widowed & any→Never Married.
5. Story 8.4: state Continue behaviour when Divorced/Widowed selected but no Yes/No answer (do nothing, stay on page).

**Low priority (convention reminder):**
6. All stories: add EN + UR labels — call out in subagent brief.
7. All stories: guard auto-advance behind user tap event, not draft state effect.
