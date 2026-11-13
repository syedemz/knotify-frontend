/**
 * Frontend view type for a single row of `deck_view`.
 *
 * Mirrors the 16 columns the backend `deck_view` exposes today — authority
 * is `knotify-backend/db-schema.json → views.deck_view.columns`. If a future
 * migration adds columns, add them here AND to the db-schema.json type guard
 * in the same PR.
 *
 * **Do NOT confuse with `DummyDeckProfile`.** `DummyDeckProfile` is a
 * superset with ~20 frontend-extension fields (photos, faceSelfieUri,
 * marital_status, education/employment blocks, `__dummy_display_only`) used
 * by phase-13 fixtures. `DeckProfile` is the strict backend shape.
 *
 * @module types/api/DeckProfile
 */

/**
 * Response envelope returned by `GET /match/deck`.
 *
 * Backend reference: `knotify-backend/infrastructure/src/functions/match/handler.py`
 * line 575 — `_json_response(200, {"results": results, "next_cursor": ...})`.
 *
 * `next_cursor` is a user_id UUID when more pages are available (pass as
 * `?cursor=<uuid>` on the next request) or `null` when the deck is
 * exhausted. Pagination isn't wired into the UI yet — future work.
 */
export interface DeckResponse {
  readonly results: DeckProfile[];
  readonly next_cursor: string | null;
}

/**
 * A single deck-card as returned inside `DeckResponse.results`.
 */
export interface DeckProfile {
  /** Cognito `sub` — the viewed user's immutable UUID. */
  readonly user_id: string;

  /** Given name. */
  readonly first_name: string;

  /** Family name. */
  readonly last_name: string;

  /** Biological sex. */
  readonly sex: 'Male' | 'Female';

  /** Age in years (computed from birthday server-side). */
  readonly age: number;

  /** Chosen profile avatar identifier / URL. Nullable. */
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
   * Whether the profile is complete and verified by the server-side check
   * constraint. Always `true` on deck rows (backend only surfaces completed
   * profiles in the deck).
   */
  readonly profile_complete_verified: boolean;
}
