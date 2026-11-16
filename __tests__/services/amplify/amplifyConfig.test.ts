/**
 * Smoke tests for `src/services/amplify/amplifyConfig.ts`.
 *
 * AC 6 (story 16.3):
 *   (a) `ensureAmplifyConfigured()` is idempotent on repeated calls.
 *   (b) The configured Amplify API module reports the expected endpoint +
 *       auth mode (`userPool`).
 *   (c) A jest-mocked GraphQL call issues through the Amplify client
 *       (not raw fetch).
 *
 * Mocking strategy:
 *   - `aws-amplify` is mocked so `Amplify.configure` is a spy — we assert it
 *     is called exactly once regardless of how many times
 *     `ensureAmplifyConfigured()` is invoked.
 *   - `aws-amplify/api` is mocked so `generateClient()` returns a lightweight
 *     stub and we can assert GraphQL calls go through it.
 *   - `@/config/env` is mocked to inject real-looking (non-placeholder) config
 *     values that match what `backendConfig.dev.json` ships with.
 */

// ── Mocks (must precede all imports) ──────────────────────────────────────
// jest.mock is hoisted above imports, so the factory function must not close
// over variables that are only defined after the import block. Use
// jest.fn() inline inside the factory and retrieve the spy via
// jest.mocked / jest.requireMock after the fact.

jest.mock('aws-amplify', () => ({
  Amplify: {
    configure: jest.fn(),
  },
}));

jest.mock('aws-amplify/api', () => ({
  generateClient: jest.fn(() => ({
    graphql: jest.fn(),
  })),
}));

