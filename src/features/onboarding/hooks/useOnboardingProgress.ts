/**
 * Hook that derives the current page number, total pages, and active
 * checkpoint from the current onboarding route name.
 *
 * @module features/onboarding/hooks/useOnboardingProgress
 */

import { PAGE_MAP, TOTAL_PAGES, type OnboardingRouteName } from '../pageMap';
import type { OnboardingDraft } from '../draftSchema';

/**
 * The value returned by {@link useOnboardingProgress}.
 */
export interface OnboardingProgressResult {
  /** The current 1-based page number (1–{@link TOTAL_PAGES}). */
  readonly current: number;
  /** Total number of onboarding pages ({@link TOTAL_PAGES}). */
  readonly total: number;
  /**
   * The furthest checkpoint the user has passed, sourced from the draft.
   * `null` when no checkpoint has been reached.
   */
  readonly checkpoint: OnboardingDraft['lastCheckpoint'];
}

/**
 * Derives `{ current, total, checkpoint }` from the current route name.
 *
 * The `current` value is looked up from {@link PAGE_MAP}. If the provided
 * route name is not a key of `PAGE_MAP`, this function throws — callers must
 * only pass valid onboarding route names.
 *
 * @param routeName - The name of the currently active onboarding route.
 * @param checkpoint - The last checkpoint from the onboarding draft.
 * @returns {@link OnboardingProgressResult}
 *
 * @throws {Error} When `routeName` is not found in `PAGE_MAP`.
 *
 * @example
 * ```tsx
 * const { current, total } = useOnboardingProgress(route.name, draft.lastCheckpoint);
 * ```
 */
export function useOnboardingProgress(
  routeName: string,
  checkpoint: OnboardingDraft['lastCheckpoint'],
): OnboardingProgressResult {
  const current = (PAGE_MAP as Record<string, number>)[routeName];

  if (current === undefined) {
    throw new Error(
      `useOnboardingProgress: unknown route "${routeName}"`,
    );
  }

  return {
    current,
    total: TOTAL_PAGES,
    checkpoint,
  };
}
