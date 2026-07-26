# Phase 9 brainstorm — Preferences + relation (B8, pages 25-27)

## 2026-07-26 14:30 brainstorm

Pre-dispatch sanity check on `implementationplan/phase-9-preferences-b8.md`. Cross-referenced against current code state on `development` (post phase-8 merge, tag `phase-8-complete`). Three stories (9.1, 9.2, 9.3) all `depends_on: []`, all `frontenddeveloper`, all AC lists non-empty — structural validation passes. However, multiple content and infrastructure gaps surfaced.

### 1. CRITICAL — Muzz reference screenshots do NOT match the PRD (BLOCKER)

Read the three reference screenshots at `muzzscreenshots/25.jpeg`, `26.jpeg`, `27.jpeg`. They show:

- **`25.jpeg`** — "Do you drink alcohol?" with YES / NO buttons
- **`26.jpeg`** — "Do you have children?" with YES / NO buttons
- **`27.jpeg`** — "Would you move abroad for marriage?" with YES / NO buttons

The PRD describes:

- **Page 25** — preferences multi-select #1 (long scrollable list)
- **Page 26** — preferences multi-select #2 (long scrollable list)
- **Page 27** — relation picker ("Who are you creating this profile for?" — Myself/Son/Daughter/Sibling/Friend/Ward)

These are entirely different features. The Yes/No screenshots correspond conceptually to page 23 (`has_children`) and page 24 (`move_abroad`), both already shipped in phase 8. Possible explanations:
- **(a)** Screenshots are misfiled — the correct 25/26/27 reference shots live elsewhere or were never captured
- **(b)** The PRD is out of date with the actual product design (Muzz app has since re-ordered pages, or knotify diverged)
- **(c)** The PRD is correct and the screenshots should simply be ignored — the preference lists + relation picker are the intended design

**Blocker for dispatch until the user picks (a), (b), or (c).** If (a): user needs to provide the correct screenshots or confirm none exist. If (b): the PRD needs re-scoping. If (c): note explicitly in the subagent brief that reference screenshots do NOT apply to phase 9.

### 2. `preferencesDraft` slot does not exist in `OnboardingDraft` (BLOCKER for 9.1 & 9.2)

Stories 9.1 and 9.2 both call for writes to `onboardingDraft.preferencesDraft.list1` and `.list2`. Current draft shape:

```
DraftFields = Partial<Omit<UserProfileWritable, 'sex'>> & { sex?: DraftSex }
```

There is no `preferencesDraft` key anywhere in `src/features/onboarding/draftSchema.ts`. Adding a new top-level slot to the persisted draft is a **schema change** and requires:
- Bumping `SCHEMA_VERSION` from 2 → 3
- Extending the `OnboardingDraft` type with `preferencesDraft?: { list1?: string[]; list2?: string[] }`
- Since the migration policy is DISCARD (per phase 4/5 precedent), existing drafts on 2 will be wiped on rehydrate — acceptable pre-launch, but worth calling out
- Extending `useOnboardingDraft` with an update helper that targets `preferencesDraft.*` (the current `update()` takes flat `DraftFields`, not nested paths)

Recommend the subagent handle this as part of story 9.1 (first story to need the slot), then story 9.2 reuses it.

### 3. `preferences1.json` and `preferences2.json` do not exist — no options content available (BLOCKER)

Neither `src/config/options/preferences1.json` nor `preferences2.json` exists on disk. The PRD says the subagent should create these JSON files, but does NOT specify:
- The screen headers for page 25 and page 26 ("What are you looking for in a partner?", "What are your dealbreakers?", etc. — unknown)
- The option lists themselves (unknown length, unknown values)
- The Urdu translations of any of the above

Without user input on the actual content, the subagent would have to invent placeholder options — which is not a "placeholder is fine" situation like phase 8 story 8.1, because these lists are the whole point of the pages and will be user-visible immediately.

**User input required:** page 25 header + option list + UR translations; page 26 header + option list + UR translations.

### 4. Story 9.1 / 9.2 — Continue button vs auto-advance inconsistency

