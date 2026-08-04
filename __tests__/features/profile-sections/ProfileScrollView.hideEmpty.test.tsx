/**
 * Integration tests for ProfileScrollView hide-if-empty guards (story 12.2).
 *
 * Three scenarios from the PRD AC:
 *
 * 1. `dummyprofile` + viewer="self":
 *    - SiblingsSection NOT in tree (siblings: []).
 *    - PhotoBlockSection NOT in tree (photos.length === 1).
 *    - ContactActionsSection NOT in tree (viewer=self).
 *    - HeroBlock (self variant) IS in tree.
 *    - Other sections (AboutMe, Faith, etc.) ARE in tree.
 *
 * 2. Synthetic minimal profile (only first_name + birthday set) + viewer="self":
 *    - Only HeroBlock IS in tree.
 *    - All other sections NOT in tree (all their fields null).
 *
 * 3. `dummyfemale` + viewer="other":
 *    - HeroBlock NOT in tree (returns null for viewer=other).
 *    - ContactActionsSection, SiblingsSection, PhotoBlockSection ARE in tree
 *      (female fixture is full).
 */

import React from 'react';
import { screen } from '@testing-library/react-native';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { ProfileScrollView } from '@/features/profile-sections/ProfileScrollView';
import type { DummyOverlay } from '@/types/DummyOverlay';
import type { UserProfile } from '@/types/api/UserProfile';

import dummyprofileJson from '../../../assets/dummyprofile.json';
import dummyfemaleJson from '../../../assets/dummyfemale.json';

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

// ── Fixtures ──────────────────────────────────────────────────────────────────

type TestProfile = UserProfile & DummyOverlay;

const dummyprofile = dummyprofileJson as unknown as TestProfile;
const dummyfemale = dummyfemaleJson as unknown as TestProfile;

/**
 * A synthetic minimal profile with only first_name and birthday set.
 * All nullable UserProfile fields are null; no DummyOverlay fields set.
 */
const syntheticMinimalProfile: TestProfile = {
  user_id: 'minimal-test-001',
  email: 'minimal@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  // Only these two set per the AC
  first_name: 'TestUser',
  birthday: '1995-01-01',
  // Everything else null
  last_name: null,
  sex: null,
  age: null,
  religion: null,
  subsect: null,
  religious_level: null,
  phone_number: null,
  username: null,
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
  // No DummyOverlay fields
};

// ── Helper ────────────────────────────────────────────────────────────────────

function renderScrollView(
  profile: TestProfile,
  viewer: 'self' | 'other',
) {
  return render(
    <ThemeProvider>
      <ProfileScrollView profile={profile} viewer={viewer} />
    </ThemeProvider>,
  );
}

// ── Scenario 1: dummyprofile + viewer=self ────────────────────────────────────

describe('Scenario 1: dummyprofile + viewer=self', () => {
  beforeEach(() => {
    renderScrollView(dummyprofile, 'self');
  });

  it('HeroBlock (self variant) IS in the tree', () => {
    expect(screen.getByTestId('hero-block')).toBeTruthy();
  });

  it('SiblingsSection is NOT in the tree (siblings: [])', () => {
    expect(screen.queryByTestId('siblings-section')).toBeNull();
  });

  it('PhotoBlockSection is NOT in the tree (photos.length === 1)', () => {
    expect(screen.queryByTestId('photo-block-section')).toBeNull();
  });

  it('ContactActionsSection is NOT in the tree (viewer=self)', () => {
    expect(screen.queryByTestId('contact-actions-section')).toBeNull();
  });

  it('AboutMeSection IS in the tree', () => {
    expect(screen.getByTestId('about-me-section')).toBeTruthy();
  });

  it('FaithSection IS in the tree', () => {
    expect(screen.getByTestId('faith-section')).toBeTruthy();
  });

  it('MarriageIntentionsSection IS in the tree', () => {
    expect(screen.getByTestId('marriage-intentions-section')).toBeTruthy();
  });

  it('FuturePlansSection IS in the tree', () => {
    expect(screen.getByTestId('future-plans-section')).toBeTruthy();
  });

  it('PersonalitySection IS in the tree', () => {
    expect(screen.getByTestId('personality-section')).toBeTruthy();
  });

  it('EducationSection IS in the tree', () => {
    expect(screen.getByTestId('education-section')).toBeTruthy();
  });

  it('ProfessionalCareerSection IS in the tree', () => {
    expect(screen.getByTestId('professional-career-section')).toBeTruthy();
  });

  it('ParentsSection IS in the tree', () => {
    expect(screen.getByTestId('parents-section')).toBeTruthy();
  });

  it('AddressSection IS in the tree', () => {
    expect(screen.getByTestId('address-section')).toBeTruthy();
  });

  it('VerifiedProfileSection IS in the tree', () => {
    expect(screen.getByTestId('verified-profile-section')).toBeTruthy();
  });
});

