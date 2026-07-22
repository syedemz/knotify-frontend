/**
 * Onboarding page map — the single source of truth for route names and their
 * 1-based page positions.
 *
 * `PAGE_MAP` is consumed by:
 * - `useOnboardingProgress` (derives current page number from the active route)
 * - `WizardProgress` (reads `TOTAL_PAGES` to render the progress bar)
 * - `src/navigation/types.ts` (imports `OnboardingRouteName` to type the
 *   `OnboardingStackParamList` — avoids string-literal duplication)
 *
 * To add a page: add an entry here. Everything else updates automatically.
 *
 * @module features/onboarding/pageMap
 */

/**
 * Maps every onboarding route name to its 1-based page position.
 *
 * The 31 entries correspond to architecture.md §11.2 rows 1–31.
 * The order of keys defines the canonical page sequence.
 */
export const PAGE_MAP = {
  Page01WelcomeScreen: 1,
  Page02EmailScreen: 2,
  Page03ConfirmCodeScreen: 3,
  Page04GetStartedScreen: 4,
  Page05SexScreen: 5,
  Page06NameScreen: 6,
  Page07BirthdayScreen: 7,
  Page08FirstCheckpointScreen: 8,
  Page09ReligionSubsectScreen: 9,
  Page10ProfessionalCategoryScreen: 10,
  Page11WorkDetailsScreen: 11,
  Page12EducationLevelScreen: 12,
  Page13EducationCredentialsScreen: 13,
  Page14SecondCheckpointScreen: 14,
  Page15ResidenceCountryScreen: 15,
  Page16ResidenceCityScreen: 16,
  Page17FamilyResidenceScreen: 17,
  Page18ParentsScreen: 18,
  Page19SiblingsScreen: 19,
  Page20MarriageTimelineScreen: 20,
  Page21OwnReligiousLevelScreen: 21,
  Page22PartnersReligiousLevelScreen: 22,
  Page23MaritalStatusScreen: 23,
  Page24MoveAbroadScreen: 24,
  Page25Preferences1Screen: 25,
  Page26Preferences2Screen: 26,
  Page27RelationScreen: 27,
  Page28PhotosScreen: 28,
  Page29PhoneScreen: 29,
  Page30FaceVerifyIntroScreen: 30,
  Page31FaceCaptureScreen: 31,
} as const satisfies Readonly<Record<string, number>>;

/**
 * Union of all valid onboarding route names.
 *
 * Defined here so `src/navigation/types.ts` can import it rather than
 * duplicating the 31 string literals. `pageMap.ts` is the single source of
 * truth for both route names AND page numbers.
 */
export type OnboardingRouteName = keyof typeof PAGE_MAP;

/**
 * Total number of onboarding pages.
 *
 * This is the single source of truth for the wizard page count. `WizardProgress`
 * imports this constant so a future bump of the page count changes exactly one file.
 */
export const TOTAL_PAGES = 31 as const;
