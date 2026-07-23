/**
 * Tests for src/features/onboarding/hooks/useCheckpointResume.ts
 *
 * Verifies the resume route for each of the three checkpoint states.
 */

import { useCheckpointResume } from '@/features/onboarding/hooks/useCheckpointResume';

describe('useCheckpointResume', () => {
  describe('given lastCheckpoint is null (no checkpoint reached)', () => {
    it('returns Page01WelcomeScreen', () => {
      expect(useCheckpointResume(null)).toBe('Page01WelcomeScreen');
    });
  });

  describe('given lastCheckpoint is "firstCheckpoint"', () => {
    it('returns Page09ReligionSubsectScreen', () => {
      expect(useCheckpointResume('firstCheckpoint')).toBe(
        'Page09ReligionSubsectScreen',
      );
    });
  });

  describe('given lastCheckpoint is "secondCheckpoint"', () => {
    it('returns Page15ResidenceCountryScreen', () => {
      expect(useCheckpointResume('secondCheckpoint')).toBe(
        'Page15ResidenceCountryScreen',
      );
    });
  });
});
