/**
 * Public API for the profile-sections feature.
 *
 * Consumers should import from this barrel rather than from individual
 * section files to avoid coupling to the internal directory structure.
 *
 * @module features/profile-sections
 */

// Container
export { ProfileScrollView } from './ProfileScrollView';
export type { ProfileScrollViewProps } from './ProfileScrollView';

// Shared types
export type { ProfileViewer } from '@/types/DummyOverlay';
export type { DummyOverlay } from '@/types/DummyOverlay';

// Section components
export { HeroBlock } from './sections/HeroBlock';
export type { HeroBlockProps } from './sections/HeroBlock';

export { AboutMeSection } from './sections/AboutMeSection';
export type { AboutMeSectionProps } from './sections/AboutMeSection';

export { MarriageIntentionsSection } from './sections/MarriageIntentionsSection';
export type { MarriageIntentionsSectionProps } from './sections/MarriageIntentionsSection';

export { FaithSection } from './sections/FaithSection';
export type { FaithSectionProps } from './sections/FaithSection';

export { FuturePlansSection } from './sections/FuturePlansSection';
export type { FuturePlansSectionProps } from './sections/FuturePlansSection';

export { PhotoBlockSection } from './sections/PhotoBlockSection';
export type { PhotoBlockSectionProps } from './sections/PhotoBlockSection';

export { PersonalitySection } from './sections/PersonalitySection';
export type { PersonalitySectionProps } from './sections/PersonalitySection';

export { EducationSection } from './sections/EducationSection';
export type { EducationSectionProps } from './sections/EducationSection';

export { ProfessionalCareerSection } from './sections/ProfessionalCareerSection';
export type { ProfessionalCareerSectionProps } from './sections/ProfessionalCareerSection';

export { ParentsSection } from './sections/ParentsSection';
export type { ParentsSectionProps } from './sections/ParentsSection';

export { AddressSection } from './sections/AddressSection';
export type { AddressSectionProps } from './sections/AddressSection';

export { SiblingsSection } from './sections/SiblingsSection';
export type { SiblingsSectionProps } from './sections/SiblingsSection';

export { VerifiedProfileSection } from './sections/VerifiedProfileSection';
export type { VerifiedProfileSectionProps } from './sections/VerifiedProfileSection';

export { ContactActionsSection } from './sections/ContactActionsSection';
export type { ContactActionsSectionProps } from './sections/ContactActionsSection';
