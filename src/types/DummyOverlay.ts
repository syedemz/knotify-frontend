/**
 * The shape of client-side display overrides common to both
 * `DummyFemaleProfile` and `DummyOwnProfile`.
 *
 * Section components accept `UserProfile & DummyOverlay` so the same
 * component code works for both the "other" (candidate) viewer and the
 * "self" (preview) viewer. When the real backend fields land, the
 * corresponding keys are removed from `DummyOverlay` and the section
 * components automatically stop using them.
 *
 * @module types/DummyOverlay
 */

import type { DummySibling } from '@/types/DummySibling';
import type { DummyDisplayOnly } from '@/types/DummyFemaleProfile';

/**
 * Client-side display fields layered on top of `UserProfile` in phase 12.
 *
 * Every field is optional — a real `UserProfile` from the API satisfies
 * `UserProfile & DummyOverlay` with all dummy fields undefined.
 */
export interface DummyOverlay {
  /**
   * Ordered photo URIs. Index 0 = hero, index 1 (if present) = PhotoBlockSection.
   * Overlays the backend-served `photo_url` scalar.
   */
  photos?: string[];

  /**
   * URI of the verified face selfie. Non-null drives the green tick on the
   * hero and inside `VerifiedProfileSection`.
   */
  faceSelfieUri?: string | null;

  /**
   * Sibling entries. Client-side dummy only in phase 12.
   *
   * @remarks
   * A future backend migration will introduce a dedicated `siblings` table;
   * when that lands this field is removed and data arrives via the profile
   * response include.
   */
  siblings?: DummySibling[];

  /**
   * Narrowed preferences shape allowing `PersonalitySection` to read
   * `preferences.personalityTraits` without a cast, while still accepting
   * arbitrary other JSONB keys from the real backend.
   */
  preferences?: ({ personalityTraits?: string[] } & Record<string, unknown>) | null;

  /**
   * How soon the user wants to meet on Knotify. Sourced from the
   * page-20 "meet timeline" pick (currently client-local during onboarding,
   * mirrored here for landing-page display until the real backend column
   * ships). Used as the second anchor on the Marriage Intentions timeline.
   */
  meet_time?: string | null;

  /** Display-only extras with no corresponding backend column. */
  __dummy_display_only?: DummyDisplayOnly;
}

/**
 * Profile viewer context — determines which sections render and how.
 *
 * - `'self'` — the profile owner is viewing their own preview.
 *   HeroBlock renders the self-hero layout; ContactActionsSection returns null.
 * - `'other'` — a different user is viewing this profile (e.g. on the
 *   Marriage landing page). HeroBlock returns null; ContactActionsSection renders.
 */
export type ProfileViewer = 'other' | 'self';
