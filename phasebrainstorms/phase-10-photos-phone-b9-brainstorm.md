# Phase 10 brainstorm — Photos + phone (B9, pages 28-29)

## 2026-08-03 10:30 brainstorm

Cross-checked the phase 10 PRD (`implementationplan/phase-10-photos-phone-b9.md`, last_updated 2026-07-19) against the current state of the codebase after phase 9 shipped. Findings grouped by severity.

### Blocking drift — PRD is wrong about the current codebase

1. **Route name mismatch (story 10.2).** PRD acceptance criterion: "advances to `Page30FaceIntroScreen`". The actual route registered in `src/navigation/OnboardingStack.tsx` is **`Page30FaceVerifyIntroScreen`**. Left unamended, the story's Continue handler will fail typecheck against `OnboardingStackParamList`. Either fix the PRD or rename the route.

2. **Page 15 does not persist a dial code (story 10.2).** PRD says the dial-code prefix should default to "the value written on page 15". Page 15 writes `current_residence_country` (display name) and `resident_country_code` (ISO-2), not a dial code. The dial code has to be derived by looking up the ISO-2 in `src/config/countries.ts` (which exposes `dialCode` per row). The PRD should say that explicitly instead of implying a direct read.

3. ~~**Helper module path doesn't exist (story 10.2).** PRD says `Helper/validationHelper.ts → isValidPhone(...)`. Neither `Helper/`, `src/helpers/`, nor `src/utils/` exists in this codebase.~~ **Retracted 2026-08-03:** The file `src/Helper/validationHelper.ts` DOES exist (with `isValidEmail`, `isValidName`, `isValidCity`, `isValidParentName`, `isValidParentJob`, `isValidProfession`, `isValidEducationYear`, etc). The original grep missed it because I searched for `Helper/` at repo root, not inside `src/`. Story 10.2 can add `isValidPhone` / `canonicalizePhone` as a new section in the existing module — the file's section-header convention (`// ── <domain> ──`) is already established.

4. **`requestMediaLibraryPermission` genuinely absent (story 10.1).** PRD acknowledges "added here if not present" — confirmed absent. `src/services/permissions/index.ts` currently exports only `requestNotificationPermission` and `requestLocationPermission`. Adding a third helper is straightforward and matches the existing pattern (narrow `'granted' | 'denied' | 'undetermined'` return, single source of truth for the raw Expo module import).

5. **Native config change required — not a JS-only phase.** `expo-image-picker` is NOT in `package.json` (only `expo-image` for rendering) and `libphonenumber-js` is also absent. Adding `expo-image-picker` is a CNG surface change: the plugin needs to go into `app.json`, and per memory `dev_workflow_android_devbuild.md` a `npx expo prebuild` + full APK reinstall is required before the next dev-build boot. Story briefs must call this out so the subagent doesn't assume Metro hot-reload will pick it up. Android also needs `READ_MEDIA_IMAGES` in the manifest (auto-added by the expo-image-picker plugin, but worth naming).

### Missing / non-testable acceptance criteria

6. **Story 10.1 — cancel path.** Nothing says what happens when the user grants media permission but cancels the picker without selecting an image. Expected: tile stays empty, no crash, no state write. Should be an explicit criterion.

7. **Story 10.1 — deletion / replacement.** Once a tile is filled, can the user tap it to remove or swap the image? A 6-tile grid where every selection is permanent is user-hostile. The PRD is silent. Pick a UX (long-press to remove? tap-to-replace? little "x" chip?) and add a criterion.

8. **Story 10.1 — image constraints.** No criterion for min/max resolution, aspect ratio, or file size. Backend upload is deferred (§17.14) so hard enforcement isn't needed yet, but the tiles will display the picked URI directly, so an unconstrained portrait/landscape mix will look ragged in the grid. At minimum specify `expo-image-picker` options (`aspect`, `quality`).

9. **Story 10.1 — Continue label.** PRD says "Add photos" is the Continue label. Should it flip to "Continue" once ≥1 tile is filled (Muzz reference behaviour) or stay "Add photos"? Ambiguous.

10. **Story 10.2 — no-country fallback.** What if the user reached page 29 via a checkpoint-resume path where `resident_country_code` was never written? Expected default (PK? empty → user must pick?) is unspecified.

