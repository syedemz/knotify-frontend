/**
 * SiblingForm — a single-sibling sub-form card used on Page 19.
 *
 * Renders five fields per sibling:
 * - `name`          — free text, validated by {@link isValidName} (max 35 chars)
 * - `gender`        — pick-one from `options.gender`
 * - `sibling_age`   — integer 0–99 (UI label matches DB column; maps to `SiblingDraft.age`)
 * - `marital_status`— pick-one from `options.maritalStatus`
 * - `profession`    — free text, validated by {@link isValidProfession} (max 35 chars)
 *
 * Emits two callbacks on every field change:
 * - `onChange(index, siblingDraft)` — the caller's copy of this sibling's state
 * - `onValidityChange(index, valid)` — `true` when all five fields are valid
 *
 * @module features/onboarding/components/SiblingForm
 */

import React, { useCallback, useEffect, useState } from 'react';

import {
  Column,
  FormField,
  Heading,
  ListRowSelectable,
  Text,
  TextInput,
} from '@/components';
import { t } from '@/labels';
import {
  isValidName,
  isValidProfession,
  MAX_SIBLING_PROFESSION_LENGTH,
} from '@/Helper/validationHelper';
import { options } from '@/config/options';
import type { SiblingDraft } from '../draftSchema';

/** Maximum length of a sibling name field (mirrors `isValidName`). */
const MAX_SIBLING_NAME_LENGTH = 35;

/** Maximum sibling age (inclusive). */
const MAX_SIBLING_AGE = 99;

// ── Types ──────────────────────────────────────────────────────────────────────

/** Props accepted by {@link SiblingForm}. */
interface Props {
  /**
   * Zero-based index of this sibling card within the list.
   * Passed back in `onChange` and `onValidityChange` so the parent can update
   * the correct slot.
   */
  index: number;

  /**
   * Initial values to pre-populate the form with (used for back-nav
   * re-hydration from `draft.siblings`).
   */
  initial?: SiblingDraft;

  /**
   * Called whenever any field changes. Receives the current index and the
   * assembled `SiblingDraft` reflecting the latest field values.
   *
   * @param index   - Zero-based index of this sibling card.
   * @param sibling - The updated sibling draft.
   */
  onChange: (index: number, sibling: SiblingDraft) => void;

