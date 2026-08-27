/**
 * DeckCard — condensed profile card for the Marriage-tab deck (story 13.3).
 *
 * Renders a single `DummyDeckProfile` as a vertically stacked card:
 * 1. `CandidateHero` — full-bleed hero image with name / age / bubbles.
 * 2. `AboutMeSection` — marital status + children chips.
 * 3. `MarriageIntentionsSection` — intent timeline.
 * 4. `EducationSection` — degree / college chips.
 * 5. `ProfessionalCareerSection` — career chips.
 *
 * Intentionally omits all other profile sections (photos-block, faith,
 * personality, address, parents, siblings, verified-profile, contact-actions,
 * future-plans, hero-block). The full section catalog is visible when the
 * user navigates to `OtherProfileScreen` (story 13.4).
 *
 * **Cast pattern.** `DummyDeckProfile` does not structurally satisfy
 * `UserProfile & DummyOverlay` (the profile-section components' contract) —
 * the four section components receive a `deck as unknown as UserProfile & DummyOverlay`
 * cast at this boundary (PRD-blessed pattern). `CandidateHero` is the
 * exception: it now accepts `CandidateHeroProfile` directly, no cast needed.
 *
 * @module features/landing/components/DeckCard
 */

import React from 'react';
import { View } from 'react-native';

import type { DummyDeckProfile } from '@/types/DummyDeckProfile';
import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay } from '@/types/DummyOverlay';

import { CandidateHero } from './CandidateHero';
import { AboutMeSection } from '@/features/profile-sections/sections/AboutMeSection';
import { MarriageIntentionsSection } from '@/features/profile-sections/sections/MarriageIntentionsSection';
import { EducationSection } from '@/features/profile-sections/sections/EducationSection';
import { ProfessionalCareerSection } from '@/features/profile-sections/sections/ProfessionalCareerSection';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DeckCardProps {
  /** The condensed deck profile to display. */
  readonly deck: DummyDeckProfile;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Condensed deck card for the Marriage landing page.
 *
 * Shows only the four most decision-relevant sections. The full profile catalog
 * is available via `OtherProfileScreen` (story 13.4).
 */
export function DeckCard({ deck }: DeckCardProps): React.ReactElement {
  // PRD-blessed cast: DummyDeckProfile → UserProfile & DummyOverlay so the
  // section components' prop types are satisfied. CandidateHero is the
  // exception — it now accepts CandidateHeroProfile, which DummyDeckProfile
  // satisfies structurally without any cast.
  const sectionProfile = deck as unknown as UserProfile & DummyOverlay;

  return (
    <View testID="deck-card">
      {/* Hero — no cast required; DummyDeckProfile satisfies CandidateHeroProfile */}
      <CandidateHero profile={deck} />

      {/* Four condensed sections — cast applied once at this boundary */}
      <AboutMeSection profile={sectionProfile} />
      <MarriageIntentionsSection profile={sectionProfile} />
      <EducationSection profile={sectionProfile} />
      <ProfessionalCareerSection profile={sectionProfile} />
    </View>
  );
}
