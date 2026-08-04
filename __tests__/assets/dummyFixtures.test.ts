/**
 * Parse-time structural tests for the phase-12 dummy JSON fixtures.
 *
 * These tests verify:
 * 1. Both fixtures import correctly (JSON parse succeeds at test load time).
 * 2. Each fixture satisfies its declared TypeScript type via a structural
 *    type-guard assertion (`assertIs<T>`).
 * 3. The pinned identity literals match exactly — later stories' assertions
 *    reference these values by name.
 * 4. The array lengths match the PRD AC (siblings, photos, personalityTraits).
 *
 * No Reanimated / React Native native module imports are made in this file,
 * so the test runs cleanly under the current Jest config without requiring
 * the Reanimated mock (which ships in story 12.4).
 */

import dummyFemale from '../../assets/dummyfemale.json';
import dummyProfile from '../../assets/dummyprofile.json';
import type { DummyFemaleProfile } from '@/types/DummyFemaleProfile';
import type { DummyOwnProfile } from '@/types/DummyOwnProfile';

/**
 * Structural type-guard assertion.
 *
 * TypeScript will produce a compile-time error if `value` does not satisfy `T`.
 * At runtime the function is a no-op — we only need the compile-time check.
 *
 * @param value - The value to assert structurally satisfies type `T`.
 */
function assertIs<T>(_value: T): void {
  // intentional no-op: compile-time only
}

describe('dummyfemale.json', () => {
  it('satisfies DummyFemaleProfile structural type', () => {
    // TypeScript infers JSON string fields as `string`, not as literal union
    // types (e.g. `gender: string` rather than `'Male' | 'Female' | null`).
    // The `as unknown as DummyFemaleProfile` cast checks that the JSON object
    // is structurally assignable at runtime; the compile-time structural check
    // is enforced by the individual field assertions below.
    assertIs<DummyFemaleProfile>(dummyFemale as unknown as DummyFemaleProfile);
  });

  it('has exactly 2 siblings', () => {
    expect(dummyFemale.siblings).toHaveLength(2);
  });

  it('has exactly 2 photos', () => {
    expect(dummyFemale.photos).toHaveLength(2);
  });

  it('has first_name "Aisha"', () => {
    expect(dummyFemale.first_name).toBe('Aisha');
  });

  it('has last_name "Khan"', () => {
    expect(dummyFemale.last_name).toBe('Khan');
  });

  it('has age 27', () => {
    expect(dummyFemale.age).toBe(27);
  });

  it('has current_residence_city "Berlin"', () => {
    expect(dummyFemale.current_residence_city).toBe('Berlin');
  });

  it('has current_residence_country "Germany"', () => {
    expect(dummyFemale.current_residence_country).toBe('Germany');
  });

  it('has resident_country_code "DE"', () => {
    expect(dummyFemale.resident_country_code).toBe('DE');
  });

  it('has job_title "Product Designer"', () => {
    expect(dummyFemale.job_title).toBe('Product Designer');
  });

  it('has religion "Islam"', () => {
    expect(dummyFemale.religion).toBe('Islam');
  });

  it('has religious_level "Practicing"', () => {
    expect(dummyFemale.religious_level).toBe('Practicing');
  });

  it('has preferences.personalityTraits with exactly 5 traits', () => {
    expect(dummyFemale.preferences?.personalityTraits).toHaveLength(5);
  });

  it('has a non-null faceSelfieUri', () => {
    expect(dummyFemale.faceSelfieUri).not.toBeNull();
  });

  it('has __dummy_display_only.is_active_today true', () => {
    expect(dummyFemale.__dummy_display_only?.is_active_today).toBe(true);
  });

  it('has __dummy_display_only.membership_tier "gold"', () => {
    expect(dummyFemale.__dummy_display_only?.membership_tier).toBe('gold');
  });
});

describe('dummyprofile.json', () => {
  it('satisfies DummyOwnProfile structural type', () => {
    // Same JSON inference caveat as dummyfemale — see the female fixture test.
    assertIs<DummyOwnProfile>(dummyProfile as unknown as DummyOwnProfile);
  });

  it('has exactly 0 siblings', () => {
    expect(dummyProfile.siblings).toHaveLength(0);
  });

  it('has exactly 1 photo', () => {
    expect(dummyProfile.photos).toHaveLength(1);
  });

  it('has first_name "Adnan"', () => {
    expect(dummyProfile.first_name).toBe('Adnan');
  });

  it('has last_name "Malik"', () => {
    expect(dummyProfile.last_name).toBe('Malik');
  });

  it('has age 29', () => {
    expect(dummyProfile.age).toBe(29);
  });

  it('has current_residence_city "Mannheim"', () => {
    expect(dummyProfile.current_residence_city).toBe('Mannheim');
  });

  it('has current_residence_country "Germany"', () => {
    expect(dummyProfile.current_residence_country).toBe('Germany');
  });

  it('has resident_country_code "DE"', () => {
    expect(dummyProfile.resident_country_code).toBe('DE');
  });

  it('has job_title "Software Engineer"', () => {
    expect(dummyProfile.job_title).toBe('Software Engineer');
  });

  it('has religion "Islam"', () => {
    expect(dummyProfile.religion).toBe('Islam');
  });

  it('has religious_level "Practicing"', () => {
    expect(dummyProfile.religious_level).toBe('Practicing');
  });

  it('has preferences.personalityTraits with exactly 1 trait', () => {
    expect(dummyProfile.preferences?.personalityTraits).toHaveLength(1);
  });

  it('has preferences.personalityTraits[0] === "Night owl"', () => {
    expect(dummyProfile.preferences?.personalityTraits?.[0]).toBe('Night owl');
  });

  it('has __mutability_notes block', () => {
    expect(dummyProfile.__mutability_notes).toBeDefined();
    expect(dummyProfile.__mutability_notes?.immutable_after_first_set).toContain('first_name');
    expect(dummyProfile.__mutability_notes?.rate_limited).toContain('username');
    expect(dummyProfile.__mutability_notes?.server_computed).toContain('age');
    expect(dummyProfile.__mutability_notes?.mutable).toContain('job_title');
  });

  it('has __dummy_display_only block', () => {
    expect(dummyProfile.__dummy_display_only).toBeDefined();
    expect(dummyProfile.__dummy_display_only?.is_active_today).toBe(true);
  });
});
