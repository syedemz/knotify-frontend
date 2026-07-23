/**
 * Named checkpoint constants for the onboarding wizard.
 *
 * These constants are the single source of truth for checkpoint string values.
 * They must match the `lastCheckpoint` union in `draftSchema.ts` exactly —
 * TypeScript enforces this through the type annotation on each constant.
 *
 * @module features/onboarding/checkpoints
 */

import type { OnboardingDraft } from './draftSchema';

/**
 * The first checkpoint, reached after the user completes page 8
 * (Page08FirstCheckpointScreen). On resume, the wizard routes to page 9.
 */
export const firstCheckpoint: NonNullable<OnboardingDraft['lastCheckpoint']> =
  'firstCheckpoint';

/**
 * The second checkpoint, reached after the user completes page 14
 * (Page14SecondCheckpointScreen). On resume, the wizard routes to page 15.
 */
export const secondCheckpoint: NonNullable<OnboardingDraft['lastCheckpoint']> =
  'secondCheckpoint';
