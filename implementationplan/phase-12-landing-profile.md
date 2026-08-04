phase: 12
title: Landing page + profile page + profile edit shell
last_updated: 2026-08-04 (story 12.1 complete)

context_summary: |
  Phase 12 builds the FIRST post-onboarding UI: the "Marriage" landing page (the
  candidate view a male user sees after registration completes) plus the "Menu"
  tab's own-profile page (home + preview + edit-shell). Both surfaces render
  from **static dummy JSON fixtures** — there is NO API call, NO MSW handler,
  NO TanStack Query hook introduced in this phase. Deck-and-fetch flow ships in
  phase 13; real /profile/me GET/PATCH ships in the phase that follows the
  edit-shell fill-in.

  === STATIC-FIXTURE DATA SOURCE (temporary, per user 2026-08-04) ===

  Two new fixtures under `assets/`:

    - `assets/dummyfemale.json` — an as-if-fetched candidate profile shown to
      the (male) test user on the landing page. Uses `assets/female/Female3.png`
      and `assets/female/Female4.png` as its photos (the real photo pipeline
      lands with the discover deck in phase 13).
    - `assets/dummyprofile.json` — the (male) test user's OWN profile. Uses
      `assets/male/Male1.png`. This is the profile the Menu-tab home and the
      profile-preview screen render against.

  Both files include display-only extras under a top-level `__dummy_display_only`
  namespace (e.g. `is_active_today`, `membership_tier`, `dress_code`, `eats_halal`,
  `smokes`, `drinks`, `fasts`). These render as visual bubbles on the landing
  hero and inside the Faith section — the underlying columns do not exist in
  `UserProfileWritable` and are not captured anywhere in onboarding today. When
  a real capture screen or backend column ships, these dummy keys are removed
  from the JSON and the section components automatically stop rendering the
  affected bubbles (each bubble is independently guarded on
  `profile.__dummy_display_only?.<key> !== undefined`).

  Both files also include a `photos: string[]` array (client convention) and a
  `faceSelfieUri: string` — the presence of `faceSelfieUri` drives the green
  "verified profile" tick on the landing hero and the Verified Profile section
  block on landing7.

  `dummyprofile.json` additionally embeds a `__mutability_notes` block that
  documents which fields are immutable-after-first-set, rate-limited, and
  server-computed. This is a documentation artifact for the future edit-flow
  phase — Preview tab in this phase is display-only, Edit tab is a
  "Coming soon" `EmptyState`, so no field is actually mutated here.

  === TAB-BAR RENAMING ===

  `AppTabs` currently ships four placeholder tabs (Discover / Requests / Chat /
  Menu). This phase renames them to `Marriage / Explore / Chat / Menu` to match
  the Muzz-style branding shown in the reference screenshots (per user directive
  2026-08-04: "build the landing page exactly as shown in the screenshots").
  `Jamaa` is intentionally omitted (user explicitly excluded it). The type in
  `src/navigation/types.ts` is updated to match; any test asserting on
  `nav.tabs.discover` / `nav.tabs.requests` is updated in-place.

  The Menu tab gains a small nested stack (`MenuStack`) because the thumbnail
  tap on `MenuHomeScreen` navigates to `MyProfileScreen`. Explore and Chat
  remain placeholder `EmptyState` screens.

  === DEFERRED / DUMMY BEHAVIORS (audit trail for teardown) ===

    - The 4 round action buttons on the landing overlay (X / undo / super-like /
      ✓) render but pressing any shows a `Snackbar` toast "Available in a later
      phase". Real handlers land in phase 13 (discover deck).
    - The engagement cards on `MenuHomeScreen` (15 Likes / 3 Compliments /
      1 Profile Boost / €10 off Gold discount) render with HARD-CODED static
      numbers. These are pure visual — no state, no data source. They exist to
      match the profilehome.jpeg layout; monetization / engagement counters
      belong to a later phase.
    - The Basic-plan / Membership card on `MenuHomeScreen` renders as static
      copy. No upsell wiring.
    - `ShareProfileButton` triggers React Native's built-in `Share.share` with a
      placeholder deep-link URL `knotify://profile/<user_id>`. The listener in
      `linking.ts` is NOT wired this phase — the URL is text-only. Wiring lands
      when the discover deck resolves candidate profile IDs (phase 13).

  All of the above are enumerated in `context.md → Before shipping` with
  grep-able `// TODO(dummy-only)` markers at every call site.

  === SECTION CATALOG (single source of truth for section render rules) ===

  This phase introduces `src/features/profile-sections/`, a shared catalog of
  14 section components consumed by BOTH the landing candidate view AND the
  profile-preview own view. Each section is one component and is independently
  guarded — if all its fields are empty, the section returns `null`. Individual
  chips inside a section are also guarded independently.

  Section order (top-to-bottom on the scroll), and their real / dummy field
  bindings, is enumerated in the story acceptance criteria below (see 12.2).
  The one-liner rule: no section renders empty, no chip renders on null data.

