/**
 * Page 29 — Phone number entry.
 *
 * Renders a country dial-code prefix chip and a national number `TextInput`.
 * The dial code defaults to the value derived from `draft.fields.resident_country_code`
 * looked up in `src/config/countries.ts`; falls back to `+91` (India) when the
 * lookup fails or `resident_country_code` is absent.
 *
 * The dial-code chip is tappable — pressing it opens a full-screen Modal
 * containing the existing `CountryPicker` so the user can override the
 * detected country without navigating back through onboarding.
 *
 * Continue is gated by `isValidPhone(dialCode, nationalNumber)`. On tap it
 * calls `canonicalizePhone` to produce the E.164 string, writes it to the
 * draft via `update({ phone_number: ... })`, and advances to
 * `Page30FaceVerifyIntroScreen`.
 *
 * **SMS OTP is [Open] per §17.23** — v1 accepts the validated number without
 * requiring a confirmation code.
 *
 * @module features/onboarding/screens/Page29PhoneScreen
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  CountryPicker,
  Heading,
  Modal,
  Screen,
  Text,
  TextInput,
  TouchableArea,
  WizardFooter,
  WizardHeader,
} from '@/components';
import { t } from '@/labels';
import { countries } from '@/config/countries';
import { useOnboardingDraft } from '@/features/onboarding/hooks/useOnboardingDraft';
import { useTheme } from '@/theme';
import type { Theme } from '@/theme/theme';
import { canonicalizePhone, isValidPhone } from '@/Helper/validationHelper';
import type { OnboardingStackParamList } from '@/navigation/types';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Fallback dial code when `resident_country_code` is absent or unmapped. */
const FALLBACK_DIAL_CODE = '+91';

/** Maximum length of the national-number field (digits only). */
const MAX_NATIONAL_NUMBER_LENGTH = 15;

// ── Types ─────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page29PhoneScreen'>;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derives the dial code for a given ISO-2 country code by looking it up in
 * the `countries` list. Returns `FALLBACK_DIAL_CODE` when the lookup fails.
 *
 * @param iso2 - ISO 3166-1 alpha-2 country code, e.g. `'IN'` or `'PK'`.
 * @returns The matched dial code, e.g. `'+91'`, or `FALLBACK_DIAL_CODE`.
 */
