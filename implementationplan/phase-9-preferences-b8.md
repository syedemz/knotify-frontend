phase: 9
title: Preferences + relation (B8, pages 25-27)
last_updated: 2026-07-26 (story 9.1 done)

context_summary: |
  Phase 9 delivers the personality-traits multi-select (page 25) and the profile-for-whom relation picker (page 26 in wizard flow — but see note below). The second preferences list originally planned for page 26 has been dropped from scope per user decision on 2026-07-26 — the "interests" catalog is not needed. The relation picker (originally story 9.3) is renumbered 9.2 and remains the last story in this phase.

  Wizard page numbering: The physical wizard pages are still 25 and 27 (page 26 is now unused / skipped by the router). The relation screen keeps its class name `Page27RelationScreen` and its position after page 25 in the wizard sequence — the wizard router advances 25 → 27 directly (no page 26 stop). Subagent should NOT insert a placeholder page 26.

  Storage: Personality traits write into `draft.fields.preferences` (already declared `Record<string, unknown> | null` on `UserProfileWritable` at `src/types/api/UserProfile.ts:203`). The shape is `preferences: { personalityTraits: string[] }`. No `preferencesDraft` bag, no schema bump — writes go straight through `useOnboardingDraft.update(...)`. This preferences JSONB field IS sent in the final PATCH body (unlike the old §17.20 [Open] which is now resolved).

  Auto-advance: Page 25 uses a Continue button (multi-select — no natural stopping point). Page 27 uses tap-to-advance (single-choice), matching phase 8 pattern with the same `initializedRef` re-visit guard.

  Labels + Urdu: Every user-visible string added to both `labels.en.json` and `labels.ur.json` under `onboarding.<page>.*`. Urdu translations for the 57 personality traits are provided inline in story 9.1's AC below — subagent creates a translation map (English key → Urdu string) inside `labels.ur.json` under `onboarding.personalityTraits.options.*`. English trait strings are also the raw values stored in the DB (source of truth). MBTI acronyms (ENFJ, ENFP, ENTJ, ENTP, ESFJ, ESFP, ESTJ, ESTP, INFJ, INFP, INTJ, INTP, ISFJ, ISFP, ISTJ, ISTP) are technical codes — Urdu translation is the same acronym (no phonetic transliteration).

