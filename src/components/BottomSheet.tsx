import React, { useCallback, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import GorhomBottomSheet, {
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useTheme } from "@/theme";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];

/**
 * Props for the `BottomSheet` component.
 */
export interface BottomSheetProps {
  /**
   * Whether the sheet is currently visible/open.
   */
  visible: boolean;
  /**
   * Callback fired when the user dismisses the sheet (swipes down or taps
   * the backdrop).
   */
  onDismiss: () => void;
  /**
   * Snap points as percentage strings or absolute pixel values.
   * Passed directly to `@gorhom/bottom-sheet`.
   *
   * @default ['50%']
   */
  snapPoints?: (string | number)[];
  /**
   * Whether to render the drag handle at the top of the sheet.
   *
   * @default true
   */
  showHandle?: boolean;
  /**
   * Internal padding for the sheet content, token key from `theme.spacing`.
   *
   * @default 'lg'
   */
  padding?: SpacingKey;
  /**
   * Accessibility label for the sheet container.
   *
   * @default 'Bottom sheet'
   */
  accessibilityLabel?: string;
  /**
   * Sheet content.
   */
  children: React.ReactNode;
}

/**
 * Draggable bottom sheet following §9.11 from `theme.md`.
 *
 * Wraps `@gorhom/bottom-sheet` with theme-token surface, handle, and padding.
 * Requires `GestureHandlerRootView` at the application root — wired in App.tsx
 * (story 1.9).
 *
 * @example
 * ```tsx
 * <BottomSheet visible={open} onDismiss={() => setOpen(false)} snapPoints={['40%']}>
 *   <Text>Filter options</Text>
 * </BottomSheet>
 * ```
 */
export function BottomSheet({
  visible,
  onDismiss,
  snapPoints = ["50%"],
  showHandle = true,
  padding = "lg",
  accessibilityLabel = "Bottom sheet",
  children,
}: BottomSheetProps) {
  const theme = useTheme();
  const sheetRef = useRef<GorhomBottomSheet>(null);

  const styles = useMemo(
    () => createStyles(theme, padding),
    [theme, padding],
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onDismiss();
      }
    },
    [onDismiss],
  );

  // Open/close imperatively when visibility changes.
  React.useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <GorhomBottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      handleIndicatorStyle={showHandle ? styles.handle : styles.handleHidden}
      backgroundStyle={styles.background}
    >
      <BottomSheetView
        // layout is intentional: gorhom requires a style prop on BottomSheetView
        // for internal layout measurement; this is the documented exception to
        // the no-style-passthrough rule.
        style={styles.content}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </BottomSheetView>
    </GorhomBottomSheet>
  );
}

function createStyles(theme: Theme, padding: SpacingKey) {
  return StyleSheet.create({
    background: {
      backgroundColor: theme.colors.bg.elevated,
      borderTopLeftRadius: theme.radii.xl,
      borderTopRightRadius: theme.radii.xl,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.border.strong,
      borderRadius: theme.radii.pill,
      alignSelf: "center",
      marginTop: theme.spacing.sm,
    },
    handleHidden: {
      width: 0,
      height: 0,
    },
    content: {
      paddingHorizontal: theme.spacing[padding],
      paddingVertical: theme.spacing.xl,
    },
  });
}
