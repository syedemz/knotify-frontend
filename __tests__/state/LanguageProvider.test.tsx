/**
 * Unit tests for src/state/i18n/LanguageProvider.tsx
 *
 * Acceptance criteria covered (story 1.8):
 * - confirm-accept path: forceRTL + reloadAsync called in order.
 * - confirm-cancel path: neither called; locale unchanged.
 * - same-locale early-return: no Alert shown.
 * - resolveDeviceLocale() returns 'en' or 'ur' from device locale list.
 * - useLocale() throws when called outside LanguageProvider.
 *
 * Mocks:
 * - `expo-updates`   → mocked; `reloadAsync` is a jest.fn().
 * - `react-native`   → `Alert.alert` and `I18nManager.forceRTL` are spied on.
 * - `@react-native-async-storage/async-storage` → mocked.
 * - `expo-localization` → mocked to control device locale.
 */

import React from "react";
import { Alert, I18nManager } from "react-native";
import { renderHook, act } from "@testing-library/react-native";

// ── expo-updates mock ──────────────────────────────────────────────────────

const mockReloadAsync = jest.fn<Promise<void>, []>(() => Promise.resolve());
jest.mock("expo-updates", () => ({
  reloadAsync: (...args: unknown[]) => mockReloadAsync(...(args as [])),
}));

// ── AsyncStorage mock ──────────────────────────────────────────────────────

const mockGetItem = jest.fn<Promise<string | null>, [string]>(() =>
  Promise.resolve(null),
);
const mockSetItem = jest.fn<Promise<void>, [string, string]>(() =>
  Promise.resolve(),
);
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: (...args: unknown[]) => mockGetItem(...(args as [string])),
    setItem: (...args: unknown[]) => mockSetItem(...(args as [string, string])),
  },
}));

// ── expo-localization mock ─────────────────────────────────────────────────

const mockGetLocales = jest.fn(() => [{ languageCode: "en" }]);
jest.mock("expo-localization", () => ({
  getLocales: () => mockGetLocales(),
}));

// ── @/labels mock — avoid real label files in unit tests ──────────────────

jest.mock("@/labels", () => ({
  t: (key: string) => key,
  setActiveLocale: jest.fn(),
  getActiveLocale: jest.fn(() => "en"),
}));

// ── Import under test (after mocks are declared) ───────────────────────────

import {
  LanguageProvider,
  useLocale,
  resolveDeviceLocale,
} from "@/state/i18n/LanguageProvider";

// ── Helpers ────────────────────────────────────────────────────────────────

function makeWrapper(initialLocaleOverride?: "en" | "ur") {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      LanguageProvider,
      { initialLocaleOverride },
      children,
    );
}

/**
 * Captures the `Alert.alert` buttons from the most recent call and returns
 * a helper for simulating button presses.
 */
function getAlertButtons() {
  const alertSpy = jest.spyOn(Alert, "alert");
  const callArgs = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
  if (!callArgs) throw new Error("Alert.alert was not called");
  const buttons = callArgs[2] ?? [];
  return {
    pressCancel: () => {
      const btn = buttons.find((b) => b.style === "cancel");
      btn?.onPress?.();
    },
    pressRestart: async () => {
      const btn = buttons.find((b) => b.style === "destructive");
      btn?.onPress?.();
      // Flush the promise chain inside onPress.
      await act(async () => {
        await Promise.resolve();
      });
    },
  };
}

// ── Setup / teardown ───────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  jest.spyOn(I18nManager, "forceRTL").mockImplementation(() => undefined);
});

// ── resolveDeviceLocale ────────────────────────────────────────────────────

describe("resolveDeviceLocale", () => {
  it("given device languageCode is 'en', when resolving, then returns 'en'", () => {
    mockGetLocales.mockReturnValueOnce([{ languageCode: "en" }]);
    expect(resolveDeviceLocale()).toBe("en");
  });

  it("given device languageCode is 'ur', when resolving, then returns 'ur'", () => {
    mockGetLocales.mockReturnValueOnce([{ languageCode: "ur" }]);
    expect(resolveDeviceLocale()).toBe("ur");
  });

  it("given device languageCode is 'fr' (unsupported), when resolving, then returns 'en'", () => {
    mockGetLocales.mockReturnValueOnce([{ languageCode: "fr" }]);
    expect(resolveDeviceLocale()).toBe("en");
  });

  it("given an empty locales list, when resolving, then returns 'en'", () => {
    mockGetLocales.mockReturnValueOnce([]);
    expect(resolveDeviceLocale()).toBe("en");
  });
});

// ── useLocale — outside provider ───────────────────────────────────────────

