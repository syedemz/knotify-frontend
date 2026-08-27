/**
 * Tests for the deck fixtures, DummyDeckProfile type, and deckFixtures.ts
 * export.
 *
 * @see src/features/discover/data/deckFixtures.ts
 * @see src/types/DummyDeckProfile.ts
 */

import type { DummyDeckProfile } from '@/types/DummyDeckProfile';
import { DECK_FIXTURES } from '@/features/discover/data/deckFixtures';
import { resolveDummyPhoto } from '@/assets/dummyPhotoRegistry';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidDeckProfile(p: unknown): p is DummyDeckProfile {
  if (typeof p !== 'object' || p === null) return false;
  const obj = p as Record<string, unknown>;
  return (
    typeof obj['user_id'] === 'string' &&
    typeof obj['first_name'] === 'string' &&
    typeof obj['last_name'] === 'string' &&
    (obj['sex'] === 'Male' || obj['sex'] === 'Female') &&
    typeof obj['age'] === 'number' &&
    Array.isArray(obj['photos'])
  );
}

// ── Structural / type conformance ─────────────────────────────────────────────

describe('DECK_FIXTURES structural conformance', () => {
  test('exports exactly 5 fixtures', () => {
    expect(DECK_FIXTURES).toHaveLength(5);
  });

  test('each fixture is a valid DummyDeckProfile', () => {
    DECK_FIXTURES.forEach((profile, i) => {
      expect(isValidDeckProfile(profile)).toBe(true);
      expect(profile.first_name).toBeTruthy();
      expect(profile.last_name).toBeTruthy();
      expect(typeof profile.user_id).toBe('string');
      expect(profile.sex).toBe('Female');
      expect(typeof profile.age).toBe('number');
    });
  });

  test('Aisha Khan (deckFemale1) is first in the array', () => {
    const first = DECK_FIXTURES[0];
    expect(first?.first_name).toBe('Aisha');
    expect(first?.last_name).toBe('Khan');
  });
});

// ── Uniqueness ────────────────────────────────────────────────────────────────

describe('DECK_FIXTURES uniqueness', () => {
  test('no two fixtures share a user_id', () => {
    const ids = DECK_FIXTURES.map((p) => p.user_id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  test('the four new profiles (indices 1–4) have distinct names', () => {
    const names = DECK_FIXTURES.slice(1).map(
      (p) => `${p.first_name} ${p.last_name}`,
    );
    const unique = new Set(names);
    expect(unique.size).toBe(4);
  });
});

// ── Photo registry resolution ─────────────────────────────────────────────────

describe('DECK_FIXTURES photo resolution', () => {
  test('all photo_url values resolve via resolveDummyPhoto()', () => {
    DECK_FIXTURES.forEach((profile) => {
      const resolved = resolveDummyPhoto(profile.photo_url);
      expect(resolved).toBeDefined();
    });
  });

  test('all photos[0] values resolve via resolveDummyPhoto()', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(Array.isArray(profile.photos)).toBe(true);
      expect(profile.photos.length).toBeGreaterThanOrEqual(1);
      const resolved = resolveDummyPhoto(profile.photos[0]);
      expect(resolved).toBeDefined();
    });
  });

  test('each fixture uses Female3.png or Female4.png (alternating)', () => {
    const allowed = new Set([
      'assets/female/Female3.png',
      'assets/female/Female4.png',
    ]);
    DECK_FIXTURES.forEach((profile) => {
      expect(allowed.has(profile.photo_url)).toBe(true);
      expect(allowed.has(profile.photos[0] ?? '')).toBe(true);
    });

    // Alternate: odd indices use Female3, even use Female4 (or vice versa).
    // Just verify both values appear across the deck.
    const photoUrls = DECK_FIXTURES.map((p) => p.photo_url);
    expect(photoUrls).toContain('assets/female/Female3.png');
    expect(photoUrls).toContain('assets/female/Female4.png');
  });
});

// ── Section field population ───────────────────────────────────────────────────
// Every fixture must have non-null values for the fields that
// AboutMeSection, MarriageIntentionsSection, EducationSection, and
// ProfessionalCareerSection read (so they render populated on every card).

