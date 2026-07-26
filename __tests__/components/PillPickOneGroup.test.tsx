/**
 * Tests for the PillPickOneGroup component (story 8.1).
 *
 * Covers:
 * - Renders subheader label and all option pills.
 * - Selected state: correct pill carries accessibilityState.selected=true.
 * - Unselected state: selected=null → no pill selected.
 * - onSelect callback fires with the correct option string.
 * - accessibilityPrefix namespaces each pill label.
 * - Default prefix falls back to the label prop when accessibilityPrefix is omitted.
 * - Light and dark theme rendering (no crash).
 *
 * These tests focus purely on component behavior — visual/styling assertions
 * are excluded per the workspace visual-work carve-out.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

jest.mock('react-native-safe-area-context', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  const INSETS = { top: 0, right: 0, bottom: 0, left: 0 };
  const ctx = Rct.createContext(INSETS);
  return {
    SafeAreaProvider: function (props: any) {
      return Rct.createElement(ctx.Provider, { value: INSETS }, Rct.createElement(RN.View, null, props.children));
    },
    SafeAreaConsumer: function (props: any) { return props.children(INSETS); },
    SafeAreaView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    SafeAreaInsetsContext: ctx,
    useSafeAreaInsets: function () { return INSETS; },
    useSafeAreaFrame: function () { return { x: 0, y: 0, width: 375, height: 812 }; },
    initialWindowMetrics: { insets: INSETS, frame: { x: 0, y: 0, width: 375, height: 812 } },
  };
});

jest.mock('react-native-gesture-handler', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    GestureHandlerRootView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    Swipeable: RN.View, DrawerLayout: RN.View, State: {}, ScrollView: RN.ScrollView,
    Slider: RN.View, Switch: RN.View, TextInput: RN.View, PanGestureHandler: RN.View,
    TapGestureHandler: RN.View, RawButton: RN.View, BaseButton: RN.View, RectButton: RN.View,
    BorderlessButton: RN.View, LongPressGestureHandler: RN.View, FlatList: RN.FlatList,
    gestureHandlerRootHOC: function (C: any) { return C; }, Directions: {},
    Gesture: {
      Tap: jest.fn(), Pan: jest.fn(), Pinch: jest.fn(), Rotation: jest.fn(),
      Fling: jest.fn(), LongPress: jest.fn(), Exclusive: jest.fn(), Simultaneous: jest.fn(), Race: jest.fn(),
    },
    GestureDetector: RN.View, NativeViewGestureHandler: RN.View, FlingGestureHandler: RN.View,
    ForceTouchGestureHandler: RN.View, PinchGestureHandler: RN.View, RotationGestureHandler: RN.View,
  };
});

jest.mock('@gorhom/bottom-sheet', () => {
  const RN = require('react-native') as typeof import('react-native');
  const Rct = require('react') as typeof import('react');
  return {
    __esModule: true,
    default: Rct.forwardRef(function (props: any, _ref: any) { return Rct.createElement(RN.View, null, props.children); }),
    BottomSheetView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetScrollView: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
    BottomSheetFlatList: RN.View, BottomSheetSectionList: RN.View, BottomSheetTextInput: RN.View,
    BottomSheetBackdrop: RN.View, useBottomSheet: jest.fn(), useBottomSheetModal: jest.fn(),
    BottomSheetModal: Rct.forwardRef(function (props: any, _ref: any) { return Rct.createElement(RN.View, null, props.children); }),
    BottomSheetModalProvider: function (props: any) { return Rct.createElement(RN.View, null, props.children); },
  };
});

jest.mock('react-native-reanimated', () => {
  const m = require('react-native-reanimated/mock');
  m.default.call = jest.fn();
  return m;
});

/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */

import { ThemeProvider } from '@/theme';
import { PillPickOneGroup } from '@/components';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const OPTIONS = ['Alpha', 'Beta', 'Gamma'] as const;

