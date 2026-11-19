/**
 * Jest manual mock for `@react-native-community/netinfo`.
 *
 * NetInfo relies on the `RNCNetInfo` native module, which does not exist in
 * the Jest/Node environment. Any test whose module graph transitively
 * imports `aws-amplify/api-graphql` (which added NetInfo as a peer dep,
 * see commit c3eba61) hits the native bridge and crashes with
 * "Cannot read properties of undefined (reading 'isInternetReachable')".
 *
 * This mock returns a stable "wifi + online" fixture and no-op subscribers,
 * which is the default state every consumer (including Amplify's
 * reachability probe) is happy with.
 *
 * Wired in via `moduleNameMapper` in `jest.config.js`.
 */

const stableState = {
  type: 'wifi',
  isConnected: true,
  isInternetReachable: true,
  details: {
    isConnectionExpensive: false,
    ssid: null,
    bssid: null,
    strength: null,
    ipAddress: null,
    subnet: null,
    frequency: null,
  },
};

const unsubscribe = () => {};

const NetInfo = {
  fetch: jest.fn(() => Promise.resolve(stableState)),
  refresh: jest.fn(() => Promise.resolve(stableState)),
  addEventListener: jest.fn(() => unsubscribe),
  useNetInfo: jest.fn(() => stableState),
  configure: jest.fn(),
};

module.exports = NetInfo;
module.exports.default = NetInfo;
module.exports.NetInfoStateType = {
  unknown: 'unknown',
  none: 'none',
  cellular: 'cellular',
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  ethernet: 'ethernet',
  wimax: 'wimax',
  vpn: 'vpn',
  other: 'other',
};
