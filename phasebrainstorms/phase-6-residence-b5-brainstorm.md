# Phase 6 brainstorm — Residence (B5, pages 15-17)

## 2026-07-25 00:10 brainstorm

Scope reviewed: `implementationplan/phase-6-residence-b5.md` — stories 6.1 (Page 15 country+dial+flag), 6.2 (Page 16 city), 6.3 (Page 17 Kashmir district + family address). Findings below are ordered by severity — first two block dispatch; the rest are worth resolving up front but do not.

### Blockers (must resolve before dispatch)

1. **`react-native-country-flag` is not installed.** Story 6.1 AC-1 mandates the library, `package.json` has no dependency and no lockfile entry. The subagent will need to install it (`npx expo install react-native-country-flag`) or the AC becomes unimplementable. Two options: (a) resolve now with a pre-story install; (b) let the 6.1 subagent do it as its first act. The story is already scoped to introduce the picker, so (b) is fine — but the AC should say so explicitly, or the subagent may treat the missing dep as a bug to file rather than a task to execute. **Suggested edit:** append to story 6.1 notes: `"Install react-native-country-flag via 'npx expo install react-native-country-flag' as part of this story; add jest transformIgnorePatterns / moduleNameMapper if native-only imports trip the test runner."`

2. **Path/naming ambiguity for `CountryPicker`.** Story 6.1 AC-3 says `src/features/onboarding/components/`. That folder does not exist yet — this story creates it. Not a blocker in itself, but worth calling out so the subagent understands it is intentionally introducing a new convention (feature-local component directory) rather than assuming a typo.

### Gaps in acceptance criteria

3. **Story 6.1 leaves search behavior underspecified.** AC-1 says "searchable list" but does not say (a) case-insensitive match, (b) match on name only vs. name+dialCode, (c) empty-search shows full list, (d) whether search is performant enough for the ~200-entry list (a plain `Array.filter` on every keystroke is fine — worth documenting the intent rather than the subagent inventing a debounce hook). **Suggested addition:** case-insensitive prefix match on `name`; no debounce; empty query shows full alphabetical list.

4. **Story 6.1 does not specify the pre-selected/default country.** In many onboarding flows the picker opens scrolled to the user's device locale country. Should Page 15 do this or open at the top (Afghanistan)? Cheapest answer: no default — open scrolled to top, no pre-selection. Confirm.

5. **Story 6.2 does not name the validator.** AC-1 says "letters/spaces/hyphens/apostrophes validation" with `maxLength=40`. The codebase already has `isValidName` (max 35, same character class) — but city max is 40, so this cannot be reused as-is. **Suggested addition:** introduce `isValidCity` in `src/Helper/validationHelper.ts` with `MAX_CITY_NAME_LENGTH = 40`, mirroring the naming convention set by phase 4's `MAX_JOB_TITLE_LENGTH` etc.

6. **Story 6.3 preselect wording is ambiguous.** AC-1 says `default preselected "Srinagar"`. Two readings: (a) if `kashmir_district` is unset in draft, seed it with `"Srinagar"` on mount (side-effect write); (b) render the "Srinagar" row as selected on first paint but only write to draft on Continue. Prior pages (e.g. Page 5 sex) do NOT preselect — they wait for tap. Preselecting is a UX choice, but if the user taps Continue without touching the picker they are silently submitting Srinagar. **Suggested clarification:** on mount, if `kashmir_district` is null in the draft, write `"Srinagar"` immediately (option a), so the write and the visual state cannot diverge. Back-nav from Page 18 should not overwrite whatever the user chose.

7. **Story 6.3 `family_residence_address` character rule is unspecified.** AC-1 says "multiline TextInput" with max 70 but not what characters. The office-address field on Page 11 accepted freeform (per prior context, "freeform for `/`, `#`, apartment names") with only max-length enforced. Recommend the same: max-length only, no character-class rule, `autoCorrect` enabled. Confirm.

### Dependency graph

8. **All three stories declare `depends_on: []`.** This is technically correct — none read state written by another phase-6 sibling — but the wizard walks 15→16→17 linearly, so the on-emulator smoke check only lands after all three ship. Not a plan defect (execution is strictly serial by workspace rule); calling it out so the subagent does not misread the empty array as "safe to skip 6.2 and jump to 6.3."

9. **Story 6.3 navigates to `Page18ParentsScreen`.** That screen does not exist yet — it is a phase-7 story. The `OnboardingStack` currently has a placeholder for Page 18 (per phase-2 pattern), so `navigation.navigate('Page18ParentsScreen')` will resolve to the placeholder screen and not crash. Worth noting so the subagent does not chase a missing route.

