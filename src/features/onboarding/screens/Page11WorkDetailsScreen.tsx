/**
 * Page 11 — Work details (5-field all-required form).
 *
 * Collects `employment_type` (Select picker), `job_title` (TextInput),
 * `employer_name` (TextInput), `office_address` (multiline TextInput), and
 * `salary_range` (Select picker). Continue is disabled until all five fields
 * pass their validation rules. On Continue, all five values are written to the
 * draft at once and the screen advances to `Page12EducationLevelScreen`.
 *
 * Inline per-field error hints mirror the Page 02 email/password pattern:
 * errors appear only after the user has interacted with a field (touched).
 *
 * @module features/onboarding/screens/Page11WorkDetailsScreen
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  FormField,
  Screen,
  Select,
  TextInput,
  WizardFooter,
  WizardHeader,
  Heading,
} from '@/components';
import { t } from '@/labels';
import { options } from '@/config/options';
import type { SelectOption } from '@/components';
import type { OnboardingStackParamList } from '@/navigation/types';
import { useOnboardingDraft } from '../hooks/useOnboardingDraft';
import {
  isValidJobTitle,
  isValidEmployerName,
  isValidOfficeAddress,
  JOB_TITLE_MAX_LENGTH,
  EMPLOYER_NAME_MAX_LENGTH,
  OFFICE_ADDRESS_MAX_LENGTH,
} from '@/Helper/validationHelper';

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page11WorkDetailsScreen'>;

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Converts a plain string options list to `SelectOption[]` for the `Select`
 * component. Value and label are both the raw option string (options are
 * stored as literal DB values per architecture §5.3).
 */
