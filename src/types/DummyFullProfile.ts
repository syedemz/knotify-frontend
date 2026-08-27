/**
 * Viewer-neutral full-profile type shared by all "other user" fixtures in
 * phase 13 (Mehvish, Qurat) and by the current user's own profile
 * (`DummyOwnProfile`).
 *
 * Phase 12 used `DummyOwnProfile` for everything, but its name implies a
 * self-viewer context. Phase 13 introduces profiles for OTHER users that the
 * current user views — Mehvish (friend) and Qurat (request sender). Naming
 * this `DummyFullProfile` makes the "any known user's full profile" intent
 * clear without polluting the self-viewer type.
 *
 * `DummyOwnProfile` is re-exported here as an alias for backwards
 * compatibility with all phase-12 callers (`MyProfileScreen`,
 * `MenuHomeScreen`, `HeroBlock`, etc.) — no edits to those files are needed.
 *
 * TODO(mock-only): retire when real `GET /profiles/{userId}` endpoint ships
 *
 * @module types/DummyFullProfile
 */

import type { UserProfile } from '@/types/api/UserProfile';
import type { DummySibling } from '@/types/DummySibling';
import type { DummyDisplayOnly } from '@/types/DummyFemaleProfile';
import type { MutabilityNotes } from '@/types/DummyOwnProfile';

/**
 * The base `UserProfile` shape with `preferences` removed so our narrowed
 * override compiles without an interface-extends conflict.
 *
 * TypeScript's `interface extends` requires assignability in both directions
 * for overridden properties. The narrowed `preferences` type adds `| undefined`
 * which is not assignable to `Record<string, unknown> | null`. Omitting and
 * re-declaring the field bypasses the structural constraint while retaining
 * the rest of `UserProfile` unchanged.
 */
type UserProfileWithoutPreferences = Omit<UserProfile, 'preferences'>;

/**
 * Viewer-neutral full-profile shape.
 *
 * Satisfied by:
 * - `assets/dummyprofile.json` (Adnan, the logged-in current user)
 * - `assets/dummyfemale.json` (Aisha — legacy landing fixture)
 * - `assets/dummymehvish.json` (Mehvish Hayat — phase 13 friend fixture)
 * - `assets/dummyqurat.json` (Qurat Baloch — phase 13 request fixture)
 *
 * Extends `UserProfile` with:
 * - `photos` — ordered photo URI array; index 0 = hero, index 1 = PhotoBlock.
 * - `faceSelfieUri` — drives the verified tick on `CandidateHero` + `VerifiedProfileSection`.
 * - `siblings` — see {@link DummySibling} for teardown plan.
 * - `preferences` — narrowed so `PersonalitySection` reads `personalityTraits` without cast.
 * - `__dummy_display_only` — display-only extras with no backend column.
 * - `__mutability_notes` — optional, present only on the current user's own fixture.
 */
export interface DummyFullProfile extends UserProfileWithoutPreferences {
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
   * Client-side dummy only in phases 12–13. A future backend migration will
   * introduce a dedicated `siblings` table keyed by `user_id`.
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
   * Documentation-only mutability categorisation. Present only on the
   * current user's fixture (`dummyprofile.json`). Never sent to the server.
   */
  __mutability_notes?: MutabilityNotes;
}

/**
 * Backwards-compatibility alias for phase-12 callers.
 *
 * All code written in phase 12 that imports `DummyOwnProfile` from
 * `@/types/DummyOwnProfile` continues to work — that module re-exports
 * the interface unchanged. This alias exists so phase-13 callers can
 * use the viewer-neutral name while phase-12 callers keep using the
 * original import path.
 *
 * @deprecated Prefer `DummyFullProfile` for new code. Use `DummyOwnProfile`
 * only when reading from `assets/dummyprofile.json` specifically.
 */
export type DummyOwnProfile = DummyFullProfile;