// ── Scenario 2: syntheticMinimalProfile + viewer=self ─────────────────────────

describe('Scenario 2: syntheticMinimalProfile + viewer=self (only first_name + birthday)', () => {
  beforeEach(() => {
    renderScrollView(syntheticMinimalProfile, 'self');
  });

  it('HeroBlock IS in the tree (never hides for viewer=self)', () => {
    expect(screen.getByTestId('hero-block')).toBeTruthy();
  });

  it('AboutMeSection is NOT in the tree', () => {
    expect(screen.queryByTestId('about-me-section')).toBeNull();
  });

  it('MarriageIntentionsSection is NOT in the tree', () => {
    expect(screen.queryByTestId('marriage-intentions-section')).toBeNull();
  });

  it('FaithSection is NOT in the tree', () => {
    expect(screen.queryByTestId('faith-section')).toBeNull();
  });

  it('FuturePlansSection is NOT in the tree', () => {
    expect(screen.queryByTestId('future-plans-section')).toBeNull();
  });

  it('PhotoBlockSection is NOT in the tree', () => {
    expect(screen.queryByTestId('photo-block-section')).toBeNull();
  });

  it('PersonalitySection is NOT in the tree', () => {
    expect(screen.queryByTestId('personality-section')).toBeNull();
  });

  it('EducationSection is NOT in the tree', () => {
    expect(screen.queryByTestId('education-section')).toBeNull();
  });

  it('ProfessionalCareerSection is NOT in the tree', () => {
    expect(screen.queryByTestId('professional-career-section')).toBeNull();
  });

  it('ParentsSection is NOT in the tree', () => {
    expect(screen.queryByTestId('parents-section')).toBeNull();
  });

  it('AddressSection is NOT in the tree', () => {
    expect(screen.queryByTestId('address-section')).toBeNull();
  });

  it('SiblingsSection is NOT in the tree', () => {
    expect(screen.queryByTestId('siblings-section')).toBeNull();
  });

  it('VerifiedProfileSection is NOT in the tree', () => {
    expect(screen.queryByTestId('verified-profile-section')).toBeNull();
  });

  it('ContactActionsSection is NOT in the tree (viewer=self)', () => {
    expect(screen.queryByTestId('contact-actions-section')).toBeNull();
  });
});

// ── Scenario 3: dummyfemale + viewer=other ────────────────────────────────────

describe('Scenario 3: dummyfemale + viewer=other', () => {
  beforeEach(() => {
    renderScrollView(dummyfemale, 'other');
  });

  it('HeroBlock is NOT in the tree (returns null for viewer=other)', () => {
    expect(screen.queryByTestId('hero-block')).toBeNull();
  });

  it('ContactActionsSection IS in the tree (viewer=other + full fixture)', () => {
    expect(screen.getByTestId('contact-actions-section')).toBeTruthy();
  });

  it('SiblingsSection IS in the tree (dummyfemale has 2 siblings)', () => {
    expect(screen.getByTestId('siblings-section')).toBeTruthy();
  });

  it('PhotoBlockSection IS in the tree (dummyfemale has 2 photos)', () => {
    expect(screen.getByTestId('photo-block-section')).toBeTruthy();
  });

  it('AboutMeSection IS in the tree', () => {
    expect(screen.getByTestId('about-me-section')).toBeTruthy();
  });

  it('MarriageIntentionsSection IS in the tree', () => {
    expect(screen.getByTestId('marriage-intentions-section')).toBeTruthy();
  });

  it('FaithSection IS in the tree', () => {
    expect(screen.getByTestId('faith-section')).toBeTruthy();
  });

  it('FuturePlansSection IS in the tree', () => {
    expect(screen.getByTestId('future-plans-section')).toBeTruthy();
  });

  it('PersonalitySection IS in the tree', () => {
    expect(screen.getByTestId('personality-section')).toBeTruthy();
  });

  it('EducationSection IS in the tree', () => {
    expect(screen.getByTestId('education-section')).toBeTruthy();
  });

  it('ProfessionalCareerSection IS in the tree', () => {
    expect(screen.getByTestId('professional-career-section')).toBeTruthy();
  });

  it('ParentsSection IS in the tree', () => {
    expect(screen.getByTestId('parents-section')).toBeTruthy();
  });

  it('AddressSection IS in the tree', () => {
    expect(screen.getByTestId('address-section')).toBeTruthy();
  });

  it('VerifiedProfileSection IS in the tree', () => {
    expect(screen.getByTestId('verified-profile-section')).toBeTruthy();
  });
});