Phase 8 established a strong "auto-advance on tap, no Continue button" pattern. But stories 9.1 and 9.2 explicitly say "Continue is enabled at >=1 selection; on tap [...] advances". This is because multi-select requires an explicit commit action (you can't auto-advance while the user is still tapping additional options).

That's correct in principle. But it means phase 9 reintroduces a Continue button — worth noting so the subagent doesn't reflexively wire auto-advance to match phase 8. A shared `ContinueButton` component may already exist from phase 2 (page 2/3 patterns) — subagent should check `src/components/` before building a new one.

### 5. Story 9.3 — Re-visit auto-advance behavior not specified

Story 9.3 says "Tap writes `relation` to the draft and auto-advances to `Page28PhotosScreen`." Missing: what happens on re-visit (back-nav from page 28)? Phase 8 precedent is explicit — highlight rehydrates, do NOT re-fire auto-advance, use `initializedRef` guard. The subagent should apply the same pattern to 9.3, but it should be stated in the AC to avoid guessing.

### 6. Labels + UR parity reminder

Same convention as phase 8: every user-visible string added under `onboarding.<page>.*` in both `labels.en.json` and `labels.ur.json` with full parity. Not repeated per story in the PRD — subagent brief should include this reminder.

### 7. Story 9.1 / 9.2 — `ListRowSelectable` component reference

The PRD says "using catalog `ListRowSelectable`". Confirm this component exists in `src/components/` before dispatch — if not, the subagent needs to build it as a general catalog piece. Quick grep required by subagent.

### Summary of items to address before dispatch

**Blockers (cannot dispatch without user input):**
1. Screenshot/PRD mismatch — user must pick (a) misfiled, (b) re-scope PRD, or (c) ignore screenshots.
2. `preferencesDraft` slot missing from draft schema — decide: bump SCHEMA_VERSION 2→3 with DISCARD, or use a different storage strategy.
3. Missing content for `preferences1.json` and `preferences2.json` — user must provide page headers + option lists + UR translations.

**Medium priority (ambiguity):**
4. Re-visit / re-hydration behavior for 9.3 — apply phase-8 `initializedRef` pattern explicitly.
5. Continue-button reintroduction on 9.1 / 9.2 — subagent should reuse existing catalog Continue button, not re-invent.

**Low priority (convention reminder):**
6. Labels EN + UR parity — call out in subagent brief.
7. `ListRowSelectable` existence check before story 9.1 kicks off.

## 2026-07-26 14:55 brainstorm — resolutions applied

User answers captured in `QA/explanations.txt` (same session). Resolutions:

- **#1 (screenshot mismatch)** — resolved: the 25/26/27 screenshots are misleading (they show phase-8 content). Use `muzzscreenshots/32-1.jpeg`, `32-2.jpeg`, `32-3.jpeg` as the true reference — those capture 57 personality traits under the header "How would you describe your personality?" with a "select up to 5" cap and a Skip button. `muzzscreenshots/32.jpeg` shows the "interests" list (sports + technology) which is explicitly dropped from scope.
- **#2 (schema slot)** — resolved: use the existing `preferences: Record<string, unknown> | null` field on `UserProfileWritable` (confirmed at `src/types/api/UserProfile.ts:203`). No `preferencesDraft` bag; no schema version bump. Shape: `preferences: { personalityTraits: string[] }`. Writes into the final PATCH body.
- **#3 (content)** — resolved: 57 English trait strings compiled from screenshots and embedded in story 9.1 AC. Urdu translations for non-MBTI traits provided inline (MBTI 16-code acronyms deliberately left untranslated — technical codes).
- **#4 (Continue button)** — resolved: page 25 uses Continue + Skip (multi-select needs commit); page 27 keeps tap-to-advance (single-choice).
- **#5 (re-visit)** — resolved: `initializedRef` guard applied to both 9.1 and 9.2 (renumbered).
- **#6 (label parity)** — handled inline in each story's AC.
- **#7 (`ListRowSelectable`)** — confirmed existing at `src/components/ListRowSelectable.tsx` (used by pages 21/22/23/24). Story 9.2 reuses it. Story 9.1 uses `PillButton` instead (also existing) since Muzz screenshot 32-1 shows pill-style multi-select.

**Scope delta from original phase-9 PRD:**
- DROPPED: story 9.2 "Page 26 preferences multi-select #2" (interests). Wizard page 26 becomes an unused slot; router advances 25 → 27 directly.
- RE-SCOPED: story 9.1 from generic "preferences multi-select" to "Personality traits (max 5, writes preferences.personalityTraits, Continue + Skip)".
- RENUMBERED: original story 9.3 (relation) → new story 9.2, now `depends_on: [9.1]` to force serial ordering after the router change.
- Phase 9 now has **2 stories**, not 3.

Ready for dispatch pending user confirmation.

## 2026-07-26 15:10 brainstorm — re-run after PRD amendment

Structural re-validation of the amended PRD (2 stories now: 9.1 personality traits, 9.2 relation). All pass:
- 9.1 `depends_on: []`, `agent: frontenddeveloper`, AC list is comprehensive (test coverage, label parity, storage shape, re-visit behavior, cap enforcement, router change).
- 9.2 `depends_on: [9.1]` — correct because 9.1 mutates the wizard router to skip page 26; 9.2's wiring assumes that router state.

No new concerns. Proceeding to Step 1 (GH issue creation) and dispatch.
