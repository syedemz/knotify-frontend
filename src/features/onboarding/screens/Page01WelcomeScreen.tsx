/**
 * Page 1 — Welcome screen with language toggle sheet.
 *
 * Renders a full-screen background image, the Knotify logo, the app title,
 * and two stacked CTA buttons. A top-left globe icon opens a BottomSheet
 * that lets the user switch between English and Urdu locales.
 *
 * Per architecture §11.2 row 1:
 * - "Continue with email" navigates to Page02EmailScreen.
 * - "Continue with Google" is intentionally a no-op (will be wired in a
 *   future feature).
 *
 * The language sheet delegates the RTL-reload flow entirely to
 * `LanguageProvider.setLocale()` — no Alert is shown here.
 *
 * @module features/onboarding/screens/Page01WelcomeScreen
 */

import React, { useState, useCallback } from "react";
import { Globe } from "lucide-react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  ScreenBackground,
  Box,
  Column,
  Row,
  Spacer,
  Image,
  Icon,
  Heading,
  Text,
  Button,
  BottomSheet,
  TouchableArea,
} from "@/components";
import { t } from "@/labels";
import { images } from "@/config/images";
import { useLocale } from "@/state/i18n/LanguageProvider";
import type { SupportedLocale } from "@/state/i18n/LanguageProvider";
import type { OnboardingStackParamList } from "@/navigation/types";

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  "Page01WelcomeScreen"
>;

/**
 * Page 1 of the onboarding wizard: Welcome screen.
 *
 * Shows the full-screen background image, logo, app name, and sign-in CTAs.
 * A globe icon in the top-left opens a language selection bottom sheet.
 */
export function Page01WelcomeScreen({ navigation }: Props): React.JSX.Element {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { setLocale } = useLocale();

  const openSheet = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
  }, []);

  const handleLocaleSelect = useCallback(
    (locale: SupportedLocale) => {
      setLocale(locale);
      closeSheet();
    },
    [setLocale, closeSheet],
  );

  const handleContinueEmail = useCallback(() => {
    navigation.navigate("Page02EmailScreen");
  }, [navigation]);

  // Intentional no-op per architecture §11.2 row 1 — Google sign-in wired in a future feature.
  const handleContinueGoogle = useCallback(() => {
    // no-op
  }, []);

  return (
    <ScreenBackground source={images.onboarding.background} safe>
      <Column flex>
        {/* Top row: language toggle */}
        <Row paddingX="lg" paddingY="sm">
          <TouchableArea
            onPress={openSheet}
            accessibilityLabel={t("onboarding.language.sheetTitle")}
          >
            <Icon icon={Globe} size="md" color="inverse" />
          </TouchableArea>
        </Row>

        {/* Center: logo + title */}
        <Column flex align="center" justify="center" gap="sm">
          <Image
            source={images.onboarding.logo}
            width={120}
            height={120}
            contentFit="contain"
            accessibilityLabel={t("onboarding.welcome.title")}
          />
          <Heading
            variant="display.md"
            color="inverse"
            align="center"
          >
            {t("onboarding.welcome.title")}
          </Heading>
        </Column>

        {/* Bottom: CTA buttons */}
        <Box paddingX="lg" paddingBottom="xxl">
          <Column gap="md">
            <Button
              label={t("onboarding.welcome.continueEmail")}
              onPress={handleContinueEmail}
              variant="primary"
            />
            <Button
              label={t("onboarding.welcome.continueGoogle")}
              onPress={handleContinueGoogle}
              variant="ghost"
            />
          </Column>
        </Box>
      </Column>

      {/* Language selection bottom sheet */}
      <BottomSheet
        visible={sheetOpen}
        onDismiss={closeSheet}
        snapPoints={["30%"]}
      >
        <Column gap="sm">
          <Text variant="label.lg" color="primary">
            {t("onboarding.language.sheetTitle")}
          </Text>
          <Spacer size="xs" />
          <TouchableArea
            onPress={() => handleLocaleSelect("en")}
            accessibilityLabel={t("onboarding.language.optionEnglish")}
          >
            <Text variant="body.lg" color="primary">
              {t("onboarding.language.optionEnglish")}
            </Text>
          </TouchableArea>
          <TouchableArea
            onPress={() => handleLocaleSelect("ur")}
            accessibilityLabel={t("onboarding.language.optionUrdu")}
          >
            <Text variant="body.lg" color="primary">
              {t("onboarding.language.optionUrdu")}
            </Text>
          </TouchableArea>
        </Column>
      </BottomSheet>
    </ScreenBackground>
  );
}
