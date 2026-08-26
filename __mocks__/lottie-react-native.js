/**
 * Jest mock for `lottie-react-native`.
 *
 * The real package is a native module (LottieView bridges to native Lottie
 * iOS/Android renderers), which cannot run under Jest. This mock renders
 * a plain `<View />` with the same testID + accessibility props so tests
 * can query the placeholder and assert its presence/absence.
 *
 * If a future test needs to assert on the source JSON or specific
 * colorFilters, extend this mock to forward them as data-* props.
 */

const React = require('react');
const { View } = require('react-native');

function LottieView(props) {
  const { testID, accessibilityLabel, style } = props;
  return React.createElement(View, {
    testID,
    accessibilityLabel,
    style,
  });
}

LottieView.displayName = 'LottieView';

module.exports = LottieView;
module.exports.default = LottieView;
