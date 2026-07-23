/**
 * Tests for src/features/onboarding/checkpoints.ts
 *
 * Verifies that exported constants match the lastCheckpoint union.
 */

import { firstCheckpoint, secondCheckpoint } from '@/features/onboarding/checkpoints';

describe('checkpoint constants', () => {
  it('firstCheckpoint equals the string "firstCheckpoint"', () => {
    expect(firstCheckpoint).toBe('firstCheckpoint');
  });

  it('secondCheckpoint equals the string "secondCheckpoint"', () => {
    expect(secondCheckpoint).toBe('secondCheckpoint');
  });

  it('firstCheckpoint and secondCheckpoint are distinct', () => {
    expect(firstCheckpoint).not.toBe(secondCheckpoint);
  });
});
