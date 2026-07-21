/**
 * Language provider — manages the active locale, persists the choice to
 * AsyncStorage, and drives the confirm-then-reload flow for RTL switches.
 *
 * Supported locales: `'en'` (LTR) and `'ur'` (RTL).
 *
 * Defaults to the device locale if it is `'en'` or `'ur'`, else `'en'`.
 *
 * On locale change:
 *   1. Shows a React Native `Alert.alert()` confirm dialog.
 *   2. On "Restart": persists the new locale to AsyncStorage →
 *      `I18nManager.forceRTL(nextIsRTL)` → `Updates.reloadAsync()`.
 *   3. On "Cancel": no-op — the locale state remains unchanged.
 *
 * The module-level `setActiveLocale()` from `@/labels` is called whenever
 * the locale changes so that the non-hook `t()` resolver always returns the
 * correct translation.
 *
 * @module state/i18n/LanguageProvider
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import * as Localization from 'expo-localization';

import { t, setActiveLocale } from '@/labels';

// ── Constants ─────────────────────────────────────────────────────────────────

/** Supported locale codes. */
export type SupportedLocale = 'en' | 'ur';

/** AsyncStorage key for the persisted locale. */
const LOCALE_STORAGE_KEY = 'app.locale';

/** Locales for which RTL layout should be applied. */
const RTL_LOCALES: ReadonlySet<SupportedLocale> = new Set<SupportedLocale>(['ur']);

// ── Context ───────────────────────────────────────────────────────────────────

export interface LanguageContextValue {
  /** The currently active locale. */
  readonly locale: SupportedLocale;
  /**
   * Requests a locale change.
   *
   * If the new locale differs from the current one, shows a confirm dialog.
   * On acceptance: persists the locale to AsyncStorage, calls
   * `I18nManager.forceRTL`, then `Updates.reloadAsync()`.
   * On cancellation: no-op — the current locale remains unchanged.
   *
   * If the new locale equals the current locale, this is a no-op and no
   * dialog is shown.
   *
   * @param nextLocale - The locale code to switch to.
   */
  readonly setLocale: (nextLocale: SupportedLocale) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Derives the default locale from the device's preferred locale list.
 *
 * Returns `'en'` or `'ur'` if the device locale matches one of those ISO
 * 639-1 codes, else returns `'en'` as the safe fallback.
 *
 * @returns The resolved {@link SupportedLocale}.
 */
export function resolveDeviceLocale(): SupportedLocale {
  const deviceLocale =
    Localization.getLocales()[0]?.languageCode ?? 'en';
  if (deviceLocale === 'ur') return 'ur';
  return 'en';
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface LanguageProviderProps {
  /** React subtree that can consume `useLocale()`. */
  readonly children?: React.ReactNode;
  /**
   * Override the initial locale for testing.
   * In production this is derived from AsyncStorage + device locale.
   *
   * @internal
   */
  readonly initialLocaleOverride?: SupportedLocale;
}

/**
 * Provides `{ locale, setLocale }` to the component subtree.
 *
 * On mount it reads the persisted locale from AsyncStorage and falls back to
 * the device locale (or `'en'`). Children are rendered immediately with the
 * default locale while the persisted value loads.
 *
 * Also keeps the module-level `t()` resolver in `@/labels` in sync by
 * calling `setActiveLocale()` whenever the locale state changes.
 *
 * @param props - {@link LanguageProviderProps}
 */
export function LanguageProvider({
  children,
  initialLocaleOverride,
}: LanguageProviderProps): React.JSX.Element {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    const initial = initialLocaleOverride ?? resolveDeviceLocale();
    // Sync the label module immediately so t() is correct even before the
    // first render completes.
    setActiveLocale(initial);
    return initial;
  });

  // On mount: hydrate from AsyncStorage.
  useEffect(() => {
    if (initialLocaleOverride !== undefined) return;

    let cancelled = false;
    const hydrate = async (): Promise<void> => {
      const persisted = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
      if (cancelled) return;
      if (persisted === 'en' || persisted === 'ur') {
        setActiveLocale(persisted);
        setLocaleState(persisted);
      }
    };
    hydrate();
    return () => {
      cancelled = true;
    };
  }, [initialLocaleOverride]);

  const setLocale = useCallback(
    (nextLocale: SupportedLocale): void => {
      if (nextLocale === locale) {
        // Same locale — no dialog, no reload.
        return;
      }

      const nextIsRTL = RTL_LOCALES.has(nextLocale);

      Alert.alert(
        t('language.changeTitle'),
        t('language.changeBody'),
        [
          {
            text: t('language.cancel'),
            style: 'cancel',
            onPress: () => {
              // Cancel: no-op — locale remains unchanged.
            },
          },
          {
            text: t('language.restart'),
            style: 'destructive',
            onPress: () => {
              // Persist first so the locale survives if the user force-quits
              // between the accept tap and the reload completing.
              AsyncStorage.setItem(LOCALE_STORAGE_KEY, nextLocale)
                .then(() => {
                  I18nManager.forceRTL(nextIsRTL);
                  return Updates.reloadAsync();
                })
                .catch(() => {
                  // Storage or reload failure — the app will revert to the
                  // old locale on the next cold boot via the hydration path.
                });
            },
          },
        ],
      );
    },
    [locale],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({ locale, setLocale }),
    [locale, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Returns the active locale and the locale-change trigger.
 *
 * Must be called within a {@link LanguageProvider}.
 *
 * @returns `{ locale, setLocale }` — the active {@link SupportedLocale} and a
 *   function to request a locale change with the confirm-then-reload flow.
 * @throws {Error} When called outside a `LanguageProvider`.
 *
 * @example
 * ```tsx
 * const { locale, setLocale } = useLocale();
 * ```
 */
export function useLocale(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (ctx === undefined) {
    throw new Error('useLocale must be used within LanguageProvider');
  }
  return ctx;
}
