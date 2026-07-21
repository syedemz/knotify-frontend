/**
 * Verifies the central options registry:
 * 1. Every JSON file in src/config/options/ parses without error.
 * 2. Every key exported from options/index.ts resolves to a non-empty array.
 * 3. Every entry in each array is a non-empty string.
 */

import { options, type OptionsKey } from '@/config/options/index';

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const ALL_KEYS: ReadonlyArray<OptionsKey> = [
  'religion',
  'islamicSubsect',
  'professionalCategory',
  'employmentType',
  'salaryRange',
  'educationLevel',
  'kashmirDistricts',
  'yesNo',
  'maritalStatus',
  'gender',
  'religiousLevel',
  'marriageTime',
  'relation',
];

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('options registry', () => {
  describe('given the registry is imported, when each key is accessed, then it resolves to a non-empty array', () => {
    it.each(ALL_KEYS)('options.%s is a non-empty string array', (key) => {
      const list = options[key];
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThan(0);
    });
  });

  describe('given each option list, when entries are inspected, then every item is a non-empty string', () => {
    it.each(ALL_KEYS)('options.%s — all entries are non-empty strings', (key) => {
      const list = options[key];
      for (const item of list) {
        expect(typeof item).toBe('string');
        expect((item as string).trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('given specific option lists, when known values are checked, then canonical values are present', () => {
    it('religion includes "Islam"', () => {
      expect(options.religion).toContain('Islam');
    });

    it('islamicSubsect includes "Sunni" and "Shia"', () => {
      expect(options.islamicSubsect).toContain('Sunni');
      expect(options.islamicSubsect).toContain('Shia');
    });

    it('professionalCategory has exactly 27 entries', () => {
      expect(options.professionalCategory).toHaveLength(27);
    });

    it('educationLevel has exactly 5 entries matching architecture.md §5', () => {
      expect(options.educationLevel).toHaveLength(5);
      expect(options.educationLevel).toContain('Elementary School Level');
      expect(options.educationLevel).toContain('Medical Doctor / PHD');
    });

    it('kashmirDistricts has exactly 22 entries and includes Srinagar first', () => {
      expect(options.kashmirDistricts).toHaveLength(22);
      expect(options.kashmirDistricts[0]).toBe('Srinagar');
    });

    it('yesNo contains exactly "YES" and "NO"', () => {
      expect(options.yesNo).toEqual(['YES', 'NO']);
    });

    it('maritalStatus contains the three backend-canonical values', () => {
      expect(options.maritalStatus).toContain('Never Married');
      expect(options.maritalStatus).toContain('Divorced');
      expect(options.maritalStatus).toContain('Widowed');
    });

    it('gender contains exactly "Male" and "Female" in that order', () => {
      expect(options.gender).toEqual(['Male', 'Female']);
    });

    it('religiousLevel has exactly 4 entries', () => {
      expect(options.religiousLevel).toHaveLength(4);
      expect(options.religiousLevel).toContain('Strictly practicing');
    });

    it('relation includes "Myself" as first entry', () => {
      expect(options.relation[0]).toBe('Myself');
    });

    it('employmentType contains the three backend-canonical values', () => {
      expect(options.employmentType).toContain('Government');
      expect(options.employmentType).toContain('Private');
      expect(options.employmentType).toContain('Self-Business');
    });
  });

  describe('given the registry object, when ALL_KEYS is compared to registry keys, then no key is missing or extra', () => {
    it('registry has exactly the expected keys', () => {
      const registryKeys = Object.keys(options).sort();
      const expectedKeys = [...ALL_KEYS].sort();
      expect(registryKeys).toEqual(expectedKeys);
    });
  });
});
