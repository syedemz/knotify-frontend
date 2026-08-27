/**
 * Tests for BookmarkCard (story 14.3).
 *
 * AC coverage:
 * (a) Renders the background image via `resolveDummyPhoto()` — asserts the
 *     `Image` source prop is resolved from `photos[0]`.
 * (b) Renders `${first_name} ${last_name}` and `${age} · ${job_title}` in
 *     the overlay.
 * (c) `onPress` fires when the card is pressed.
 * (d) Accessibility label composes name + age + job title.
 * (e) Missing `job_title` (null) renders age only — no ` · ` separator.
 */

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { BookmarkCard } from '@/features/bookmarks/components/BookmarkCard';
import type { DummyDeckProfile } from '@/types/DummyDeckProfile';

// ── resolveDummyPhoto mock ────────────────────────────────────────────────────
// We mock the registry so it returns a predictable value rather than requiring
// the real bundled assets to be available in the Jest environment.

jest.mock('@/assets/dummyPhotoRegistry', () => ({
  resolveDummyPhoto: (path: string | null | undefined) => {
    if (path === 'assets/female/Female3.png') {
      return 42; // opaque module handle — matches how Metro returns require()
    }
    return undefined;
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** A minimal DummyDeckProfile fixture that satisfies the type. */
const AISHA_FIXTURE: DummyDeckProfile = {
  user_id: 'aisha-test-id',
  first_name: 'Aisha',
  last_name: 'Khan',
  sex: 'Female',
  age: 27,
  chosen_profile_avatar: null,
  photo_url: 'assets/female/Female3.png',
  current_residence_city: 'Berlin',
  current_residence_country: 'Germany',
  resident_country_code: 'DE',
  religion: 'Islam',
  job_title: 'Product Designer',
  username: 'aisha_khan',
  profile_complete_verified: true,
  // Frontend extensions
  photos: ['assets/female/Female3.png', 'assets/female/Female4.png'],
  faceSelfieUri: null,
  marital_status: 'Never Married',
  has_children: false,
  marriage_time: 'Within 1 year',
  meet_time: 'Within 3 months',
  professional_category: 'Design',
  employer_name: 'Acme Corp',
  employment_type: 'Full-time',
  office_address: null,
  salary_range: null,
  highest_degree: 'MSc Human-Computer Interaction',
  education_level: 'Masters',
  college_name: 'TU Berlin',
  graduation_year: 2021,
  higher_secondary: null,
  higher_secondary_passing_year: null,
  high_school: null,
  high_school_passing_year: null,
  __dummy_display_only: {
    is_active_today: true,
    membership_tier: 'gold',
    has_unread_notifications: false,
  },
};

/** Fixture with `job_title` set to null for the guard test. */
const NO_JOB_FIXTURE: DummyDeckProfile = {
  ...AISHA_FIXTURE,
  user_id: 'no-job-id',
  first_name: 'Sara',
  last_name: 'Mirza',
  age: 25,
  job_title: null as unknown as string, // guard test: null job_title
};

// ── Render helper ─────────────────────────────────────────────────────────────

function renderCard(props: Partial<React.ComponentProps<typeof BookmarkCard>> = {}) {
  return render(
    <ThemeProvider>
      <BookmarkCard
        bookmark={AISHA_FIXTURE}
        onPress={jest.fn()}
        {...props}
      />
    </ThemeProvider>,
  );
}

// ── AC (a): renders background image via resolveDummyPhoto() ──────────────────

describe('BookmarkCard — AC (a): background image via resolveDummyPhoto()', () => {
  it('given a bookmark with photos[0], then Image is rendered with the resolved source', () => {
    renderCard();
    // The mock returns 42 for 'assets/female/Female3.png'.
    // React Native Testing Library exposes the source prop on Image elements.
    const images = screen.UNSAFE_getAllByType(require('react-native').Image);
    // At least one image should be present with source 42 (module handle).
    const hasResolvedSource = images.some(
      (img: any) => img.props.source === 42,
    );
    expect(hasResolvedSource).toBe(true);
  });
});

// ── AC (b): renders overlay text ─────────────────────────────────────────────

describe('BookmarkCard — AC (b): overlay name and age · job_title', () => {
  it('given Aisha fixture, then full name is visible in the overlay', () => {
    renderCard();
    expect(screen.getByText('Aisha Khan')).toBeTruthy();
  });

  it('given Aisha fixture, then age and job title are rendered with separator', () => {
    renderCard();
    expect(screen.getByText('27 · Product Designer')).toBeTruthy();
  });
});

// ── AC (c): onPress fires ─────────────────────────────────────────────────────

describe('BookmarkCard — AC (c): onPress fires when card is pressed', () => {
  it('given a press on the card, then onPress callback is called once', () => {
    const onPress = jest.fn();
    renderCard({ onPress });
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

// ── AC (d): accessibility label ───────────────────────────────────────────────

describe('BookmarkCard — AC (d): accessibility label composes name + age + job title', () => {
  it('given Aisha fixture, then accessibilityLabel contains name, age, and job title', () => {
    renderCard({ testID: 'aisha-card' });
    const card = screen.getByTestId('aisha-card');
    expect(card.props.accessibilityLabel).toContain('Aisha Khan');
    expect(card.props.accessibilityLabel).toContain('27');
    expect(card.props.accessibilityLabel).toContain('Product Designer');
  });
});

// ── AC (e): null job_title renders age only, no · separator ──────────────────

describe('BookmarkCard — AC (e): null job_title renders age only', () => {
  it('given a bookmark with null job_title, then only age is shown with no separator', () => {
    render(
      <ThemeProvider>
        <BookmarkCard
          bookmark={NO_JOB_FIXTURE}
          onPress={jest.fn()}
          testID="no-job-card"
        />
      </ThemeProvider>,
    );
    // Age should be visible
    expect(screen.getByText('25')).toBeTruthy();
    // The dot separator must NOT appear
    expect(screen.queryByText(/·/)).toBeNull();
  });

  it('given a bookmark with null job_title, then accessibilityLabel has no separator', () => {
    render(
      <ThemeProvider>
        <BookmarkCard
          bookmark={NO_JOB_FIXTURE}
          onPress={jest.fn()}
          testID="no-job-card"
        />
      </ThemeProvider>,
    );
    const card = screen.getByTestId('no-job-card');
    expect(card.props.accessibilityLabel).not.toContain('·');
  });
});
