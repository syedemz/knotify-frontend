/**
 * Jest manual mock for `@react-native-async-storage/async-storage`.
 *
 * Wraps the official async-storage mock shipped under
 * `@react-native-async-storage/async-storage/jest/async-storage-mock.js` and
 * also exposes it as `.default` for consumers that expect an ES-module
 * default export.
 *
 * `@aws-amplify/react-native/src/moduleLoaders/loadAsyncStorage.ts` does
 * `require('@react-native-async-storage/async-storage')?.default` — the
 * official mock has no `.default` property, so that evaluates to `undefined`
 * and Amplify throws "Ensure `@react-native-async-storage/async-storage` is
 * installed and linked." at module-load time. That breaks any test suite
 * whose module graph transitively includes `aws-amplify` (e.g.
 * `AppTabs.test.tsx`, `ExploreHomeScreen.test.tsx`).
 *
 * Wired in via `moduleNameMapper` in `jest.config.js`.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const mock = require('@react-native-async-storage/async-storage/jest/async-storage-mock');

module.exports = mock;
module.exports.default = mock;