describe("useLocale", () => {
  it("given no LanguageProvider, when useLocale is called, then throws", () => {
    // Suppress expected error output from React.
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => renderHook(() => useLocale())).toThrow(
      "useLocale must be used within LanguageProvider",
    );
    consoleSpy.mockRestore();
  });
});

// ── setLocale — same-locale early-return ──────────────────────────────────

describe("setLocale same-locale early-return", () => {
  it("given locale is already 'en', when setLocale('en') is called, then Alert.alert is NOT shown", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { result } = renderHook(() => useLocale(), {
      wrapper: makeWrapper("en"),
    });

    act(() => {
      result.current.setLocale("en");
    });

    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("given locale is already 'ur', when setLocale('ur') is called, then Alert.alert is NOT shown", () => {
    const alertSpy = jest.spyOn(Alert, "alert");
    const { result } = renderHook(() => useLocale(), {
      wrapper: makeWrapper("ur"),
    });

    act(() => {
      result.current.setLocale("ur");
    });

    expect(alertSpy).not.toHaveBeenCalled();
  });
});

// ── setLocale — confirm-cancel path ───────────────────────────────────────

describe("setLocale confirm-cancel path", () => {
  it("given locale is 'en' and user cancels the dialog, then I18nManager.forceRTL is NOT called", async () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: makeWrapper("en"),
    });

    act(() => {
      result.current.setLocale("ur");
    });

    const { pressCancel } = getAlertButtons();
    await act(async () => {
      pressCancel();
    });

    expect(I18nManager.forceRTL).not.toHaveBeenCalled();
  });

  it("given locale is 'en' and user cancels the dialog, then reloadAsync is NOT called", async () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: makeWrapper("en"),
    });

    act(() => {
      result.current.setLocale("ur");
    });

    const { pressCancel } = getAlertButtons();
    await act(async () => {
      pressCancel();
    });

    expect(mockReloadAsync).not.toHaveBeenCalled();
  });

  it("given locale is 'en' and user cancels, then the locale state remains 'en'", async () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: makeWrapper("en"),
    });

    act(() => {
      result.current.setLocale("ur");
    });

    const { pressCancel } = getAlertButtons();
    await act(async () => {
      pressCancel();
    });

    expect(result.current.locale).toBe("en");
  });
});

// ── setLocale — confirm-accept path ───────────────────────────────────────

describe("setLocale confirm-accept path", () => {
  it("given locale is 'en' and user confirms restart, then AsyncStorage.setItem is called before forceRTL", async () => {
    const callOrder: string[] = [];
    mockSetItem.mockImplementation(async () => {
      callOrder.push("setItem");
    });
    jest.spyOn(I18nManager, "forceRTL").mockImplementation(() => {
      callOrder.push("forceRTL");
    });
    mockReloadAsync.mockImplementation(async () => {
      callOrder.push("reloadAsync");
    });

    const { result } = renderHook(() => useLocale(), {
      wrapper: makeWrapper("en"),
    });

    act(() => {
      result.current.setLocale("ur");
    });

    const { pressRestart } = getAlertButtons();
    await pressRestart();

    expect(callOrder[0]).toBe("setItem");
    expect(callOrder[1]).toBe("forceRTL");
    expect(callOrder[2]).toBe("reloadAsync");
  });

  it("given locale is 'en' and user confirms restart to 'ur', then I18nManager.forceRTL(true) is called", async () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: makeWrapper("en"),
    });

    act(() => {
      result.current.setLocale("ur");
    });

    const { pressRestart } = getAlertButtons();
    await pressRestart();

    expect(I18nManager.forceRTL).toHaveBeenCalledWith(true);
  });

  it("given locale is 'ur' and user confirms restart to 'en', then I18nManager.forceRTL(false) is called", async () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: makeWrapper("ur"),
    });

    act(() => {
      result.current.setLocale("en");
    });

    const { pressRestart } = getAlertButtons();
    await pressRestart();

    expect(I18nManager.forceRTL).toHaveBeenCalledWith(false);
  });

  it("given locale is 'en' and user confirms restart, then reloadAsync is called", async () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: makeWrapper("en"),
    });

    act(() => {
      result.current.setLocale("ur");
    });

    const { pressRestart } = getAlertButtons();
    await pressRestart();

    expect(mockReloadAsync).toHaveBeenCalledTimes(1);
  });

  it("given locale is 'en' and user confirms restart, then persists 'ur' to AsyncStorage", async () => {
    const { result } = renderHook(() => useLocale(), {
      wrapper: makeWrapper("en"),
    });

    act(() => {
      result.current.setLocale("ur");
    });

    const { pressRestart } = getAlertButtons();
    await pressRestart();

    expect(mockSetItem).toHaveBeenCalledWith("app.locale", "ur");
  });
});
