/**
 * ProfileScrollView — ordered section catalog for profile display.
 *
 * Renders the 14 profile sections in a fixed top-to-bottom order. Each
 * section independently returns `null` if its content would be empty — no
 * empty wrapper markup is produced.
 *
 * This component is consumed by:
 * - `MarriageLandingScreen` (story 12.4) with `viewer="other"`.
 * - `MyProfileScreen` (story 12.5) with `viewer="self"`.
 *
 * It does NOT contain a native `ScrollView` — callers wrap it in their own
 * scroll surface (FlatList header, ScrollView, etc.) to keep scroll
 * coordination under caller control.
 *
 * @module features/profile-sections/ProfileScrollView
 */

import React from 'react';
import { View } from 'react-native';

import type { UserProfile } from '@/types/api/UserProfile';
import type { DummyOverlay, ProfileViewer } from '@/types/DummyOverlay';

import { HeroBlock } from './sections/HeroBlock';
import { AboutMeSection } from './sections/AboutMeSection';
import { MarriageIntentionsSection } from './sections/MarriageIntentionsSection';
import { FaithSection } from './sections/FaithSection';
import { FuturePlansSection } from './sections/FuturePlansSection';
import { PhotoBlockSection } from './sections/PhotoBlockSection';
import { PersonalitySection } from './sections/PersonalitySection';
import { EducationSection } from './sections/EducationSection';
import { ProfessionalCareerSection } from './sections/ProfessionalCareerSection';
import { ParentsSection } from './sections/ParentsSection';
import { AddressSection } from './sections/AddressSection';
import { SiblingsSection } from './sections/SiblingsSection';
import { VerifiedProfileSection } from './sections/VerifiedProfileSection';
import { ContactActionsSection } from './sections/ContactActionsSection';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileScrollViewProps {
  readonly profile: UserProfile & DummyOverlay;
  readonly viewer: ProfileViewer;
  /**
   * When `false`, `ContactActionsSection` is skipped entirely — no phone row,
   * no share button, no disabled Favourite/Block/Report triad.
   *
   * Defaults to `true` so phase-12 callers (`MyProfileScreen`, pre-deck
   * `MarriageLandingScreen`) continue to render `ContactActionsSection`
   * unchanged.
   *
   * Used by `OtherProfileScreen` (story 13.4) to hide contact details when
   * the viewer is viewing a *pending-request* sender's profile — closing the
   * phone-number leak identified in brainstorm Q13 / S5.
   */
  readonly contactVisible?: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Renders the 14 profile sections in fixed order.
 *
 * Sections that would be empty return `null` and leave no wrapper markup in
 * the tree. Callers can assert section presence/absence in tests by querying
 * the section's `testID` prop.
 */
export function ProfileScrollView({
  profile,
  viewer,
  contactVisible = true,
}: ProfileScrollViewProps): React.ReactElement {
  return (
    <View testID="profile-scroll-view">
      <HeroBlock profile={profile} viewer={viewer} />
      <AboutMeSection profile={profile} />
      <MarriageIntentionsSection profile={profile} />
      <FaithSection profile={profile} />
      <FuturePlansSection profile={profile} />
      <PhotoBlockSection profile={profile} />
      <PersonalitySection profile={profile} />
      <EducationSection profile={profile} />
      <ProfessionalCareerSection profile={profile} />
      <ParentsSection profile={profile} />
      <AddressSection profile={profile} />
      <SiblingsSection profile={profile} />
      <VerifiedProfileSection profile={profile} />
      {contactVisible && (
        <ContactActionsSection profile={profile} viewer={viewer} />
      )}
    </View>
  );
}
