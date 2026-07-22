/**
 * Tests for src/features/onboarding/hooks/useOnboardingProgress.ts
 *
 * Verifies:
 * - Returns correct { current, total, checkpoint } for known routes
 * - Throws a descriptive error for unknown routes
 */

import { useOnboardingProgress } from '@/features/onboarding/hooks/useOnboardingProgress';
import { TOTAL_PAGES, PAGE_MAP } from '@/features/onboarding/pageMap';

describe('useOnboardingProgress', () => {
  describe('given a known route name', () => {
    it('returns current=1 for Page01WelcomeScreen', () => {
      const result = useOnboardingProgress('Page01WelcomeScreen', null);
      expect(result.current).toBe(1);
      expect(result.total).toBe(TOTAL_PAGES);
      expect(result.checkpoint).toBeNull();
    });

    it('returns current=14 for Page14SecondCheckpointScreen', () => {
      const result = useOnboardingProgress(
        'Page14SecondCheckpointScreen',
        'firstCheckpoint',
      );
      expect(result.current).toBe(14);
      expect(result.checkpoint).toBe('firstCheckpoint');
    });

    it('returns current=31 for Page31FaceCaptureScreen', () => {
      const result = useOnboardingProgress(
        'Page31FaceCaptureScreen',
        'secondCheckpoint',
      );
      expect(result.current).toBe(31);
      expect(result.total).toBe(31);
      expect(result.checkpoint).toBe('secondCheckpoint');
    });

    it('returns the correct current value for every route in PAGE_MAP', () => {
      for (const [routeName, expectedPage] of Object.entries(PAGE_MAP)) {
        const result = useOnboardingProgress(routeName, null);
        expect(result.current).toBe(expectedPage);
        expect(result.total).toBe(TOTAL_PAGES);
      }
    });
  });

  describe('given an unknown route name', () => {
    it('throws a descriptive error containing the route name', () => {
      expect(() =>
        useOnboardingProgress('SomeRandomScreen', null),
      ).toThrow('useOnboardingProgress: unknown route "SomeRandomScreen"');
    });

    it('throws for an empty string route name', () => {
      expect(() =>
        useOnboardingProgress('', null),
      ).toThrow('useOnboardingProgress: unknown route ""');
    });

    it('throws for a partial/misspelled route name', () => {
      expect(() =>
        useOnboardingProgress('Page01', null),
      ).toThrow('useOnboardingProgress: unknown route "Page01"');
    });
  });
});
