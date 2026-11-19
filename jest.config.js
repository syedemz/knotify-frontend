/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  // Registered for any future global setup steps. Does NOT call jest.mock —
  // native module mocks are handled via moduleNameMapper (below) and the
  // __mocks__/ directory.
  setupFiles: ["./jest.setup.ts"],
  transformIgnorePatterns: [
    // Jest's default is to NOT transform anything under node_modules. The
    // negative-lookahead group whitelists packages that ship ESM/TS source
    // (or a mix) so Babel runs on them. `aws-amplify` + `@aws-amplify/*` were
    // added 2026-11-19 — `@aws-amplify/core/src/utils/amplifyUuid/index.native.ts`
    // uses `export` syntax which Jest/Babel refused to parse, causing
    // AppTabs.test.tsx and ExploreHomeScreen.test.tsx (both transitively
    // import `aws-amplify` via httpClient/cognitoClient) to fail with
    // "SyntaxError: Unexpected token 'export'" from CI run #110 onwards.
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@gorhom/.*|lucide-react-native|react-native-vision-camera|react-native-vision-camera-face-detector|react-native-worklets-core|aws-amplify|@aws-amplify/.*|uuid)",
  ],
  testMatch: [
    "**/__tests__/**/*.{ts,tsx}",
    "**/?(*.)+(spec|test).{ts,tsx}",
  ],
  // Redirect native modules to test-friendly stubs.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Provide the official in-memory mock for AsyncStorage so any test that
    // transitively imports LanguageProvider does not hit the native NativeModule.
    // Wrapped via __mocks__/async-storage.js so the module also exposes
    // `.default` — aws-amplify's loadAsyncStorage() calls
    // `require('@react-native-async-storage/async-storage')?.default` and
    // throws when `.default` is missing (which it is on the raw mock).
    "^@react-native-async-storage/async-storage$":
      "<rootDir>/__mocks__/async-storage.js",
    // lucide-react-native ships its main entry as an ESM .mjs file which the
    // Babel/CJS Jest runtime cannot parse. Redirect to the CJS build so every
    // test file that transitively imports a Lucide icon works without an
    // individual jest.mock() call.
    "^lucide-react-native$":
      "<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js",
    // react-native-reanimated requires the Worklets native runtime which is
    // unavailable in Jest/Node. Redirect to the project-local manual mock
    // (__mocks__/react-native-reanimated.js) which stubs all hooks and
    // animated components with lightweight React Native equivalents.
    "^react-native-reanimated$":
      "<rootDir>/__mocks__/react-native-reanimated.js",
    // lottie-react-native is a native module that cannot run under Jest.
    // Redirect to the project-local mock that renders a plain View
    // preserving testID + accessibility props for assertion.
    "^lottie-react-native$":
      "<rootDir>/__mocks__/lottie-react-native.js",
    // @react-native-community/netinfo relies on the RNCNetInfo native module
    // and crashes in Jest ("Cannot read properties of undefined (reading
    // 'isInternetReachable')") whenever a test's module graph transitively
    // imports aws-amplify/api-graphql. The project-local mock returns a
    // stable wifi-online fixture and no-op subscribers.
    "^@react-native-community/netinfo$":
      "<rootDir>/__mocks__/netinfo.js",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/theme/index.ts",
    // handlers.ts imports msw/native which is ESM-only and cannot be
    // instrumented by Babel/Jest in the CJS runtime. Coverage for the
    // MSW worker setup is verified by reading the module, not by execution.
    "!src/services/api/mocks/handlers.ts",
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 75,
      functions: 80,
      statements: 80,
    },
  },
};
