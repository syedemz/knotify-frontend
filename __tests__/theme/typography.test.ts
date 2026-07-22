/**
 * Tests for src/theme/typography.ts — font family registry and text style presets.
 */

import { fontFamily, fontSize, fontWeight, textStyles } from "@/theme/typography";

describe("given the fontFamily registry, when accessing primary weights", () => {
  it("then regular, medium, semibold, bold, and extrabold keys are present", () => {
    expect(fontFamily.primary.regular).toBe("PlusJakartaSans-Regular");
    expect(fontFamily.primary.medium).toBe("PlusJakartaSans-Medium");
    expect(fontFamily.primary.semibold).toBe("PlusJakartaSans-SemiBold");
    expect(fontFamily.primary.bold).toBe("PlusJakartaSans-Bold");
    expect(fontFamily.primary.extrabold).toBe("PlusJakartaSans-ExtraBold");
  });
});

describe("given the fontFamily registry, when accessing urdu weights", () => {
  it("then regular, medium, semibold, and bold keys are present", () => {
    expect(fontFamily.urdu.regular).toBe("NotoNastaliqUrdu-Regular");
    expect(fontFamily.urdu.medium).toBe("NotoNastaliqUrdu-Medium");
    expect(fontFamily.urdu.semibold).toBe("NotoNastaliqUrdu-SemiBold");
    expect(fontFamily.urdu.bold).toBe("NotoNastaliqUrdu-Bold");
  });

  it("then urdu font family strings do not match primary (different font)", () => {
    expect(fontFamily.urdu.regular).not.toBe(fontFamily.primary.regular);
    expect(fontFamily.urdu.bold).not.toBe(fontFamily.primary.bold);
  });
});

describe("given the fontSize scale, when reading values", () => {
  it("then xs through displayLg are all numbers", () => {
    const keys: Array<keyof typeof fontSize> = [
      "xs", "sm", "md", "base", "lg", "xl", "xxl", "xxxl", "display", "displayLg",
    ];
    for (const key of keys) {
      expect(typeof fontSize[key]).toBe("number");
    }
  });
});

describe("given the fontWeight map, when reading values", () => {
  it("then regular through extrabold are valid string weights", () => {
    expect(fontWeight.regular).toBe("400");
    expect(fontWeight.medium).toBe("500");
    expect(fontWeight.semibold).toBe("600");
    expect(fontWeight.bold).toBe("700");
    expect(fontWeight.extrabold).toBe("800");
  });
});

describe("given the textStyles presets, when checking shape", () => {
  it("then display.lg and display.md exist with fontFamily, fontSize, lineHeight", () => {
    expect(textStyles.display.lg).toMatchObject({
      fontFamily: expect.any(String),
      fontSize: expect.any(Number),
      lineHeight: expect.any(Number),
    });
    expect(textStyles.display.md).toMatchObject({
      fontFamily: expect.any(String),
      fontSize: expect.any(Number),
      lineHeight: expect.any(Number),
    });
  });

  it("then heading.xl uses Plus Jakarta Sans Bold (primary)", () => {
    expect(textStyles.heading.xl.fontFamily).toBe(fontFamily.primary.bold);
  });

  it("then body.lg uses Plus Jakarta Sans Regular (primary)", () => {
    expect(textStyles.body.lg.fontFamily).toBe(fontFamily.primary.regular);
  });

  it("then caption has a fontFamily, fontSize, and lineHeight", () => {
    expect(textStyles.caption).toMatchObject({
      fontFamily: expect.any(String),
      fontSize: expect.any(Number),
      lineHeight: expect.any(Number),
    });
  });

  it("then no textStyle preset contains a hex color literal (colors belong in theme.ts)", () => {
    const presetsJson = JSON.stringify(textStyles);
    expect(presetsJson).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});
