/**
 * Onboarding wizard navigator.
 *
 * Registers all 31 routes using the semantic names defined by `PAGE_MAP` in
 * `src/features/onboarding/pageMap.ts` (architecture §6.3, §11.2). Pages 1-19
 * are real screens (phases 2-7, B1-B6 story 7.2); pages 20-31 remain as
 * `EmptyState` placeholders — real screens land in phases 8-11 (B7-B10).
 *
 * `useCheckpointResume` is wired as `initialRouteName` so users who resume
 * an in-progress wizard skip already-completed pages.
 *
 * @module navigation/OnboardingStack
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { EmptyState } from "@/components";
import { t } from "@/labels";
import { useCheckpointResume } from "@/features/onboarding/hooks/useCheckpointResume";
import {
  OnboardingDraftProvider,
  useOnboardingDraft,
} from "@/features/onboarding/hooks/useOnboardingDraft";

import { Page01WelcomeScreen } from "@/features/onboarding/screens/Page01WelcomeScreen";
import { Page02EmailScreen } from "@/features/onboarding/screens/Page02EmailScreen";
import { Page03ConfirmCodeScreen } from "@/features/onboarding/screens/Page03ConfirmCodeScreen";
import { Page04GetStartedScreen } from "@/features/onboarding/screens/Page04GetStartedScreen";
import { Page05SexScreen as Page05SexScreenImpl } from "@/features/onboarding/screens/Page05SexScreen";
import { Page06NameScreen as Page06NameScreenImpl } from "@/features/onboarding/screens/Page06NameScreen";
import { Page07BirthdayScreen as Page07BirthdayScreenImpl } from "@/features/onboarding/screens/Page07BirthdayScreen";
import { Page08FirstCheckpointScreen as Page08FirstCheckpointScreenImpl } from "@/features/onboarding/screens/Page08FirstCheckpointScreen";
import { Page09ReligionSubsectScreen as Page09ReligionSubsectScreenImpl } from "@/features/onboarding/screens/Page09ReligionSubsectScreen";
import { Page10ProfessionalCategoryScreen as Page10ProfessionalCategoryScreenImpl } from "@/features/onboarding/screens/Page10ProfessionalCategoryScreen";
import { Page11WorkDetailsScreen as Page11WorkDetailsScreenImpl } from "@/features/onboarding/screens/Page11WorkDetailsScreen";
import { Page12EducationLevelScreen as Page12EducationLevelScreenImpl } from "@/features/onboarding/screens/Page12EducationLevelScreen";
import { Page13EducationCredentialsScreen as Page13EducationCredentialsScreenImpl } from "@/features/onboarding/screens/Page13EducationCredentialsScreen";
import { Page14SecondCheckpointScreen as Page14SecondCheckpointScreenImpl } from "@/features/onboarding/screens/Page14SecondCheckpointScreen";
import { Page15CountryScreen as Page15CountryScreenImpl } from "@/features/onboarding/screens/Page15CountryScreen";
import { Page16ResidenceCityScreen as Page16ResidenceCityScreenImpl } from "@/features/onboarding/screens/Page16ResidenceCityScreen";
import { Page17FamilyResidenceScreen as Page17FamilyResidenceScreenImpl } from "@/features/onboarding/screens/Page17FamilyResidenceScreen";
import { Page18ParentsScreen as Page18ParentsScreenImpl } from "@/features/onboarding/screens/Page18ParentsScreen";
import { Page19SiblingsScreen as Page19SiblingsScreenImpl } from "@/features/onboarding/screens/Page19SiblingsScreen";
import { Page20MarriageTimelineScreen as Page20MarriageTimelineScreenImpl } from "@/features/onboarding/screens/Page20MarriageTimelineScreen";
import { Page21OwnReligiousLevelScreen as Page21OwnReligiousLevelScreenImpl } from "@/features/onboarding/screens/Page21OwnReligiousLevelScreen";
import { Page22PartnersReligiousLevelScreen as Page22PartnersReligiousLevelScreenImpl } from "@/features/onboarding/screens/Page22PartnersReligiousLevelScreen";

import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

// ---------------------------------------------------------------------------
// Placeholder screen factory (pages 5-31)
// ---------------------------------------------------------------------------

/**
 * Creates a named placeholder screen component for a given onboarding page.
 *
 * Renders an `EmptyState` with `common.notImplemented`. Real screen components
 * replace these in onboarding phases 3-11 (B2-B10).
 *
 * @param pageName - The semantic route name (e.g. `'Page05SexScreen'`).
 * @returns A React component suitable for use as a `Stack.Screen` component.
 */
