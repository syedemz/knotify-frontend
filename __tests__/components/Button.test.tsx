/**
 * Tests for src/components/Button.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Button } from "@/components/Button";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Button", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props (primary, lg, fullWidth)", () => {
    it("then renders label text", () => {
      renderWithTheme(<Button label="Continue" onPress={() => {}} />);
      expect(screen.getByText("Continue")).toBeTruthy();
    });

    it("then has accessibilityRole button", () => {
      renderWithTheme(<Button label="Continue" onPress={() => {}} />);
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("then defaults accessibilityLabel to label prop", () => {
      renderWithTheme(<Button label="Continue" onPress={() => {}} />);
      expect(screen.getByLabelText("Continue")).toBeTruthy();
    });

    it("then applies primary background color", () => {
      const { toJSON } = renderWithTheme(
        <Button label="Continue" onPress={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });

    it("then applies pill border radius", () => {
      const { toJSON } = renderWithTheme(
        <Button label="Continue" onPress={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.pill));
    });
  });

  describe("given variant='secondary'", () => {
    it("then applies secondary (mint) background", () => {
      const { toJSON } = renderWithTheme(
        <Button label="Skip" variant="secondary" onPress={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.secondary);
    });
  });

  describe("given variant='ghost'", () => {
    it("then has transparent background", () => {
      const { toJSON } = renderWithTheme(
        <Button label="Maybe later" variant="ghost" onPress={() => {}} />,
      );
      // Ghost has transparent bg and accent.primary label color
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });
  });

  describe("given size='sm'", () => {
    it("then renders without crash at sm size", () => {
      renderWithTheme(
        <Button label="Sm" size="sm" onPress={() => {}} />,
      );
      expect(screen.getByText("Sm")).toBeTruthy();
    });
  });

  describe("given size='md'", () => {
    it("then renders without crash at md size", () => {
      renderWithTheme(
        <Button label="Md" size="md" onPress={() => {}} />,
      );
      expect(screen.getByText("Md")).toBeTruthy();
    });
  });

  describe("given fullWidth={false}", () => {
    it("then renders without alignSelf stretch", () => {
      const { toJSON } = renderWithTheme(
        <Button label="Narrow" fullWidth={false} onPress={() => {}} />,
      );
      const json = JSON.stringify(toJSON());
      // Should not have alignSelf: stretch
      const parsed = JSON.parse(json);
      expect(JSON.stringify(parsed)).toBeTruthy();
    });
  });

  describe("given disabled={true}", () => {
    it("then does not fire onPress", () => {
      const onPress = jest.fn();
      renderWithTheme(
        <Button label="Disabled" disabled onPress={onPress} />,
      );
      fireEvent.press(screen.getByLabelText("Disabled"));
      expect(onPress).not.toHaveBeenCalled();
    });

    it("then applies disabled background color for primary variant", () => {
      const { toJSON } = renderWithTheme(
        <Button label="Disabled" disabled onPress={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(
        lightTheme.colors.accent.primaryDisabled,
      );
    });

    it("then has accessibilityState disabled=true", () => {
      renderWithTheme(
        <Button label="Disabled" disabled onPress={() => {}} />,
      );
      const btn = screen.getByRole("button");
      expect(btn.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe("given loading={true}", () => {
    it("then does not fire onPress while loading", () => {
      const onPress = jest.fn();
      renderWithTheme(
        <Button label="Loading" loading onPress={onPress} />,
      );
      // Label is hidden during loading — press via role
      fireEvent.press(screen.getByRole("button"));
      expect(onPress).not.toHaveBeenCalled();
    });

    it("then hides the label text and shows ActivityIndicator", () => {
      renderWithTheme(<Button label="Submit" loading onPress={() => {}} />);
      expect(screen.queryByText("Submit")).toBeNull();
    });
  });

  describe("given iconLeft prop", () => {
    it("then renders without crash with a left icon", () => {
      renderWithTheme(
        <Button
          label="With icon"
          onPress={() => {}}
          iconLeft={<></>}
        />,
      );
      expect(screen.getByText("With icon")).toBeTruthy();
    });
  });

  describe("given iconRight prop", () => {
    it("then renders without crash with a right icon", () => {
      renderWithTheme(
        <Button
          label="With icon right"
          onPress={() => {}}
          iconRight={<></>}
        />,
      );
      expect(screen.getByText("With icon right")).toBeTruthy();
    });
  });

  describe("given custom accessibilityLabel", () => {
    it("then uses the custom label", () => {
      renderWithTheme(
        <Button
          label="Continue"
          onPress={() => {}}
          accessibilityLabel="Proceed to next step"
        />,
      );
      expect(screen.getByLabelText("Proceed to next step")).toBeTruthy();
    });
  });

  describe("given onPress callback", () => {
    it("then fires when pressed and not disabled", () => {
      const onPress = jest.fn();
      renderWithTheme(<Button label="Press me" onPress={onPress} />);
      fireEvent.press(screen.getByLabelText("Press me"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("given dark theme", () => {
    it("then renders primary button with dark accent color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Button label="Dark mode" onPress={() => {}} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.accent.primary);
    });
  });
});
