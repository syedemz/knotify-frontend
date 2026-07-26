/**
 * Page 18 — Parents information (4 text fields + 2 pick-ones).
 *
 * Captures:
 * - `fathers_name`   — validated by {@link isValidParentName} (max 40 chars)
 * - `fathers_job`    — validated by {@link isValidParentJob} (max 40 chars)
 * - `father_retired` — pick-one from `options.yesNo` (`"YES"` / `"NO"`)
 * - `mothers_name`   — validated by {@link isValidParentName} (max 40 chars)
 * - `mothers_job`    — validated by {@link isValidParentJob} (max 40 chars)
 * - `mother_retired` — pick-one from `options.yesNo` (`"YES"` / `"NO"`)
 *
 * Continue is disabled until all six fields are valid. On tap, all six are
 * written in a single `update({...})` call and the wizard navigates to
 * `Page19SiblingsScreen`.
 *
 * Back-nav from page 19 re-hydrates all six fields from `draft.fields`.
 *
 * @module features/onboarding/screens/Page18ParentsScreen
 */

import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Column,
  FormField,
  Heading,
  ListRowSelectable,
  Screen,
  Text,
  TextInput,
  WizardFooter,
  WizardHeader,
} from '@/components';
import { t } from '@/labels';
import {
  isValidParentJob,
  isValidParentName,
  MAX_PARENT_JOB_LENGTH,
  MAX_PARENT_NAME_LENGTH,
} from '@/Helper/validationHelper';
import { options } from '@/config/options';
import { useOnboardingDraft } from '../hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page18ParentsScreen'>;

/**
 * The string values that `father_retired` and `mother_retired` accept in the
 * draft and backend (see §17.21 open assumption: backend casing is unvalidated).
 */
type YesNoValue = 'YES' | 'NO';

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 18: parents information.
 *
 * Four text inputs gated by two validators (`isValidParentName`,
 * `isValidParentJob`) and two pick-ones (`father_retired`, `mother_retired`)
 * sourced from `options.yesNo`. All six fields must be valid before Continue
 * is enabled. On Continue, all six are written atomically and the wizard
 * advances to page 19.
 */
