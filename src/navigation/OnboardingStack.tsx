/**
 * Onboarding wizard navigator.
 *
 * Registers all 31 routes using the semantic names defined by `PAGE_MAP` in
 * `src/features/onboarding/pageMap.ts` (architecture §6.3, §11.2). Pages 1-8
 * are real screens (phases 2-3, B1-B2); pages 9-31 remain as `EmptyState`
 * placeholders — real screens land in phases 4-11 (B3-B10).
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
import { useOnboardingDraft } from "@/features/onboarding/hooks/useOnboardingDraft";

import { Page01WelcomeScreen } from "@/features/onboarding/screens/Page01WelcomeScreen";
import { Page02EmailScreen } from "@/features/onboarding/screens/Page02EmailScreen";
import { Page03ConfirmCodeScreen } from "@/features/onboarding/screens/Page03ConfirmCodeScreen";
import { Page04GetStartedScreen } from "@/features/onboarding/screens/Page04GetStartedScreen";
import { Page05SexScreen as Page05SexScreenImpl } from "@/features/onboarding/screens/Page05SexScreen";
import { Page06NameScreen as Page06NameScreenImpl } from "@/features/onboarding/screens/Page06NameScreen";
import { Page07BirthdayScreen as Page07BirthdayScreenImpl } from "@/features/onboarding/screens/Page07BirthdayScreen";
import { Page08FirstCheckpointScreen as Page08FirstCheckpointScreenImpl } from "@/features/onboarding/screens/Page08FirstCheckpointScreen";
import { Page09ReligionSubsectScreen as Page09ReligionSubsectScreenImpl } from "@/features/onboarding/screens/Page09ReligionSubsectScreen";

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
// Pages 9+: real screens land as phases 4-11 are implemented.
const Page09ReligionSubsectScreen = Page09ReligionSubsectScreenImpl;
const Page10ProfessionalCategoryScreen = makePlaceholderScreen("Page10ProfessionalCategoryScreen");
const Page11WorkDetailsScreen = makePlaceholderScreen("Page11WorkDetailsScreen");
const Page12EducationLevelScreen = makePlaceholderScreen("Page12EducationLevelScreen");
const Page13EducationCredentialsScreen = makePlaceholderScreen("Page13EducationCredentialsScreen");
const Page14SecondCheckpointScreen = makePlaceholderScreen("Page14SecondCheckpointScreen");
const Page15ResidenceCountryScreen = makePlaceholderScreen("Page15ResidenceCountryScreen");
const Page16ResidenceCityScreen = makePlaceholderScreen("Page16ResidenceCityScreen");
const Page17FamilyResidenceScreen = makePlaceholderScreen("Page17FamilyResidenceScreen");
const Page18ParentsScreen = makePlaceholderScreen("Page18ParentsScreen");
const Page19SiblingsScreen = makePlaceholderScreen("Page19SiblingsScreen");
const Page20MarriageTimelineScreen = makePlaceholderScreen("Page20MarriageTimelineScreen");
const Page21OwnReligiousLevelScreen = makePlaceholderScreen("Page21OwnReligiousLevelScreen");
const Page22PartnersReligiousLevelScreen = makePlaceholderScreen("Page22PartnersReligiousLevelScreen");
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
 * Pages 1-8 use real screens (phases 2-3). Pages 9-31 are `EmptyState`
 * placeholders; real screens land in phases 4-11.
 *
 * @see {@link OnboardingStackParamList} for typed navigation.
 */
export function OnboardingStack(): React.JSX.Element {
  const { getDraft } = useOnboardingDraft();
  const draft = getDraft();
  const initialRouteName = useCheckpointResume(draft.lastCheckpoint);

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

      {/* Pages 5-31: EmptyState placeholders — replaced by phases 3-11 */}
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
