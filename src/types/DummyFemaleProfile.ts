/**
 * Type declaration for the `assets/dummyfemale.json` fixture.
 *
 * Extends {@link UserProfile} with client-side display fields that have no
 * corresponding column in `UserProfileWritable`. Every extension is phase-12
 * temporary: when the real API or backend column ships, the relevant field is
 * removed from this type and served via the real profile response.
 *
 * @module types/DummyFemaleProfile
 */

import type { UserProfile } from '@/types/api/UserProfile';
import type { DummySibling } from '@/types/DummySibling';

/**
 * The base `UserProfile` shape with the `preferences` field removed so our
 * narrowed override compiles without an interface-extends conflict.
 *
 * TypeScript's `interface extends` requires assignability in both directions
 * for overridden properties. The narrowed `preferences` type adds
 * `| undefined` (because the field is optional on the subtype) which is not
 * assignable to `Record<string, unknown> | null`. Omitting and re-declaring
 * the field bypasses the structural constraint while retaining the rest of
 * `UserProfile` unchanged.
 */
type UserProfileWithoutPreferences = Omit<UserProfile, 'preferences'>;

/**
 * A dummy display-only property bag for fields that do not yet exist in
 * `UserProfileWritable`. Each key is independently optional — components
 * guard on `profile.__dummy_display_only?.<key> !== undefined` and hide
 * the corresponding chip when the key is absent.
 */
export interface DummyDisplayOnly {
  /** Whether the profile owner was active on the app today. */
  is_active_today?: boolean;
  /** Membership tier. `null` means explicitly set to no tier. */
  membership_tier?: 'gold' | 'silver' | null;
  /** Whether the profile has unread notifications. */
  has_unread_notifications?: boolean;
  /** Dress code preference (e.g. "Modest", "Smart Casual"). */
  dress_code?: string;
  /** Whether the user eats only halal food. */
  eats_halal?: boolean;
  /** Whether the user smokes. */
  smokes?: boolean;
  /** Whether the user drinks alcohol. */
  drinks?: boolean;
  /** Whether the user regularly fasts. */
  fasts?: boolean;
}

/**
 * The type of `assets/dummyfemale.json` — a candidate female profile shown
 * on the Marriage landing page in phase 12.
 *
 * Extends `UserProfile` with:
 * - `photos` — ordered list of image URIs. `photos[0]` drives the hero;
 *   `photos[1]` drives `PhotoBlockSection` mid-scroll.
 * - `faceSelfieUri` — the URI of the verified face selfie. Non-null drives
 *   the green "verified profile" tick on `CandidateHero` and inside
 *   `VerifiedProfileSection`.
 * - `siblings` — see {@link DummySibling} TSDoc for the teardown plan.
 * - `preferences` — narrowed so `PersonalitySection` can read
 *   `preferences.personalityTraits` without a cast, while still allowing
 *   arbitrary other JSONB keys present in production data.
 * - `__dummy_display_only` — display-only extras with no backend column.
 *
 * @remarks
 * Client-side dummy only in phase 12. When the real discover-deck API ships
 * in phase 13, `MarriageLandingScreen` will receive a real `UserProfile`
 * shape and this type is retired for the landing context. The section
 * components consume `UserProfile & DummyOverlay` so the swap is additive.
 */
export interface DummyFemaleProfile extends UserProfileWithoutPreferences {
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
}