function toSelectOptions(list: readonly string[]): SelectOption[] {
  return list.map((s) => ({ value: s, label: s }));
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 11: work details entry (5 required fields).
 *
 * `employment_type` and `salary_range` are Select pickers backed by
 * `options.employmentType` and `options.salaryRange`. `job_title`,
 * `employer_name`, and `office_address` are TextInput fields.
 *
 * Inline errors appear only once the user has touched a field.
 * Continue fires `update()` with all five values and advances to page 12.
 */
export function Page11WorkDetailsScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance } = useOnboardingDraft();

  // ── Memoised Select option arrays ───────────────────────────────────────────
  const employmentTypeOptions = useMemo(
    () => toSelectOptions(options.employmentType),
    [],
  );
  const salaryRangeOptions = useMemo(
    () => toSelectOptions(options.salaryRange),
    [],
  );

  // ── Field state ──────────────────────────────────────────────────────────────

  const [employmentType, setEmploymentType] = useState<string | undefined>(undefined);
  const [jobTitle, setJobTitle] = useState('');
  const [employerName, setEmployerName] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [salaryRange, setSalaryRange] = useState<string | undefined>(undefined);

  // Touched flags — errors only render after first interaction with a field.
  const [employmentTypeTouched, setEmploymentTypeTouched] = useState(false);
  const [jobTitleTouched, setJobTitleTouched] = useState(false);
  const [employerNameTouched, setEmployerNameTouched] = useState(false);
  const [officeAddressTouched, setOfficeAddressTouched] = useState(false);
  const [salaryRangeTouched, setSalaryRangeTouched] = useState(false);

  // ── Derived validation ───────────────────────────────────────────────────────

  const employmentTypeValid = employmentType !== undefined && employmentType.length > 0;
  const jobTitleValid = isValidJobTitle(jobTitle);
  const employerNameValid = isValidEmployerName(employerName);
  const officeAddressValid = isValidOfficeAddress(officeAddress);
  const salaryRangeValid = salaryRange !== undefined && salaryRange.length > 0;

  const continueEnabled =
    employmentTypeValid &&
    jobTitleValid &&
    employerNameValid &&
    officeAddressValid &&
    salaryRangeValid;

  // Per-field inline error strings.
  const employmentTypeError: string | undefined =
    employmentTypeTouched && !employmentTypeValid
      ? t('onboarding.work.errors.employmentType.required')
      : undefined;

  const jobTitleError: string | undefined = (() => {
    if (!jobTitleTouched || jobTitle.length === 0) return undefined;
    if (jobTitle.length > JOB_TITLE_MAX_LENGTH) {
      return t('onboarding.work.errors.jobTitle.tooLong');
    }
    // Length is within bounds — check character set.
    if (!isValidJobTitle(jobTitle)) {
      // Leading/trailing whitespace or invalid characters.
      return t('onboarding.work.errors.jobTitle.invalidChars');
    }
    return undefined;
  })();

  const employerNameError: string | undefined = (() => {
    if (!employerNameTouched || employerName.length === 0) return undefined;
    if (employerName.length > EMPLOYER_NAME_MAX_LENGTH) {
      return t('onboarding.work.errors.employerName.tooLong');
    }
    if (!isValidEmployerName(employerName)) {
      return t('onboarding.work.errors.employerName.invalidChars');
    }
    return undefined;
  })();

  const officeAddressError: string | undefined = (() => {
    if (!officeAddressTouched || officeAddress.length === 0) return undefined;
    if (officeAddress.length > OFFICE_ADDRESS_MAX_LENGTH) {
      return t('onboarding.work.errors.officeAddress.tooLong');
    }
    return undefined;
  })();

  const salaryRangeError: string | undefined =
    salaryRangeTouched && !salaryRangeValid
      ? t('onboarding.work.errors.salaryRange.required')
      : undefined;

  // ── Continue handler ─────────────────────────────────────────────────────────

  const handleContinue = useCallback((): void => {
    if (!continueEnabled) return;
    // Non-null assertion is safe: continueEnabled guards all five Select values.
    // `continueEnabled` requires employmentType !== undefined AND salaryRange !== undefined.
    update({
      employment_type: employmentType!,
      job_title: jobTitle,
      employer_name: employerName,
      office_address: officeAddress,
      salary_range: salaryRange!,
    });
    advance(12);
    navigation.navigate('Page12EducationLevelScreen');
  }, [
    continueEnabled,
    employmentType,
    jobTitle,
    employerName,
    officeAddress,
    salaryRange,
    update,
    advance,
    navigation,
  ]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={11} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Heading variant="display.md" color="primary">
          {t('onboarding.work.title')}
        </Heading>

        {/* Employment type */}
        <FormField
          label={t('onboarding.work.employmentType.label')}
          error={employmentTypeError}
          required
        >
          <Select
            options={employmentTypeOptions}
            value={employmentType}
            onChange={(v) => {
              setEmploymentType(v);
              setEmploymentTypeTouched(true);
            }}
            placeholder={t('onboarding.work.employmentType.placeholder')}
            error={!!employmentTypeError}
            accessibilityLabel={t('onboarding.work.employmentType.label')}
          />
        </FormField>

        {/* Job title */}
        <FormField
          label={t('onboarding.work.jobTitle.label')}
          error={jobTitleError}
          required
        >
          <TextInput
            value={jobTitle}
            onChangeText={(text) => {
              setJobTitle(text);
              if (!jobTitleTouched) setJobTitleTouched(true);
            }}
            placeholder={t('onboarding.work.jobTitle.placeholder')}
            maxLength={JOB_TITLE_MAX_LENGTH + 1}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            error={!!jobTitleError}
            accessibilityLabel={t('onboarding.work.jobTitle.label')}
          />
        </FormField>

        {/* Employer name */}
        <FormField
          label={t('onboarding.work.employerName.label')}
          error={employerNameError}
          required
        >
          <TextInput
            value={employerName}
            onChangeText={(text) => {
              setEmployerName(text);
              if (!employerNameTouched) setEmployerNameTouched(true);
            }}
            placeholder={t('onboarding.work.employerName.placeholder')}
            maxLength={EMPLOYER_NAME_MAX_LENGTH + 1}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            error={!!employerNameError}
            accessibilityLabel={t('onboarding.work.employerName.label')}
          />
        </FormField>

        {/* Office address */}
        <FormField
          label={t('onboarding.work.officeAddress.label')}
          error={officeAddressError}
          required
        >
          <TextInput
            value={officeAddress}
            onChangeText={(text) => {
              setOfficeAddress(text);
              if (!officeAddressTouched) setOfficeAddressTouched(true);
            }}
            placeholder={t('onboarding.work.officeAddress.placeholder')}
            maxLength={OFFICE_ADDRESS_MAX_LENGTH + 1}
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
            autoCorrect
            returnKeyType="next"
            error={!!officeAddressError}
            accessibilityLabel={t('onboarding.work.officeAddress.label')}
          />
        </FormField>

        {/* Salary range */}
        <FormField
          label={t('onboarding.work.salaryRange.label')}
          error={salaryRangeError}
          required
        >
          <Select
            options={salaryRangeOptions}
            value={salaryRange}
            onChange={(v) => {
              setSalaryRange(v);
              setSalaryRangeTouched(true);
            }}
            placeholder={t('onboarding.work.salaryRange.placeholder')}
            error={!!salaryRangeError}
            accessibilityLabel={t('onboarding.work.salaryRange.label')}
          />
        </FormField>
      </ScrollView>

      <WizardFooter
        onContinue={handleContinue}
        disabled={!continueEnabled}
      />
    </Screen>
  );
}
