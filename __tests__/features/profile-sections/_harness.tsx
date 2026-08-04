/**
 * Test harness for profile-section components (story 12.2).
 *
 * Provides:
 * - A `renderSection` helper that mounts any section component inside a
 *   `ThemeProvider` and returns the RNTL query helpers.
 * - A `fullProfile` fixture (all fields populated) for the full-data render path.
 * - A `minimalProfile` fixture (all nullable fields set to null) for the
 *   section-level hide path.
 * - A `buildProfile` factory for per-chip hide assertions.
 *
 * NOTE: jest.mock() calls must live in the test files that use this harness,
 * not here, because Jest hoists `jest.mock()` to the top of each file during
 * compilation — mocks in a shared helper module are NOT hoisted and do not
 * apply. Each test file that imports from this harness includes its own
 * jest.mock() calls for react-native-safe-area-context and
 * react-native-reanimated.
 *
 * This file exports only runtime helpers and fixtures. Jest picks it up via
 * the `__tests__/**` glob but it contains no test assertions — the placeholder
 * `describe` block below satisfies the "at least one test suite" requirement
 * while documenting the harness purpose.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, Rct.createElement(RN.View, null, props.children));
    },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () { return INSETS; },
    useSafeAreaFrame: function () { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

jest.mock('react-native-reanimated', () => {
  const m = require('react-native-reanimated/mock');
  m.default.call = jest.fn();
  return m;
});
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

// ── Profile type ──────────────────────────────────────────────────────────────

export type TestProfile = UserProfile & DummyOverlay;

// ── Full profile fixture (all fields populated) ───────────────────────────────

/**
 * A profile where every field is populated. Used for full-data render path
 * assertions in per-section tests.
 */
export const fullProfile: TestProfile = {
  // UserProfile required fields
  user_id: 'test-user-001',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',

  // Nullable fields — all populated for full-data path
  phone_number: '+4915987654321',
  username: 'test_user',
  first_name: 'Adnan',
  last_name: 'Malik',
  sex: 'Male',
  birthday: '1995-07-22',
  age: 29,
  religion: 'Islam',
  subsect: 'Sunni',
  religious_level: 'Practicing',
  chosen_profile_avatar: null,
  photo_url: 'assets/male/Male1.png',
  college_name: 'Test University',
  current_residence_city: 'Mannheim',
  current_residence_country: 'Germany',
  resident_country_code: 'DE',
  district: 'Quadrate',
  education_level: 'Bachelors',
  employer_name: 'TechCorp GmbH',
  employment_type: 'Full-time',
  family_residence_address: 'Ringstraße 5, 68159 Mannheim',
  father_retired: 'YES',
  fathers_job: 'Retired Teacher',
  fathers_name: 'Khalid Malik',
  graduation_year: 2019,
  has_children: false,
  higher_secondary: 'Test Grammar School',
  higher_secondary_passing_year: 2013,
  highest_degree: 'BSc Computer Science',
  high_school: 'Test Secondary School',
  high_school_passing_year: 2011,
  job_title: 'Software Engineer',
  marital_status: 'Never Married',
  marriage_time: 'Within 2 years',
  mother_retired: 'NO',
  mothers_job: 'Homemaker',
  mothers_name: 'Samina Malik',
  move_abroad: true,
  office_address: 'Bismarckplatz 1, 68165 Mannheim',
  partners_religious_level: 'Practicing',
  professional_category: 'Technology & Engineering',
  profile_complete_verified: true,
  relation: 'Myself',
  salary_range: '50000–70000 EUR',
  preferences: { personalityTraits: ['Adventurous', 'Family-oriented'] },
  deleted_at: null,

  // DummyOverlay fields
  photos: ['assets/male/Male1.png', 'assets/male/Male2.png'],
  faceSelfieUri: 'assets/male/Male1.png',
  siblings: [
    {
      name: 'Zara Malik',
      age: 24,
      marital_status: 'Never Married',
      gender: 'Female',
      profession: 'Medical Student',
    },
  ],
  __dummy_display_only: {
    is_active_today: true,
    membership_tier: 'gold',
    has_unread_notifications: true,
    dress_code: 'Modest',
    eats_halal: true,
    smokes: false,
    drinks: false,
    fasts: true,
  },
};

/**
 * A profile where every nullable field is null and every optional overlay
 * field is absent. Used for section-level hide assertions.
 */
export const minimalProfile: TestProfile = {
  user_id: 'test-user-minimal',
  email: 'minimal@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  phone_number: null,
  username: null,
  first_name: 'Test',
  last_name: null,
  sex: null,
  birthday: '2000-01-01',
  age: null,
  religion: null,
  subsect: null,
  religious_level: null,
  chosen_profile_avatar: null,
  photo_url: null,
  college_name: null,
  current_residence_city: null,
  current_residence_country: null,
  resident_country_code: null,
  district: null,
  education_level: null,
  employer_name: null,
  employment_type: null,
  family_residence_address: null,
  father_retired: null,
  fathers_job: null,
  fathers_name: null,
  graduation_year: null,
  has_children: null,
  higher_secondary: null,
  higher_secondary_passing_year: null,
  highest_degree: null,
  high_school: null,
  high_school_passing_year: null,
  job_title: null,
  marital_status: null,
  marriage_time: null,
  mother_retired: null,
  mothers_job: null,
  mothers_name: null,
  move_abroad: null,
  office_address: null,
  partners_religious_level: null,
  professional_category: null,
  profile_complete_verified: null,
  relation: null,
  salary_range: null,
  preferences: null,
  deleted_at: null,
  // No DummyOverlay fields set
};

/**
 * Builds a profile by merging overrides on top of `minimalProfile`.
 * Use this to test chip-level hide guards by setting only the fields
 * relevant to a specific chip.
 */
export function buildProfile(overrides: Partial<TestProfile>): TestProfile {
  return { ...minimalProfile, ...overrides };
}

// ── Render helper ─────────────────────────────────────────────────────────────

/**
 * Renders a single section component inside `ThemeProvider` and returns
 * the RNTL query helpers.
 */
export function renderSection(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

// ── Harness self-test ─────────────────────────────────────────────────────────

/**
 * Minimal self-test so Jest does not fail with "test suite must contain at
 * least one test". The harness is a utility module — its real coverage comes
 * from the per-section test files that import it.
 */
describe('_harness', () => {
  it('provides fullProfile with user_id', () => {
    expect(fullProfile.user_id).toBe('test-user-001');
  });

  it('provides minimalProfile with all nullable fields as null', () => {
    expect(minimalProfile.religion).toBeNull();
    expect(minimalProfile.job_title).toBeNull();
  });

  it('buildProfile merges overrides onto minimalProfile', () => {
    const p = buildProfile({ religion: 'Islam' });
    expect(p.religion).toBe('Islam');
    expect(p.job_title).toBeNull(); // still minimal for everything else
  });
});
