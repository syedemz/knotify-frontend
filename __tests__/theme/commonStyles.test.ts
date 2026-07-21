/**
 * Tests for src/theme/commonStyles.ts — shared layout fragment factory.
 */

import { createCommonStyles } from "@/theme/commonStyles";
import { lightTheme, darkTheme } from "@/theme/theme";

describe("given createCommonStyles with the light theme, when inspecting the result", () => {
  const styles = createCommonStyles(lightTheme);

  it("then the result has a row style with flexDirection 'row'", () => {
    expect(styles.row).toMatchObject({ flexDirection: "row" });
  });

  it("then the result has a column style with flexDirection 'column'", () => {
    expect(styles.column).toMatchObject({ flexDirection: "column" });
  });

  it("then screenBackground uses the theme bg.primary color", () => {
    expect(styles.screenBackground).toMatchObject({
      backgroundColor: lightTheme.colors.bg.primary,
    });
  });

  it("then card uses the theme bg.surface color and radii.lg border radius", () => {
    expect(styles.card).toMatchObject({
      backgroundColor: lightTheme.colors.bg.surface,
      borderRadius: lightTheme.radii.lg,
    });
  });

  it("then divider has height 1 and uses the theme border.default color", () => {
    expect(styles.divider).toMatchObject({
      height: 1,
      backgroundColor: lightTheme.colors.border.default,
    });
  });
});

describe("given createCommonStyles with the dark theme, when inspecting the result", () => {
  const lightStyles = createCommonStyles(lightTheme);
  const darkStyles = createCommonStyles(darkTheme);

  it("then screenBackground color differs between light and dark themes", () => {
    expect(darkStyles.screenBackground.backgroundColor).not.toBe(
      lightStyles.screenBackground.backgroundColor,
    );
  });

  it("then card backgroundColor differs between light and dark themes", () => {
    expect(darkStyles.card.backgroundColor).not.toBe(
      lightStyles.card.backgroundColor,
    );
  });
});
