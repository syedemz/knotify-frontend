/**
 * Tests for src/components/PillButton.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { PillButton } from "@/components/PillButton";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("PillButton", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props (variant='default')", () => {
    it("then renders label text", () => {
      renderWithTheme(<PillButton label="Pakistani" onPress={() => {}} />);
      expect(screen.getByText("Pakistani")).toBeTruthy();
    });

    it("then has accessibilityRole button", () => {
      renderWithTheme(<PillButton label="Pakistani" onPress={() => {}} />);
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("then defaults accessibilityLabel to label prop", () => {
      renderWithTheme(<PillButton label="Pakistani" onPress={() => {}} />);
      expect(screen.getByLabelText("Pakistani")).toBeTruthy();
    });

    it("then has transparent background for default variant", () => {
      const { toJSON } = renderWithTheme(
        <PillButton label="Option" onPress={() => {}} />,
      );
      // Default has transparent background; border color should be strong
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.border.strong);
    });

    it("then has pill border radius", () => {
      const { toJSON } = renderWithTheme(
        <PillButton label="Option" onPress={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.pill));
    });
  });

  describe("given variant='selected'", () => {
    it("then applies accent.primary background", () => {
      const { toJSON } = renderWithTheme(
        <PillButton label="Pakistani" variant="selected" onPress={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });

    it("then has accessibilityState selected=true", () => {
      renderWithTheme(
        <PillButton label="Pakistani" variant="selected" onPress={() => {}} />,
      );
      const btn = screen.getByRole("button");
      expect(btn.props.accessibilityState.selected).toBe(true);
    });
  });

  describe("given disabled={true}", () => {
    it("then does not fire onPress", () => {
      const onPress = jest.fn();
      renderWithTheme(
        <PillButton label="Disabled" disabled onPress={onPress} />,
      );
      fireEvent.press(screen.getByRole("button"));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe("given onPress callback", () => {
    it("then fires when pressed and not disabled", () => {
      const onPress = jest.fn();
      renderWithTheme(<PillButton label="Press" onPress={onPress} />);
      fireEvent.press(screen.getByLabelText("Press"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("given iconLeft prop", () => {
    it("then renders without crash", () => {
      renderWithTheme(
        <PillButton label="With icon" onPress={() => {}} iconLeft={<></>} />,
      );
      expect(screen.getByText("With icon")).toBeTruthy();
    });
  });

  describe("given custom accessibilityLabel", () => {
    it("then uses the custom label", () => {
      renderWithTheme(
        <PillButton
          label="Pakistan"
          onPress={() => {}}
          accessibilityLabel="Select Pakistani nationality"
        />,
      );
      expect(screen.getByLabelText("Select Pakistani nationality")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders selected pill with dark accent primary", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <PillButton label="Selected" variant="selected" onPress={() => {}} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.accent.primary);
    });
  });
});