function makePlaceholderScreen(pageName: string) {
  function PlaceholderScreen(): React.JSX.Element {
    return (
      <EmptyState
        title={pageName}
        description={t("common.notImplemented")}
      />
    );
  }
  PlaceholderScreen.displayName = `${pageName}`;
  return PlaceholderScreen;
}

// Pages 5-8 now have real screen components (phases 3B2, stories 3.1-3.4).
const Page05SexScreen = Page05SexScreenImpl;
const Page06NameScreen = Page06NameScreenImpl;
const Page07BirthdayScreen = Page07BirthdayScreenImpl;
const Page08FirstCheckpointScreen = Page08FirstCheckpointScreenImpl;
// Pages 9-11: real screens landed in phase 4 (B3).
const Page09ReligionSubsectScreen = Page09ReligionSubsectScreenImpl;
const Page10ProfessionalCategoryScreen = Page10ProfessionalCategoryScreenImpl;
const Page11WorkDetailsScreen = Page11WorkDetailsScreenImpl;
// Page 12: real screen landed in phase 5 (B4, story 5.1).
const Page12EducationLevelScreen = Page12EducationLevelScreenImpl;
// Page 13: real screen landed in phase 5 (B4, story 5.2).
const Page13EducationCredentialsScreen = Page13EducationCredentialsScreenImpl;
// Page 14: real screen landed in phase 5 (B4, story 5.3).
const Page14SecondCheckpointScreen = Page14SecondCheckpointScreenImpl;
// Page 15: real screen landed in phase 6 (B5, story 6.1).
const Page15ResidenceCountryScreen = Page15CountryScreenImpl;
// Page 16: real screen landed in phase 6 (B5, story 6.2).
const Page16ResidenceCityScreen = Page16ResidenceCityScreenImpl;
// Page 17: real screen landed in phase 6 (B5, story 6.3).
const Page17FamilyResidenceScreen = Page17FamilyResidenceScreenImpl;
// Page 18: real screen landed in phase 7 (B6, story 7.1).
const Page18ParentsScreen = Page18ParentsScreenImpl;
// Page 19: real screen landed in phase 7 (B6, story 7.2).
const Page19SiblingsScreen = Page19SiblingsScreenImpl;
// Page 20: real screen landed in phase 8 (B7, story 8.1).
const Page20MarriageTimelineScreen = Page20MarriageTimelineScreenImpl;
// Page 21: real screen landed in phase 8 (B7, story 8.2).
const Page21OwnReligiousLevelScreen = Page21OwnReligiousLevelScreenImpl;
// Page 22: real screen landed in phase 8 (B7, story 8.3).
const Page22PartnersReligiousLevelScreen = Page22PartnersReligiousLevelScreenImpl;
const Page23MaritalStatusScreen = makePlaceholderScreen("Page23MaritalStatusScreen");
const Page24MoveAbroadScreen = makePlaceholderScreen("Page24MoveAbroadScreen");
const Page25Preferences1Screen = makePlaceholderScreen("Page25Preferences1Screen");
const Page26Preferences2Screen = makePlaceholderScreen("Page26Preferences2Screen");
const Page27RelationScreen = makePlaceholderScreen("Page27RelationScreen");
const Page28PhotosScreen = makePlaceholderScreen("Page28PhotosScreen");
const Page29PhoneScreen = makePlaceholderScreen("Page29PhoneScreen");
const Page30FaceVerifyIntroScreen = makePlaceholderScreen("Page30FaceVerifyIntroScreen");
const Page31FaceCaptureScreen = makePlaceholderScreen("Page31FaceCaptureScreen");

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

/**
 * Native-stack navigator for the 31-page onboarding wizard.
 *
 * Auth-gate mapping (managed by `RootNavigator`):
 * - `status === 'unauthenticated'` → this stack (new sign-up flow, starts at page 1).
 * - `status === 'authenticated' && !profileComplete` → this stack (resume from checkpoint).
 *
 * `useCheckpointResume` reads the persisted draft's `lastCheckpoint` and
 * returns the correct `initialRouteName`:
 * - `'secondCheckpoint'` → `Page15ResidenceCountryScreen`
 * - `'firstCheckpoint'`  → `Page09ReligionSubsectScreen`
 * - `null`               → `Page01WelcomeScreen`
 *
 * Pages 1-21 use real screens (phases 2-8, stories 8.1-8.2). Pages 22-31 are
 * `EmptyState` placeholders; real screens land in phases 8-11.
 *
 * @see {@link OnboardingStackParamList} for typed navigation.
 */