// Provide real-looking env values so the placeholder guard does not fire.
jest.mock('@/config/env', () => ({
  env: {
    isMockAuth: false,
    cognitoUserPoolId: 'eu-central-1_TestPool',
    cognitoAppClientId: 'testclientid123',
    cognitoRegion: 'eu-central-1',
    appsyncUrl:
      'https://26ve3dcqxbh2zgd2hf2ylbn76q.appsync-api.eu-central-1.amazonaws.com/graphql',
    appsyncRealtimeUrl:
      'wss://26ve3dcqxbh2zgd2hf2ylbn76q.appsync-realtime-api.eu-central-1.amazonaws.com/graphql',
  },
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';

import {
  ensureAmplifyConfigured,
  _resetAmplifyConfiguredForTests,
} from '@/services/amplify/amplifyConfig';

import {
  getAppsyncClient,
  _resetAppsyncClientForTests,
} from '@/services/graphql/appsyncClient';

// ── Typed spy accessors ───────────────────────────────────────────────────

const mockConfigure = Amplify.configure as jest.MockedFunction<typeof Amplify.configure>;
// Use jest.Mock (not jest.MockedFunction<typeof generateClient>) to avoid the
// excessive-stack-depth tsc error from V6Client's recursive Prettify types.
const mockGenerateClient = generateClient as jest.Mock<unknown, unknown[]>;

// ── Tests ─────────────────────────────────────────────────────────────────

describe('ensureAmplifyConfigured', () => {
  beforeEach(() => {
    mockConfigure.mockClear();
    mockGenerateClient.mockClear();
    _resetAmplifyConfiguredForTests();
    _resetAppsyncClientForTests();
  });

  // ── AC 6a: idempotency ─────────────────────────────────────────────────

  describe('given called once', () => {
    it('then calls Amplify.configure exactly once', () => {
      ensureAmplifyConfigured();

      expect(mockConfigure).toHaveBeenCalledTimes(1);
    });
  });

  describe('given called multiple times in succession', () => {
    it('then calls Amplify.configure only once (idempotent)', () => {
      ensureAmplifyConfigured();
      ensureAmplifyConfigured();
      ensureAmplifyConfigured();

      expect(mockConfigure).toHaveBeenCalledTimes(1);
    });
  });

  // ── AC 6b: endpoint + auth mode ───────────────────────────────────────

  describe('given called once', () => {
    it('then configures Amplify with the expected AppSync endpoint', () => {
      ensureAmplifyConfigured();

      // Non-null: safe because configure was called once (asserted above).
      const callArg: any = mockConfigure.mock.calls[0]![0];
      expect(callArg.API.GraphQL.endpoint).toBe(
        'https://26ve3dcqxbh2zgd2hf2ylbn76q.appsync-api.eu-central-1.amazonaws.com/graphql',
      );
    });

    it('then configures Amplify with defaultAuthMode "userPool"', () => {
      ensureAmplifyConfigured();

      const callArg: any = mockConfigure.mock.calls[0]![0];
      expect(callArg.API.GraphQL.defaultAuthMode).toBe('userPool');
    });

    it('then configures the Auth Cognito block with userPoolId and userPoolClientId', () => {
      ensureAmplifyConfigured();

      const callArg: any = mockConfigure.mock.calls[0]![0];
      expect(callArg.Auth.Cognito.userPoolId).toBe('eu-central-1_TestPool');
      expect(callArg.Auth.Cognito.userPoolClientId).toBe('testclientid123');
    });

    it('then configures the API GraphQL block with the correct region', () => {
      ensureAmplifyConfigured();

      const callArg: any = mockConfigure.mock.calls[0]![0];
      expect(callArg.API.GraphQL.region).toBe('eu-central-1');
    });
  });

  // ── mock-auth skip ────────────────────────────────────────────────────

  describe('given env.isMockAuth is true', () => {
    it('then skips Amplify.configure entirely', () => {
      // Mutate the mock env object in-place so the already-imported `env`
      // binding inside amplifyConfig.ts sees the new value (same object ref).
      const envModule = require('@/config/env');
      const savedIsMockAuth: boolean = (envModule.env as any).isMockAuth;

      (envModule.env as any).isMockAuth = true;
      _resetAmplifyConfiguredForTests();
      ensureAmplifyConfigured();

      expect(mockConfigure).not.toHaveBeenCalled();

      // Restore so subsequent tests are unaffected.
      (envModule.env as any).isMockAuth = savedIsMockAuth;
    });
  });

  // ── placeholder guard ─────────────────────────────────────────────────

  describe('given appsyncUrl is a placeholder', () => {
    it('then throws a descriptive error', () => {
      const envModule = require('@/config/env');
      const savedUrl: string = (envModule.env as any).appsyncUrl;

      (envModule.env as any).appsyncUrl = '<FILL_APPSYNC_URL>';
      _resetAmplifyConfiguredForTests();

      expect(() => ensureAmplifyConfigured()).toThrow(
        '[amplifyConfig] appsync.graphqlUrl is not configured',
      );

      (envModule.env as any).appsyncUrl = savedUrl;
    });
  });

  describe('given appsyncRealtimeUrl is a placeholder', () => {
    it('then throws a descriptive error', () => {
      const envModule = require('@/config/env');
      const savedUrl: string = (envModule.env as any).appsyncRealtimeUrl;

      (envModule.env as any).appsyncRealtimeUrl = '<FILL_APPSYNC_REALTIME_URL>';
      _resetAmplifyConfiguredForTests();

      expect(() => ensureAmplifyConfigured()).toThrow(
        '[amplifyConfig] appsync.realtimeUrl is not configured',
      );

      (envModule.env as any).appsyncRealtimeUrl = savedUrl;
    });
  });
});

// ── AC 6c: GraphQL calls go through the Amplify client ──────────────────

describe('getAppsyncClient', () => {
  beforeEach(() => {
    mockConfigure.mockClear();
    mockGenerateClient.mockClear();
    _resetAmplifyConfiguredForTests();
    _resetAppsyncClientForTests();
  });

  it('given called, then calls ensureAmplifyConfigured (Amplify.configure invoked once)', () => {
    getAppsyncClient();

    expect(mockConfigure).toHaveBeenCalledTimes(1);
  });

  it('given called multiple times, then generateClient is only called once (singleton)', () => {
    getAppsyncClient();
    getAppsyncClient();
    getAppsyncClient();

    expect(mockGenerateClient).toHaveBeenCalledTimes(1);
  });

  it('given a GraphQL call is made through the returned client, then it goes through the Amplify client not raw fetch', async () => {
    const stubClient = {
      graphql: jest.fn().mockResolvedValue({ data: { listMyRooms: [] } }),
    };
    mockGenerateClient.mockReturnValueOnce(stubClient as any);
    _resetAppsyncClientForTests();

    const client = getAppsyncClient() as any;
    const query = /* GraphQL */ `query ListMyRooms { listMyRooms { roomId } }`;
    const result = await client.graphql({ query });

    expect(stubClient.graphql).toHaveBeenCalledTimes(1);
    expect(stubClient.graphql).toHaveBeenCalledWith({ query });
    expect(result).toEqual({ data: { listMyRooms: [] } });
  });

  it('given called once, then returns a client object (not null)', () => {
    const client = getAppsyncClient();

    expect(client).not.toBeNull();
    expect(client).toBeDefined();
  });

  it('given called twice, then returns the same client instance (cached)', () => {
    const client1 = getAppsyncClient();
    const client2 = getAppsyncClient();

    expect(client1).toBe(client2);
  });
});
