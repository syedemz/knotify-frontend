/**
 * Unit tests for buildShareMessage (story 12.3).
 *
 * AC coverage:
 * (a) Given a fixture profile, returns exact `{ message, url }` shape.
 * (b) URL always takes the form `knotify://profile/<user_id>`.
 * (c) Message always takes the form `Check out <first_name> on Knotify: <url>`.
 * (d) Falls back to `user_id` when `first_name` is null.
 */

import { buildShareMessage } from '@/features/profile/buildShareMessage';
import type { UserProfile } from '@/types/api/UserProfile';

// ── Fixtures ─────────────────────────────────────────────────────────────────

type ProfileSlice = Pick<UserProfile, 'user_id' | 'first_name'>;

const adnan: ProfileSlice = {
  user_id: 'adnan-malik-uuid-001',
  first_name: 'Adnan',
};

const aisha: ProfileSlice = {
  user_id: 'aisha-khan-uuid-002',
  first_name: 'Aisha',
};

const noName: ProfileSlice = {
  user_id: 'anon-user-uuid-003',
  first_name: null,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('buildShareMessage', () => {
  describe('given a profile with first_name "Adnan" and user_id "adnan-malik-uuid-001"', () => {
    it('returns exact message and url shape', () => {
      const result = buildShareMessage(adnan);

      expect(result).toEqual({
        message: 'Check out Adnan on Knotify: knotify://profile/adnan-malik-uuid-001',
        url: 'knotify://profile/adnan-malik-uuid-001',
      });
    });

    it('url is knotify://profile/<user_id>', () => {
      const { url } = buildShareMessage(adnan);
      expect(url).toBe('knotify://profile/adnan-malik-uuid-001');
    });

    it('message embeds the url', () => {
      const { message, url } = buildShareMessage(adnan);
      expect(message).toContain(url);
    });
  });

  describe('given a profile with first_name "Aisha"', () => {
    it('returns correct message for Aisha', () => {
      const { message, url } = buildShareMessage(aisha);
      expect(url).toBe('knotify://profile/aisha-khan-uuid-002');
      expect(message).toBe(
        'Check out Aisha on Knotify: knotify://profile/aisha-khan-uuid-002',
      );
    });
  });

  describe('given a profile with first_name null', () => {
    it('falls back to user_id in the message when first_name is null', () => {
      const { message, url } = buildShareMessage(noName);
      expect(url).toBe('knotify://profile/anon-user-uuid-003');
      expect(message).toContain('anon-user-uuid-003');
    });
  });
});
