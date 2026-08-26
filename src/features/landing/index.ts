/**
 * Landing feature barrel.
 *
 * Exports the public API of the `features/landing` module. Consumers outside
 * this feature import from here; they should not reach into sub-folders
 * directly.
 *
 * @module features/landing
 */

export { MarriageLandingScreen } from './screens/MarriageLandingScreen';
export { HeaderBar } from './components/HeaderBar';
export type { HeaderBarProps } from './components/HeaderBar';
export { CandidateHero } from './components/CandidateHero';
export type { CandidateHeroProps } from './components/CandidateHero';
export { CollapsingActionBar } from './components/CollapsingActionBar';
export type { CollapsingActionBarProps } from './components/CollapsingActionBar';