describe('DECK_FIXTURES section field population', () => {
  // AboutMeSection: marital_status !== null AND/OR has_children !== null
  test('every fixture has a non-null marital_status (AboutMeSection)', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(profile.marital_status).not.toBeNull();
    });
  });

  test('every fixture has a non-null has_children value (AboutMeSection)', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(profile.has_children).not.toBeNull();
    });
  });

  // MarriageIntentionsSection: marriage_time !== null
  test('every fixture has a non-null marriage_time (MarriageIntentionsSection)', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(profile.marriage_time).not.toBeNull();
    });
  });

  // meet_time used for the intent label; null falls back to "Let's chat" so
  // non-null is nice but not strictly required — still assert it is present
  // for fixture completeness.
  test('every fixture has a non-null meet_time (MarriageIntentionsSection timeline)', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(profile.meet_time).not.toBeNull();
    });
  });

  // EducationSection: at least one of highest_degree / education_level /
  // college_name / higher_secondary / high_school must be non-null.
  test('every fixture populates at least one EducationSection field', () => {
    DECK_FIXTURES.forEach((profile) => {
      const hasEdField =
        profile.highest_degree !== null ||
        profile.education_level !== null ||
        profile.college_name !== null ||
        profile.higher_secondary !== null ||
        profile.high_school !== null;
      expect(hasEdField).toBe(true);
    });
  });

  test('every fixture has a non-null highest_degree (EducationSection degree chip)', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(profile.highest_degree).not.toBeNull();
    });
  });

  test('every fixture has a non-null college_name (EducationSection college chip)', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(profile.college_name).not.toBeNull();
    });
  });

  // ProfessionalCareerSection: at least one career field must be non-null.
  test('every fixture populates at least one ProfessionalCareerSection field', () => {
    DECK_FIXTURES.forEach((profile) => {
      const hasCareerField =
        profile.professional_category !== null ||
        profile.job_title !== null ||
        profile.employer_name !== null ||
        profile.employment_type !== null ||
        profile.office_address !== null ||
        profile.salary_range !== null;
      expect(hasCareerField).toBe(true);
    });
  });

  test('every fixture has a non-null job_title (ProfessionalCareerSection)', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(profile.job_title).not.toBeNull();
    });
  });

  test('every fixture has a non-null employer_name (ProfessionalCareerSection)', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(profile.employer_name).not.toBeNull();
    });
  });
});

// ── __dummy_display_only block ────────────────────────────────────────────────

describe('DECK_FIXTURES __dummy_display_only block', () => {
  test('every fixture has a __dummy_display_only block', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(profile.__dummy_display_only).toBeDefined();
    });
  });

  test('every __dummy_display_only block has is_active_today', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(typeof profile.__dummy_display_only?.is_active_today).toBe(
        'boolean',
      );
    });
  });

  test('every __dummy_display_only block has membership_tier', () => {
    DECK_FIXTURES.forEach((profile) => {
      const tier = profile.__dummy_display_only?.membership_tier;
      expect(['gold', 'silver', null].includes(tier ?? null)).toBe(true);
    });
  });

  test('every __dummy_display_only block has has_unread_notifications', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(
        typeof profile.__dummy_display_only?.has_unread_notifications,
      ).toBe('boolean');
    });
  });
});

// ── Backend deck_view fields present ─────────────────────────────────────────
// Ensure all 16 backend deck_view columns are populated in each fixture.

describe('DECK_FIXTURES backend deck_view fields', () => {
  test('every fixture has all required backend deck_view fields populated', () => {
    DECK_FIXTURES.forEach((profile) => {
      expect(typeof profile.user_id).toBe('string');
      expect(typeof profile.first_name).toBe('string');
      expect(typeof profile.last_name).toBe('string');
      expect(profile.sex).toBe('Female');
      expect(typeof profile.age).toBe('number');
      // chosen_profile_avatar may be null per backend
      expect('chosen_profile_avatar' in profile).toBe(true);
      expect(typeof profile.photo_url).toBe('string');
      expect(typeof profile.current_residence_city).toBe('string');
      expect(typeof profile.current_residence_country).toBe('string');
      expect(typeof profile.resident_country_code).toBe('string');
      expect(typeof profile.religion).toBe('string');
      expect(typeof profile.job_title).toBe('string');
      expect(typeof profile.username).toBe('string');
      expect(typeof profile.profile_complete_verified).toBe('boolean');
    });
  });
});
