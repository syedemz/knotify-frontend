/**
 * Onboarding wizard navigator.
 *
 * Registers routes `Page01` through `Page31` — the 31-page sign-up wizard
 * (architecture §6.3, §11.2). All screens are placeholder `EmptyState`
 * components in phase 1; the wizard shell and real screens land in the
 * onboarding phases (B1-B10, phases 2-11).
 *
 * @module navigation/OnboardingStack
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { EmptyState } from "@/components";
import { t } from "@/labels";
import type { OnboardingStackParamList } from "./types";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

// ---------------------------------------------------------------------------
// Placeholder screen factory
// ---------------------------------------------------------------------------

/**
 * Creates a named placeholder screen component for a given onboarding page.
 *
 * Each page renders an `EmptyState` with `common.notImplemented` — sufficient
 * for the phase 1 scaffold. Real screen components replace these in
 * onboarding phases.
 *
 * @param pageName - The route name (e.g. `'Page01'`).
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
  PlaceholderScreen.displayName = `${pageName}Screen`;
  return PlaceholderScreen;
}

const Page01Screen = makePlaceholderScreen("Page01");
const Page02Screen = makePlaceholderScreen("Page02");
const Page03Screen = makePlaceholderScreen("Page03");
const Page04Screen = makePlaceholderScreen("Page04");
const Page05Screen = makePlaceholderScreen("Page05");
const Page06Screen = makePlaceholderScreen("Page06");
const Page07Screen = makePlaceholderScreen("Page07");
const Page08Screen = makePlaceholderScreen("Page08");
const Page09Screen = makePlaceholderScreen("Page09");
const Page10Screen = makePlaceholderScreen("Page10");
const Page11Screen = makePlaceholderScreen("Page11");
const Page12Screen = makePlaceholderScreen("Page12");
const Page13Screen = makePlaceholderScreen("Page13");
const Page14Screen = makePlaceholderScreen("Page14");
const Page15Screen = makePlaceholderScreen("Page15");
const Page16Screen = makePlaceholderScreen("Page16");
const Page17Screen = makePlaceholderScreen("Page17");
const Page18Screen = makePlaceholderScreen("Page18");
const Page19Screen = makePlaceholderScreen("Page19");
const Page20Screen = makePlaceholderScreen("Page20");
const Page21Screen = makePlaceholderScreen("Page21");
const Page22Screen = makePlaceholderScreen("Page22");
const Page23Screen = makePlaceholderScreen("Page23");
const Page24Screen = makePlaceholderScreen("Page24");
const Page25Screen = makePlaceholderScreen("Page25");
const Page26Screen = makePlaceholderScreen("Page26");
const Page27Screen = makePlaceholderScreen("Page27");
const Page28Screen = makePlaceholderScreen("Page28");
const Page29Screen = makePlaceholderScreen("Page29");
const Page30Screen = makePlaceholderScreen("Page30");
const Page31Screen = makePlaceholderScreen("Page31");

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

/**
 * Native-stack navigator for the 31-page onboarding wizard.
 *
 * Mounted when `status === 'authenticated' && profileComplete === false`.
 * All screens are placeholders; the wizard shell (WizardHeader, WizardProgress,
 * WizardFooter) and real screens are added by the onboarding phases.
 *
 * @see {@link OnboardingStackParamList} for typed navigation.
 */
export function OnboardingStack(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Page01" component={Page01Screen} />
      <Stack.Screen name="Page02" component={Page02Screen} />
      <Stack.Screen name="Page03" component={Page03Screen} />
      <Stack.Screen name="Page04" component={Page04Screen} />
      <Stack.Screen name="Page05" component={Page05Screen} />
      <Stack.Screen name="Page06" component={Page06Screen} />
      <Stack.Screen name="Page07" component={Page07Screen} />
      <Stack.Screen name="Page08" component={Page08Screen} />
      <Stack.Screen name="Page09" component={Page09Screen} />
      <Stack.Screen name="Page10" component={Page10Screen} />
      <Stack.Screen name="Page11" component={Page11Screen} />
      <Stack.Screen name="Page12" component={Page12Screen} />
      <Stack.Screen name="Page13" component={Page13Screen} />
      <Stack.Screen name="Page14" component={Page14Screen} />
      <Stack.Screen name="Page15" component={Page15Screen} />
      <Stack.Screen name="Page16" component={Page16Screen} />
      <Stack.Screen name="Page17" component={Page17Screen} />
      <Stack.Screen name="Page18" component={Page18Screen} />
      <Stack.Screen name="Page19" component={Page19Screen} />
      <Stack.Screen name="Page20" component={Page20Screen} />
      <Stack.Screen name="Page21" component={Page21Screen} />
      <Stack.Screen name="Page22" component={Page22Screen} />
      <Stack.Screen name="Page23" component={Page23Screen} />
      <Stack.Screen name="Page24" component={Page24Screen} />
      <Stack.Screen name="Page25" component={Page25Screen} />
      <Stack.Screen name="Page26" component={Page26Screen} />
      <Stack.Screen name="Page27" component={Page27Screen} />
      <Stack.Screen name="Page28" component={Page28Screen} />
      <Stack.Screen name="Page29" component={Page29Screen} />
      <Stack.Screen name="Page30" component={Page30Screen} />
      <Stack.Screen name="Page31" component={Page31Screen} />
    </Stack.Navigator>
  );
}
