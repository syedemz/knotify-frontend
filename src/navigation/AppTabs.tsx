/**
 * Main application tab navigator.
 *
 * Registers the four bottom tabs: Discover, Requests, Chat, Menu.
 * Screens are placeholder `EmptyState` components — real tab screens
 * and nested stacks land in their respective feature phases.
 *
 * @module navigation/AppTabs
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { EmptyState } from "@/components";
import { t } from "@/labels";
import type { AppTabsParamList } from "./types";

const Tab = createBottomTabNavigator<AppTabsParamList>();

// ---------------------------------------------------------------------------
// Placeholder screens
// ---------------------------------------------------------------------------

/**
 * Placeholder for the Discover tab screen.
 *
 * Renders the `nav.tabs.discover` label so the auth-gate test can
 * positively identify the `AppTabs` surface via `queryByText`.
 */
function DiscoverScreen(): React.JSX.Element {
  return (
    <EmptyState
      title={t("nav.tabs.discover")}
      description={t("common.notImplemented")}
    />
  );
}

/**
 * Placeholder for the Requests tab screen.
 */
function RequestsScreen(): React.JSX.Element {
  return (
    <EmptyState
      title={t("nav.tabs.requests")}
      description={t("common.notImplemented")}
    />
  );
}

/**
 * Placeholder for the Chat tab screen.
 */
function ChatScreen(): React.JSX.Element {
  return (
    <EmptyState
      title={t("nav.tabs.chat")}
      description={t("common.notImplemented")}
    />
  );
}

/**
 * Placeholder for the Menu tab screen.
 */
function MenuScreen(): React.JSX.Element {
  return (
    <EmptyState
      title={t("nav.tabs.menu")}
      description={t("common.notImplemented")}
    />
  );
}

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

/**
 * Bottom-tab navigator for the authenticated main application.
 *
 * Tabs: `Discover` / `Requests` / `Chat` / `Menu`.
 * Mounted when `status === 'authenticated' && profileComplete === true`.
 * Real tab screens and nested stacks (DiscoverStack, ChatStack, etc.) are
 * added by the feature phases.
 *
 * @see {@link AppTabsParamList} for typed navigation.
 */
export function AppTabs(): React.JSX.Element {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Requests" component={RequestsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Menu" component={MenuScreen} />
    </Tab.Navigator>
  );
}
