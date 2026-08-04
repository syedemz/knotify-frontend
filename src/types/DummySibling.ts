/**
 * Client-side sibling shape used by the phase-12 dummy fixtures.
 *
 * This type is intentionally different from `SiblingDraft` in
 * `src/features/onboarding/draftSchema.ts`:
 * - `SiblingDraft` captures live onboarding draft state (used during the
 *   family-wizard pages) and may evolve as the onboarding flow changes.
 * - `DummySibling` is a display-only type that represents the shape served
 *   to profile-section components in phase 12. All fields are nullable so
 *   per-chip hide-guards inside `SiblingsSection` have something to test.
 *
 * @module types/DummySibling
 */

/**
 * A single sibling entry in a dummy profile fixture.
 *
 * All fields are nullable. Presence of a non-null value drives a chip
 * render inside `SiblingsSection`; null values cause the corresponding
 * chip to hide independently.
 *
 * @remarks
 * Client-side dummy only in phase 12. A future backend migration will
 * introduce a dedicated `siblings` table keyed by `user_id`; when that
 * lands, this optional override is removed and the field is served via a
 * separate include on the profile response.
 */
export interface DummySibling {
  /** Sibling's given name. Renders as the card header; hides if null. */
  name: string | null;
  /** Sibling's age in years. Hides if null. */
  age: number | null;
  /** Sibling's marital status. Hides if null. */
  marital_status: string | null;
  /** Sibling's gender. Hides if null. */
  gender: 'Male' | 'Female' | null;
  /** Sibling's profession. Hides if null. */
  profession: string | null;
}
