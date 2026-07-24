/**
 * Page 13 — Dynamic education credentials form.
 *
 * Renders the credential fields appropriate for the `education_level` selected
 * on page 12, per the branch matrix in architecture.md §11.2.3:
 *
 * | education_level              | Visible fields                                     |
 * |------------------------------|----------------------------------------------------|
 * | Elementary School Level      | (none — all sentinels)                             |
 * | High School (10th)           | high_school, high_school_passing_year              |
 * | Higher Secondary (12th)      | + higher_secondary, higher_secondary_passing_year  |
 * | Graduate And Above           | all seven                                          |
 * | Medical Doctor / PHD         | all seven                                          |
 *
 * Hidden branches are auto-defaulted to their sentinels on mount:
 * - Text fields   → `"Not Applicable"`
 * - Year fields   → `0`  (deliberate — NOT null, per AC)
 *
 * A `useEffect` reconciles fields on mount and whenever `education_level`
 * changes (back-nav downgrade): force-resets now-irrelevant fields to sentinels
 * before the form re-renders.
 *
 * Continue navigates to `Page14SecondCheckpointScreen` via `advance(14)`.
 *
 * @module features/onboarding/screens/Page13EducationCredentialsScreen
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  FormField,
  Heading,
  Screen,
  TextInput,
  WizardFooter,
  WizardHeader,
} from '@/components';
import { t } from '@/labels';
import {
  EDUCATION_TEXT_MAX_LENGTH,
  isValidEducationText,
  isValidEducationYear,
} from '@/Helper/validationHelper';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

// ── Constants ──────────────────────────────────────────────────────────────────

/** Sentinel value for text education fields that are not applicable. */
export const EDUCATION_TEXT_SENTINEL = 'Not Applicable';

/** Sentinel value for year education fields that are not applicable. */
export const EDUCATION_YEAR_SENTINEL = 0;

// ── Branch matrix ──────────────────────────────────────────────────────────────

/** All five possible `education_level` values. */
export const EDUCATION_LEVELS = {
  ELEMENTARY: 'Elementary School Level',
  HIGH_SCHOOL: 'High School (10th)',
  HIGHER_SECONDARY: 'Higher Secondary School (12th)',
  GRADUATE: 'Graduate And Above',
  MEDICAL: 'Medical Doctor / PHD',
} as const;

/**
 * Derives which fields are visible (must be filled) for a given education
 * level. Fields not in the returned set are auto-defaulted to sentinels.
 *
 * @param level - The `education_level` string from the draft, or null/undefined.
 * @returns An object of boolean flags, one per credential field.
 */
function visibleFields(level: string | null | undefined): {
  showHighSchool: boolean;
  showHighSchoolYear: boolean;
  showHigherSecondary: boolean;
  showHigherSecondaryYear: boolean;
  showHighestDegree: boolean;
  showGraduationYear: boolean;
  showCollegeName: boolean;
} {
  const l = level ?? '';
  const isHighSchoolOrAbove =
    l === EDUCATION_LEVELS.HIGH_SCHOOL ||
    l === EDUCATION_LEVELS.HIGHER_SECONDARY ||
    l === EDUCATION_LEVELS.GRADUATE ||
    l === EDUCATION_LEVELS.MEDICAL;

  const isHigherSecondaryOrAbove =
    l === EDUCATION_LEVELS.HIGHER_SECONDARY ||
    l === EDUCATION_LEVELS.GRADUATE ||
    l === EDUCATION_LEVELS.MEDICAL;

  const isGraduateOrAbove =
    l === EDUCATION_LEVELS.GRADUATE || l === EDUCATION_LEVELS.MEDICAL;

  return {
    showHighSchool: isHighSchoolOrAbove,
    showHighSchoolYear: isHighSchoolOrAbove,
    showHigherSecondary: isHigherSecondaryOrAbove,
    showHigherSecondaryYear: isHigherSecondaryOrAbove,
    showHighestDegree: isGraduateOrAbove,
    showGraduationYear: isGraduateOrAbove,
    showCollegeName: isGraduateOrAbove,
  };
}

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page13EducationCredentialsScreen'>;

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 13: dynamic education credentials form.
 *
 * Field visibility is derived from `education_level` in the draft (written by
 * page 12). All hidden fields are auto-defaulted to sentinels on mount and on
 * every reconciliation cycle triggered by a back-nav level change. Continue
 * writes all visible fields to the draft and advances to page 14.
 */
