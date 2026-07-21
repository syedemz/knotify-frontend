/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@gorhom/.*|lucide-react-native)",
  ],
  testMatch: [
    "**/__tests__/**/*.{ts,tsx}",
    "**/?(*.)+(spec|test).{ts,tsx}",
  ],
  // Automatically mock native modules that require device APIs unavailable in
  // the Jest environment. Each entry maps the module to its automatic mock.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Provide the official in-memory mock for AsyncStorage so any test that
    // transitively imports LanguageProvider does not hit the native NativeModule.
    "^@react-native-async-storage/async-storage$":
      "@react-native-async-storage/async-storage/jest/async-storage-mock.js",
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
