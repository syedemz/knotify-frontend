/**
 * Tests for src/theme/useLocalizedFontFamily.ts
 *
 * Note: The stub locale defaults to 'en' until LanguageProvider is wired in
 * story 1.8. These tests verify the stub behaviour and the return type shape.
 *
 * The 'ur' branch of the locale guard is exercised via the selectFontFamily
 * helper (exported for testability) to maintain branch coverage without
 * requiring a real LanguageProvider.
 */

import { renderHook } from "@testing-library/react-native";
import { useLocalizedFontFamily, selectFontFamily } from "@/theme/useLocalizedFontFamily";
import { fontFamily } from "@/theme/typography";

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

describe("given useLocalizedFontFamily with stub locale (en)", () => {
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