function dialCodeFromIso2(iso2: string | undefined | null): string {
  if (iso2 == null || iso2.trim() === '') {
    return FALLBACK_DIAL_CODE;
  }
  const match = countries.find((c) => c.iso2 === iso2.toUpperCase());
  return match?.dialCode ?? FALLBACK_DIAL_CODE;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Onboarding page 29: phone number with libphonenumber-js validation.
 *
 * Derives the default dial code from `draft.fields.resident_country_code`.
 * The user can tap the dial-code chip to open a country picker modal and
 * override the code. Continue writes the validated E.164 number to
 * `draft.phone_number` and advances to `Page30FaceVerifyIntroScreen`.
 */
export function Page29PhoneScreen({ navigation }: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { getDraft, update, advance } = useOnboardingDraft();

  // ── Local state ──────────────────────────────────────────────────────────────

  /** E.164 country calling code prefix currently selected, e.g. `'+91'`. */
  const [dialCode, setDialCode] = useState<string>(FALLBACK_DIAL_CODE);

  /** National subscriber number as typed by the user (digits only). */
  const [nationalNumber, setNationalNumber] = useState<string>('');

  /** Whether the country picker modal is open. */
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);

  // ── Mount-time rehydration ───────────────────────────────────────────────────

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const draft = getDraft();

    // Derive the default dial code from the residence country set on page 15.
    const derivedDialCode = dialCodeFromIso2(draft.fields.resident_country_code);
    setDialCode(derivedDialCode);

    // Rehydrate the previously-entered national number when revisiting.
    // Restore only the numeric portion — strip the dial code prefix from E.164.
    if (draft.phone_number != null) {
      const e164 = draft.phone_number;
      // E.164 = dialCode + nationalNumber. Strip the leading dial code to
      // recover the national number stored in local state.
      if (e164.startsWith(derivedDialCode)) {
        setNationalNumber(e164.slice(derivedDialCode.length));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  /**
   * Handles a tap on the dial-code chip.
   * Opens the country picker modal.
   */
  const handleDialCodePress = useCallback((): void => {
    setPickerVisible(true);
  }, []);

  /**
   * Handles a country selection from the picker modal.
   *
   * Updates `dialCode` to the selected country's calling code and closes the
   * modal. Clears the national number so an incompatible number isn't
   * silently considered valid for the new country.
   *
   * @param _name - The country display name (unused here — only dial code needed).
   * @param iso2  - The ISO 3166-1 alpha-2 code used to look up the dial code.
   */
  const handleCountrySelect = useCallback(
    (_name: string, iso2: string): void => {
      const selected = countries.find((c) => c.iso2 === iso2);
      if (selected != null) {
        setDialCode(selected.dialCode);
        setNationalNumber('');
      }
      setPickerVisible(false);
    },
    [],
  );

  /**
   * Handles changes to the national number text input.
   * Strips any non-digit characters before storing.
   *
   * @param text - Raw text from the TextInput.
   */
  const handleNumberChange = useCallback((text: string): void => {
    // Allow digits only — the input has keyboardType='number-pad' but Android
    // paste can still introduce non-digit chars.
    setNationalNumber(text.replace(/\D/g, ''));
  }, []);

  /**
   * Handles a Continue tap.
   *
   * Writes the E.164 phone number to the draft and advances to page 30.
   * Called only when the Continue button is enabled (i.e. `isValidPhone` is
   * true), so `canonicalizePhone` is guaranteed to return a non-null string.
   */
  const handleContinue = useCallback((): void => {
    const e164 = canonicalizePhone(dialCode, nationalNumber);
    // e164 is guaranteed non-null here: Continue is enabled only when isValidPhone
    // returns true, and canonicalizePhone shares the same underlying parse call.
    if (e164 === null) {
      return;
    }
    update({ phone_number: e164 });
    advance(30);
    navigation.navigate('Page30FaceVerifyIntroScreen');
  }, [dialCode, nationalNumber, update, advance, navigation]);

  // ── Derived values ───────────────────────────────────────────────────────────

  const valid = isValidPhone(dialCode, nationalNumber);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={29} onBack={() => navigation.goBack()} />

      <Heading variant="display.md" color="primary">
        {t('onboarding.phone.title')}
      </Heading>

      <View style={styles.subtitleSpacer} />

      <Text variant="body.md" color="secondary">
        {t('onboarding.phone.subtitle')}
      </Text>

      <View style={styles.inputRow}>
        {/* Dial-code chip */}
        <TouchableArea
          onPress={handleDialCodePress}
          accessibilityLabel={t('onboarding.phone.dialCodeAccessibility')}
        >
          <View style={styles.dialCodeChip}>
            <Text variant="body.lg" color="primary">
              {dialCode}
            </Text>
          </View>
        </TouchableArea>

        {/* National number input */}
        <View style={styles.numberInputWrapper}>
          <TextInput
            value={nationalNumber}
            onChangeText={handleNumberChange}
            placeholder={t('onboarding.phone.placeholder')}
            keyboardType="number-pad"
            maxLength={MAX_NATIONAL_NUMBER_LENGTH}
            accessibilityLabel={t('onboarding.phone.inputAccessibility')}
          />
        </View>
      </View>

      <WizardFooter
        onContinue={handleContinue}
        disabled={!valid}
        continueLabel={t('onboarding.phone.continueLabel')}
      />

      {/* Country picker modal — reuses the same CountryPicker as page 15. */}
      <Modal
        visible={pickerVisible}
        onDismiss={() => setPickerVisible(false)}
        accessibilityLabel={t('onboarding.phone.changeCountry')}
      >
        <CountryPicker
          countries={countries}
          onSelect={handleCountrySelect}
          selectedIso={null}
          searchPlaceholder={t('onboarding.country.searchPlaceholder')}
          searchAccessibilityLabel={t('onboarding.country.searchPlaceholder')}
        />
      </Modal>
    </Screen>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(theme: Theme) {
  return StyleSheet.create({
    subtitleSpacer: {
      height: theme.spacing.sm,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xxl,
      gap: theme.spacing.sm,
    },
    dialCodeChip: {
      backgroundColor: theme.colors.bg.input,
      borderRadius: theme.radii.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      minWidth: 72,
      alignItems: 'center',
      justifyContent: 'center',
    },
    numberInputWrapper: {
      flex: 1,
    },
  });
}
