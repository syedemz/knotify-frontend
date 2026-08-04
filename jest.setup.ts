/**
 * Jest global setup file — registered in `jest.config.js` under `setupFiles`.
 *
 * `setupFiles` execute before the test framework is installed, so `jest.mock`
 * is NOT available here. Module-level mocks for native packages are handled
 * via the `__mocks__/` directory at the project root:
 *
 * - `__mocks__/react-native-reanimated.js` — stubs Reanimated hooks and
 *   `Animated.*` components so any component that imports
 *   `react-native-reanimated` can render in the Jest/Node environment.
 *   Jest auto-discovers and applies `__mocks__/<package-name>` entries for
 *   node_modules packages without an explicit `jest.mock()` call.
 *
 * This file is intentionally lean — global setup steps that do NOT require
 * the test framework (e.g. environment variable init, polyfills) belong here.
 */

// No global setup steps are required at this time.
// The Reanimated mock lives in __mocks__/react-native-reanimated.js
// and is applied automatically by Jest for all test files.
