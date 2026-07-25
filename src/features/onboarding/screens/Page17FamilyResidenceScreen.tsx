/**
 * Page 17 — Kashmir district picker + family residence address.
 *
 * Renders a pick-one list from `options.kashmirDistricts` (22 entries) and a
 * multiline `TextInput` for `family_residence_address`.
 *
 * Default pre-select semantics (AC 2):
 * On mount, if `kashmir_district` in the draft is `null` or `undefined`, the
 * screen immediately writes `"Srinagar"` to the draft. This keeps the visual
 * "selected" state and the draft value in sync. Back-navigation from the next
 * screen does NOT overwrite whatever the user chose — the mount-write is
 * guarded by the `null`/`undefined` check so it only fires once.
 *
 * Continue is disabled until:
 * - `kashmir_district` is non-null in the draft (always true after mount-write).
 * - `isValidFamilyResidenceAddress(address)` returns true.
 *
 * On Continue, both fields are written to the draft and the wizard advances to
 * `Page18ParentsScreen`.
 *
 * @module features/onboarding/screens/Page17FamilyResidenceScreen
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import {
  Column,
  FormField,
  Heading,
  ListRowSelectable,
  Screen,
  TextInput,
  WizardFooter,
  WizardHeader,
} from '@/components';
import { t } from '@/labels';
import { isValidFamilyResidenceAddress, MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH } from '@/Helper/validationHelper';
import { options } from '@/config/options';
import { useOnboardingDraft } from '../hooks/useOnboardingDraft';
import type { OnboardingStackParamList } from '@/navigation/types';

// ── Types ──────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<OnboardingStackParamList, 'Page17FamilyResidenceScreen'>;

/** The default district written to the draft on mount when no district is set. */
const DEFAULT_DISTRICT = 'Srinagar';

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Onboarding page 17: Kashmir district selector + family home address entry.
 *
 * Displays a scrollable pick-one list of 22 Kashmir districts (from
 * `options.kashmirDistricts`) and a multiline text input for the user's family
 * home address. The district defaults to `"Srinagar"` on first mount; the
 * address has no character-class restriction (mirrors `office_address`) with a
 * 70-character length limit.
 */
export function Page17FamilyResidenceScreen({ navigation }: Props): React.JSX.Element {
  const { update, advance, getDraft } = useOnboardingDraft();
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // ── Keyboard tracking ────────────────────────────────────────────────────────
  //
  // Android targetSdk 36 is edge-to-edge by default, which disables the
  // `adjustResize` window behaviour that would normally push the WizardFooter
  // above the keyboard. Track the keyboard height ourselves and add matching
  // bottom padding to the content wrapper so the footer stays visible.

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ── Local state ──────────────────────────────────────────────────────────────

  /**
   * The currently-selected district, initialised from the draft on mount.
   * Falls back to `DEFAULT_DISTRICT` when the draft has no value (first visit).
   */
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    () => getDraft().fields.district ?? DEFAULT_DISTRICT,
  );

  const [address, setAddress] = useState('');
  const [addressTouched, setAddressTouched] = useState(false);

  // ── Mount-write effect (AC 2) ─────────────────────────────────────────────────
  //
  // On first mount, if the draft has no `kashmir_district`, write the default
  // value so the draft stays in sync with what the row renders. This runs only
  // once (empty dep array) and reads the draft value at that moment — if the
  // user previously chose a district and pressed Back from page 18, the draft
  // already has a value and the guard prevents an overwrite.

  useEffect(() => {
    const draftDistrict = getDraft().fields.district;
    if (draftDistrict === null || draftDistrict === undefined) {
      update({ district: DEFAULT_DISTRICT });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived validation ───────────────────────────────────────────────────────

  const addressValid = isValidFamilyResidenceAddress(address);
  const continueEnabled = selectedDistrict !== null && addressValid;

  /**
   * Inline error for the address field. Rendered only after the user has
   * typed at least one character (touched-flag guard). tooLong is checked
   * first so the user sees "too long" rather than a generic error when the
   * trimmed length exceeds 70.
   */
  const addressError: string | undefined = (() => {
    if (!addressTouched || address.length === 0) return undefined;
    if (address.trim().length > MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH) {
      return t('onboarding.familyResidenceAddress.errors.tooLong');
    }
    if (!isValidFamilyResidenceAddress(address)) {
      return t('onboarding.familyResidenceAddress.errors.tooShort');
    }
    return undefined;
  })();

  // ── District tap handler ──────────────────────────────────────────────────────

  const handleDistrictPress = useCallback(
    (district: string): void => {
      setSelectedDistrict(district);
      update({ district });
    },
    [update],
  );

  // ── Continue handler ──────────────────────────────────────────────────────────

  const handleContinue = useCallback((): void => {
    if (!continueEnabled) return;
    update({
      district: selectedDistrict,
      family_residence_address: address,
    });
    advance(18);
    navigation.navigate('Page18ParentsScreen');
  }, [continueEnabled, selectedDistrict, address, update, advance, navigation]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Screen paddingX="lg">
      <WizardHeader currentPage={17} onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Heading variant="display.md" color="primary">
            {t('onboarding.kashmirDistrict.title')}
          </Heading>

          <Column gap="sm" paddingY="lg">
            {options.kashmirDistricts.map((district) => (
              <ListRowSelectable
                key={district}
                label={district}
                selected={selectedDistrict === district}
                onToggle={() => handleDistrictPress(district)}
                control="radio"
              />
            ))}
          </Column>

          <FormField
            label={t('onboarding.familyResidenceAddress.label')}
            error={addressError}
            required
          >
            <TextInput
              value={address}
              onChangeText={(text) => {
                setAddress(text);
                if (!addressTouched) setAddressTouched(true);
              }}
              onFocus={() => {
                // Delay so the keyboard has time to open before we scroll.
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
              }}
              placeholder={t('onboarding.familyResidenceAddress.placeholder')}
              // maxLength = MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH + 1 so the user can
              // type past the limit and see the "tooLong" inline error rather than
              // a silent hard-stop (mirrors the phase-11 / page-11 pattern).
              maxLength={MAX_FAMILY_RESIDENCE_ADDRESS_LENGTH + 1}
              autoCorrect
              multiline
              numberOfLines={4}
              returnKeyType="default"
              error={!!addressError}
              accessibilityLabel={t('onboarding.familyResidenceAddress.label')}
            />
          </FormField>
        </ScrollView>

        <WizardFooter onContinue={handleContinue} disabled={!continueEnabled} />
      </View>
    </Screen>
  );
}
