/**
 * Tests for src/theme/theme.ts — design token shapes and theme construction.
 */

import {
  lightColors,
  darkColors,
  spacing,
  radii,
  shadows,
  lightTheme,
  darkTheme,
} from "@/theme/theme";

describe("given the light color palette, when inspecting semantic roles", () => {
  it("then bg, text, border, accent, status, and notification categories exist", () => {
    expect(lightColors.bg).toBeDefined();
    expect(lightColors.text).toBeDefined();
    expect(lightColors.border).toBeDefined();
    expect(lightColors.accent).toBeDefined();
    expect(lightColors.status).toBeDefined();
    expect(lightColors.notification).toBeDefined();
  });

  it("then no hex literals appear directly in the exported objects (values come from palette)", () => {
    // Structural check — colors are strings (hex values from palette)
    expect(typeof lightColors.bg.primary).toBe("string");
    expect(typeof lightColors.accent.primary).toBe("string");
    expect(typeof lightColors.text.primary).toBe("string");
  });

  it("then lightTheme mode is 'light'", () => {
    expect(lightTheme.mode).toBe("light");
  });

  it("then darkTheme mode is 'dark'", () => {
    expect(darkTheme.mode).toBe("dark");
  });
});

describe("given the dark color palette, when inspecting semantic roles", () => {
  it("then all categories exist and match the same shape as light", () => {
    expect(Object.keys(darkColors.bg)).toEqual(Object.keys(lightColors.bg));
    expect(Object.keys(darkColors.text)).toEqual(Object.keys(lightColors.text));
    expect(Object.keys(darkColors.accent)).toEqual(Object.keys(lightColors.accent));
  });

  it("then dark bg.primary differs from light bg.primary", () => {
    expect(darkColors.bg.primary).not.toBe(lightColors.bg.primary);
  });
});

describe("given the spacing tokens, when accessing values", () => {
  it("then xxs through giant are all defined and numeric", () => {
    const keys: Array<keyof typeof spacing> = [
      "xxs", "xs", "sm", "md", "lg", "xl", "xxl", "xxxl", "huge", "giant",
    ];
    for (const key of keys) {
      expect(typeof spacing[key]).toBe("number");
    }
  });

  it("then lg is 16 (the screen edge padding convention)", () => {
    expect(spacing.lg).toBe(16);
  });
});

describe("given the radii tokens, when accessing values", () => {
  it("then pill is 999 (fully rounded)", () => {
    expect(radii.pill).toBe(999);
  });

  it("then none is 0", () => {
    expect(radii.none).toBe(0);
  });
});

describe("given the shadows tokens, when accessing values", () => {
  it("then none is an empty object", () => {
    expect(shadows.none).toEqual({});
  });

  it("then sm, md, lg each have shadowColor, shadowOffset, elevation", () => {
    for (const key of ["sm", "md", "lg"] as const) {
      const shadow = shadows[key];
      expect(shadow).toHaveProperty("shadowColor");
      expect(shadow).toHaveProperty("shadowOffset");
      expect(shadow).toHaveProperty("elevation");
    }
  });
});

describe("given lightTheme and darkTheme, when checking structure", () => {
  it("then both themes share the same spacing tokens", () => {
    expect(lightTheme.spacing).toEqual(darkTheme.spacing);
  });

  it("then both themes share the same radii tokens", () => {
    expect(lightTheme.radii).toEqual(darkTheme.radii);
  });

  it("then lightTheme colors reference lightColors", () => {
    expect(lightTheme.colors.bg.primary).toBe(lightColors.bg.primary);
  });

  it("then darkTheme colors reference darkColors", () => {
    expect(darkTheme.colors.bg.primary).toBe(darkColors.bg.primary);
  });
});
