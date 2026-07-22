import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";
import { textStyles } from "@/theme/typography";
import { Text as RNText } from "react-native";
import type { Theme } from "@/theme/theme";

type SpacingKey = keyof Theme["spacing"];
type BgKey = keyof Theme["colors"]["bg"];

/**
 * Props for the `Section` component.
 */
export interface SectionProps {
  /**
   * Optional section title rendered above the children in `heading.md` style.
   */
  title?: string;
  /**
   * Background color token key from `theme.colors.bg`.
   *
   * @default 'muted'
   */
  bg?: BgKey;
  /**
   * Horizontal padding token key from `theme.spacing`.
   *
   * @default 'lg'
   */
  paddingX?: SpacingKey;
  /**
   * Vertical padding token key from `theme.spacing`.
   *
   * @default 'xl'
   */
  paddingY?: SpacingKey;
  /**
   * Vertical gap between the title and children, token key from `theme.spacing`.
   *
   * @default 'md'
   */
  gap?: SpacingKey;
  /**
   * Accessibility label for the section container.
   */
  accessibilityLabel?: string;
  /**
   * Section content.
   */
  children: React.ReactNode;
}

/**
 * Themed layout section with an optional heading and configurable background.
 *
 * Used to group related content into visually distinct blocks. All appearance
 * values derive from theme tokens — no raw colors or pixel values.
 *
 * @example
 * ```tsx
 * <Section title="About me">
 *   <Text>Some description</Text>
 * </Section>
 *
 * <Section bg="premium" paddingY="xxl">
 *   <Text>Premium features</Text>
 * </Section>
 * ```
 */
export function Section({
  title,
  bg = "muted",
  paddingX = "lg",
  paddingY = "xl",
  gap = "md",
  accessibilityLabel,
  children,
}: SectionProps) {
  const theme = useTheme();
  const styles = useMemo(
    () => createStyles(theme, bg, paddingX, paddingY, gap),
    [theme, bg, paddingX, paddingY, gap],
  );

  return (
    <View
      style={styles.container}
      accessibilityLabel={accessibilityLabel}
    >
      {title !== undefined && (
        <RNText style={styles.title}>{title}</RNText>
      )}
      {children}
    </View>
  );
}

function createStyles(
  theme: Theme,
  bg: BgKey,
  paddingX: SpacingKey,
  paddingY: SpacingKey,
  gap: SpacingKey,
) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.bg[bg],
      paddingHorizontal: theme.spacing[paddingX],
      paddingVertical: theme.spacing[paddingY],
    },
    title: {
      ...textStyles.heading.md,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing[gap],
    },
  });
}
