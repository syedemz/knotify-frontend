/**
 * Tests for src/features/onboarding/pageMap.ts
 *
 * Verifies:
 * - PAGE_MAP completeness: all 31 expected route names are present
 * - PAGE_MAP uniqueness: every page number 1..31 appears exactly once
 * - TOTAL_PAGES constant equals 31
 * - OnboardingRouteName type (structural, via compile-time import)
 */

import { PAGE_MAP, TOTAL_PAGES } from '@/features/onboarding/pageMap';
import type { OnboardingRouteName } from '@/features/onboarding/pageMap';

/** The canonical ordered list of all 31 onboarding route names. */
const EXPECTED_ROUTE_NAMES: readonly string[] = [
  'Page01WelcomeScreen',
  'Page02EmailScreen',
  'Page03ConfirmCodeScreen',
  'Page04GetStartedScreen',
  'Page05SexScreen',
  'Page06NameScreen',
  'Page07BirthdayScreen',
  'Page08FirstCheckpointScreen',
  'Page09ReligionSubsectScreen',
  'Page10ProfessionalCategoryScreen',
  'Page11WorkDetailsScreen',
  'Page12EducationLevelScreen',
  'Page13EducationCredentialsScreen',
  'Page14SecondCheckpointScreen',
  'Page15ResidenceCountryScreen',
  'Page16ResidenceCityScreen',
  'Page17FamilyResidenceScreen',
  'Page18ParentsScreen',
  'Page19SiblingsScreen',
  'Page20MarriageTimelineScreen',
  'Page21OwnReligiousLevelScreen',
  'Page22PartnersReligiousLevelScreen',
  'Page23MaritalStatusScreen',
  'Page24MoveAbroadScreen',
  'Page25Preferences1Screen',
  'Page26Preferences2Screen',
  'Page27RelationScreen',
  'Page28PhotosScreen',
  'Page29PhoneScreen',
  'Page30FaceVerifyIntroScreen',
  'Page31FaceCaptureScreen',
];

describe('PAGE_MAP', () => {
  it('contains exactly 31 entries', () => {
    expect(Object.keys(PAGE_MAP)).toHaveLength(31);
  });

  it('contains every expected route name', () => {
    for (const name of EXPECTED_ROUTE_NAMES) {
      expect(PAGE_MAP).toHaveProperty(name);
    }
  });

  it('maps each route to a unique page number in the range 1..31', () => {
    const values = Object.values(PAGE_MAP);

    // Unique check
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(31);

    // Range check
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(31);
    }
  });

  it('assigns sequential page numbers matching the expected route order', () => {
    EXPECTED_ROUTE_NAMES.forEach((name, index) => {
      const expectedPage = index + 1;
      expect((PAGE_MAP as Record<string, number>)[name]).toBe(expectedPage);
    });
  });

  it('contains no extra unexpected route names', () => {
    const actualNames = Object.keys(PAGE_MAP);
    for (const name of actualNames) {
      expect(EXPECTED_ROUTE_NAMES).toContain(name);
    }
  });
});

describe('TOTAL_PAGES', () => {
  it('equals 31', () => {
    expect(TOTAL_PAGES).toBe(31);
  });

  it('matches the number of entries in PAGE_MAP', () => {
    expect(TOTAL_PAGES).toBe(Object.keys(PAGE_MAP).length);
  });
});

// Compile-time check: OnboardingRouteName must be assignable from a known key.
// This will error at build time if the type diverges from PAGE_MAP.
describe('OnboardingRouteName type', () => {
  it('is satisfied by every key in PAGE_MAP', () => {
    // Runtime reflection of the type — every key must pass the PAGE_MAP lookup.
    const keys = Object.keys(PAGE_MAP) as OnboardingRouteName[];
    for (const key of keys) {
      expect(PAGE_MAP[key]).toBeDefined();
    }
  });
});
