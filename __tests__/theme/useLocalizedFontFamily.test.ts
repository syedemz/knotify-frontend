/**
 * Tests for src/theme/useLocalizedFontFamily.ts
 *
 * After story 1.8, `useLocalizedFontFamily` reads the active locale from the
 * module-level store in `@/labels` (updated by `LanguageProvider` via
 * `setActiveLocale()`). Tests exercise both the pure `selectFontFamily` helper
 * and the hook via the `setActiveLocale` → hook path.
 */

import { renderHook } from "@testing-library/react-native";
import { useLocalizedFontFamily, selectFontFamily } from "@/theme/useLocalizedFontFamily";
import { fontFamily } from "@/theme/typography";
import { setActiveLocale, getActiveLocale } from "@/labels";

// ── selectFontFamily (pure helper) ────────────────────────────────────────

describe("given selectFontFamily helper, when locale is 'en'", () => {
  it("then it returns fontFamily.primary", () => {
    expect(selectFontFamily("en")).toEqual(fontFamily.primary);
  });
});

describe("given selectFontFamily helper, when locale is 'ur'", () => {
  it("then it returns fontFamily.urdu", () => {
    expect(selectFontFamily("ur")).toEqual(fontFamily.urdu);
  });

  it("then the regular weight is 'NotoNastaliqUrdu-Regular'", () => {
    const result = selectFontFamily("ur");
    expect(result.regular).toBe("NotoNastaliqUrdu-Regular");
  });
});

// ── useLocalizedFontFamily — driven by setActiveLocale ────────────────────

describe("given useLocalizedFontFamily with locale 'en' (via setActiveLocale)", () => {
  beforeEach(() => {
    setActiveLocale("en");
  });

  it("then getActiveLocale() returns 'en'", () => {
    expect(getActiveLocale()).toBe("en");
  });

  it("then it returns the primary (Plus Jakarta Sans) font family", () => {
    const { result } = renderHook(() => useLocalizedFontFamily());
    expect(result.current).toEqual(fontFamily.primary);
  });

  it("then the returned object has regular, medium, semibold, bold keys", () => {
    const { result } = renderHook(() => useLocalizedFontFamily());
    expect(result.current).toHaveProperty("regular");
    expect(result.current).toHaveProperty("medium");
    expect(result.current).toHaveProperty("semibold");
    expect(result.current).toHaveProperty("bold");
  });

  it("then the regular value is the Plus Jakarta Sans regular string", () => {
    const { result } = renderHook(() => useLocalizedFontFamily());
    expect(result.current.regular).toBe("PlusJakartaSans-Regular");
  });

  it("then the return value does NOT equal fontFamily.urdu when locale is en", () => {
    const { result } = renderHook(() => useLocalizedFontFamily());
    expect(result.current).not.toEqual(fontFamily.urdu);
  });
});

describe("given useLocalizedFontFamily with locale 'ur' (via setActiveLocale)", () => {
  beforeEach(() => {
    setActiveLocale("ur");
  });

  afterEach(() => {
    // Restore to 'en' so other tests are not affected by the module-level state.
    setActiveLocale("en");
  });

  it("then it returns fontFamily.urdu", () => {
    const { result } = renderHook(() => useLocalizedFontFamily());
    expect(result.current).toEqual(fontFamily.urdu);
  });

  it("then the regular weight is 'NotoNastaliqUrdu-Regular'", () => {
    const { result } = renderHook(() => useLocalizedFontFamily());
    expect(result.current.regular).toBe("NotoNastaliqUrdu-Regular");
  });
});
