/**
 * Onboarding wizard draft schema (schemaVersion 1).
 *
 * Migration policy for schemaVersion bumps is deferred; the current schema is
 * version 1 and no bump handler exists yet. When bumping, decide before merge
 * whether to migrate, discard, or prompt.
 *
 * @module features/onboarding/draftSchema
 */

import type { UserProfileWritable } from '@/types/api/UserProfile';

/**
 * A single sibling entry captured on page 19 (Page19SiblingsScreen).
 *
 * This is a client-side scaffold — the backend `siblings` table stores
 * additional columns (`sibling_id`, `user_id`, `gender`, `profession`,
 * `created_at`). Those are server-assigned and not part of the draft.
 */
export interface SiblingDraft {
  /** Sibling's name. */
  name: string;
  /**
   * Sibling's age in years, or `null` if not provided.
   * NOTE: the DB stores `sibling_age` as TEXT to allow entries like 'late 20s';
   * the draft uses `number | null` while the user is filling the form.
   */
  age: number | null;
  /** Sibling's marital status, or `null` if not provided. */
  maritalStatus: string | null;
}

/**
 * The in-progress onboarding wizard state, persisted to `expo-secure-store`
 * under the `onboarding.draft` key between app sessions.
 *
 * Shape matches architecture.md §11.2.4.
 *
 * @see useOnboardingDraft for the hook that reads/writes this type.
 */
export interface OnboardingDraft {
  /**
   * Schema version. Always `1` for the current draft shape.
   * Increment this number when the shape changes in a breaking way.
   */
  readonly schemaVersion: 1;

  /**
   * The furthest checkpoint the user has reached.
   * - `'firstCheckpoint'`  — completed page 8; resumes at page 9.
   * - `'secondCheckpoint'` — completed page 14; resumes at page 15.
   * - `null`               — no checkpoint reached; resumes at page 1.
   *
   * This value NEVER regresses — once set to `'secondCheckpoint'`,
   * back-navigation must not overwrite it with `'firstCheckpoint'` or `null`.
   */
  lastCheckpoint: 'firstCheckpoint' | 'secondCheckpoint' | null;

  /**
   * The wizard page the user is currently on (1–31).
   * Updated on every navigate() call so the app can highlight the right step.
   */
  currentPage: number;

  /**
   * Accumulated profile field values, typed as a writable subset of the
   * eventual PATCH body. Only fields the user has actually filled are present.
   */
  fields: Partial<UserProfileWritable>;

  /**
   * Sibling records captured on page 19. Empty array before page 19.
   */
  siblings: SiblingDraft[];

  /**
   * Local URIs of the user's chosen profile photos, captured on page 28.
   * These are client-only device paths — they are NOT sent to the backend
   * as-is (the photo upload pipeline is deferred per phase-12 placeholder).
   */
  photoPreviewUris: string[];

  /**
   * Notification permission status at the time the user responded to the
   * system prompt, or `null` if the prompt has not been shown yet.
   */
  notificationPermissionStatus:
    | 'granted'
    | 'denied'
    | 'undetermined'
    | null;

  /**
   * Location permission status at the time the user responded to the
   * system prompt, or `null` if the prompt has not been shown yet.
   */
  locationPermissionStatus:
    | 'granted'
    | 'denied'
    | 'undetermined'
    | null;

  /** Timestamps for when the draft was first created and last modified. */
  timestamps: {
    /** ISO-8601 string — when the draft was first created. */
    createdAt: string;
    /** ISO-8601 string — when the draft was last written to secure-store. */
    updatedAt: string;
  };
}

/**
 * Returns a fresh, empty draft for a new onboarding session.
 *
 * @returns A default {@link OnboardingDraft} with schemaVersion 1.
 */
export function createEmptyDraft(): OnboardingDraft {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    lastCheckpoint: null,
    currentPage: 1,
    fields: {},
    siblings: [],
    photoPreviewUris: [],
    notificationPermissionStatus: null,
    locationPermissionStatus: null,
    timestamps: {
      createdAt: now,
      updatedAt: now,
    },
  };
}
