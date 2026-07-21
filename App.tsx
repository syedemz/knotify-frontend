import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider } from "@/theme";
import { LanguageProvider } from "@/state/i18n/LanguageProvider";
import { QueryProvider } from "@/state/query/QueryProvider";
import { AuthProvider } from "@/state/auth/AuthProvider";
import { env } from "@/config/env";
import { worker } from "@/services/api/mocks/handlers";

// Start MSW before any component renders so every fetch() call is intercepted.
// Gated by EXPO_PUBLIC_API_MODE=mock — live builds are unaffected.
if (env.isMock) {
  worker.listen({ onUnhandledRequest: "warn" });
}

// Keep the splash screen visible while fonts are loading.
SplashScreen.preventAutoHideAsync();

/**
 * Required Plus Jakarta Sans weights (primary English font).
 * Filenames must exactly match the `fontFamily.primary.*` values in
 * `src/theme/typography.ts`.
 */
const PLUS_JAKARTA_SANS_FONTS = {
  "PlusJakartaSans-Regular": require("./src/assets/fonts/PlusJakartaSans-Regular.ttf"),
  "PlusJakartaSans-Medium": require("./src/assets/fonts/PlusJakartaSans-Medium.ttf"),
  "PlusJakartaSans-SemiBold": require("./src/assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  "PlusJakartaSans-Bold": require("./src/assets/fonts/PlusJakartaSans-Bold.ttf"),
  "PlusJakartaSans-ExtraBold": require("./src/assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
} as const;

/**
 * Required Noto Nastaliq Urdu weights (Urdu script font, SIL OFL).
 * Filenames must exactly match the `fontFamily.urdu.*` values in
 * `src/theme/typography.ts`.
 *
 * The physical .ttf files must be present at `src/assets/fonts/`.
 * Startup fails with a readable error if any file is missing — there is
 * no silent fallback.
 */
const NOTO_NASTALIQ_URDU_FONTS = {
  "NotoNastaliqUrdu-Regular": require("./src/assets/fonts/NotoNastaliqUrdu-Regular.ttf"),
  "NotoNastaliqUrdu-Medium": require("./src/assets/fonts/NotoNastaliqUrdu-Medium.ttf"),
  "NotoNastaliqUrdu-SemiBold": require("./src/assets/fonts/NotoNastaliqUrdu-SemiBold.ttf"),
  "NotoNastaliqUrdu-Bold": require("./src/assets/fonts/NotoNastaliqUrdu-Bold.ttf"),
} as const;

const ALL_FONTS = {
  ...PLUS_JAKARTA_SANS_FONTS,
  ...NOTO_NASTALIQ_URDU_FONTS,
};

/**
 * Root application component.
 *
 * Responsibilities:
 * 1. Load all required fonts (Plus Jakarta Sans + Noto Nastaliq Urdu) before
 *    rendering any UI.
 * 2. Hold the splash screen visible until fonts are ready.
 * 3. Surface a readable error screen if font loading fails instead of falling
 *    back to system fonts silently.
 * 4. Compose providers in the canonical order (§7.2, §7.3, §15.6):
 *      fonts loaded → ThemeProvider → LanguageProvider → QueryProvider →
 *      AuthProvider → RootNavigator (story 1.9)
 */
export default function App() {
  const [fontsLoaded, fontError] = useFonts(ALL_FONTS);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Block render until fonts resolve (success or error).
  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Font loading failed — surface a readable error instead of silently falling
  // back to the system font. This surfaces missing .ttf files at startup.
  if (fontError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Font loading failed</Text>
        <Text style={styles.errorMessage}>
          One or more required font files could not be loaded.{"\n\n"}
          Required files in src/assets/fonts/:{"\n"}
          {Object.keys(ALL_FONTS).join("\n")}{"\n\n"}
          Error: {fontError.message}
        </Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <QueryProvider>
          <AuthProvider>
            {/*
             * TODO(1.9): Mount RootNavigator here once navigation/
             * scaffolding is complete (story 1.9).
             */}
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>knotify — phase 1 scaffold</Text>
              <StatusBar style="auto" />
            </View>
          </AuthProvider>
        </QueryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

// Minimal static styles for the pre-theme error and placeholder screens.
// These intentionally do not use theme tokens because ThemeProvider may not
// be mounted when the error state is reached.
const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFF",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E63946",
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 13,
    color: "#4A4F58",
    textAlign: "center",
    lineHeight: 20,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  placeholderText: {
    fontSize: 16,
    color: "#0E1116",
  },
});
