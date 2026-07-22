import React, { useMemo } from "react";
import {
  Modal as RNModal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];

/**
 * Props for the `Modal` component.
 */
export interface ModalProps {
  /**
   * Whether the modal is currently visible.
   */
  visible: boolean;
  /**
   * Callback fired when the backdrop is pressed or the modal should close.
   */
  onDismiss: () => void;
  /**
   * Internal padding for the modal surface, token key from `theme.spacing`.
   *
   * @default 'lg'
   */
  padding?: SpacingKey;
  /**
   * Accessibility label for the modal surface.
   *
   * @default 'Dialog'
   */
  accessibilityLabel?: string;
  /**
   * Modal content.
   */
  children: React.ReactNode;
}

/**
 * General-purpose full-screen overlay following §9.11 from `theme.md`.
 *
 * Wraps React Native's `Modal` with theme-token surface and backdrop. Use
 * this component for confirmation dialogs and detail sheets. NOT for the
 * language-change confirm-then-reload flow — that story (1.8) uses
 * `Alert.alert()` per the PRD.
 *
 * @example
 * ```tsx
 * <Modal visible={showConfirm} onDismiss={() => setShowConfirm(false)}>
 *   <Text>Are you sure?</Text>
 *   <Button label="Confirm" onPress={handleConfirm} />
 * </Modal>
 * ```
 */
export function Modal({
  visible,
  onDismiss,
  padding = "lg",
  accessibilityLabel = "Dialog",
  children,
}: ModalProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, padding),
    [theme, padding],
  );

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      accessibilityLabel={accessibilityLabel}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Close dialog"
      >
        {/* Inner Pressable prevents backdrop tap from propagating through the surface */}
        <Pressable
          style={styles.surface}
          accessibilityLabel={accessibilityLabel}
        >
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

function createStyles(theme: Theme, padding: SpacingKey) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.lg,
    },
    surface: {
      backgroundColor: theme.colors.bg.elevated,
      borderRadius: theme.radii.xl,
      padding: theme.spacing[padding],
      width: "100%",
      ...theme.shadows.lg,
    },
  });
}
