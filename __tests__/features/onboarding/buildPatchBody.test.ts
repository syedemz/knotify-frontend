/**
 * Unit tests for buildPatchBody (story 11.2).
 *
 * AC coverage (per PRD):
 * (a) First-submit includes every allowlisted writable field that is non-null.
 * (b) Client-only fields are never included.
 * (c) Retry strips every field where isImmutable(field) === true — iterates over
 *     ALL keys returned by isImmutable to cover future additions automatically.
 * (d) Siblings are embedded under `siblings` key in snake_case shape.
 * (e) Empty draft produces an empty (or near-empty) body without crashing.
 */

import { buildPatchBody, serializeSiblings } from '@/features/onboarding/buildPatchBody';
import { isImmutable } from '@/Helper/immutableFieldHelper';
import { createEmptyDraft } from '@/features/onboarding/draftSchema';
import type { OnboardingDraft, SiblingDraft } from '@/features/onboarding/draftSchema';
import type { UserProfileWritable } from '@/types/api/UserProfile';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFullDraft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  const base = createEmptyDraft();
  return {
    ...base,
    phone_number: '+919812345678',
    fields: {
      sex: 'Female',
      first_name: 'Sara',
      last_name: 'Khan',
      birthday: '1995-03-15',
      religion: 'Islam',
      subsect: 'Sunni',
      religious_level: 'Moderate',
      partners_religious_level: 'Moderate',
      username: 'sarakhan1234',
      current_residence_city: 'Mumbai',
      current_residence_country: 'India',
      resident_country_code: 'IN',
      district: 'Andheri',
      education_level: 'Masters',
      employer_name: 'TechCorp',
      employment_type: 'Full-time',
      family_residence_address: '123 Main St',
      father_retired: 'YES',
      fathers_job: 'Engineer',
      fathers_name: 'Ahmed Khan',
      graduation_year: 2018,
      has_children: false,
      higher_secondary: 'Jain College',
      highest_degree: 'MBA',
      high_school: 'DAV School',
      job_title: 'Software Engineer',
      marital_status: 'Never Married',
      marriage_time: '1-2 years',
      mother_retired: 'NO',
      mothers_job: 'Teacher',
      mothers_name: 'Fatima Khan',
      move_abroad: true,
      office_address: '456 Business Park',
      professional_category: 'Technology',
      relation: 'Myself',
      salary_range: '10-15 LPA',
      preferences: { personalityTraits: ['Ambitious'] },
      college_name: 'IIT Mumbai',
    },
    ...overrides,
  };
}

// ── AC (a): first-submit includes every allowlisted non-null field ────────────

describe('buildPatchBody — AC (a): first-submit allowlist', () => {
  it('given a fully filled draft, then body includes sex from fields', () => {
    const draft = makeFullDraft();
    const body = buildPatchBody(draft, { isRetry: false });
    expect(body.sex).toBe('Female');
  });

  it('given a fully filled draft, then body includes first_name', () => {
    const draft = makeFullDraft();
    const body = buildPatchBody(draft, { isRetry: false });
    expect(body.first_name).toBe('Sara');
  });

  it('given a fully filled draft, then body includes religion', () => {
    const draft = makeFullDraft();
    const body = buildPatchBody(draft, { isRetry: false });
    expect(body.religion).toBe('Islam');
  });

  it('given a fully filled draft, then body includes phone_number from top-level draft field', () => {
    const draft = makeFullDraft();
    const body = buildPatchBody(draft, { isRetry: false });
    expect(body.phone_number).toBe('+919812345678');
  });

  it('given a fully filled draft, then body includes username', () => {
    const draft = makeFullDraft();
    const body = buildPatchBody(draft, { isRetry: false });
    expect(body.username).toBe('sarakhan1234');
  });

  it('given a fully filled draft, then body includes preferences', () => {
    const draft = makeFullDraft();
    const body = buildPatchBody(draft, { isRetry: false });
    expect(body.preferences).toEqual({ personalityTraits: ['Ambitious'] });
  });

  it('given a null field in draft, then that field is omitted from body', () => {
    const draft = makeFullDraft();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (draft.fields as any).graduation_year = null;
    const body = buildPatchBody(draft, { isRetry: false });
    expect('graduation_year' in body).toBe(false);
  });

  it('given phone_number is null in draft, then phone_number is omitted from body', () => {
    const draft = createEmptyDraft();
    const body = buildPatchBody(draft, { isRetry: false });
    expect('phone_number' in body).toBe(false);
  });
});

