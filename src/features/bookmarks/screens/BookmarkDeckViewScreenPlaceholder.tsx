/**
 * Temporary placeholder for `BookmarkDeckViewScreen`.
 *
 * Story 14.3 owns the route-type registration and this placeholder so that
 * `navigation.navigate('BookmarkDeckViewScreen', { userId })` compiles. Story
 * 14.4 replaces this file with the real screen and deletes this placeholder.
 *
 * TODO(14.4): delete this file and replace with the real BookmarkDeckViewScreen.
 *
 * @module features/bookmarks/screens/BookmarkDeckViewScreenPlaceholder
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components';

/**
 * Placeholder component registered at the `BookmarkDeckViewScreen` route.
 *
 * Renders a minimal centered label so the screen is navigable during
 * development. Deleted and replaced by story 14.4.
 */
export function BookmarkDeckViewScreenPlaceholder(): React.JSX.Element {
  return (
    <View style={styles.root}>
      <Text variant="body.md" color="secondary" align="center">
        TODO(14.4): real screen ships next
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
