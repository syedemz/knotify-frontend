import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";
import { t } from "@/labels";
import { Button } from "./Button";

/**
 * Props for the `WizardFooter` component.
 */
export interface WizardFooterProps {
  /**
   * Callback fired when the primary Continue/Next button is pressed.
   */
  onContinue: () => void;
  /**
   * When `true`, the Continue button is non-interactive and renders in its
   * disabled style.
   *
   * @default false
   */
  disabled?: boolean;
  /**
   * When `true`, the Continue button shows a loading indicator and is
   * non-interactive.
   *
   * @default false
   */
  loading?: boolean;
  /**
   * When provided, renders an optional Back button below the Continue button.
   * Set to `undefined` (or omit) to hide the Back button entirely.
   *
   * @default undefined
   */
  onBack?: () => void;
  /**
   * Override label for the primary Continue button.
   *
   * Defaults to `labels.wizard.footer.continue` ("Continue").
   * Pass a custom label when a specific page needs different wording
   * (e.g., "Get started").
   */
  continueLabel?: string;
  /**
   * Padding applied to all sides of the footer container.
   *
   * Maps to a theme spacing token.
   *
   * @default 'lg' (16px — standard screen edge padding)
   */
  padding?: keyof Theme["spacing"];
  /**
   * Vertical gap between the Continue and Back buttons when the Back button
   * is visible.
   *
   * Maps to a theme spacing token.
   *
   * @default 'sm' (8px)
   */
  gap?: keyof Theme["spacing"];
  /**
   * Background color of the footer container.
   *
   * Maps to a key in `theme.colors.bg`.
   *
   * @default 'primary'
   */
  bg?: keyof Theme["colors"]["bg"];
}

/**
 * Wizard chrome footer used across every page in the onboarding wizard.
 *
 * Renders a full-width primary Continue button and an optional ghost Back
 * button. Every user-facing string is sourced from the labels registry so
 * locale switching works automatically.
 *
 * All appearance props are theme-token-keyed — no `style` prop, no raw
 * numeric values.
 *
 * @example
 * ```tsx
 * // Continue only
 * <WizardFooter onContinue={handleNext} disabled={!isValid} />
 *
 * // Continue + Back
 * <WizardFooter
 *   onContinue={handleNext}
 *   onBack={() => navigation.goBack()}
 *   loading={isSaving}
 * />
 *
 * // Custom label
 * <WizardFooter continueLabel="Get started" onContinue={handleNext} />
 * ```
 */
export function WizardFooter({
  onContinue,
  disabled = false,
  loading = false,
  onBack,
  continueLabel,
  padding = "lg",
  gap = "sm",
  bg = "primary",
}: WizardFooterProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, padding, gap, bg),
    [theme, padding, gap, bg],
  );

  const resolvedContinueLabel = continueLabel ?? t("wizard.footer.continue");

  return (
    <View style={styles.container}>
      <Button
        label={resolvedContinueLabel}
        onPress={onContinue}
        disabled={disabled}
        loading={loading}
        variant="primary"
        accessibilityLabel={resolvedContinueLabel}
      />
      {onBack !== undefined && (
        <View style={styles.backWrapper}>
          <Button
            label={t("wizard.footer.back")}
            onPress={onBack}
            variant="ghost"
            accessibilityLabel={t("wizard.footer.back")}
          />
        </View>
      )}
    </View>
  );
}

function createStyles(
  theme: Theme,
  padding: keyof Theme["spacing"],
  gap: keyof Theme["spacing"],
  bg: keyof Theme["colors"]["bg"],
) {
  return StyleSheet.create({
    container: {
      padding: theme.spacing[padding],
      backgroundColor: theme.colors.bg[bg],
    },
    backWrapper: {
      marginTop: theme.spacing[gap],
    },
  });
}