export function Page18ParentsScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance, getDraft } = useOnboardingDraft();

  // ── Field state (hydrated from draft on mount for back-nav) ─────────────────

  const [fathersName, setFathersName] = useState('');
  const [fathersNameTouched, setFathersNameTouched] = useState(false);

  const [fathersJob, setFathersJob] = useState('');
  const [fathersJobTouched, setFathersJobTouched] = useState(false);

  const [fatherRetired, setFatherRetired] = useState<YesNoValue | null>(null);

  const [mothersName, setMothersName] = useState('');
  const [mothersNameTouched, setMothersNameTouched] = useState(false);

  const [mothersJob, setMothersJob] = useState('');
  const [mothersJobTouched, setMothersJobTouched] = useState(false);

  const [motherRetired, setMotherRetired] = useState<YesNoValue | null>(null);

  // ── Back-nav re-hydration (AC: back-nav from page 19 restores all six) ──────
  //
  // On mount, if the draft already has values for these fields (i.e. the user
  // previously continued past page 18 and then pressed back from page 19),
  // restore them so the form appears pre-filled. The touched flags are also
  // set so that inline errors would show immediately on an invalid value.

  useEffect(() => {
    const { fields } = getDraft();

    if (fields.fathers_name) {
      setFathersName(fields.fathers_name);
      setFathersNameTouched(true);
    }
    if (fields.fathers_job) {
      setFathersJob(fields.fathers_job);
      setFathersJobTouched(true);
    }
    if (fields.father_retired === 'YES' || fields.father_retired === 'NO') {
      setFatherRetired(fields.father_retired as YesNoValue);
    }
    if (fields.mothers_name) {
      setMothersName(fields.mothers_name);
      setMothersNameTouched(true);
    }
    if (fields.mothers_job) {
      setMothersJob(fields.mothers_job);
      setMothersJobTouched(true);
    }
    if (fields.mother_retired === 'YES' || fields.mother_retired === 'NO') {
      setMotherRetired(fields.mother_retired as YesNoValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived validation ───────────────────────────────────────────────────────

  const fathersNameValid = isValidParentName(fathersName);
  const fathersJobValid = isValidParentJob(fathersJob);
  const mothersNameValid = isValidParentName(mothersName);
  const mothersJobValid = isValidParentJob(mothersJob);

  const continueEnabled =
    fathersNameValid &&
    fathersJobValid &&
    fatherRetired !== null &&
    mothersNameValid &&
    mothersJobValid &&
    motherRetired !== null;

  // ── Inline errors ────────────────────────────────────────────────────────────

  /**
   * Inline error for `fathers_name`. Only shown after the user has typed at
   * least one character. tooLong is checked before invalidCharacters so the
   * more specific length message is shown first.
   */
  const fathersNameError: string | undefined = (() => {
    if (!fathersNameTouched || fathersName.length === 0) return undefined;
    if (fathersName.trim().length > MAX_PARENT_NAME_LENGTH) {
      return t('onboarding.parents.fathersName.errors.tooLong');
    }
    if (!fathersNameValid) {
      return t('onboarding.parents.fathersName.errors.invalidCharacters');
    }
    return undefined;
  })();

  /**
   * Inline error for `fathers_job`. Only shown after the user has typed at
   * least one character.
   */
  const fathersJobError: string | undefined = (() => {
    if (!fathersJobTouched || fathersJob.length === 0) return undefined;
    if (fathersJob.trim().length > MAX_PARENT_JOB_LENGTH) {
      return t('onboarding.parents.fathersJob.errors.tooLong');
    }
    if (!fathersJobValid) {
      return t('onboarding.parents.fathersJob.errors.invalidCharacters');
    }
    return undefined;
  })();

  /**
   * Inline error for `mothers_name`. Only shown after the user has typed at
   * least one character.
   */
  const mothersNameError: string | undefined = (() => {
    if (!mothersNameTouched || mothersName.length === 0) return undefined;
    if (mothersName.trim().length > MAX_PARENT_NAME_LENGTH) {
      return t('onboarding.parents.mothersName.errors.tooLong');
    }
    if (!mothersNameValid) {
      return t('onboarding.parents.mothersName.errors.invalidCharacters');
    }
    return undefined;
  })();

  /**
   * Inline error for `mothers_job`. Only shown after the user has typed at
   * least one character.
   */
  const mothersJobError: string | undefined = (() => {
    if (!mothersJobTouched || mothersJob.length === 0) return undefined;
    if (mothersJob.trim().length > MAX_PARENT_JOB_LENGTH) {
      return t('onboarding.parents.mothersJob.errors.tooLong');
    }
    if (!mothersJobValid) {
      return t('onboarding.parents.mothersJob.errors.invalidCharacters');
    }
    return undefined;
  })();

  // ── Continue handler ─────────────────────────────────────────────────────────

  const handleContinue = useCallback((): void => {
    if (!continueEnabled) return;
    // Single atomic update for all six fields (AC: single update({...}) call).
    update({
      fathers_name: fathersName,
      fathers_job: fathersJob,
      father_retired: fatherRetired as string,
      mothers_name: mothersName,
      mothers_job: mothersJob,
      mother_retired: motherRetired as string,
    });
    advance(19);
    navigation.navigate('Page19SiblingsScreen');
  }, [
    continueEnabled,
    fathersName,
    fathersJob,
    fatherRetired,
    mothersName,
    mothersJob,
    motherRetired,
    update,
    advance,
    navigation,
  ]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={18} onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Heading variant="display.md" color="primary">
          {t('onboarding.parents.title')}
        </Heading>

        {/* ── Father's fields ─────────────────────────────────────────────── */}

        <FormField
          label={t('onboarding.parents.fathersName.label')}
          error={fathersNameError}
          required
        >
          <TextInput
            value={fathersName}
            onChangeText={(text) => {
              setFathersName(text);
              if (!fathersNameTouched) setFathersNameTouched(true);
            }}
            placeholder={t('onboarding.parents.fathersName.placeholder')}
            maxLength={MAX_PARENT_NAME_LENGTH + 1}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            error={!!fathersNameError}
            accessibilityLabel={t('onboarding.parents.fathersName.label')}
          />
        </FormField>

        <FormField
          label={t('onboarding.parents.fathersJob.label')}
          error={fathersJobError}
          required
        >
          <TextInput
            value={fathersJob}
            onChangeText={(text) => {
              setFathersJob(text);
              if (!fathersJobTouched) setFathersJobTouched(true);
            }}
            placeholder={t('onboarding.parents.fathersJob.placeholder')}
            maxLength={MAX_PARENT_JOB_LENGTH + 1}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            error={!!fathersJobError}
            accessibilityLabel={t('onboarding.parents.fathersJob.label')}
          />
        </FormField>

        <Text variant="body.md" color="secondary">
          {t('onboarding.parents.fatherRetired.prompt')}
        </Text>
        <Column gap="sm" paddingY="sm">
          {options.yesNo.map((option) => (
            <ListRowSelectable
              key={`father_retired_${option}`}
              label={option}
              selected={fatherRetired === option}
              onToggle={() => setFatherRetired(option as YesNoValue)}
              control="radio"
            />
          ))}
        </Column>

        {/* ── Mother's fields ─────────────────────────────────────────────── */}

        <FormField
          label={t('onboarding.parents.mothersName.label')}
          error={mothersNameError}
          required
        >
          <TextInput
            value={mothersName}
            onChangeText={(text) => {
              setMothersName(text);
              if (!mothersNameTouched) setMothersNameTouched(true);
            }}
            placeholder={t('onboarding.parents.mothersName.placeholder')}
            maxLength={MAX_PARENT_NAME_LENGTH + 1}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            error={!!mothersNameError}
            accessibilityLabel={t('onboarding.parents.mothersName.label')}
          />
        </FormField>

        <FormField
          label={t('onboarding.parents.mothersJob.label')}
          error={mothersJobError}
          required
        >
          <TextInput
            value={mothersJob}
            onChangeText={(text) => {
              setMothersJob(text);
              if (!mothersJobTouched) setMothersJobTouched(true);
            }}
            placeholder={t('onboarding.parents.mothersJob.placeholder')}
            maxLength={MAX_PARENT_JOB_LENGTH + 1}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            error={!!mothersJobError}
            accessibilityLabel={t('onboarding.parents.mothersJob.label')}
          />
        </FormField>

        <Text variant="body.md" color="secondary">
          {t('onboarding.parents.motherRetired.prompt')}
        </Text>
        <Column gap="sm" paddingY="sm">
          {options.yesNo.map((option) => (
            <ListRowSelectable
              key={`mother_retired_${option}`}
              label={option}
              selected={motherRetired === option}
              onToggle={() => setMotherRetired(option as YesNoValue)}
              control="radio"
            />
          ))}
        </Column>
      </ScrollView>

      <WizardFooter onContinue={handleContinue} disabled={!continueEnabled} />
    </Screen>
  );
}