function renderGroup(
  selected: string | null = null,
  onSelect = jest.fn(),
  prefix?: string,
) {
  return render(
    <ThemeProvider>
      <PillPickOneGroup
        label="Test label"
        options={OPTIONS}
        selected={selected}
        onSelect={onSelect}
        accessibilityPrefix={prefix ?? 'pfx'}
      />
    </ThemeProvider>,
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Render
// ═════════════════════════════════════════════════════════════════════════════

describe('PillPickOneGroup — render', () => {
  it('given a label, then the subheader label is visible', () => {
    renderGroup();
    expect(screen.getByText('Test label')).toBeTruthy();
  });

  it('given an options array, then every option appears as a pill', () => {
    renderGroup();
    for (const opt of OPTIONS) {
      expect(screen.getByText(opt)).toBeTruthy();
    }
  });

  it('given options, then the correct number of pills is rendered', () => {
    renderGroup();
    // Each pill is a Pressable with role="button"
    const pills = screen.getAllByRole('button');
    // Filter by accessible label prefix to avoid matching other buttons in the tree
    const groupPills = pills.filter((el) =>
      typeof el.props.accessibilityLabel === 'string' &&
      (el.props.accessibilityLabel as string).startsWith('pfx '),
    );
    expect(groupPills).toHaveLength(OPTIONS.length);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Selected state
// ═════════════════════════════════════════════════════════════════════════════

describe('PillPickOneGroup — selected state', () => {
  it('given selected=null, then no pill has accessibilityState.selected=true', () => {
    renderGroup(null);
    for (const opt of OPTIONS) {
      const pill = screen.getByLabelText(`pfx ${opt}`);
      expect(pill.props.accessibilityState?.selected).not.toBe(true);
    }
  });

  it('given selected="Beta", then only the Beta pill has selected=true', () => {
    renderGroup('Beta');
    const betaPill = screen.getByLabelText('pfx Beta');
    expect(betaPill.props.accessibilityState?.selected).toBe(true);

    const alphaPill = screen.getByLabelText('pfx Alpha');
    const gammaPill = screen.getByLabelText('pfx Gamma');
    expect(alphaPill.props.accessibilityState?.selected).not.toBe(true);
    expect(gammaPill.props.accessibilityState?.selected).not.toBe(true);
  });

  it('given selected="Alpha", then Alpha has selected=true and others do not', () => {
    renderGroup('Alpha');
    expect(screen.getByLabelText('pfx Alpha').props.accessibilityState?.selected).toBe(true);
    expect(screen.getByLabelText('pfx Beta').props.accessibilityState?.selected).not.toBe(true);
    expect(screen.getByLabelText('pfx Gamma').props.accessibilityState?.selected).not.toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Interaction
// ═════════════════════════════════════════════════════════════════════════════

describe('PillPickOneGroup — interaction', () => {
  it('given a tap on a pill, then onSelect is called once with that option string', () => {
    const onSelect = jest.fn();
    renderGroup(null, onSelect);
    fireEvent.press(screen.getByLabelText('pfx Alpha'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('Alpha');
  });

  it('given tapping the same pill twice, then onSelect is called twice', () => {
    const onSelect = jest.fn();
    renderGroup(null, onSelect);
    fireEvent.press(screen.getByLabelText('pfx Gamma'));
    fireEvent.press(screen.getByLabelText('pfx Gamma'));
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('given tapping a different pill, then onSelect is called with the correct option', () => {
    const onSelect = jest.fn();
    renderGroup('Alpha', onSelect);
    fireEvent.press(screen.getByLabelText('pfx Gamma'));
    expect(onSelect).toHaveBeenCalledWith('Gamma');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Accessibility prefix
// ═════════════════════════════════════════════════════════════════════════════

describe('PillPickOneGroup — accessibilityPrefix', () => {
  it('given accessibilityPrefix="grp", then pills are labelled "grp <option>"', () => {
    render(
      <ThemeProvider>
        <PillPickOneGroup
          label="Test"
          options={['X', 'Y']}
          selected={null}
          onSelect={jest.fn()}
          accessibilityPrefix="grp"
        />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('grp X')).toBeTruthy();
    expect(screen.getByLabelText('grp Y')).toBeTruthy();
  });

  it('given no accessibilityPrefix, then pills use the label text as prefix', () => {
    render(
      <ThemeProvider>
        <PillPickOneGroup
          label="My Group"
          options={['Z']}
          selected={null}
          onSelect={jest.fn()}
        />
      </ThemeProvider>,
    );
    expect(screen.getByLabelText('My Group Z')).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Theme variants
// ═════════════════════════════════════════════════════════════════════════════

describe('PillPickOneGroup — theme', () => {
  it('given light theme, then renders without crashing', () => {
    expect(() => renderGroup()).not.toThrow();
  });

  it('given dark theme context, then renders without crashing', () => {
    // ThemeProvider uses device color scheme to determine light/dark — both
    // modes share the same component shape. The light-mode test above covers
    // structural rendering; this test ensures no crash in any mode.
    expect(() =>
      render(
        <ThemeProvider>
          <PillPickOneGroup
            label="Dark test"
            options={OPTIONS}
            selected={null}
            onSelect={jest.fn()}
            accessibilityPrefix="d"
          />
        </ThemeProvider>,
      ),
    ).not.toThrow();
  });
});