// ── AC (b): client-only fields are never included ────────────────────────────

describe('buildPatchBody — AC (b): client-only fields excluded', () => {
  it('given any draft, then photoPreviewUris is never in body', () => {
    const draft = makeFullDraft({ photoPreviewUris: ['file://photo1.jpg'] });
    const body = buildPatchBody(draft, { isRetry: false }) as Record<string, unknown>;
    expect('photoPreviewUris' in body).toBe(false);
  });

  it('given any draft, then faceSelfieUri is never in body', () => {
    const draft = makeFullDraft({ faceSelfieUri: 'mock://selfie.jpg' });
    const body = buildPatchBody(draft, { isRetry: false }) as Record<string, unknown>;
    expect('faceSelfieUri' in body).toBe(false);
  });

  it('given any draft, then notificationPermissionStatus is never in body', () => {
    const draft = makeFullDraft({ notificationPermissionStatus: 'granted' });
    const body = buildPatchBody(draft, { isRetry: false }) as Record<string, unknown>;
    expect('notificationPermissionStatus' in body).toBe(false);
  });

  it('given any draft, then locationPermissionStatus is never in body', () => {
    const draft = makeFullDraft({ locationPermissionStatus: 'granted' });
    const body = buildPatchBody(draft, { isRetry: false }) as Record<string, unknown>;
    expect('locationPermissionStatus' in body).toBe(false);
  });

  it('given any draft, then lastCheckpoint is never in body', () => {
    const draft = makeFullDraft({ lastCheckpoint: 'secondCheckpoint' });
    const body = buildPatchBody(draft, { isRetry: false }) as Record<string, unknown>;
    expect('lastCheckpoint' in body).toBe(false);
  });

  it('given any draft, then currentPage is never in body', () => {
    const draft = makeFullDraft({ currentPage: 31 });
    const body = buildPatchBody(draft, { isRetry: false }) as Record<string, unknown>;
    expect('currentPage' in body).toBe(false);
  });

  it('given any draft, then timestamps is never in body', () => {
    const draft = makeFullDraft();
    const body = buildPatchBody(draft, { isRetry: false }) as Record<string, unknown>;
    expect('timestamps' in body).toBe(false);
  });

  it('given any draft, then schemaVersion is never in body', () => {
    const draft = makeFullDraft();
    const body = buildPatchBody(draft, { isRetry: false }) as Record<string, unknown>;
    expect('schemaVersion' in body).toBe(false);
  });
});

// ── AC (c): retry strips immutable fields ────────────────────────────────────

describe('buildPatchBody — AC (c): retry strips immutable fields', () => {
  /**
   * Enumerate all UserProfileWritable keys that isImmutable() returns true for.
   * This mirrors the PRD requirement: "The unit test iterates over ALL keys
   * returned by isImmutable() and asserts each is stripped — future helper
   * additions are automatically covered without editing the test."
   */
  const ALL_WRITABLE_KEYS: (keyof UserProfileWritable)[] = [
    'sex',
    'first_name',
    'last_name',
    'birthday',
    'religion',
    'subsect',
    'religious_level',
    'partners_religious_level',
    'username',
    'phone_number',
    'email',
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
  ];

  const immutableKeys = ALL_WRITABLE_KEYS.filter((k) => isImmutable(k));

  it('at least one immutable key exists (sanity check)', () => {
    expect(immutableKeys.length).toBeGreaterThan(0);
  });

  // For each immutable key, assert it is stripped from the retry body.
  for (const key of immutableKeys) {
    it(`given isRetry=true, then "${key}" is stripped from the body`, () => {
      const draft = makeFullDraft();
      const body = buildPatchBody(draft, { isRetry: true }) as Record<string, unknown>;
      expect(key in body).toBe(false);
    });
  }

  it('given isRetry=true, then non-immutable fields are still included', () => {
    const draft = makeFullDraft();
    const body = buildPatchBody(draft, { isRetry: true });
    // username is NOT immutable — should still be present
    expect(body.username).toBe('sarakhan1234');
    // job_title is NOT immutable
    expect(body.job_title).toBe('Software Engineer');
  });
});