stories:

  - id: 12.1
    title: Dummy JSON fixtures + type declarations
    agent: frontenddeveloper
    done: true
    depends_on: []
    tracking_issue: 112
    acceptance_criteria:
      - Two fixture files are added under `assets/`:
        (a) `assets/dummyfemale.json` — a female candidate profile using
        `assets/female/Female3.png` and `assets/female/Female4.png` as its two
        photos, `faceSelfieUri` set to Female3.png, `siblings` populated with
        two entries (see sibling shape below), `preferences.personalityTraits`
        populated with 5 traits (suggested: `["Adventurous", "Family-oriented",
        "Bookworm", "Fitness enthusiast", "Foodie"]` — subagent may override
        with equivalent traits from `src/config/options`), and a
        `__dummy_display_only` block containing `is_active_today: true`,
        `membership_tier: "gold"`, `has_unread_notifications: true`,
        `dress_code: "Modest"`, `eats_halal: true`, `smokes: false`,
        `drinks: false`, `fasts: true`.
        (b) `assets/dummyprofile.json` — the (male) test user's own profile
        using `assets/male/Male1.png` as its single photo, `siblings: []`
        (proves the hide-if-empty guard), `preferences.personalityTraits`
        with exactly one trait (`["Night owl"]`), a `__mutability_notes` block
        documenting `immutable_after_first_set`, `rate_limited`,
        `server_computed`, and `mutable` field categories per
        `src/Helper/immutableFieldHelper.ts`, and the same `__dummy_display_only`
        block shape as the female fixture.
      - **Pinned literal identity values** (used by tests in 12.4 and 12.5 —
        subagent must match these EXACTLY, not invent):
        `dummyprofile`: `first_name: "Adnan"`, `last_name: "Malik"`,
        `age: 29`, `current_residence_city: "Mannheim"`,
        `current_residence_country: "Germany"`, `resident_country_code: "DE"`,
        `job_title: "Software Engineer"`, `religion: "Islam"`,
        `religious_level: "Practicing"`.
        `dummyfemale`: `first_name: "Aisha"`, `last_name: "Khan"`,
        `age: 27`, `current_residence_city: "Berlin"`,
        `current_residence_country: "Germany"`, `resident_country_code: "DE"`,
        `job_title: "Product Designer"`, `religion: "Islam"`,
        `religious_level: "Practicing"`.
        Every other required-for-completion field in the fixtures may be
        filled with any plausible non-null value the subagent chooses.
      - Both fixtures satisfy every non-nullable field in `UserProfileWritable`
        so the file is a valid overlay of the real API shape when the API lands.
      - New type files added:
        `src/types/DummyFemaleProfile.ts` and `src/types/DummyOwnProfile.ts`.
        Both extend `UserProfile` with:
        (1) an optional `photos: string[]`,
        (2) an optional `faceSelfieUri: string | null`,
        (3) an optional `siblings: DummySibling[]` where `DummySibling` is a
        new exported type declared in the same file(s) (or in a shared
        `src/types/DummySibling.ts` — subagent's choice) with shape
        `{ name: string | null; age: number | null;
        marital_status: string | null; gender: 'Male' | 'Female' | null;
        profession: string | null }`. All fields nullable so per-chip hide
        guards inside SiblingsSection (story 12.2) have something to test.
        Add a TSDoc note on the `siblings` field: "Client-side dummy only in
        phase 12. A future backend migration will introduce a dedicated
        `siblings` table keyed by `user_id`; when that lands, this optional
        override is removed and the field is served via a separate include on
        the profile response." This documents the intent captured in the
        brainstorm.
        (4) an optional `__dummy_display_only: { is_active_today?: boolean;
        membership_tier?: 'gold' | 'silver' | null;
        has_unread_notifications?: boolean; dress_code?: string;
        eats_halal?: boolean; smokes?: boolean; drinks?: boolean;
        fasts?: boolean; }`.
        (5) A narrowed `preferences` field:
        `preferences?: ({ personalityTraits?: string[] } &
        Record<string, unknown>) | null`. This lets PersonalitySection read
        `preferences.personalityTraits` without a cast, while still allowing
        arbitrary other keys.
        `DummyOwnProfile` additionally allows an optional `__mutability_notes`
        block (documentation-only).
      - A parse-time test at `__tests__/assets/dummyFixtures.test.ts` imports
        both JSON files and asserts each satisfies its declared type via a
        structural type-guard (`assertIs<DummyFemaleProfile>(dummyFemale)`).
        The test also asserts `dummyfemale.siblings.length === 2`,
        `dummyprofile.siblings.length === 0`, `dummyfemale.photos.length === 2`,
        `dummyprofile.photos.length === 1`,
        `dummyprofile.first_name === "Adnan"`,
        `dummyprofile.last_name === "Malik"`,
        `dummyfemale.first_name === "Aisha"`,
        `dummyprofile.preferences?.personalityTraits?.length === 1`,
        `dummyfemale.preferences?.personalityTraits?.length === 5`.
      - `tsconfig.json` — confirm `resolveJsonModule: true` is set at the
        `compilerOptions` level. It is NOT currently set in this repo — the
        subagent must add it as part of this story or the JSON imports will
        fail typecheck.
    notes: ""

  - id: 12.2
    title: Profile-section catalog + hide-if-empty guards
    agent: frontenddeveloper
    done: false
    depends_on: [12.1]
    tracking_issue: 113
    acceptance_criteria:
      - New folder `src/features/profile-sections/` with one container
        `ProfileScrollView.tsx` and 14 section components under `sections/`:
        HeroBlock, AboutMeSection, MarriageIntentionsSection, FaithSection,
        FuturePlansSection, PhotoBlockSection, PersonalitySection,
        EducationSection, ProfessionalCareerSection, ParentsSection,
        AddressSection, SiblingsSection, VerifiedProfileSection,
        ContactActionsSection. Barrel exported via
        `src/features/profile-sections/index.ts`.
      - `ProfileScrollView` takes `{ profile: UserProfile & DummyOverlay,
        viewer: 'other' | 'self' }` and renders the sections in the fixed order
        listed above. Sections that would be empty return `null` and produce
        no wrapper markup.
      - **Field bindings and guard rules (single source of truth)**:
        (1) **HeroBlock** — takes an implicit `viewer: 'other' | 'self'` prop
        (propagated by `ProfileScrollView`). **`viewer === 'other'` returns
        `null`** — the landing candidate view supplies its own hero via
        `<CandidateHero>` in story 12.4, so HeroBlock does not double-render.
        For `viewer === 'self'` (profile preview), reads `photos[0]`
        (fallback `photo_url`), `first_name`, `age`,
        `current_residence_city`, `current_residence_country`,
        `resident_country_code`, `job_title`, `faceSelfieUri` (drives green
        tick), `religious_level`. Renders the full-bleed image with name /
        age / "MANNHEIM, GERMANY" subtitle / country-flag + job-title +
        religious-level chip strip at the bottom of the image, per
        profile1.jpeg. Country-flag chip hides if `resident_country_code`
        null; profession chip hides if `job_title` null; religious-level
        chip hides if `religious_level` null. The Active-today and Gold
        overlay bubbles are NOT rendered — those are engagement-facing
        surfaces for the OTHER viewer, owned by `CandidateHero` in 12.4.
        Never hides overall in the `'self'` variant (hero is the entry
        point of the Preview tab).
        (2) **AboutMeSection** — reads `marital_status`, `has_children`. Each
        chip hides on null. Section hides if both null.
        (3) **MarriageIntentionsSection** — reads `relation`, `marriage_time`.
        Renders a two-anchor rail: `Match! ─── <relation> (<marriage_time>)`.
        Hides if `marriage_time` null.
        (4) **FaithSection** — reads `religion`, `subsect`, `religious_level`
        (3 real chips) and `__dummy_display_only.{dress_code, eats_halal, smokes,
        drinks, fasts}` (5 dummy chips). Each of the 8 chips hides independently
        on null / absent. Section hides if all 8 would hide.
        (5) **FuturePlansSection** — reads `move_abroad` (renders "Open to
        relocate globally" / "Won't move abroad") and `has_children` (renders
        "Open to having children" / "Doesn't want children"). Each chip hides
        on null. Section hides if both null.
        (6) **PhotoBlockSection** — mid-scroll full-bleed image. Renders
        `photos[1]` if `photos.length >= 2`; hides otherwise.
        (7) **PersonalitySection** — reads `preferences.personalityTraits[]`.
        Renders one chip per trait. Hides if array missing or empty.
        (8) **EducationSection** — reads `education_level`, `college_name`,
        `graduation_year`, `highest_degree`, `higher_secondary`,
        `higher_secondary_passing_year`, `high_school`,
        `high_school_passing_year`. Each row (Degree / College / Higher
        secondary / High school) hides if its primary field null; year suffix
        hides if year null. Section hides if all 4 rows would hide.
        (9) **ProfessionalCareerSection** — reads `professional_category`,
        `job_title`, `employer_name`, `employment_type`, `office_address`,
        `salary_range`. Each chip / row guarded independently. Section hides if
        all fields null.
        (10) **ParentsSection** — reads `fathers_name`, `fathers_job`,
        `father_retired`, `mothers_name`, `mothers_job`, `mother_retired`.
        Father block hides if `fathers_name` null (job / retired chips inside
        the father block also each hide independently); mother block
        symmetric. Section hides if both parent blocks hidden.
        (11) **AddressSection** — reads `current_residence_city`, `district`,
        `family_residence_address`. Labels: "Current residence", "Home
        district", "Home address". Each row guarded. Section hides if all
        three null.
        (12) **SiblingsSection** — reads `siblings[]`. Renders one card per
        sibling; inside a card, `name` / `age` / `marital_status` / `gender` /
        `profession` each hide on null. Section hides if
        `siblings.length === 0`.
        (13) **VerifiedProfileSection** — reads `faceSelfieUri`, `first_name`.
        Hides if `faceSelfieUri` null.
        (14) **ContactActionsSection** — reads `phone_number`, `first_name`.
        Only renders when `viewer === 'other'`; returns `null` for
        `viewer === 'self'` (Favourite/Block/Report make no sense on self;
        Share is rendered separately by the profile-preview footer).
        For `viewer === 'other'`: renders a phone-number row (hidden if
        `phone_number` null), a `<ShareProfileButton variant="row-link" />`,
        and a disabled Favourite / Block / Report triad (buttons render at
        reduced opacity, no press handlers). Never hides in the other-viewer
        variant — Share is always available.
      - **Test harness**: a small `TestHarness` file under
        `__tests__/features/profile-sections/_harness.tsx` mounts one section
        at a time with a synthetic minimal profile. Each of the 14 sections has
        its own test file that asserts (a) full-data render path, (b)
        section-level hide path, (c) at least one bubble-level hide path.
      - Guard-behavior integration test:
        `__tests__/features/profile-sections/ProfileScrollView.hideEmpty.test.tsx`
        renders the whole `<ProfileScrollView profile={dummyprofile}
        viewer="self" />` (siblings empty, one photo) and asserts
        SiblingsSection and PhotoBlockSection and ContactActionsSection are
        NOT in the tree while HeroBlock (self variant) and the other
        sections are; then renders `<ProfileScrollView viewer="self"
        profile={syntheticMinimalProfile} />` (only `first_name` and
        `birthday` set) and asserts only HeroBlock is in the tree; then
        renders `<ProfileScrollView viewer="other" profile={dummyfemale}
        />` and asserts HeroBlock is NOT in the tree (it returns null for
        viewer='other') while the other sections render (ContactActions,
        Siblings, PhotoBlock, etc. are all present because the female
        fixture is full).
      - No screen wiring in this story — sections are validated through the
        harness. Screen consumers land in 12.4 and 12.5.
    notes: ""

  - id: 12.3
    title: Reusable Share primitive
    agent: frontenddeveloper
    done: false
    depends_on: []
    tracking_issue: 114
    acceptance_criteria:
      - New pure helper `src/features/profile/buildShareMessage.ts` exposing
        `buildShareMessage(profile: Pick<UserProfile, 'user_id' | 'first_name'>):
        { message: string; url: string }` that returns
        `{ message: "Check out <first_name> on Knotify: <url>",
        url: "knotify://profile/<user_id>" }`. Deep-link URL is a placeholder;
        the phase does NOT wire a `linking.ts` handler. Documented in the
        deferred-behaviors context-summary block.
      - New component `src/features/profile/components/ShareProfileButton.tsx`
        accepting `{ profile: Pick<UserProfile, 'user_id' | 'first_name'>;
        variant: 'icon-only' | 'pill' | 'row-link'; testID?: string }`.
        - `icon-only` — 24×24 share glyph, no label. Used at profile1.jpeg
          top-right.
        - `pill` — rounded outline button, icon left, label "Share". Used on
          profilehome.jpeg next to Edit.
        - `row-link` — centered icon + "Share profile" text, no background.
          Used at landing7.jpeg bottom and profile3.jpeg bottom.
        On press, calls React Native's built-in `Share.share({ message, url })`
        with the result of `buildShareMessage(profile)`. Rejection (user
        cancels) is swallowed with `.catch(() => {})`.
      - Labels added under `share.*` (`share.action`, `share.messagePrefix`,
        `share.actionAccessibility`) in both `labels.en.json` and
        `labels.ur.json`.
      - Tests:
        `__tests__/features/profile/buildShareMessage.test.ts` — snapshot-style,
        given a fixture profile, returns exact `{ message, url }` shape.
        `__tests__/features/profile/ShareProfileButton.test.tsx` — three tests,
        one per variant, each asserts (a) distinct testID renders, (b) press
        triggers `Share.share` with the message from `buildShareMessage`.
        `Share` is mocked via `jest.spyOn(Share, 'share')`.
    notes: ""

  - id: 12.4
    title: MarriageLandingScreen + CollapsingActionBar + HeaderBar
    agent: frontenddeveloper
    done: false
    depends_on: [12.2]
    tracking_issue: 115
    acceptance_criteria:
      - New folder `src/features/landing/` with barrel `index.ts` and the
        following components:
        - `screens/MarriageLandingScreen.tsx` — the landing screen. Statically
          imports `assets/dummyfemale.json`. Composes, top-to-bottom:
          `<HeaderBar />` (sticky top), `<CandidateHero profile={dummyfemale}
          />` (full-bleed hero at the top of the scroll), then the section
          catalog via `<ProfileScrollView profile={dummyfemale}
          viewer="other" />` for the body (HeroBlock inside ProfileScrollView
          returns `null` for `viewer === 'other'` per 12.2, so no double
          hero), then a floating `<CollapsingActionBar />` overlay at the
          bottom. CandidateHero is rendered as the first child of the scroll
          content, not as a sticky overlay — it scrolls up with the page.
        - `components/HeaderBar.tsx` — thin sticky header. Left: filter icon
          (`Ionicons/options-outline` via `@expo/vector-icons`), press is a
          no-op. Right: notification bell (`Ionicons/notifications-outline`),
          press is a no-op. NOT rendered: the Sort pill or the green
          lightning-bolt bubble from the reference screenshot (per user
          directive: header has ONLY filter icon left, bell icon right). The
          bell renders with a small red dot when
          `dummyfemale.__dummy_display_only?.has_unread_notifications === true`
          (guarded — hides if the key is absent).
        - `components/CandidateHero.tsx` — the standalone landing hero (this
          is NOT redundant with HeroBlock; HeroBlock only renders the
          self-preview hero per 12.2, and returns `null` for
          `viewer === 'other'`). Takes `{ profile: DummyFemaleProfile }`.
          Renders full-bleed hero image (`photos[0]` fallback `photo_url`),
          the two overlay bubbles ("Active today" / "Gold" — each guarded
          on the matching `__dummy_display_only` key), and the
          name / age / green-tick / city-and-country / country-flag /
          profession chip strip beneath the image. Green tick appears only
          when `faceSelfieUri` is non-null. Country-flag chip hides if
          `resident_country_code` null; profession chip hides if `job_title`
          null.
        - `components/CollapsingActionBar.tsx` — bottom floating overlay
          containing ONLY the four round action buttons (X / undo / star /
          ✓) in a single row. Sits above (and independent of) the native
          React Navigation bottom tab bar. Uses colors matching landing1.jpeg.
      - **Collapse animation** — done in TWO independent pieces:
        (a) The four action buttons in `CollapsingActionBar` stay anchored;
        they do NOT collapse. Only the underlying tab bar collapses.
        (b) The native React Navigation bottom tab bar collapses on
        downward scroll. Achieved without a custom tab-bar reimpl: the
        `Marriage` tab entry (registered in 12.6) sets `screenOptions` such
        that `tabBarStyle` is an animated style bound to a shared value
        published by `MarriageLandingScreen`. The screen creates
        `previousScrollY = useSharedValue(0)` and `tabBarHidden =
        useSharedValue(0)`; `useAnimatedScrollHandler` diffs
        `event.contentOffset.y` vs `previousScrollY.value`, and when the
        delta exceeds 8px sets `tabBarHidden.value = withTiming(1,
        { duration: 220 })` (scroll down) or `withTiming(0, ...)` (scroll
        up). The AppTabs Marriage `tabBarStyle` reads that shared value via
        `useAnimatedStyle` to map to `translateY` (0 → tabBarHeight) and
        `opacity` (1 → 0). Coordination: MarriageLandingScreen exports a
        module-scope shared value (`marriageTabBarHidden`) that AppTabs
        imports for its Marriage-tab `tabBarStyle`. This keeps
        MarriageLandingScreen self-contained: no navigation-level scroll
        hooks, no wrapper component around AppTabs. Minimum scroll-delta
        threshold is 8px to avoid twitchy hides.
      - **Action-button no-op behavior**: local-state Snackbar pattern
        (matches Page25 and Page30). `MarriageLandingScreen` holds
        `const [snackbarMsg, setSnackbarMsg] = useState<string | null>(null)`.
        Each of the four round buttons calls
        `setSnackbarMsg(t('landing.actionUnavailable'))`. The screen renders
        `<Snackbar visible={snackbarMsg !== null} message={snackbarMsg ??
        ""} onDismiss={() => setSnackbarMsg(null)} />` at its root. New label
        `landing.actionUnavailable: "Available in a later phase"` added to
        both locales. NO global `showSnackbar()` helper is introduced —
        that infrastructure change is out of scope for phase 12.
      - **Reanimated Jest mock** (prerequisite for the screen wiring test):
        add `jest.mock('react-native-reanimated', () =>
        require('react-native-reanimated/mock'));` to `jest.setup.ts` (the
        repo's Jest global setup — if the file does not exist, create it
        and register it in `jest.config` under `setupFilesAfterEach` or the
        preset's equivalent hook). This is not currently present — the
        subagent must verify and add. Without it, MarriageLandingScreen
        tests will crash on Reanimated worklet imports.
      - Screen wiring test at
        `__tests__/features/landing/MarriageLandingScreen.test.tsx`:
        (a) renders the hero with `dummyfemale.first_name` ("Aisha") visible,
        (b) all sections that should render on the female fixture are
        mounted: AboutMe, MarriageIntentions, Faith, FuturePlans,
        PhotoBlock (photos.length === 2), Personality, Education,
        ProfessionalCareer, Parents, Address, Siblings (siblings.length
        === 2), VerifiedProfile, ContactActions. (HeroBlock is skipped
        because viewer === 'other' — CandidateHero handles it instead.
        So 13 sections in the ScrollView + 1 CandidateHero above.)
        (c) tapping the ✓ button renders the toast with text
        `t('landing.actionUnavailable')` (queried via `getByText`, not via
        a mock),
        (d) HeaderBar renders filter icon + bell icon and NO Sort pill /
        green lightning bubble.
      - Animation is NOT tested (Reanimated worklets are mocked to no-op per
        the setup added above).
      - Labels added: `landing.*` (`landing.actionUnavailable`,
        `landing.header.filter`, `landing.header.notifications`,
        `landing.hero.activeToday`, `landing.hero.gold`, `landing.hero.verified`,
        etc.) in both locales.
    notes: ""

  - id: 12.5
    title: MenuHomeScreen + MyProfileScreen (Preview tab + Edit shell)
    agent: frontenddeveloper
    done: false
    depends_on: [12.2, 12.3]
    tracking_issue: 116
    acceptance_criteria:
      - New files under `src/features/profile/`:
        - `screens/MenuHomeScreen.tsx` — the Menu-tab home. Statically imports
          `assets/dummyprofile.json`. Renders header (top bar with "Marriage v"
          dropdown left, settings + bell right — dropdown / settings are
          no-ops, bell is a no-op), then the profile row (round avatar
          composed via `ProfileThumbnailCircle`, "Adnan Malik" + verified
          tick, `<ShareProfileButton variant="pill" />`, Edit pill — the
          Edit pill's press navigates to `MyProfileScreen` with
          `{ initialTab: 'edit' }` (the Edit TAB itself renders an
          `EmptyState` "Coming soon" and does not mutate profile state; the
          pill is not itself a no-op, the destination tab is)), then a
          static chip row (Membership / Invite / Help / Safety & Advice —
          all press no-ops), then the Basic-plan card (static copy, Upgrade
          button no-op), then the engagement cards row (`15 Likes` /
          `3 Compliments` / `1 Profile Boost` — hard-coded numbers, all
          Get-more buttons no-op), then the €10 off Muzz Gold discount card
          (hard-coded, Claim-discount button no-op). Tapping the avatar
          navigates to `MyProfileScreen` with `{ initialTab: 'preview' }`.
        - `screens/MyProfileScreen.tsx` — takes `{ initialTab?: 'preview' |
          'edit' }`. Renders a header: close X (goBack) left, "Adnan Malik" +
          verified tick center, `<ShareProfileButton variant="icon-only" />`
          right. Below the header, a two-segment tab bar: `Preview` | `Edit`.
          The Preview tab renders `<ProfileScrollView profile={dummyprofile}
          viewer="self" />`. `ProfileScrollView` renders all 14 sections; the
          `viewer="self"` variant makes HeroBlock render its self-hero layout
          (per story 12.2, profile1.jpeg style) and omits the
          ContactActionsSection (Favourite/Block/Report make no sense on
          self). SiblingsSection and PhotoBlockSection hide because
          dummyprofile.siblings is empty and dummyprofile.photos.length === 1.
          At the bottom of the Preview scroll, renders
          `<ShareProfileButton variant="row-link" />`. The Edit tab renders an
          `EmptyState` with title "Coming soon" and description "Profile
          editing is coming in a later phase".
        - `components/ProfileThumbnailCircle.tsx` — a thin wrapper that
          COMPOSES the existing `<Avatar />` primitive
          (`src/components/Avatar.tsx`) and layers an optional small
          edit-pencil dot overlay in the corner. Does NOT reimplement avatar
          rendering. Takes `{ uri: string; onPress?: () => void;
          showEditDot?: boolean; size?: number }`. Internally renders
          `<Avatar uri={uri} size={size} />` inside a pressable wrapper and
          absolutely-positions a small `<Icon name="pencil" />` badge when
          `showEditDot === true`.
      - Screen wiring tests:
        `__tests__/features/profile/MenuHomeScreen.test.tsx`:
        (a) renders with `dummyprofile.first_name + " " + last_name` visible,
        (b) Share pill press triggers `Share.share`,
        (c) tapping the avatar navigates to `MyProfileScreen` with `{
        initialTab: 'preview' }`,
        (d) tapping the Edit pill navigates to `MyProfileScreen` with `{
        initialTab: 'edit' }`,
        (e) engagement cards render the exact hard-coded numbers 15 / 3 / 1.
        `__tests__/features/profile/MyProfileScreen.test.tsx`:
        (a) Preview tab (default) renders HeroBlock (self variant),
        AboutMe, MarriageIntentions, Faith, FuturePlans, Personality,
        Education, ProfessionalCareer, Parents, Address, VerifiedProfile;
        SiblingsSection is NOT rendered (dummyprofile.siblings is empty);
        PhotoBlockSection is NOT rendered (dummyprofile.photos.length === 1);
        ContactActionsSection is NOT rendered (viewer === 'self'),
        (b) Edit tab renders `EmptyState` "Coming soon",
        (c) top-right icon-only Share triggers `Share.share`,
        (d) bottom row-link Share triggers `Share.share`,
        (e) tapping the close X calls `navigation.goBack`.
      - Labels added: `menu.*` and `myProfile.*` in both locales.
    notes: ""

  - id: 12.6
    title: AppTabs rename + Menu nested stack wiring
    agent: frontenddeveloper
    done: false
    depends_on: [12.4, 12.5]
    tracking_issue: 117
    acceptance_criteria:
      - `src/navigation/AppTabs.tsx` is updated to register FOUR tabs in this
        exact order: `Marriage` (icon: `MaterialCommunityIcons/ring`),
        `Explore` (icon: `Ionicons/heart-outline`), `Chat` (icon:
        `Ionicons/chatbubble-outline`), `Menu` (icon: the user's avatar from
        `dummyprofile.photos[0]` cropped to a 24×24 circle; falls back to
        `Ionicons/menu` if the image is unloadable). Tab bar labels are pulled
        from `nav.tabs.marriage`, `nav.tabs.explore`, `nav.tabs.chat`,
        `nav.tabs.menu`.
      - `Marriage` renders `<MarriageLandingScreen />` (from 12.4). `Menu`
        renders `<MenuStack />` (below). `Explore` and `Chat` remain
        `EmptyState` placeholders as before.
      - New nested stack `src/navigation/MenuStack.tsx` with two screens:
        `MenuHomeScreen` (initial) and `MyProfileScreen`. Header hidden by
        default (both screens own their own headers).
      - `src/navigation/types.ts` updated:
        - `AppTabsParamList` becomes `{ Marriage: undefined; Explore:
          undefined; Chat: undefined; Menu: NavigatorScreenParams<
          MenuStackParamList> }`.
        - New exported type `MenuStackParamList = { MenuHomeScreen: undefined;
          MyProfileScreen: { initialTab?: 'preview' | 'edit' } | undefined }`.
      - Labels added: `nav.tabs.marriage`, `nav.tabs.explore` (both locales).
        `nav.tabs.chat` and `nav.tabs.menu` already exist and are reused.
        `nav.tabs.discover` and `nav.tabs.requests` REMAIN in the label
        catalog for now (no deletion) to keep phase-level diff surface small;
        a separate cleanup PR can remove them once no dead references exist.
      - Any existing test that references `AppTabsParamList` members
        (`Discover`, `Requests`) or the labels `nav.tabs.discover` /
        `nav.tabs.requests` is updated in-place to use the new names. Grep
        confirms zero remaining references after the rename.
      - **Specifically, the following existing test files must be updated
        in-place** (both currently reference `nav.tabs.discover`):
        (1) `__tests__/navigation/AppTabs.test.tsx` (currently asserts
        `queryByText(t("nav.tabs.discover"))` — swap to `nav.tabs.marriage`),
        (2) `__tests__/navigation/auth-gate.test.tsx` (currently asserts
        `nav.tabs.discover` at multiple lines: 248, 272, 275, 287, 290-291,
        319, 348 — all positive-identify checks swap to `nav.tabs.marriage`;
        negative-identify checks stay semantic).
      - After the rename, grep for `nav.tabs.discover` and `nav.tabs.requests`
        across `__tests__/` must return zero hits.
      - End-to-end wiring test at
        `__tests__/navigation/MenuStack.test.tsx` asserts: mounting the Menu
        tab lands on `MenuHomeScreen`; tapping the avatar navigates to
        `MyProfileScreen`; goBack returns to `MenuHomeScreen`.
    notes: ""
