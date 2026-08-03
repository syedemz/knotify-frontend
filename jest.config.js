/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@gorhom/.*|lucide-react-native|react-native-vision-camera|vision-camera-face-detector)",
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
    // lucide-react-native ships its main entry as an ESM .mjs file which the
    // Babel/CJS Jest runtime cannot parse. Redirect to the CJS build so every
    // test file that transitively imports a Lucide icon works without an
    // individual jest.mock() call.
    "^lucide-react-native$":
      "<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js",
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
