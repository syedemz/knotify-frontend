/**
 * Hook that returns the correct initial onboarding route on app resume,
 * based on the user's last saved checkpoint.
 *
 * Resume logic per architecture.md §6.3:
 * - `'secondCheckpoint'` → `Page15ResidenceCountryScreen` (completed page 14)
 * - `'firstCheckpoint'`  → `Page09ReligionSubsectScreen`  (completed page 8)
 * - `null`               → `Page01WelcomeScreen`           (no checkpoint)
 *
 * @module features/onboarding/hooks/useCheckpointResume
 */

import type { OnboardingDraft } from '../draftSchema';
import type { OnboardingRouteName } from '../pageMap';

/**
 * Returns the route name the user should resume from based on their
 * last saved checkpoint.
 *
 * @param lastCheckpoint - The `lastCheckpoint` value from the onboarding draft.
 * @returns The {@link OnboardingRouteName} to mount as `initialRouteName`.
 *
 * @example
 * ```tsx
 * const initialRoute = useCheckpointResume(draft.lastCheckpoint);
 * // <Stack.Navigator initialRouteName={initialRoute}>
 * ```
 */
export function useCheckpointResume(
  lastCheckpoint: OnboardingDraft['lastCheckpoint'],
): OnboardingRouteName {
  if (lastCheckpoint === 'secondCheckpoint') {
    return 'Page15ResidenceCountryScreen';
  }
  if (lastCheckpoint === 'firstCheckpoint') {
    return 'Page09ReligionSubsectScreen';
  }
  return 'Page01WelcomeScreen';
}
