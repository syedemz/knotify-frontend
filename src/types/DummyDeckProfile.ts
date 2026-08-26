/**
 * Type for deck-card fixtures used by the Phase 13 discover feature.
 *
 * The backend `deck_view` today exposes 16 columns (see
 * `knotify-backend/db-schema.json → views.deck_view.columns`). Phase 13
 * fixtures intentionally carry **more** — the extra fields power the
 * About Me / Marriage Intentions / Education / Professional Career blocks
 * visible on each deck card.
 *
 * When backend `deck_view` is extended in a later backend migration, the
 * fields tagged `@frontend-extension` will be dropped from this type and
 * served via the real deck response instead.
 *
 * @module types/DummyDeckProfile
 */

import type { DummyDisplayOnly } from '@/types/DummyFemaleProfile';

// ── Backend deck_view columns (the 16 columns the real view exposes today) ────

/**
 * The 16 fields the backend `deck_view` exposes today.
 *
 * Keep in sync with `knotify-backend/db-schema.json → views.deck_view.columns`.
 * Do NOT add non-backend fields here — put them in the extension block below.
 */
interface DeckViewBackendFields {
  /** Cognito `sub` — the user's immutable UUID primary key. */
  readonly user_id: string;

  /** Given name. */
  readonly first_name: string;

  /** Family name. */
  readonly last_name: string;

  /** Biological sex. */
  readonly sex: 'Male' | 'Female';

  /** Age in years (computed from birthday). */
  readonly age: number;

  /** Chosen profile avatar identifier or URL. Nullable. */
  readonly chosen_profile_avatar: string | null;

  /** Direct photo URL. */
  readonly photo_url: string;

  /** City of current residence. */
  readonly current_residence_city: string;

  /** Country of current residence (full name). */
  readonly current_residence_country: string;

  /** ISO 3166-1 alpha-2 country code for current residence. */
  readonly resident_country_code: string;

  /** Religion text. */
  readonly religion: string;

  /** Current or most recent job title. */
  readonly job_title: string;

  /** Optional username. */
  readonly username: string;

  /**
   * Whether the profile is complete and verified.
   * Server-controlled — never send in PATCH bodies.
   */
  readonly profile_complete_verified: boolean;
}

// ── Frontend-only extensions (not in backend deck_view yet) ───────────────────

/**
 * Extra fields needed by the deck-card section components that are NOT yet
 * in the backend `deck_view`. Each field carries `@frontend-extension` so the
 * divergence from the real backend shape is grep-able:
 *
 *   grep -r '@frontend-extension' src/types/DummyDeckProfile.ts
 *
 * When a backend migration adds these columns to `deck_view`, remove the
 * corresponding field from this interface and update `deckFixtures.ts` to
 * read the value from the real response.
 */
interface DeckViewFrontendExtensions {
  /**
   * Ordered photo URIs for this profile. Index 0 = hero image.
   *
   * @frontend-extension Absent from backend deck_view; served via a future
   * photos-array endpoint or deck_view extension.
   */
  readonly photos: string[];

  /**
   * URI of the verified face selfie. Drives the verified tick on CandidateHero
   * and inside VerifiedProfileSection.
   *
   * @frontend-extension Not in backend deck_view; will arrive via a photos/
   * verification endpoint.
   */
  readonly faceSelfieUri: string | null;

  /**
   * Marital status. Powers AboutMeSection chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly marital_status: string | null;

  /**
   * Whether the user has children. Powers AboutMeSection chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly has_children: boolean | null;

  /**
   * Intended marriage timeline (e.g. "Within 1 year"). Powers
   * MarriageIntentionsSection timeline anchor.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly marriage_time: string | null;

  /**
   * How soon the user wants to meet. Powers MarriageIntentionsSection
   * "meet" anchor label.
   *
   * @frontend-extension Absent from backend deck_view; introduced in phase 13
   * batch-C polish as a client-local field during onboarding.
   */
  readonly meet_time: string | null;

  /**
   * Professional category (broad occupational grouping). Powers
   * ProfessionalCareerSection chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly professional_category: string | null;

  /**
   * Name of current or most recent employer. Powers ProfessionalCareerSection
   * chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly employer_name: string | null;

  /**
   * Employment type (e.g. "Full-time"). Powers ProfessionalCareerSection chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly employment_type: string | null;

  /**
   * Office or workplace address. Powers ProfessionalCareerSection chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly office_address: string | null;

  /**
   * Salary range band. Powers ProfessionalCareerSection chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly salary_range: string | null;

  /**
   * Name of highest degree credential (e.g. "MSc Human-Computer Interaction").
   * Powers EducationSection degree chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly highest_degree: string | null;

  /**
   * Highest level of education achieved (e.g. "Masters"). Powers EducationSection
   * degree chip as a fallback to highest_degree.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly education_level: string | null;

  /**
   * Name of college or university attended. Powers EducationSection college chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly college_name: string | null;

  /**
   * Year of graduation from highest degree program. Optional year suffix for
   * EducationSection degree chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly graduation_year: number | null;

  /**
   * Higher secondary school or college name (e.g. A-levels institution).
   * Powers EducationSection higher-secondary chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly higher_secondary: string | null;

  /**
   * Year of higher secondary completion. Optional year suffix.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly higher_secondary_passing_year: number | null;

  /**
   * High school (secondary school) name. Powers EducationSection high-school chip.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly high_school: string | null;

  /**
   * Year of high school completion. Optional year suffix.
   *
   * @frontend-extension Absent from backend deck_view (present on users table).
   */
  readonly high_school_passing_year: number | null;

  /**
   * Display-only field bag for CandidateHero extras (active-today dot,
   * membership tier badge, unread-notifications dot) that have no backend
   * `deck_view` column yet.
   *
   * @frontend-extension Entire block absent from backend deck_view.
   */
  readonly __dummy_display_only: {
    /**
     * Whether the profile owner was active on the app today.
     * @frontend-extension
     */
    readonly is_active_today: boolean;

    /**
     * Membership tier displayed as a badge on CandidateHero.
     * @frontend-extension
     */
    readonly membership_tier: 'gold' | 'silver' | null;

    /**
     * Whether the profile has unread notifications. Derived from the CURRENT
     * USER's profile (dummyprofile), NOT the viewed deck card.
     * @frontend-extension
     */
    readonly has_unread_notifications: boolean;
  };
}

// ── Public type ───────────────────────────────────────────────────────────────

/**
 * The shape of a single deck-card fixture in `assets/dummydeck/`.
 *
 * Combines the 16 real backend `deck_view` columns with the frontend-only
 * extensions needed by the deck-card section components. All frontend-only
 * fields carry a JSDoc `@frontend-extension` tag so the divergence from the
 * backend shape is grep-able.
 *
 * @see DeckViewFrontendExtensions for teardown instructions per field.
 */
export type DummyDeckProfile = DeckViewBackendFields & DeckViewFrontendExtensions;