11. **Story 10.2 — draft schema gap.** `src/features/onboarding/draftSchema.ts` does not currently include a `phone_number` field. `UserProfile.phone_number` exists on the API type, but the onboarding draft has no matching key. Story 10.2 needs to add the field to the draft schema and to the `emptyDraft()` factory (with test updates), which the acceptance criteria don't mention.

### Scope / dependency review

12. **`depends_on: []` on both stories — correct.** Page 29 does not read anything page 28 writes; they're independent. Fine.

13. **Local-URI persistence caveat (story 10.1).** Photos live only as local URIs until the backend photo pipeline lands. `expo-image-picker` URIs on Android are `content://` URIs that can become invalid across app restarts (grant scoped to the process). The draft persists via SecureStore, so on cold-start the URIs may resolve to a broken image. Not blocking phase 10 but the story should note the known limitation so QA doesn't file it as a bug.

### Bookkeeping

14. **Tracking issues already exist.** GitHub issues #41 (story 10.1) and #42 (story 10.2) are already open with `phase-10,story` labels — created on the phase-planning sweep. On the Step 1 sweep I should reuse them (verify state=OPEN, add `tracking_issue: 41` / `tracking_issue: 42` to the PRD) rather than creating duplicates.

15. **Phase 9 completion tag missing.** Orthogonal to phase 10, but phase 9 is `done: true` in the index with no `phase-9-complete` git tag (tags stop at `phase-8-complete`). Worth tagging `origin/development` at the phase-9 merge commit per `gitbranching.md` at some point.

### Suggested PRD amendments (concrete)

- Fix route name to `Page30FaceVerifyIntroScreen` in story 10.2.
- Rewrite the dial-code prefix criterion as: "defaults to the dial code derived by looking up `draft.resident_country_code` in `src/config/countries.ts`; if that field is empty, defaults to `+92` (Pakistan)."
- Move the validation helper from `Helper/validationHelper.ts` to `src/features/onboarding/helpers/phoneValidation.ts` (or an agreed alternative). Keep the same function signature.
- Add a criterion to story 10.1: "cancelling the picker after granting permission leaves the tapped tile empty and writes nothing to the draft."
- Add a criterion to story 10.1: pick one of remove-on-long-press / tap-to-replace / X-chip, and add it.
- Add a criterion to story 10.1: `expo-image-picker` opens with `aspect: [1,1]`, `quality: 0.8`, `mediaTypes: 'Images'`.
- Add a criterion to story 10.1: Continue label stays "Add photos" when 0 tiles filled; flips to "Continue" when ≥1 tile filled.
- Add a criterion to story 10.2: adds `phone_number: string | null` to `OnboardingDraft` and `emptyDraft()`; updates the ~20 test fixtures that pin the empty-draft shape.
- Add a note to story 10.1: "local URI on Android may not survive cold restarts until backend upload lands — QA aware, not a bug for v1."
- Add a note across both stories: "requires `npx expo prebuild` + full APK reinstall because both `expo-image-picker` (native) and its Android manifest additions are new — no Metro hot-reload for the first install."

## 2026-08-03 10:56 brainstorm (re-run)

`/implement-phase 10` re-invoked after the user resolved the four blockers in `QA/explanations.txt` and the PRD was amended + committed (0dc4b20). Pre-flight rechecked — phase 10 `ready: true`, all prior phases `done: true`, PRD file present and non-empty, stories `10.1` / `10.2` both validate (agent = `frontenddeveloper`, non-empty acceptance criteria, `depends_on: []`).

No new drift surfaced against the codebase since the 10:30 pass:
- `src/Helper/validationHelper.ts` still present (10.2 add-on target confirmed).
- `src/services/permissions/index.ts` still exports only `requestNotificationPermission` + `requestLocationPermission` (10.1 add-on slot).
- `src/features/onboarding/draftSchema.ts` still at SCHEMA_VERSION 3 with no `phone_number` key (10.2 bump lane clear).
- Tracking issues #41 and #42 verified OPEN via `gh issue view` — reused, no duplicates created.

Proceeding to dispatch story 10.1.