export function Page13EducationCredentialsScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance, getDraft } = useOnboardingDraft();

  // ── Derive current education_level from draft ────────────────────────────────

  const educationLevel = getDraft().fields.education_level ?? null;
  const visibility = visibleFields(educationLevel);

  // ── Text field local state ───────────────────────────────────────────────────

  const [highSchool, setHighSchool] = useState('');
  const [higherSecondary, setHigherSecondary] = useState('');
  const [highestDegree, setHighestDegree] = useState('');
  const [collegeName, setCollegeName] = useState('');

  // ── Year field local state (stored as string for keyboard input) ─────────────

  const [highSchoolYear, setHighSchoolYear] = useState('');
  const [higherSecondaryYear, setHigherSecondaryYear] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  // ── Touched flags (errors appear only after first interaction) ───────────────

  const [highSchoolTouched, setHighSchoolTouched] = useState(false);
  const [highSchoolYearTouched, setHighSchoolYearTouched] = useState(false);
  const [higherSecondaryTouched, setHigherSecondaryTouched] = useState(false);
  const [higherSecondaryYearTouched, setHigherSecondaryYearTouched] = useState(false);
  const [highestDegreeTouched, setHighestDegreeTouched] = useState(false);
  const [graduationYearTouched, setGraduationYearTouched] = useState(false);
  const [collegeNameTouched, setCollegeNameTouched] = useState(false);

  // ── Back-nav downgrade reconciliation ────────────────────────────────────────

  /**
   * On mount (and on any educationLevel change), reset all now-irrelevant
   * fields to their sentinel defaults in the draft. This satisfies
   * architecture §11.2.3's back-nav policy:
   *
   * "if the user returns to page 12 and picks a lesser education level,
   * page 13's now-irrelevant fields are force-reset to defaults before
   * page 13 re-mounts."
   *
   * Visible fields are left alone — the user's in-flight values are kept.
   */
  useEffect(() => {
    // Build the sentinel patch as a plain mutable object, then cast it to the
    // DraftFields type for the update() call. The cast is safe because every
    // key/value pair matches the DraftFields shape exactly.
    const sentinelPatch: Record<string, string | number> = {};

    if (!visibility.showHighSchool) sentinelPatch['high_school'] = EDUCATION_TEXT_SENTINEL;
    if (!visibility.showHighSchoolYear) sentinelPatch['high_school_passing_year'] = EDUCATION_YEAR_SENTINEL;
    if (!visibility.showHigherSecondary) sentinelPatch['higher_secondary'] = EDUCATION_TEXT_SENTINEL;
    if (!visibility.showHigherSecondaryYear) sentinelPatch['higher_secondary_passing_year'] = EDUCATION_YEAR_SENTINEL;
    if (!visibility.showHighestDegree) sentinelPatch['highest_degree'] = EDUCATION_TEXT_SENTINEL;
    if (!visibility.showGraduationYear) sentinelPatch['graduation_year'] = EDUCATION_YEAR_SENTINEL;
    if (!visibility.showCollegeName) sentinelPatch['college_name'] = EDUCATION_TEXT_SENTINEL;

    if (Object.keys(sentinelPatch).length > 0) {
      // The cast is safe: every key in sentinelPatch is a valid DraftFields key
      // and every value matches its declared type (TEXT → string, INTEGER → number).
      update(sentinelPatch as Parameters<typeof update>[0]);
    }
    // educationLevel drives the sentinel reconciliation — all other deps are
    // intentionally excluded because update() is stable (useCallback) and
    // visibility is a derived value from educationLevel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [educationLevel]);

  // ── Derived validation ───────────────────────────────────────────────────────

  const currentYear = new Date().getFullYear();

  const highSchoolValid = !visibility.showHighSchool || isValidEducationText(highSchool);
  const highSchoolYearValid =
    !visibility.showHighSchoolYear || isValidEducationYear(Number(highSchoolYear), currentYear);
  const higherSecondaryValid =
    !visibility.showHigherSecondary || isValidEducationText(higherSecondary);
  const higherSecondaryYearValid =
    !visibility.showHigherSecondaryYear ||
    isValidEducationYear(Number(higherSecondaryYear), currentYear);
  const highestDegreeValid =
    !visibility.showHighestDegree || isValidEducationText(highestDegree);
  const graduationYearValid =
    !visibility.showGraduationYear || isValidEducationYear(Number(graduationYear), currentYear);
  const collegeNameValid = !visibility.showCollegeName || isValidEducationText(collegeName);

  const continueEnabled =
    highSchoolValid &&
    highSchoolYearValid &&
    higherSecondaryValid &&
    higherSecondaryYearValid &&
    highestDegreeValid &&
    graduationYearValid &&
    collegeNameValid;

  // ── Inline errors ─────────────────────────────────────────────────────────────

  const highSchoolError: string | undefined =
    highSchoolTouched && !highSchoolValid
      ? t('onboarding.education.credentials.highSchool.error')
      : undefined;

  const highSchoolYearError: string | undefined =
    highSchoolYearTouched && !highSchoolYearValid
      ? t('onboarding.education.credentials.highSchoolYear.error')
      : undefined;

  const higherSecondaryError: string | undefined =
    higherSecondaryTouched && !higherSecondaryValid
      ? t('onboarding.education.credentials.higherSecondary.error')
      : undefined;

  const higherSecondaryYearError: string | undefined =
    higherSecondaryYearTouched && !higherSecondaryYearValid
      ? t('onboarding.education.credentials.higherSecondaryYear.error')
      : undefined;

  const highestDegreeError: string | undefined =
    highestDegreeTouched && !highestDegreeValid
      ? t('onboarding.education.credentials.highestDegree.error')
      : undefined;

  const graduationYearError: string | undefined =
    graduationYearTouched && !graduationYearValid
      ? t('onboarding.education.credentials.graduationYear.error')
      : undefined;

  const collegeNameError: string | undefined =
    collegeNameTouched && !collegeNameValid
      ? t('onboarding.education.credentials.collegeName.error')
      : undefined;

  // ── Continue handler ──────────────────────────────────────────────────────────

  const handleContinue = useCallback((): void => {
    if (!continueEnabled) return;

    // Write visible fields; hidden fields were already defaulted to sentinels
    // by the useEffect reconciliation on mount. Build as a plain mutable object
    // and cast to DraftFields — the cast is safe because every key/value pair
    // exactly matches the DraftFields shape.
    const patch: Record<string, string | number> = {};

    if (visibility.showHighSchool) patch['high_school'] = highSchool;
    if (visibility.showHighSchoolYear) patch['high_school_passing_year'] = Number(highSchoolYear);
    if (visibility.showHigherSecondary) patch['higher_secondary'] = higherSecondary;
    if (visibility.showHigherSecondaryYear) patch['higher_secondary_passing_year'] = Number(higherSecondaryYear);
    if (visibility.showHighestDegree) patch['highest_degree'] = highestDegree;
    if (visibility.showGraduationYear) patch['graduation_year'] = Number(graduationYear);
    if (visibility.showCollegeName) patch['college_name'] = collegeName;

    update(patch as Parameters<typeof update>[0]);
    advance(14);
    navigation.navigate('Page14SecondCheckpointScreen');
  }, [
    continueEnabled,
    visibility,
    highSchool,
    highSchoolYear,
    higherSecondary,
    higherSecondaryYear,
    highestDegree,
    graduationYear,
    collegeName,
    update,
    advance,
    navigation,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={13} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Heading variant="display.md" color="primary">
          {t('onboarding.education.credentials.title')}
        </Heading>

        {/* ── High school name ──────────────────────────────────────── */}
        {visibility.showHighSchool && (
          <FormField
            label={t('onboarding.education.credentials.highSchool.label')}
            error={highSchoolError}
            required
          >
            <TextInput
              value={highSchool}
              onChangeText={(text) => {
                setHighSchool(text);
                if (!highSchoolTouched) setHighSchoolTouched(true);
              }}
              placeholder={t('onboarding.education.credentials.highSchool.placeholder')}
              maxLength={EDUCATION_TEXT_MAX_LENGTH + 1}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              error={!!highSchoolError}
              accessibilityLabel={t('onboarding.education.credentials.highSchool.label')}
            />
          </FormField>
        )}

        {/* ── High school passing year ──────────────────────────────── */}
        {visibility.showHighSchoolYear && (
          <FormField
            label={t('onboarding.education.credentials.highSchoolYear.label')}
            error={highSchoolYearError}
            required
          >
            <TextInput
              value={highSchoolYear}
              onChangeText={(text) => {
                setHighSchoolYear(text);
                if (!highSchoolYearTouched) setHighSchoolYearTouched(true);
              }}
              placeholder={t('onboarding.education.credentials.highSchoolYear.placeholder')}
              maxLength={4}
              keyboardType="number-pad"
              returnKeyType="next"
              error={!!highSchoolYearError}
              accessibilityLabel={t('onboarding.education.credentials.highSchoolYear.label')}
            />
          </FormField>
        )}

        {/* ── Higher secondary school name ──────────────────────────── */}
        {visibility.showHigherSecondary && (
          <FormField
            label={t('onboarding.education.credentials.higherSecondary.label')}
            error={higherSecondaryError}
            required
          >
            <TextInput
              value={higherSecondary}
              onChangeText={(text) => {
                setHigherSecondary(text);
                if (!higherSecondaryTouched) setHigherSecondaryTouched(true);
              }}
              placeholder={t('onboarding.education.credentials.higherSecondary.placeholder')}
              maxLength={EDUCATION_TEXT_MAX_LENGTH + 1}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              error={!!higherSecondaryError}
              accessibilityLabel={t('onboarding.education.credentials.higherSecondary.label')}
            />
          </FormField>
        )}

        {/* ── Higher secondary passing year ─────────────────────────── */}
        {visibility.showHigherSecondaryYear && (
          <FormField
            label={t('onboarding.education.credentials.higherSecondaryYear.label')}
            error={higherSecondaryYearError}
            required
          >
            <TextInput
              value={higherSecondaryYear}
              onChangeText={(text) => {
                setHigherSecondaryYear(text);
                if (!higherSecondaryYearTouched) setHigherSecondaryYearTouched(true);
              }}
              placeholder={t('onboarding.education.credentials.higherSecondaryYear.placeholder')}
              maxLength={4}
              keyboardType="number-pad"
              returnKeyType="next"
              error={!!higherSecondaryYearError}
              accessibilityLabel={t('onboarding.education.credentials.higherSecondaryYear.label')}
            />
          </FormField>
        )}

        {/* ── Highest degree ────────────────────────────────────────── */}
        {visibility.showHighestDegree && (
          <FormField
            label={t('onboarding.education.credentials.highestDegree.label')}
            error={highestDegreeError}
            required
          >
            <TextInput
              value={highestDegree}
              onChangeText={(text) => {
                setHighestDegree(text);
                if (!highestDegreeTouched) setHighestDegreeTouched(true);
              }}
              placeholder={t('onboarding.education.credentials.highestDegree.placeholder')}
              maxLength={EDUCATION_TEXT_MAX_LENGTH + 1}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              error={!!highestDegreeError}
              accessibilityLabel={t('onboarding.education.credentials.highestDegree.label')}
            />
          </FormField>
        )}

        {/* ── Graduation year ───────────────────────────────────────── */}
        {visibility.showGraduationYear && (
          <FormField
            label={t('onboarding.education.credentials.graduationYear.label')}
            error={graduationYearError}
            required
          >
            <TextInput
              value={graduationYear}
              onChangeText={(text) => {
                setGraduationYear(text);
                if (!graduationYearTouched) setGraduationYearTouched(true);
              }}
              placeholder={t('onboarding.education.credentials.graduationYear.placeholder')}
              maxLength={4}
              keyboardType="number-pad"
              returnKeyType="next"
              error={!!graduationYearError}
              accessibilityLabel={t('onboarding.education.credentials.graduationYear.label')}
            />
          </FormField>
        )}

        {/* ── College / university name ─────────────────────────────── */}
        {visibility.showCollegeName && (
          <FormField
            label={t('onboarding.education.credentials.collegeName.label')}
            error={collegeNameError}
            required
          >
            <TextInput
              value={collegeName}
              onChangeText={(text) => {
                setCollegeName(text);
                if (!collegeNameTouched) setCollegeNameTouched(true);
              }}
              placeholder={t('onboarding.education.credentials.collegeName.placeholder')}
              maxLength={EDUCATION_TEXT_MAX_LENGTH + 1}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              error={!!collegeNameError}
              accessibilityLabel={t('onboarding.education.credentials.collegeName.label')}
            />
          </FormField>
        )}
      </ScrollView>

      <WizardFooter
        onContinue={handleContinue}
        disabled={!continueEnabled}
      />
    </Screen>
  );
}
