/**
 * Central selection-options registry.
 *
 * Every form field that shows a fixed list of choices reads its options from
 * here. No screen or component may inline an options array — it comes from
 * the corresponding JSON file in this folder.
 *
 * All lists are plain string arrays. The string values match the exact case
 * and spelling expected by the backend (`db-schema → users.<column>`).
 *
 * @see architecture.md §5.3
 */

import religion from './religion.json';
import islamicSubsect from './islamicSubsect.json';
import professionalCategory from './professionalCategory.json';
import employmentType from './employmentType.json';
import salaryRange from './salaryRange.json';
import educationLevel from './educationLevel.json';
import kashmirDistricts from './kashmirDistricts.json';
import yesNo from './yesNo.json';
import maritalStatus from './maritalStatus.json';
import gender from './gender.json';
import religiousLevel from './religiousLevel.json';
import marriageTime from './marriageTime.json';
import relation from './relation.json';
import preferences1 from './preferences1.json';

/**
 * Typed wrapper around a plain string-array options list.
 *
 * Using `readonly string[]` keeps the loader compatible with both
 * `as const` JSON imports and mutable arrays in tests.
 */
export type OptionList = readonly string[];

/**
 * The central options registry.
 *
 * Access individual lists as `options.religion`, `options.professionalCategory`, etc.
 * Every key maps directly to the field name used in db-schema.
 */
export const options = {
  /** Religion options for page 9 (`religion` field). */
  religion: religion as OptionList,

  /**
   * Islamic subsect options shown when `religion === 'Islam'` (page 9,
   * `subsect` field). For all other religions, `subsect` is force-set to
   * `"Not Applicable"` — see architecture.md §11.2.1.
   */
  islamicSubsect: islamicSubsect as OptionList,

  /** Professional category options for page 10 (`professional_category` field). */
  professionalCategory: professionalCategory as OptionList,

  /** Employment type options for page 11 (`employment_type` field). */
  employmentType: employmentType as OptionList,

  /** Salary range options for page 11 (`salary_range` field). */
  salaryRange: salaryRange as OptionList,

  /** Education level options for page 12 (`education_level` field). */
  educationLevel: educationLevel as OptionList,

  /**
   * Kashmir district options for page 17 (`district` field).
   * Default preselected value is `"Srinagar"` — enforced in the screen.
   */
  kashmirDistricts: kashmirDistricts as OptionList,

  /** Yes/No options for binary pick-one fields (`father_retired`, `mother_retired`, `has_children`, `move_abroad`). */
  yesNo: yesNo as OptionList,

  /** Marital status options for page 23 (`marital_status` field). */
  maritalStatus: maritalStatus as OptionList,

  /** Gender options for sibling sub-forms on page 19 (`siblings.gender` field). */
  gender: gender as OptionList,

  /**
   * Religious level options for pages 21–22 (`religious_level` and
   * `partners_religious_level` fields).
   */
  religiousLevel: religiousLevel as OptionList,

  /** Marriage timeline options for page 20 (`marriage_time` field). */
  marriageTime: marriageTime as OptionList,

  /** Profile-for-whom options for page 27 (`relation` field). */
  relation: relation as OptionList,

  /**
   * Personality traits for page 25 (`preferences.personalityTraits`).
   * 57 traits in alphabetical order including 16 MBTI acronyms.
   */
  preferences1: preferences1 as OptionList,
} as const;

export type OptionsRegistry = typeof options;
export type OptionsKey = keyof OptionsRegistry;