// ── AC (d): siblings in snake_case ───────────────────────────────────────────

describe('buildPatchBody — AC (d): siblings embedded in snake_case', () => {
  const siblings: SiblingDraft[] = [
    {
      name: 'Umar',
      age: 28,
      maritalStatus: 'Never Married',
      gender: 'Male',
      profession: 'Engineer',
    },
    {
      name: 'Aisha',
      age: null,
      maritalStatus: null,
      gender: 'Female',
      profession: null,
    },
  ];

  it('given siblings in draft, then body.siblings is present', () => {
    const draft = makeFullDraft({ siblings });
    const body = buildPatchBody(draft, { isRetry: false });
    expect(body.siblings).toBeDefined();
    expect(body.siblings).toHaveLength(2);
  });

  it('given siblings in draft, then camelCase maritalStatus → snake_case marital_status', () => {
    const draft = makeFullDraft({ siblings });
    const body = buildPatchBody(draft, { isRetry: false });
    expect(body.siblings?.[0]).toMatchObject({
      name: 'Umar',
      sibling_age: 28,
      marital_status: 'Never Married',
      gender: 'Male',
      profession: 'Engineer',
    });
  });

  it('given siblings with null fields, then null fields are preserved in serialized form', () => {
    const draft = makeFullDraft({ siblings });
    const body = buildPatchBody(draft, { isRetry: false });
    expect(body.siblings?.[1]).toMatchObject({
      name: 'Aisha',
      sibling_age: null,
      marital_status: null,
      gender: 'Female',
      profession: null,
    });
  });

  it('given no siblings in draft, then body.siblings is absent', () => {
    const draft = makeFullDraft({ siblings: [] });
    const body = buildPatchBody(draft, { isRetry: false });
    expect('siblings' in body).toBe(false);
  });
});

// ── AC (e): empty draft produces valid empty body ────────────────────────────

describe('buildPatchBody — AC (e): empty draft', () => {
  it('given an empty draft, then buildPatchBody does not throw', () => {
    const draft = createEmptyDraft();
    expect(() => buildPatchBody(draft, { isRetry: false })).not.toThrow();
  });

  it('given an empty draft, then body contains no user-data fields', () => {
    const draft = createEmptyDraft();
    const body = buildPatchBody(draft, { isRetry: false }) as Record<string, unknown>;
    // No allowlisted field should appear since all are null/undefined
    expect('sex' in body).toBe(false);
    expect('first_name' in body).toBe(false);
    expect('phone_number' in body).toBe(false);
    expect('siblings' in body).toBe(false);
  });
});

// ── serializeSiblings helper ─────────────────────────────────────────────────

describe('serializeSiblings', () => {
  it('converts camelCase age → sibling_age and maritalStatus → marital_status', () => {
    const siblings: SiblingDraft[] = [
      { name: 'Ali', age: 30, maritalStatus: 'Divorced', gender: 'Male', profession: 'Doctor' },
    ];
    const result = serializeSiblings(siblings);
    expect(result[0]).toEqual({
      name: 'Ali',
      sibling_age: 30,
      marital_status: 'Divorced',
      gender: 'Male',
      profession: 'Doctor',
    });
  });

  it('returns empty array for empty input', () => {
    expect(serializeSiblings([])).toEqual([]);
  });
});