  /**
   * Called whenever the aggregate validity of this card changes. `valid` is
   * `true` when all five fields pass their respective validators.
   *
   * @param index - Zero-based index of this sibling card.
   * @param valid - Whether the card is currently fully valid.
   */
  onValidityChange: (index: number, valid: boolean) => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Feature-local sub-form card for a single sibling entry on Page 19.
 *
 * Used inside the Filling state of {@link Page19SiblingsScreen} — one card
 * per sibling, rendered in a `ScrollView`. The card owns its own field state
 * and reports validity + current values to the parent screen via callbacks.
 */
export function SiblingForm({
  index,
  initial,
  onChange,
  onValidityChange,
}: Props): React.JSX.Element {
  // ── Field state ─────────────────────────────────────────────────────────────

  const [name, setName] = useState(initial?.name ?? '');
  const [nameTouched, setNameTouched] = useState(initial !== undefined && initial.name !== '');

  const [gender, setGender] = useState<'Male' | 'Female' | null>(initial?.gender ?? null);

  // Age is stored as a string in the input to allow mid-typing states (e.g. "")
  const [ageText, setAgeText] = useState(
    initial?.age !== null && initial?.age !== undefined ? String(initial.age) : '',
  );
  const [ageTouched, setAgeTouched] = useState(
    initial !== undefined && initial.age !== null,
  );

  const [maritalStatus, setMaritalStatus] = useState<string | null>(
    initial?.maritalStatus ?? null,
  );

  const [profession, setProfession] = useState(initial?.profession ?? '');
  const [professionTouched, setProfessionTouched] = useState(
    initial !== undefined && initial.profession !== null && initial.profession !== '',
  );

  // ── Derived validity ─────────────────────────────────────────────────────────

  const nameValid = isValidName(name);

  const ageNum = parseInt(ageText, 10);
  const ageValid =
    ageText !== '' &&
    Number.isInteger(ageNum) &&
    !isNaN(ageNum) &&
    ageNum >= 0 &&
    ageNum <= MAX_SIBLING_AGE &&
    String(ageNum) === ageText; // ensures no leading zeros or decimal points

  const professionValid = isValidProfession(profession);

  // ── Inline errors ────────────────────────────────────────────────────────────

  const nameError: string | undefined = (() => {
    if (!nameTouched || name.length === 0) return undefined;
    if (name.trim().length > MAX_SIBLING_NAME_LENGTH) {
      return t('siblingForm.name.errors.tooLong');
    }
    if (!nameValid) {
      return t('siblingForm.name.errors.invalidCharacters');
    }
    return undefined;
  })();

  const ageError: string | undefined = (() => {
    if (!ageTouched || ageText.length === 0) return undefined;
    if (!ageValid) {
      return t('siblingForm.siblingAge.errors.invalid');
    }
    return undefined;
  })();

  const professionError: string | undefined = (() => {
    if (!professionTouched || profession.length === 0) return undefined;
    if (profession.trim().length > MAX_SIBLING_PROFESSION_LENGTH) {
      return t('siblingForm.profession.errors.tooLong');
    }
    if (!professionValid) {
      return t('siblingForm.profession.errors.invalidCharacters');
    }
    return undefined;
  })();

  // ── Emit callbacks when state changes ────────────────────────────────────────

  const emit = useCallback(
    (
      nextName: string,
      nextGender: 'Male' | 'Female' | null,
      nextAgeText: string,
      nextMaritalStatus: string | null,
      nextProfession: string,
    ): void => {
      const parsedAge = parseInt(nextAgeText, 10);
      const resolvedAge =
        nextAgeText !== '' &&
        Number.isInteger(parsedAge) &&
        !isNaN(parsedAge) &&
        parsedAge >= 0 &&
        parsedAge <= MAX_SIBLING_AGE &&
        String(parsedAge) === nextAgeText
          ? parsedAge
          : null;

      const sibling: SiblingDraft = {
        name: nextName,
        age: resolvedAge,
        maritalStatus: nextMaritalStatus,
        gender: nextGender,
        profession: nextProfession || null,
      };
      onChange(index, sibling);

      const nextNameValid = isValidName(nextName);
      const nextAgeValid = resolvedAge !== null;
      const nextProfessionValid = isValidProfession(nextProfession);
      const nextAllValid =
        nextNameValid &&
        nextGender !== null &&
        nextAgeValid &&
        nextMaritalStatus !== null &&
        nextProfessionValid;
      onValidityChange(index, nextAllValid);
    },
    [index, onChange, onValidityChange],
  );

  // On initial mount, emit validity for pre-populated cards so the parent
  // knows their state without waiting for a field change.
  useEffect(() => {
    emit(name, gender, ageText, maritalStatus, profession);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleNameChange = useCallback(
    (text: string): void => {
      setName(text);
      if (!nameTouched) setNameTouched(true);
      emit(text, gender, ageText, maritalStatus, profession);
    },
    [nameTouched, gender, ageText, maritalStatus, profession, emit],
  );

  const handleGenderToggle = useCallback(
    (option: string): void => {
      const next = option as 'Male' | 'Female';
      setGender(next);
      emit(name, next, ageText, maritalStatus, profession);
    },
    [name, ageText, maritalStatus, profession, emit],
  );

  const handleAgeChange = useCallback(
    (text: string): void => {
      // Only allow digits (no decimals, no negatives)
      const sanitized = text.replace(/[^0-9]/g, '');
      setAgeText(sanitized);
      if (!ageTouched) setAgeTouched(true);
      emit(name, gender, sanitized, maritalStatus, profession);
    },
    [name, gender, ageTouched, maritalStatus, profession, emit],
  );

  const handleMaritalStatusToggle = useCallback(
    (option: string): void => {
      setMaritalStatus(option);
      emit(name, gender, ageText, option, profession);
    },
    [name, gender, ageText, profession, emit],
  );

  const handleProfessionChange = useCallback(
    (text: string): void => {
      setProfession(text);
      if (!professionTouched) setProfessionTouched(true);
      emit(name, gender, ageText, maritalStatus, text);
    },
    [name, gender, ageText, maritalStatus, professionTouched, emit],
  );

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Column gap="sm" paddingY="md">
      <Heading variant="heading.sm" color="primary">
        {`${t('siblingForm.cardTitle')} ${index + 1}`}
      </Heading>

      {/* ── Name ────────────────────────────────────────────────────────── */}
      <FormField
        label={t('siblingForm.name.label')}
        error={nameError}
        required
      >
        <TextInput
          value={name}
          onChangeText={handleNameChange}
          placeholder={t('siblingForm.name.placeholder')}
          maxLength={MAX_SIBLING_NAME_LENGTH + 1}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="next"
          error={!!nameError}
          accessibilityLabel={`${t('siblingForm.name.label')} ${index + 1}`}
        />
      </FormField>

      {/* ── Gender ──────────────────────────────────────────────────────── */}
      <Text variant="body.md" color="secondary">
        {t('siblingForm.gender.prompt')}
      </Text>
      <Column gap="sm">
        {options.gender.map((option) => (
          <ListRowSelectable
            key={`sibling_${index}_gender_${option}`}
            label={option}
            selected={gender === option}
            onToggle={() => handleGenderToggle(option)}
            control="radio"
            accessibilityLabel={`${option} ${index}`}
          />
        ))}
      </Column>

      {/* ── Age ─────────────────────────────────────────────────────────── */}
      <FormField
        label={t('siblingForm.siblingAge.label')}
        error={ageError}
        required
      >
        <TextInput
          value={ageText}
          onChangeText={handleAgeChange}
          placeholder={t('siblingForm.siblingAge.placeholder')}
          keyboardType="number-pad"
          maxLength={2}
          returnKeyType="next"
          error={!!ageError}
          accessibilityLabel={`${t('siblingForm.siblingAge.label')} ${index + 1}`}
        />
      </FormField>

      {/* ── Marital status ──────────────────────────────────────────────── */}
      <Text variant="body.md" color="secondary">
        {t('siblingForm.maritalStatus.prompt')}
      </Text>
      <Column gap="sm">
        {options.maritalStatus.map((option) => (
          <ListRowSelectable
            key={`sibling_${index}_marital_${option}`}
            label={option}
            selected={maritalStatus === option}
            onToggle={() => handleMaritalStatusToggle(option)}
            control="radio"
            accessibilityLabel={`${option} ${index}`}
          />
        ))}
      </Column>

      {/* ── Profession ──────────────────────────────────────────────────── */}
      <FormField
        label={t('siblingForm.profession.label')}
        error={professionError}
        required
      >
        <TextInput
          value={profession}
          onChangeText={handleProfessionChange}
          placeholder={t('siblingForm.profession.placeholder')}
          maxLength={MAX_SIBLING_PROFESSION_LENGTH + 1}
          autoCapitalize="words"
          autoCorrect={false}
          returnKeyType="done"
          error={!!professionError}
          accessibilityLabel={`${t('siblingForm.profession.label')} ${index + 1}`}
        />
      </FormField>
    </Column>
  );
}
