/**
 * Unit tests for `src/services/auth/secureStorage.ts`.
 *
 * expo-secure-store is automatically mocked by jest-expo preset.
 * We spy on its methods to verify they are called with the correct keys.
 */

import * as SecureStore from 'expo-secure-store';
import { secureStorage, SecureStorageKey } from '@/services/auth/secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── get / set / del ────────────────────────────────────────────────────

  describe('given get is called with a key', () => {
    it('then calls SecureStore.getItemAsync with the exact key string', async () => {
      jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue('token123');

      const result = await secureStorage.get(SecureStorageKey.accessToken);

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth.accessToken');
      expect(result).toBe('token123');
    });

    it('then returns null when no value is stored', async () => {
      jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue(null);

      const result = await secureStorage.get(SecureStorageKey.refreshToken);

      expect(result).toBeNull();
    });
  });

  describe('given set is called with a key and value', () => {
    it('then calls SecureStore.setItemAsync with the exact key string and value', async () => {
      jest.spyOn(SecureStore, 'setItemAsync').mockResolvedValue();

      await secureStorage.set(SecureStorageKey.idToken, 'my-id-token');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth.idToken', 'my-id-token');
    });
  });

  describe('given del is called with a key', () => {
    it('then calls SecureStore.deleteItemAsync with the exact key string', async () => {
      jest.spyOn(SecureStore, 'deleteItemAsync').mockResolvedValue();

      await secureStorage.del(SecureStorageKey.onboardingDraft);

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('onboarding.draft');
    });
  });

  // ── clearAuthTokens ────────────────────────────────────────────────────

  describe('given clearAuthTokens is called', () => {
    it('then deletes access, refresh, and id tokens', async () => {
      jest.spyOn(SecureStore, 'deleteItemAsync').mockResolvedValue();

      await secureStorage.clearAuthTokens();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth.accessToken');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth.refreshToken');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth.idToken');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(3);
    });

    it('then does NOT delete the onboarding draft', async () => {
      jest.spyOn(SecureStore, 'deleteItemAsync').mockResolvedValue();

      await secureStorage.clearAuthTokens();

      expect(SecureStore.deleteItemAsync).not.toHaveBeenCalledWith('onboarding.draft');
    });
  });

  // ── Typed convenience accessors ────────────────────────────────────────

  describe('given getAccessToken is called', () => {
    it('then reads from auth.accessToken key', async () => {
      jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue('access-abc');

      const result = await secureStorage.getAccessToken();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth.accessToken');
      expect(result).toBe('access-abc');
    });
  });

  describe('given setAccessToken is called', () => {
    it('then writes to auth.accessToken key', async () => {
      jest.spyOn(SecureStore, 'setItemAsync').mockResolvedValue();

      await secureStorage.setAccessToken('new-access');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth.accessToken', 'new-access');
    });
  });

  describe('given getRefreshToken is called', () => {
    it('then reads from auth.refreshToken key', async () => {
      jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue('refresh-xyz');

      const result = await secureStorage.getRefreshToken();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth.refreshToken');
      expect(result).toBe('refresh-xyz');
    });
  });

  describe('given setRefreshToken is called', () => {
    it('then writes to auth.refreshToken key', async () => {
      jest.spyOn(SecureStore, 'setItemAsync').mockResolvedValue();

      await secureStorage.setRefreshToken('new-refresh');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth.refreshToken', 'new-refresh');
    });
  });

  describe('given getIdToken is called', () => {
    it('then reads from auth.idToken key', async () => {
      jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue('id-tok');

      const result = await secureStorage.getIdToken();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth.idToken');
      expect(result).toBe('id-tok');
    });
  });

  describe('given setIdToken is called', () => {
    it('then writes to auth.idToken key', async () => {
      jest.spyOn(SecureStore, 'setItemAsync').mockResolvedValue();

      await secureStorage.setIdToken('new-id');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth.idToken', 'new-id');
    });
  });

  describe('given getOnboardingDraft is called', () => {
    it('then reads from onboarding.draft key', async () => {
      jest.spyOn(SecureStore, 'getItemAsync').mockResolvedValue('{"page":3}');

      const result = await secureStorage.getOnboardingDraft();

      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('onboarding.draft');
      expect(result).toBe('{"page":3}');
    });
  });

  describe('given setOnboardingDraft is called', () => {
    it('then writes to onboarding.draft key', async () => {
      jest.spyOn(SecureStore, 'setItemAsync').mockResolvedValue();

      await secureStorage.setOnboardingDraft('{"page":5}');

      expect(SecureStore.setItemAsync).toHaveBeenCalledWith('onboarding.draft', '{"page":5}');
    });
  });

  describe('given clearOnboardingDraft is called', () => {
    it('then deletes the onboarding.draft key', async () => {
      jest.spyOn(SecureStore, 'deleteItemAsync').mockResolvedValue();

      await secureStorage.clearOnboardingDraft();

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('onboarding.draft');
    });
  });
});
