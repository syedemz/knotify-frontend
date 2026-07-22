import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";
import { t } from "@/labels";
import { IconButton } from "./IconButton";
import { WizardProgress } from "./WizardProgress";
import { ChevronLeft } from "lucide-react-native";

/**
 * Props for the `WizardHeader` component.
 */
export interface WizardHeaderProps {
  /**
   * The current page number forwarded to `WizardProgress`.
   * Required unless `hideProgress` is `true`.
   *
   * @default 1
   */
  currentPage?: number;
  /**
   * When `true`, the progress bar is hidden entirely.
   *
   * Used by pages 1-4 per architecture §6.3 which show the header chrome
   * but suppress the progress indicator during the account-creation flow.
   *
   * @default false
   */
  hideProgress?: boolean;
  /**
   * Callback invoked when the back button is pressed.
   *
   * Typically `navigation.goBack()` supplied by the consuming screen.
   */
  onBack: () => void;
  /**
   * Vertical padding above and below the header row.
   *
   * Maps to a theme spacing token.
   *
   * @default 'sm' (8px)
   */
  paddingY?: keyof Theme["spacing"];
  /**
   * Horizontal padding on the header row.
   *
   * Maps to a theme spacing token.
   *
   * @default 'sm' (8px)
   */
  paddingX?: keyof Theme["spacing"];
  /**
   * Background color of the header.
   *
   * Maps to a key in `theme.colors.bg`.
   *
   * @default 'primary'
   */
  bg?: keyof Theme["colors"]["bg"];
}

/**
 * Wizard chrome header used across every page in the onboarding wizard.
 *
 * Renders a back-navigation button (using `labels.wizard.header.back`) and,
 * unless `hideProgress` is `true`, a `WizardProgress` bar directly beneath
 * the button row.
 *
 * All appearance props are theme-token-keyed — no `style` prop, no raw
 * numeric values.
 *
 * @example
 * ```tsx
 * // Page 1-4 (no progress bar)
 * <WizardHeader hideProgress onBack={() => navigation.goBack()} />
 *
 * // Pages 5-31 (with progress bar)
 * <WizardHeader currentPage={5} onBack={() => navigation.goBack()} />
 * ```
 */
export function WizardHeader({
  currentPage = 1,
  hideProgress = false,
  onBack,
  paddingY = "sm",
  paddingX = "sm",
  bg = "primary",
}: WizardHeaderProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, paddingY, paddingX, bg),
    [theme, paddingY, paddingX, bg],
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <IconButton
          icon={<ChevronLeft size={24} color={theme.colors.text.primary} />}
          onPress={onBack}
          accessibilityLabel={t("wizard.header.back")}
        />
      </View>
      {!hideProgress && (
        <WizardProgress current={currentPage} />
      )}
    </View>
  );
}

function createStyles(
  theme: Theme,
  paddingY: keyof Theme["spacing"],
  paddingX: keyof Theme["spacing"],
  bg: keyof Theme["colors"]["bg"],
) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.bg[bg],
      paddingVertical: theme.spacing[paddingY],
      paddingHorizontal: theme.spacing[paddingX],
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 44,
    },
  });
}
