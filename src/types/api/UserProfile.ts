/**
 * Frontend view type for the `users` table.
 *
 * Derived from `knotify-backend/db-schema.json` (migrations 0000–0018, §14 of
 * architecture.md). This type mirrors every column the backend exposes in its
 * REST responses — authority is `db-schema.json`, not this file.
 *
 * NOTE: `preference_vector` MUST NOT appear in `UserProfile`. The backend
 * strips it from all API responses (pgvector column, backend-computed only).
 * If a future migration adds a new user column, add it here AND to the
 * db-schema.json type guard in the same PR.
 *
 * @module types/api/UserProfile
 */

/**
 * The shape of a user row as returned by the REST API.
 *
 * Fields map 1-to-1 to `db-schema.json → tables.users.columns`, with the
 * following exclusions:
 * - `preference_vector` — never exposed by the backend (stripped at the API layer).
 *
 * Nullable DB columns become `string | null` (or the appropriate primitive | null).
 * Non-nullable columns are required.
 *
 * @see UserProfileWritable for the subset safe to send in PATCH bodies.
 */
export interface UserProfile {
  /** Cognito `sub` — the user's immutable UUID primary key. */
  readonly user_id: string;

  /** Verified email address. Non-nullable in DB. */
  readonly email: string;

  /** Optional phone number. */
  readonly phone_number: string | null;

  /**
   * Optional username. Unique case-insensitively. Required at profile
   * completion. Rename is rate-limited to once per 30 days in the API layer.
   */
  readonly username: string | null;

  /** Given name. Immutable after first non-null set. Required at completion. */
  readonly first_name: string | null;

  /** Family name. Immutable after first non-null set. Required at completion. */
  readonly last_name: string | null;

  /** Biological sex. Immutable after set. Required at completion. */
  readonly sex: 'Male' | 'Female' | null;

  /**
   * ISO-8601 date string (YYYY-MM-DD). Immutable after set.
   * Required at completion. Drives the `age` generated column.
   */
  readonly birthday: string | null;

  /**
   * Age in years, computed by the DB from `birthday`.
   * Read-only — never send in PATCH bodies (excluded from {@link UserProfileWritable}).
   */
  readonly age: number | null;

  /** Religion text. Immutable after set. Required at completion. */
  readonly religion: string | null;

  /** Religious subsect. Immutable after set. Required at completion. */
  readonly subsect: string | null;

  /** Personal religious observance level. Required at completion. */
  readonly religious_level: string | null;

  /** Chosen profile avatar identifier or URL. Optional. */
  readonly chosen_profile_avatar: string | null;

  /** Direct photo URL. Optional. Phase-12 placeholder. */
  readonly photo_url: string | null;

  /** Name of college or university attended. Required at completion. */
  readonly college_name: string | null;

  /** City of current residence. Required at completion. */
  readonly current_residence_city: string | null;

  /** Country of current residence (full name). Required at completion. */
  readonly current_residence_country: string | null;

  /**
   * ISO 3166-1 alpha-2 country code for current residence.
   * Required at completion.
   */
  readonly resident_country_code: string | null;

  /** District within current residence city. Required at completion. */
  readonly district: string | null;

  /** Highest level of education achieved. Required at completion. */
  readonly education_level: string | null;

  /** Name of current or most recent employer. Required at completion. */
  readonly employer_name: string | null;

  /** Employment type (e.g. full-time, self-employed). Required at completion. */
  readonly employment_type: string | null;

  /** Family's residential address. Required at completion. */
  readonly family_residence_address: string | null;

  /**
   * Whether the father is retired. Stored as TEXT in DB (not boolean).
   * Required at completion.
   */
  readonly father_retired: string | null;

  /** Father's occupation. Required at completion. */
  readonly fathers_job: string | null;

  /** Father's name. Required at completion. */
  readonly fathers_name: string | null;

  /** Year of graduation from highest degree program. Optional. */
  readonly graduation_year: number | null;

  /** Whether the user has children. Required at completion. */
  readonly has_children: boolean | null;

  /**
   * Higher secondary school or college name. Required at completion.
   * (E.g. A-levels institution, 11th–12th grade school.)
   */
  readonly higher_secondary: string | null;

  /** Year of higher secondary completion. Optional. */
  readonly higher_secondary_passing_year: number | null;

  /** Name of highest degree credential. Required at completion. */
  readonly highest_degree: string | null;

  /** High school (secondary school) name. Required at completion. */
  readonly high_school: string | null;

  /** Year of high school completion. Optional. */
  readonly high_school_passing_year: number | null;

  /** Current or most recent job title. Required at completion. */
  readonly job_title: string | null;

  /** Marital status. Required at completion. */
  readonly marital_status: string | null;

  /**
   * Intended marriage timeline. Defaults to `'Not Provided'` in DB (never NULL
   * for new rows after migration 0012). NOT in `requiredForCompletion`.
   */
  readonly marriage_time: string | null;

  /**
   * Whether the mother is retired. Stored as TEXT in DB (not boolean).
   * Required at completion.
   */
  readonly mother_retired: string | null;

  /** Mother's occupation. Required at completion. */
  readonly mothers_job: string | null;

  /** Mother's name. Required at completion. */
  readonly mothers_name: string | null;

  /** Whether the user is willing to move abroad. Required at completion. */
  readonly move_abroad: boolean | null;

  /** Office or workplace address. Required at completion. */
  readonly office_address: string | null;

  /** Desired partner's religious observance level. Optional. */
  readonly partners_religious_level: string | null;

  /** Professional category (broad occupational grouping). Required at completion. */
  readonly professional_category: string | null;

  /**
   * Whether the profile is complete and verified by the server-side check
   * constraint. Flipped to `true` only when all 34 `requiredForCompletion`
   * fields are non-NULL. Mirrored into the Cognito JWT as
   * `custom:profile_complete`. Server-controlled — never send in PATCH bodies.
   */
  readonly profile_complete_verified: boolean | null;

  /**
   * Type of relationship sought (e.g. marriage, friendship).
   * Required at completion.
   */
  readonly relation: string | null;

  /** Salary range band. Required at completion. */
  readonly salary_range: string | null;

  /**
   * Free-form preferences object. JSONB in DB; sent and received as a plain JS
   * object. GIN-indexed. Optional — defaults to `{}` in DB.
   */
  readonly preferences: Record<string, unknown> | null;

  /** ISO-8601 timestamp of row creation. Non-nullable in DB. */
  readonly created_at: string;

  /** ISO-8601 timestamp of last update. Non-nullable in DB. */
  readonly updated_at: string;

  /**
   * Soft-delete marker. `null` means the account is live; a timestamp means
   * the account has been soft-deleted.
   */
  readonly deleted_at: string | null;
}

/**
 * The writable subset of {@link UserProfile} — safe to include in
 * `PATCH /profile/me` request bodies.
 *
 * Excludes server-controlled or read-only fields:
 * - `age` — generated column, computed from `birthday`.
 * - `user_id` — immutable primary key.
 * - `created_at` — set at row insertion.
 * - `updated_at` — managed by the DB trigger.
 * - `deleted_at` — managed by the soft-delete API endpoint.
 * - `profile_complete_verified` — server-controlled check-constraint outcome.
 */
export type UserProfileWritable = Omit<
  UserProfile,
  | 'age'
  | 'user_id'
  | 'created_at'
  | 'updated_at'
  | 'deleted_at'
  | 'profile_complete_verified'
>;
