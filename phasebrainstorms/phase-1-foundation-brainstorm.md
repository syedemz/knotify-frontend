# Phase 1 brainstorm — Foundation & scaffolding

## 2026-07-19 23:49 brainstorm

Gap analysis of `implementationplan/phase-1-foundation.md` against `architecture.md`, the resolved open questions (§17.22 Noto Nastaliq Urdu, §17.26 confirm-then-reload), and the workspace conventions.

### Findings

**1. Story 1.1 — Urdu font sourcing is undefined.**
Story 1.1 pins Noto Nastaliq Urdu at `src/assets/fonts/NotoNastaliqUrdu-Regular.ttf` but no acceptance criterion says how the `.ttf` gets there. Subagent will guess. Fix: add a criterion naming the source (Google Fonts: https://fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu — SIL OFL) and requiring the `.ttf` to be committed alongside a `LICENSE-NotoNastaliqUrdu.txt` in the same folder.

**2. Story 1.1 — Package version pins not referenced.**
Architecture.md §16 pins Expo SDK 55, RN 0.83.6, React 19.2.0, TS 5.9.2, `@react-navigation/*` versions, etc. Story 1.1 doesn't cite §16. Subagent may pick different versions. Fix: add "package versions per architecture.md §16" to the criteria.

**3. Story 1.2 — templateimages/ migration is implicit.**
The five runtime PNGs (`backgr.png`, `banner.png`, `Logo.png`, `male.png`, `female.png`) already sit at project-root `templateimages/`. Story 1.2 says the PNGs live under `src/assets/images/onboarding/` but doesn't say they're migrated from `templateimages/` (which should then be deleted). Fix: add "PNGs are moved from the project-root `templateimages/` folder to `src/assets/images/onboarding/`; the old folder is deleted after migration."

**4. Story 1.2 — muzzscreenshots/countrycodes.js path is wrong.**
The PRD says `countries.ts` is migrated from `muzzscreenshots/countrycodes.js` (relative). The actual file is at `C:\Users\syede\Claude-Master\muzzscreenshots\countrycodes.js` — one level up from the project. The subagent will look inside the project and fail. Fix: give the absolute workspace-root path.

**5. Story 1.3 — Baseline label key set is vague.**
"Baseline key set required by the placeholder screens shipped in this phase" — but phase 1 ships only auth-stack placeholders (Login/ForgotPassword/ResetPassword) and shell state UIs. Fix: enumerate the required keys: `common.notImplemented`, `common.loading`, `common.error`, `common.retry`, `auth.login.title`, `auth.forgotPassword.title`, `auth.resetPassword.title`. Any others discovered during 1.4-1.9 get added when they're needed with parity enforced by the test.

**6. Story 1.4 — Text/Heading don't consume useLocalizedFontFamily().**
Story 1.1 (post-blocker-resolution) adds `useLocalizedFontFamily()` that returns `plusJakarta` for `en` and `urdu` for `ur`. But story 1.4's criteria for `Text` and `Heading` don't say to consume it. Result: Urdu strings would render in Plus Jakarta Sans (which has no Urdu glyphs) → fallback font → the very problem §17.22 resolved. Fix: add "`Text` and `Heading` consume `useLocalizedFontFamily()` and default their font family accordingly; consumers do not pass fontFamily explicitly."

**7. Story 1.8 — Confirm-then-reload modal has an unclear dep.**
The confirm modal in `LanguageProvider.setLocale()` is a UI concern. Two options:
- (a) Use catalog `Modal` from story 1.6 → add `1.6` to 1.8's `depends_on` (currently `[1.3, 1.7]`).
- (b) Use React Native's native `Alert.alert()` for phase 1 (zero catalog dep). Swap to catalog `Modal` later only if the phase 19 language-toggle brainstorm demands custom styling.
Recommendation: (b). Alerts are perfectly acceptable for a system-level "restart to apply" prompt (WhatsApp, Signal, Slack all use native Alerts for this). Avoids coupling providers to catalog UI. Fix: change story 1.8's confirm-modal wording from "confirm modal" to "confirm dialog via React Native `Alert.alert`".

**8. Story 1.10 — Coverage thresholds have no owner.**
Story 1.10 says the CI job "coverage thresholds from §12.1 are enforced by `jest.config.js` and the CI job surfaces the failure." But story 1.1's `jest.config.js` criterion only says it mirrors the `@` alias — nothing about `coverageThreshold`. Result: CI passes with 0% coverage. Fix: either add "`coverageThreshold: { global: { lines: 80, branches: 75, functions: 80, statements: 80 } }`" to story 1.1's jest config criterion, or add a "add coverageThreshold to jest.config.js" step to 1.10.

**9. Story 1.9 — auth-gate test wording is fuzzy.**
"A post-auth label query returns `null` when `status === 'unauthenticated'`" — what's a "post-auth label"? A screen from `AppTabs`? Fix: tighten to "renders `AuthStack` (not `AppTabs` or `OnboardingStack`) when `useAuth().status === 'unauthenticated'`; a `queryByText` for a known `AppTabs`-only label (e.g., the Discover tab label) returns `null`."

### Not gaps — noted for future phases

- **Screenshot flow.** No wizard screens are built in phase 1, so screenshot inventory is not needed. Starting phase 2, the /implement-phase Step 0 brainstorm should distill a per-phase screenshot inventory into the brainstorm file so subagents don't have to reverse-navigate three docs to find `5.jpeg`.
- **Story size (1.4/1.5/1.6).** Each catalog group story ships 10-18 components + tests. Big but coherent (typography+buttons, inputs, containers). Splitting further would create artificial boundaries. Leave as-is.
- **`options/*.json` schema.** Story 1.2 requires one JSON file per options list and a loader. Format (raw array vs `{value,label}` object list) isn't specified. Defer to the subagent per file — most fields will just want string arrays; some (religiousLevel with subtext) may want objects. Not blocking.

### Depends-on review

- 1.4/1.5/1.6 → 1.1: correct (theme + fonts).
- 1.7 → 1.2: correct (needs `env.ts`).
- 1.8 → 1.3, 1.7: correct if we take Alert-based confirm (finding 7 option b); otherwise add 1.6.
- 1.9 → 1.4, 1.8: correct (needs Button + Auth).
- 1.10 → 1.1, 1.3: correct (CI needs the project skeleton and the labels-parity test).
- Everything else `depends_on: []`: correct.

### Suggested edits summary (if user picks `address`)

| Story | Change |
|---|---|
| 1.1 | Add: Urdu font sourced from Google Fonts (SIL OFL) with LICENSE file committed alongside. |
| 1.1 | Add: package versions per architecture.md §16. |
| 1.1 | Add: `jest.config.js` sets `coverageThreshold: { global: { lines: 80, branches: 75, functions: 80, statements: 80 } }`. |
| 1.2 | Add: PNGs moved from project-root `templateimages/`; old folder deleted. |
| 1.2 | Fix: source path is absolute `C:\Users\syede\Claude-Master\muzzscreenshots\countrycodes.js`. |
| 1.3 | Enumerate baseline label keys. |
| 1.4 | Add: `Text` and `Heading` consume `useLocalizedFontFamily()`. |
| 1.8 | Change wording: React Native `Alert.alert` for the confirm-then-reload gate (not catalog Modal). |

If any of these seem wrong or you want a different direction, say so — otherwise pick `address` (I'll edit the PRD then you re-run `/implement-phase 1`) or `proceed` (I make no edits, dispatch begins).
