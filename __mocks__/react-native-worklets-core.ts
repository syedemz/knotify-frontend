/**
 * Jest manual mock for `react-native-worklets-core`.
 *
 * The frame-processor worklet runtime is inert in tests — the camera preview
 * is mocked out, so no worklet ever executes. This mock provides just enough
 * surface for module-load to succeed.
 *
 * `Worklets.createRunOnJS(fn)` normally wraps `fn` so it can be invoked from
 * a worklet thread and marshalled back to the JS thread. In tests we return
 * the original function unchanged — callers may still invoke it directly.
 */

export const Worklets = {
  createRunOnJS: <T extends (...args: never[]) => unknown>(fn: T): T => fn,
};
