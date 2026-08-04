/**
 * Type declaration for the `assets/dummyprofile.json` fixture.
 *
 * Extends {@link UserProfile} with the same client-side display fields as
 * {@link DummyFemaleProfile}, plus a `__mutability_notes` documentation
 * block that categorises every `UserProfileWritable` field for the future
 * edit-flow phase. The `__mutability_notes` block is a documentation
 * artifact only — no field is mutated in phase 12.
 *
 * @module types/DummyOwnProfile
 */

import type { UserProfile } from '@/types/api/UserProfile';
import type { DummySibling } from '@/types/DummySibling';
import type { DummyDisplayOnly } from '@/types/DummyFemaleProfile';

/**
 * The base `UserProfile` shape with `preferences` removed so our narrowed
 * override compiles without an interface-extends conflict.
 *
 * @see DummyFemaleProfile for the full rationale.
 */
type UserProfileWithoutPreferences = Omit<UserProfile, 'preferences'>;

/**
 * Documentation-only block embedded in `dummyprofile.json` that categorises
 * every writable field by its mutability contract with the backend.
 *
 * Used by the future edit-flow phase to pre-wire field guards without
 * consulting the backend schema on every edit. This block is never sent to
 * the server and is stripped from real PATCH bodies by `buildPatchBody`.
 */
export interface MutabilityNotes {
  /**
   * Fields that the backend treats as write-once: once a non-null value is
   * persisted, further PATCH attempts for that field are rejected.
   * Corresponds to `isImmutable()` in `src/Helper/immutableFieldHelper.ts`.
   */
  immutable_after_first_set: readonly string[];

  /**
   * Fields that are mutable but rate-limited by the API layer.
   * E.g. `username` may be renamed at most once per 30 days.
   */
  rate_limited: readonly string[];

  /**
   * Fields computed or managed entirely by the server.
   * These are never sent in PATCH bodies — they are excluded from
   * `UserProfileWritable`.
   */
  server_computed: readonly string[];

  /**
   * Freely mutable fields with no restrictions beyond basic validation.
   */
  mutable: readonly string[];
}

/**
 * The type of `assets/dummyprofile.json` — the (male) test user's own
 * profile, shown in the Menu-tab profile preview in phase 12.
 *
 * Extends `UserProfile` with:
 * - `photos` — single-element array (`Male1.png`). `PhotoBlockSection` hides
 *   because `photos.length < 2`.
 * - `faceSelfieUri` — drives the verified tick on `HeroBlock` (self variant)
 *   and `VerifiedProfileSection`.
 * - `siblings` — empty array (`[]`). `SiblingsSection` hides when empty.
 * - `preferences` — narrowed so `PersonalitySection` can read
 *   `preferences.personalityTraits` without a cast.
 * - `__dummy_display_only` — display-only extras with no backend column.
 * - `__mutability_notes` — documentation-only categorisation of fields for
 *   the future edit-flow phase.
 *
 * @remarks
 * When the real `GET /profile/me` endpoint ships (phase after the edit-shell
 * fill-in), `MenuHomeScreen` and `MyProfileScreen` will receive a real
 * `UserProfile` and this fixture is retired. The section components consume
 * `UserProfile & DummyOverlay` so the swap is additive.
 */
export interface DummyOwnProfile extends UserProfileWithoutPreferences {
  /**
   * Ordered photo URIs for this profile.
   * - Index 0: hero image.
   * - Index 1 (if present): mid-scroll `PhotoBlockSection` image.
   */
  photos?: string[];

  /**
   * URI of the verified face selfie. Drives the green tick on the hero and
   * inside `VerifiedProfileSection`. `null` means not yet verified.
   */
  faceSelfieUri?: string | null;

  /**
   * Sibling entries for display in `SiblingsSection`.
   *
   * @remarks
   * Client-side dummy only in phase 12. A future backend migration will
   * introduce a dedicated `siblings` table keyed by `user_id`; when that
   * lands, this optional override is removed and the field is served via a
   * separate include on the profile response.
   */
  siblings?: DummySibling[];

  /**
   * Narrowed preferences shape allowing `PersonalitySection` to read
   * `preferences.personalityTraits` without a type cast, while still
   * accepting arbitrary other JSONB keys produced by the real backend.
   */
  preferences?: ({ personalityTraits?: string[] } & Record<string, unknown>) | null;

  /** Display-only extras with no corresponding backend column. */
  __dummy_display_only?: DummyDisplayOnly;

  /**
   * Documentation-only mutability categorisation for the future edit-flow
   * phase. Never sent to the server; stripped by `buildPatchBody`.
   *
   * @see {@link MutabilityNotes} for field descriptions.
   */
  __mutability_notes?: MutabilityNotes;
}