stories:
  - id: 9.1
    title: Page 25 - Personality traits multi-select (writes preferences.personalityTraits)
    agent: frontenddeveloper
    done: true
    tracking_issue: 104
    depends_on: []
    acceptance_criteria:
      - `Page25PersonalityTraitsScreen` renders header "How would you describe your personality?" and subheader "Select up to 5 traits to show off your personality!" (both localised).
      - The 57-trait catalog is stored in a new file `src/config/options/preferences1.json` as a flat array of English strings (source of truth for both UI values and DB values). Full ordered list is (alphabetical, matching Muzz screenshot 32-1/32-2/32-3): `Active Listener, Adventurous, Affectionate, Ambitious, Animal lover, Assertive, Bookworm, Brunch Lover, Carefree, Charismatic, Cheerful, Competitive, Confident, Conservative, Creative, Cultural, Empathetic, ENFJ, ENFP, ENTJ, ENTP, Entrepreneurial, ESFJ, ESFP, ESTJ, ESTP, Extroverted, Family-oriented, Fashionable, Funny, Generous, Germaphobe, Good with Kids, INFJ, INFP, Intelligent, INTJ, INTP, Introverted, ISFJ, ISFP, ISTJ, ISTP, Liberal, Nerdy, Night owl, Open-minded, Outdoorsy, Patient, Playful, Positive, Respectful, Romantic, Self-aware, Shopaholic, Spontaneous, Thoughtful`.
      - Options render as pill-style buttons in a wrapping two-column layout, matching Muzz screenshot 32-1 visual style. Reuse the catalog `PillButton` component (`src/components/PillButton.tsx`); do NOT invent a new pill component. Emojis on each pill are nice-to-have but NOT required for phase 9 — subagent may skip emojis if it complicates the layout.
      - Selection cap enforced at 5. Attempting to select a 6th trait either (a) shows a subtle toast/snackbar "You can select up to 5 traits" and rejects the tap, or (b) the 6th tap is a no-op silent reject. Subagent picks (a) if a Snackbar catalog component is convenient, otherwise (b). Selected pills are visually distinct (filled background / accent border) from unselected.
      - Below the pill grid, a "Select (N)" counter Continue button (from catalog `Button` — variant primary) is enabled when N >= 1 and writes `preferences: { personalityTraits: [...] }` to the draft on tap, then advances to `Page27RelationScreen` (skipping page 26 — the router jumps 25 → 27).
      - A "Skip" text button below the Continue button lets the user proceed without any selection. On Skip tap, `preferences` is NOT written (left untouched — if a prior value exists it stays; if none exists it stays null). Advance to `Page27RelationScreen`.
      - On re-visit (back-nav from page 27), previously-saved traits in `draft.fields.preferences?.personalityTraits` rehydrate as pre-selected pills. Continue button reflects the rehydrated count. Auto-advance never fires on mount — apply the `initializedRef` guard pattern from phase 8.
      - New labels added under `onboarding.personalityTraits.*` in `labels.en.json` and `labels.ur.json`:
        * `title`: "How would you describe your personality?" / (Urdu) "آپ اپنی شخصیت کو کیسے بیان کریں گے؟"
        * `subtitle`: "Select up to 5 traits to show off your personality!" / (Urdu) "اپنی شخصیت کو ظاہر کرنے کے لیے 5 خصوصیات تک منتخب کریں!"
        * `continueLabel`: "Select ({count})" / (Urdu) "منتخب کریں ({count})"
        * `skip`: "Skip" / (Urdu) "چھوڑ دیں"
        * `capExceededToast` (only if selection cap variant a is used): "You can select up to 5 traits" / (Urdu) "آپ 5 خصوصیات تک منتخب کر سکتے ہیں"
        * `options.*` — translation map for every trait: `Active Listener→فعال سننے والا, Adventurous→مہم جو, Affectionate→پیار کرنے والا, Ambitious→حوصلہ مند, Animal lover→جانوروں سے محبت کرنے والا, Assertive→پرزور, Bookworm→کتابی کیڑا, Brunch Lover→برنچ سے محبت کرنے والا, Carefree→بے فکر, Charismatic→پرکشش, Cheerful→خوش مزاج, Competitive→مسابقتی, Confident→پراعتماد, Conservative→قدامت پسند, Creative→تخلیقی, Cultural→ثقافتی, Empathetic→ہمدرد, Entrepreneurial→کاروباری, Extroverted→ملنسار, Family-oriented→خاندان دوست, Fashionable→فیشن ایبل, Funny→مزاحیہ, Generous→سخی, Germaphobe→جراثیم سے خوف زدہ, Good with Kids→بچوں کے ساتھ اچھا, Intelligent→ذہین, Introverted→کم گو, Liberal→آزاد خیال, Nerdy→کتابی, Night owl→رات کا جاگنے والا, Open-minded→کھلے ذہن کا, Outdoorsy→کھلی فضا کا شوقین, Patient→صابر, Playful→کھلاڑی, Positive→مثبت, Respectful→با ادب, Romantic→رومانوی, Self-aware→خود آگاہ, Shopaholic→خریداری کا شوقین, Spontaneous→بے ساختہ, Thoughtful→با شعور`. The 16 MBTI acronyms (ENFJ, ENFP, ENTJ, ENTP, ESFJ, ESFP, ESTJ, ESTP, INFJ, INFP, INTJ, INTP, ISFJ, ISFP, ISTJ, ISTP) are the same string in Urdu (no transliteration).
      - Screen wiring tests cover: (i) mount with empty preferences → no pills selected, Continue disabled, Skip enabled; (ii) tap 1 pill → Continue shows "Select (1)", enabled; (iii) tap 5 pills → 6th tap rejected (toast if variant a); (iv) tap Continue with 3 traits → writes `preferences: { personalityTraits: [...3 traits] }`, advances to Page27; (v) tap Skip → does not write, advances to Page27; (vi) re-visit with 3 traits in draft → 3 pills pre-selected, Continue "Select (3)", no auto-advance; (vii) re-visit and deselect all then tap Continue → still requires >=1 to advance (Continue disables at 0), or use Skip.
      - Wizard router (`src/features/onboarding/navigation/`) updated so page 25's advance target is `Page27RelationScreen`, not any placeholder page 26. Verify no other screen references or nav guards break.
    notes: "Deletes the previously-planned story 9.2 (interests multi-select). `preferences` writes go straight into the final PATCH body — the previous §17.20 [Open] is resolved. MBTI acronyms deliberately have no Urdu translation because they are technical/international personality codes."

  - id: 9.2
    title: Page 27 - Relation (profile-for-whom)
    agent: frontenddeveloper
    done: false
    tracking_issue: 105
    depends_on: [9.1]
    acceptance_criteria:
      - `Page27RelationScreen` renders header "Who are you creating this profile for?" and reads `options.relation` (Myself, Son, Daughter, Sibling, Friend, Ward) via the existing catalog.
      - Vertical `ListRowSelectable` list (matching pages 21/22 style) — one row per option.
      - Tap writes `relation` to the draft and auto-advances to `Page28PhotosScreen`. Auto-advance is tap-triggered only — never effect-driven on draft state.
      - On re-visit (back-nav from page 28), the previously-selected row rehydrates as highlighted but auto-advance MUST NOT re-fire — apply the `initializedRef` guard from phase 8 (same pattern as pages 21/22/23/24).
      - New labels added under `onboarding.relation.*` in `labels.en.json` and `labels.ur.json`:
        * `title`: "Who are you creating this profile for?" / (Urdu) "آپ یہ پروفائل کس کے لیے بنا رہے ہیں؟"
        * `options.*` — one-to-one translation: `Myself→میں خود, Son→بیٹا, Daughter→بیٹی, Sibling→بہن بھائی, Friend→دوست, Ward→زیر کفالت`.
      - Screen wiring tests cover: (i) mount empty → no row highlighted, no advance; (ii) tap "Myself" → writes `relation='Myself'`, advances to Page28; (iii) re-visit with `relation='Son'` → Son row highlighted, no auto-advance.
    notes: "Renumbered from the original story 9.3 after story 9.2 (interests) was dropped."
