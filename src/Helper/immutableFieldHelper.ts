/**
 * Predicate for fields that the backend treats as immutable after their
 * first non-null write.
 *
 * This helper is introduced in phase 3 but consumed by phase 11's PATCH-builder
 * to skip already-frozen fields in the final profile submission. The predicate
 * has no callers in phase 3 — its presence here is intentional as the single
 * source of truth for immutability metadata so the phase-11 consumer does not
 * need to rediscover which fields are frozen.
 *
 * **Source of truth:** `UserProfile` TSDoc (`src/types/api/UserProfile.ts`)
 * and `knotify-backend/db-schema.json`. Fields are immutable when the DB
 * column comment or API contract says "Immutable after first non-null set".
 *
 * @module Helper/immutableFieldHelper
 */

import type { UserProfileWritable } from '@/types/api/UserProfile';

/**
 * Set of `UserProfileWritable` keys that the backend treats as write-once
 * after their first non-null value is persisted.
 *
 * Maintained here so a single edit keeps phase-11's PATCH logic correct
 * across any future schema additions.
 */
const IMMUTABLE_FIELDS: ReadonlySet<keyof UserProfileWritable> = new Set<keyof UserProfileWritable>([
  'sex',
  'first_name',
  'last_name',
  'birthday',
  'religion',
  'subsect',
]);

/**
 * Returns `true` when the given `UserProfileWritable` field is treated as
 * immutable by the backend after its first non-null write.
 *
 * Immutable fields must not be included in a PATCH body once they have a
 * non-null value on the server. Phase 11's PATCH-builder uses this predicate
 * to skip frozen fields.
 *
 * @param field - A key of {@link UserProfileWritable}.
 * @returns `true` if the field is immutable post-first-write; `false` otherwise.
 *
 * @example
 * ```ts
 * isImmutable('sex')        // true  — immutable after first write
 * isImmutable('first_name') // true  — immutable after first write
 * isImmutable('username')   // false — mutable (rate-limited rename)
 * isImmutable('job_title')  // false — freely editable
 * ```
 */
export function isImmutable(field: keyof UserProfileWritable): boolean {
  return IMMUTABLE_FIELDS.has(field);
}