### Drift since plan authored

10. **Draft-store refactor (2026-07-25, PR #92).** `useOnboardingDraft` is now a Context/Provider; all screen tests must mock `OnboardingDraftProvider: ({ children }) => children`. The three phase-6 wiring tests must follow this convention. Phase-6 PRD predates the refactor and does not mention it — the subagent will discover it by looking at `Page13EducationCredentialsScreen.test.tsx` for the current pattern.

11. **Android dev-build workflow (2026-07-25, PR #91).** On-device verification (if the subagent runs it) uses `npx expo run:android` (not `expo start --android`) and requires `adb shell pm clear com.knotify.app` to wipe secure-store between runs. Documented in context.md; the subagent will already have this from CLAUDE.md loading.

### Labels

12. **No phase-6 labels exist yet.** `onboarding.country.*`, `onboarding.residenceCity.*`, `onboarding.kashmirDistrict.*`, `onboarding.familyResidenceAddress.*` (or whatever slugs the subagent picks) are all absent from `labels.en.json` and `labels.ur.json`. Standard practice — each story adds its own — but the labels-parity Jest test enforces that every EN key has a UR key. Reminder more than a gap.

### Testing

13. **No mock for `react-native-country-flag` exists.** If the library uses SVG or native modules, Jest may need a manual mock in `__mocks__/` or a `moduleNameMapper` entry, mirroring how `lucide-react-native` was mapped to CJS (per phase 2). Worth including in story 6.1 as an anticipated task rather than a blocker discovered mid-implementation.

### External assumptions (still true?)

- **`src/config/countries.ts` completeness.** File exports ~200 entries with `name/dialCode/iso2`. Some ISO-2 codes are `+1` (US, Canada, Bahamas, Barbados, Antigua etc.) — Story 6.1 must be OK with duplicate dial codes since keying by ISO-2 disambiguates. Confirmed non-issue but worth flagging.
- **`options.kashmirDistricts` count.** File has exactly 22 entries; AC-1 says 22. ✓

---

### Summary — recommended PRD edits before proceeding

Minor edits worth adding, none of which change scope:

- Story 6.1 notes: add "install react-native-country-flag; add jest module mapping if needed"; add search behavior (case-insensitive prefix on name, no debounce); confirm no default-country pre-selection.
- Story 6.2 AC: name the validator `isValidCity` (+ `MAX_CITY_NAME_LENGTH = 40` in validationHelper.ts).
- Story 6.3 AC: clarify preselect semantics (mount-time write of `"Srinagar"` if unset); confirm `family_residence_address` has max-length only, no character class.

If you accept these as no-ops for the subagents (i.e. you'll trust them to make the right call from the discussion above), we can proceed without editing the PRD. Otherwise, address in the PRD and re-run.


## 2026-07-25 00:53 brainstorm (re-run)

Second pass over the PRD after the user's answers were applied. Confirming all 13 items from the first pass are resolved.

**Blockers**
- Issue 1 (flag library install) → resolved: story 6.1 notes now explicitly own the `npx expo install react-native-country-flag` step and jest mapping fallback.
- Issue 2 (CountryPicker location) → resolved: moved to shared catalog at `src/components/CountryPicker.tsx`.

**Gaps**
- Issue 3 (search behavior) → resolved: case-insensitive prefix match on name only, no debounce.
- Issue 4 (default country) → resolved: no pre-selection, opens scrolled to top.
- Issue 5 (city validator) → resolved: `isValidCity` + `MAX_CITY_NAME_LENGTH = 40` in validationHelper.ts.
- Issue 6 (Srinagar preselect semantics) → resolved: mount-time write guarded by null/undefined check.
- Issue 7 (address character rule) → resolved: length-only, `MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH = 70`, autoCorrect enabled.

**FYI / drift**
- Issue 8 → left as-is (serial-execution rule handles it).
- Issue 9 → left as-is (Page18ParentsScreen placeholder exists).
- Issue 10 (draft-store Context refactor) → resolved: `context_summary` carries a cross-story reminder + each story's AC references it.
- Issues 11, 12, 13 → left as-is per user answers.

**New issues surfaced on second pass**
None. The PRD is internally consistent; every AC is testable; every helper/component path resolves or explicitly self-declares as new. Proceeding to Step 1 (tracking-issue sweep).
