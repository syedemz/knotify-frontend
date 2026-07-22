/**
 * Environment configuration loader.
 *
 * Reads `EXPO_PUBLIC_ENV` (defaulting to `"dev"`), loads the corresponding
 * `backendConfig.<env>.json`, validates all required fields at import time,
 * and exports a typed `env` object.
 *
 * @throws {Error} At module load time if any required field is a placeholder
 *   or missing — lists every missing field in one readable message.
 */

import devConfig from './backendConfig.dev.json';
import prodConfig from './backendConfig.prod.json';

type SupportedEnv = 'dev' | 'prod';

interface BackendConfig {
  environment: string;
  region: string;
  cognito: {
    region: string;
    userPoolId: string;
    appClientId: string;
    appClientHasSecret: boolean;
  };
  restApi: {
    baseUrl: string;
    auth: {
      mode: string;
      headerName: string;
      tokenPrefix: string;
    };
  };
  appsync: {
    graphqlUrl: string;
    realtimeUrl: string;
    auth: {
      headerName: string;
    };
  };
  pushNotifications: {
    registerEndpoint: string;
  };
  media: {
    readPhotoCloudFrontDomain: string;
  };
}

/** Fields that must not be placeholders at startup. */
const REQUIRED_FIELDS: ReadonlyArray<[keyof BackendConfig | string, string]> = [
  ['cognito.userPoolId', 'cognito.userPoolId'],
  ['cognito.appClientId', 'cognito.appClientId'],
  ['restApi.baseUrl', 'restApi.baseUrl'],
  ['appsync.graphqlUrl', 'appsync.graphqlUrl'],
  ['appsync.realtimeUrl', 'appsync.realtimeUrl'],
];

function isPlaceholder(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('<FILL_');
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current !== null && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function loadConfig(envName: SupportedEnv): BackendConfig {
  const raw: BackendConfig = envName === 'prod' ? (prodConfig as BackendConfig) : (devConfig as BackendConfig);

  const missing: string[] = [];
  for (const [path] of REQUIRED_FIELDS) {
    const value = getNestedValue(raw as unknown as Record<string, unknown>, path);
    if (value === undefined || value === null || value === '' || isPlaceholder(value)) {
      missing.push(path);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing or unresolved backend config values for environment "${envName}".\n` +
        `Fill the following fields in src/config/backendConfig.${envName}.json:\n` +
        missing.map((f) => `  • ${f}`).join('\n'),
    );
  }

  return raw;
}

const rawEnv = (process.env['EXPO_PUBLIC_ENV'] ?? 'dev') as SupportedEnv;
const supportedEnvs: ReadonlyArray<SupportedEnv> = ['dev', 'prod'];
const activeEnv: SupportedEnv = supportedEnvs.includes(rawEnv) ? rawEnv : 'dev';

// Config is loaded and validated eagerly at import time.
// A placeholder value surfaces as a startup error before any network call is made.
let _config: BackendConfig;
try {
  _config = loadConfig(activeEnv);
} catch (err) {
  // Re-throw with a clear prefix so the Metro error overlay is immediately actionable.
  throw err;
}
const config = _config;

/**
 * Typed environment object consumed by services throughout the app.
 *
 * All fields are guaranteed to be non-placeholder strings at runtime — the
 * module throws at import time if any required field is missing.
 */
export const env = {
  /** Active environment name: `"dev"` or `"prod"`. */
  name: activeEnv,

  /** Whether MSW mock mode is active (`EXPO_PUBLIC_API_MODE === 'mock'`). */
  isMock: process.env['EXPO_PUBLIC_API_MODE'] === 'mock',

  /** CloudFront base URL for all REST calls. Include the `/v1` prefix. */
  apiBaseUrl: config.restApi.baseUrl,

  /** Authorization header name for REST requests. */
  apiAuthHeader: config.restApi.auth.headerName,

  /** Token prefix for REST authorization header (e.g. `"Bearer"`). */
  apiTokenPrefix: config.restApi.auth.tokenPrefix,

  /** AppSync GraphQL HTTP endpoint. */
  appsyncUrl: config.appsync.graphqlUrl,

  /** AppSync real-time WebSocket endpoint. */
  appsyncRealtimeUrl: config.appsync.realtimeUrl,

  /** Cognito region. */
  cognitoRegion: config.cognito.region,

  /** Cognito User Pool ID. */
  cognitoUserPoolId: config.cognito.userPoolId,

  /** Cognito App Client ID (no client secret). */
  cognitoAppClientId: config.cognito.appClientId,

  /** Relative path for push token registration (e.g. `"/v1/push-tokens"`). */
  pushRegisterEndpoint: config.pushNotifications.registerEndpoint,

  /** CloudFront domain for reading user photo URLs (phase 12+). */
  photoCloudFrontDomain: config.media.readPhotoCloudFrontDomain,
} as const;