export function OnboardingStack(): React.JSX.Element {
  return (
    <OnboardingDraftProvider>
      <OnboardingStackNavigator />
    </OnboardingDraftProvider>
  );
}

function OnboardingStackNavigator(): React.JSX.Element | null {
  const { getDraft, isLoading } = useOnboardingDraft();
  const draft = getDraft();
  const initialRouteName = useCheckpointResume(draft.lastCheckpoint);

  // Wait for the persisted draft to hydrate from secure-store before mounting
  // the navigator. React Navigation reads `initialRouteName` once at mount and
  // freezes it — if we mount before the draft loads, the checkpoint is still
  // `null` and the user lands on Page 1 instead of resuming from their last
  // completed checkpoint. Returning `null` for the ~ms of hydration avoids the
  // race; the Splash/loading UX is handled at a higher level (App root).
  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      {/* Pages 1-4: real placeholder screens with WizardHeader */}
      <Stack.Screen name="Page01WelcomeScreen" component={Page01WelcomeScreen} />
      <Stack.Screen name="Page02EmailScreen" component={Page02EmailScreen} />
      <Stack.Screen name="Page03ConfirmCodeScreen" component={Page03ConfirmCodeScreen} />
      <Stack.Screen name="Page04GetStartedScreen" component={Page04GetStartedScreen} />

      {/* Pages 5-20: real screens; EmptyState placeholders for 21-31 */}
      <Stack.Screen name="Page05SexScreen" component={Page05SexScreen} />
      <Stack.Screen name="Page06NameScreen" component={Page06NameScreen} />
      <Stack.Screen name="Page07BirthdayScreen" component={Page07BirthdayScreen} />
      <Stack.Screen name="Page08FirstCheckpointScreen" component={Page08FirstCheckpointScreen} />
      <Stack.Screen name="Page09ReligionSubsectScreen" component={Page09ReligionSubsectScreen} />
      <Stack.Screen name="Page10ProfessionalCategoryScreen" component={Page10ProfessionalCategoryScreen} />
      <Stack.Screen name="Page11WorkDetailsScreen" component={Page11WorkDetailsScreen} />
      <Stack.Screen name="Page12EducationLevelScreen" component={Page12EducationLevelScreen} />
      <Stack.Screen name="Page13EducationCredentialsScreen" component={Page13EducationCredentialsScreen} />
      <Stack.Screen name="Page14SecondCheckpointScreen" component={Page14SecondCheckpointScreen} />
      <Stack.Screen name="Page15ResidenceCountryScreen" component={Page15ResidenceCountryScreen} />
      <Stack.Screen name="Page16ResidenceCityScreen" component={Page16ResidenceCityScreen} />
      <Stack.Screen name="Page17FamilyResidenceScreen" component={Page17FamilyResidenceScreen} />
      <Stack.Screen name="Page18ParentsScreen" component={Page18ParentsScreen} />
      <Stack.Screen name="Page19SiblingsScreen" component={Page19SiblingsScreen} />
      <Stack.Screen name="Page20MarriageTimelineScreen" component={Page20MarriageTimelineScreen} />
      <Stack.Screen name="Page21OwnReligiousLevelScreen" component={Page21OwnReligiousLevelScreen} />
      <Stack.Screen name="Page22PartnersReligiousLevelScreen" component={Page22PartnersReligiousLevelScreen} />
      <Stack.Screen name="Page23MaritalStatusScreen" component={Page23MaritalStatusScreen} />
      <Stack.Screen name="Page24MoveAbroadScreen" component={Page24MoveAbroadScreen} />
      <Stack.Screen name="Page25Preferences1Screen" component={Page25Preferences1Screen} />
      <Stack.Screen name="Page26Preferences2Screen" component={Page26Preferences2Screen} />
      <Stack.Screen name="Page27RelationScreen" component={Page27RelationScreen} />
      <Stack.Screen name="Page28PhotosScreen" component={Page28PhotosScreen} />
      <Stack.Screen name="Page29PhoneScreen" component={Page29PhoneScreen} />
      <Stack.Screen name="Page30FaceVerifyIntroScreen" component={Page30FaceVerifyIntroScreen} />
      <Stack.Screen name="Page31FaceCaptureScreen" component={Page31FaceCaptureScreen} />
    </Stack.Navigator>
  );
}
