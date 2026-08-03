/**
 * Pure PATCH body builder for `PATCH /profile/me`.
 *
 * Assembles a {@link UserProfileWritable}-shaped object from a fully-filled
 * {@link OnboardingDraft}. The function is pure — it never throws for a valid
 * draft, never performs I/O, and never reads from React state.
 *
 * **Allowlist semantics.** Only the keys listed in `WRITABLE_DRAFT_FIELDS` are
 * included in the body. Client-only fields (`photoPreviewUris`, `faceSelfieUri`,
 * `notificationPermissionStatus`, `locationPermissionStatus`, `lastCheckpoint`,
 * `currentPage`, `timestamps`, `schemaVersion`) are never included.
 *
 * **Retry semantics.** When `isRetry === true`, every field for which
 * `isImmutable(field)` returns `true` is stripped from the body. This prevents
 * 422 errors when the backend rejects attempts to overwrite immutable fields
 * that were set during a prior attempt.
 *
 * @module features/onboarding/buildPatchBody
 */

import type { UserProfileWritable } from '@/types/api/UserProfile';
import { isImmutable } from '@/Helper/immutableFieldHelper';
import type { OnboardingDraft, SiblingDraft } from './draftSchema';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Options controlling how the PATCH body is assembled.
 */
export interface BuildPatchBodyOptions {
  /**
   * When `true`, immutable fields (per {@link isImmutable}) are stripped from
   * the body. Set to `true` on all retry attempts after a 409 username collision.
   */
  readonly isRetry: boolean;
}

/**
 * Shape of the serialized sibling entry as expected by the backend.
 *
 * Snake-case conversion of {@link SiblingDraft} — the backend `siblings` table
 * uses snake_case column names.
 */
export interface SerializedSibling {
  readonly name: string;
  readonly sibling_age: number | null;
  readonly marital_status: string | null;
  readonly gender: 'Male' | 'Female' | null;
  readonly profession: string | null;
}

/**
 * The assembled PATCH body shape.
 *
 * Mirrors {@link UserProfileWritable} plus the `siblings` array. Fields that
 * are `null` / `undefined` in the draft are omitted from the body (the backend
 * treats absent keys as "no change" for nullable columns).
 *
 * `Partial<UserProfileWritable>` is used here because not every writable field
 * is necessarily filled when this function is called (the backend accepts partial
 * updates). The `siblings` key is appended separately.
 */
export type PatchBody = Partial<UserProfileWritable> & {
  /** Serialized sibling records, or absent if the siblings array is empty. */
  readonly siblings?: readonly SerializedSibling[];
};

// ── Allowlist ─────────────────────────────────────────────────────────────────

/**
 * Explicit allowlist of `UserProfileWritable` keys sourced directly from the
 * draft's `fields` object.
 *
 * Adding a new field to this array automatically includes it in the PATCH body.
 * To exclude a client-only field, do NOT add it here — the allowlist is the
 * contract.
 */
const WRITABLE_DRAFT_FIELDS: ReadonlyArray<keyof UserProfileWritable> = [
  'sex',
  'first_name',
  'last_name',
  'birthday',
  'religion',
  'subsect',
  'religious_level',
  'partners_religious_level',
  'username',
  'college_name',
  'current_residence_city',
  'current_residence_country',
  'resident_country_code',
  'district',
  'education_level',
  'employer_name',
  'employment_type',
  'family_residence_address',
  'father_retired',
  'fathers_job',
  'fathers_name',
  'graduation_year',
  'has_children',
  'higher_secondary',
  'higher_secondary_passing_year',
  'highest_degree',
  'high_school',
  'high_school_passing_year',
  'job_title',
  'marital_status',
  'marriage_time',
  'mother_retired',
  'mothers_job',
  'mothers_name',
  'move_abroad',
  'office_address',
  'professional_category',
  'relation',
  'salary_range',
  'preferences',
  'chosen_profile_avatar',
  'photo_url',
  // `email` and `phone_number` are writable but handled below separately.
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Converts a {@link SiblingDraft} array to the snake_case shape expected by
 * the backend `siblings` table.
 *
 * @param siblings - Array of {@link SiblingDraft} entries from the draft.
 * @returns Array of {@link SerializedSibling} in snake_case form.
 */
export function serializeSiblings(siblings: readonly SiblingDraft[]): readonly SerializedSibling[] {
  return siblings.map((s) => ({
    name: s.name,
    sibling_age: s.age,
    marital_status: s.maritalStatus,
    gender: s.gender,
    profession: s.profession,
  }));
}

// ── Main builder ──────────────────────────────────────────────────────────────

/**
 * Assembles the PATCH body for `PATCH /profile/me` from the given draft.
 *
 * **Pure function** — no I/O, no side effects, no thrown exceptions for a
 * valid draft. The caller is responsible for ensuring the draft is not in an
 * intermediate invalid state before calling this function.
 *
 * Fields that are `null` or `undefined` in the draft are omitted from the
 * returned body so the backend receives only the fields the user actually filled.
 *
 * @param draft - The completed onboarding draft.
 * @param options - {@link BuildPatchBodyOptions} controlling retry behaviour.
 * @returns A partial {@link PatchBody} containing only the non-null, allowlisted fields.
 *
 * @example
 * ```ts
 * const body = buildPatchBody(draft, { isRetry: false });
 * // body: { sex: 'Male', first_name: 'Ali', ..., phone_number: '+919812345678', siblings: [...] }
 * ```
 */
export function buildPatchBody(
  draft: OnboardingDraft,
  options: BuildPatchBodyOptions,
): PatchBody {
  const { isRetry } = options;
  const body: Record<string, unknown> = {};

  // ── Allowlisted `fields` entries ───────────────────────────────────────────
  for (const key of WRITABLE_DRAFT_FIELDS) {
    // Skip immutable fields on retry to avoid 422 "field is immutable" errors.
    if (isRetry && isImmutable(key)) {
      continue;
    }

    const value = (draft.fields as Record<string, unknown>)[key];
    // Omit null and undefined — backend treats absent keys as "no change".
    if (value !== null && value !== undefined) {
      body[key] = value;
    }
  }

  // ── phone_number (top-level draft field, not inside `fields`) ─────────────
  if (!isRetry || !isImmutable('email')) {
    if (draft.phone_number !== null) {
      body['phone_number'] = draft.phone_number;
    }
  }

  // ── siblings array ─────────────────────────────────────────────────────────
  if (draft.siblings.length > 0) {
    body['siblings'] = serializeSiblings(draft.siblings);
  }

  return body as PatchBody;
}
