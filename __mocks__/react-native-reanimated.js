/**
 * Jest manual mock for `react-native-reanimated`.
 *
 * Reanimated's native module requires the Worklets runtime which is
 * unavailable in the Jest/Node environment. This file provides lightweight
 * stubs so any component that uses Reanimated APIs (useSharedValue,
 * useAnimatedScrollHandler, withTiming, etc.) can import and render in tests
 * without crashing.
 *
 * Animation behaviour is intentionally NOT tested — worklet-driven transitions
 * belong in device/emulator integration tests. Unit tests assert component
 * structure and interaction only.
 *
 * The module is auto-discovered by Jest when `automock` is off (the default):
 * placing this file in `__mocks__/react-native-reanimated.js` at the project
 * root causes every `import 'react-native-reanimated'` in the test
 * environment to resolve here instead of the real package.
 */

'use strict';

const React = require('react');
const { View, ScrollView } = require('react-native');

// No-op helpers used throughout.
const NOOP = () => {};
const ID = (x) => x;

// Shared value stub — read/write the `.value` property synchronously.
const makeSharedValue = (init) => {
  const sv = { value: init };
  return sv;
};

// makeMutable is the internal API used by module-scope shared values.
const makeMutable = makeSharedValue;

// withTiming / withSpring — return the target value immediately (no
// animation). If a completion callback is passed (third arg), invoke it
// synchronously with `finished = true` so animation-chained state changes
// (runOnJS(setState) inside a withTiming/withSequence callback) actually
// fire in tests.
const withTiming = (value, _config, callback) => {
  if (typeof callback === 'function') callback(true);
  return value;
};
const withSpring = (value, _config, callback) => {
  if (typeof callback === 'function') callback(true);
  return value;
};

// useSharedValue — returns a plain object {value: init} so components can
// read/write .value without a proxy.
const useSharedValue = (init) => makeSharedValue(init);

// useAnimatedStyle — call the factory once synchronously and return the style.
const useAnimatedStyle = (factory) => {
  try { return factory(); } catch { return {}; }
};

// useAnimatedScrollHandler — return a plain object; scroll events are not
// dispatched in the RNTL test environment.
const useAnimatedScrollHandler = () => NOOP;

// useAnimatedRef — stub matching the real hook signature.
const useAnimatedRef = () => ({ current: null });

// useAnimatedProps — call factory and return result.
const useAnimatedProps = (factory) => {
  try { return factory(); } catch { return {}; }
};

// Animated.ScrollView — render as a plain React Native ScrollView so RNTL
// can traverse children, fire fireEvent.scroll, etc.
const AnimatedScrollView = React.forwardRef(function AnimatedScrollView(props, ref) {
  return React.createElement(ScrollView, { ...props, ref });
});

// Animated.View — render as a plain View.
const AnimatedView = React.forwardRef(function AnimatedView(props, ref) {
  return React.createElement(View, { ...props, ref });
});

// createAnimatedComponent — wrap as a plain component passthrough.
const createAnimatedComponent = (Component) => {
  const Wrapped = React.forwardRef(function Wrapped(props, ref) {
    return React.createElement(Component, { ...props, ref });
  });
  Wrapped.displayName = `Animated(${Component.displayName || Component.name || 'Component'})`;
  return Wrapped;
};

const Animated = {
  View: AnimatedView,
  ScrollView: AnimatedScrollView,
  Text: require('react-native').Text,
  Image: require('react-native').Image,
  FlatList: require('react-native').FlatList,
  createAnimatedComponent,
  call: NOOP,
  event: NOOP,
  timing: NOOP,
  spring: NOOP,
  sequence: NOOP,
  parallel: NOOP,
  delay: NOOP,
  loop: NOOP,
  Value: class {
    constructor(val) { this._value = val; }
    setValue(v) { this._value = v; }
    getValue() { return this._value; }
    addListener() { return { remove: NOOP }; }
    removeAllListeners() {}
    interpolate() { return this; }
  },
  // @gorhom/bottom-sheet calls these on the Reanimated default export at
  // module-load time to whitelist animated props on native views.
  addWhitelistedUIProps: NOOP,
  addWhitelistedNativeProps: NOOP,
};

// Mark as ES module so Babel's `import Animated from '...'` receives
// `module.exports.default` (the Animated namespace) rather than the entire
// exports object. Without this flag, `Animated.ScrollView` resolves to
// undefined inside test files that use named ES import syntax.
module.exports = {
  __esModule: true,
  default: Animated,
  Animated,

  // Hooks
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedRef,
  useAnimatedProps,

  // Component factory
  createAnimatedComponent,

  // Animation builders (return target value synchronously)
  withTiming,
  withSpring,
  withDelay: (_delay, anim) => anim,
  withRepeat: (anim) => anim,
  withSequence: (...anims) => anims[anims.length - 1],
  cancelAnimation: NOOP,

  // Shared value factories
  useSharedValue,
  makeMutable,

  // Interpolation
  interpolate: (_value, _inputRange, outputRange) => outputRange[0],
  interpolateColor: (_value, _inputRange, outputRange) => outputRange[0],
  Extrapolation: { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' },

  // Easing
  Easing: {
    linear: ID,
    ease: ID,
    quad: ID,
    cubic: ID,
    poly: () => ID,
    sin: ID,
    circle: ID,
    exp: ID,
    elastic: () => ID,
    back: () => ID,
    bounce: ID,
    bezier: () => ID,
    in: ID,
    out: ID,
    inOut: ID,
  },

  // runOnJS / runOnUI — in tests both just invoke the function immediately.
  runOnJS: (fn) => fn,
  runOnUI: (fn) => fn,

  // FadeIn / FadeOut / other layout animations — no-op stubs.
  FadeIn: { duration: () => ({ withInitialValues: () => ({}) }) },
  FadeOut: { duration: () => ({}) },
  Layout: { duration: () => ({}) },
  ZoomIn: { duration: () => ({}) },
  ZoomOut: { duration: () => ({}) },
  SlideInDown: { duration: () => ({}) },
  SlideOutDown: { duration: () => ({}) },
  SlideInUp: { duration: () => ({}) },
  SlideOutUp: { duration: () => ({}) },

  // Misc stubs
  useReducedMotion: () => false,
  setUpTests: NOOP,
  getAnimatedStyle: ID,

  // @gorhom/bottom-sheet calls this at module-load to whitelist Reanimated
  // props on native views. No-op in tests.
  addWhitelistedUIProps: NOOP,
  addWhitelistedNativeProps: NOOP,
};
