/**
 * Tests for src/components/WizardHeader.tsx
 *
 * lucide-react-native is resolved to its CJS build via jest.config.js
 * moduleNameMapper, so no per-test mock is needed for the icon import.
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { WizardHeader } from "@/components/WizardHeader";
import { setActiveLocale } from "@/labels";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("WizardHeader", () => {
  beforeEach(() => {
    setActiveLocale("en");
  });

  afterEach(() => jest.restoreAllMocks());

  describe("given default props (no hideProgress)", () => {
    it("then renders without crash", () => {
      renderWithTheme(<WizardHeader currentPage={5} onBack={() => {}} />);
      expect(screen.getByLabelText("Back")).toBeTruthy();
    });

    it("then renders the WizardProgress bar", () => {
      renderWithTheme(<WizardHeader currentPage={5} onBack={() => {}} />);
      expect(screen.getByLabelText("Step 5 of 31")).toBeTruthy();
    });

    it("then progress bar reflects currentPage", () => {
      renderWithTheme(<WizardHeader currentPage={10} onBack={() => {}} />);
      const bar = screen.getByLabelText("Step 10 of 31");
      expect(bar.props.accessibilityValue.now).toBe(10);
    });

    it("then back button fires onBack callback", () => {
      const onBack = jest.fn();
      renderWithTheme(<WizardHeader currentPage={3} onBack={onBack} />);
      fireEvent.press(screen.getByLabelText("Back"));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("given hideProgress={true}", () => {
    it("then does not render the progress bar", () => {
      renderWithTheme(<WizardHeader hideProgress onBack={() => {}} />);
      expect(screen.queryByLabelText("Step 1 of 31")).toBeNull();
    });

    it("then still renders the back button", () => {
      renderWithTheme(<WizardHeader hideProgress onBack={() => {}} />);
      expect(screen.getByLabelText("Back")).toBeTruthy();
    });

    it("then back button still fires onBack callback", () => {
      const onBack = jest.fn();
      renderWithTheme(<WizardHeader hideProgress onBack={onBack} />);
      fireEvent.press(screen.getByLabelText("Back"));
      expect(onBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("given Urdu locale", () => {
    it("then renders back button with Urdu label", () => {
      setActiveLocale("ur");
      renderWithTheme(<WizardHeader currentPage={3} onBack={() => {}} />);
      expect(screen.getByLabelText("واپس")).toBeTruthy();
    });
  });

  describe("given custom bg prop", () => {
    it("then renders with surface background color from light theme", () => {
      const { toJSON } = renderWithTheme(
        <WizardHeader currentPage={1} onBack={() => {}} bg="surface" />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.surface);
    });
  });

  describe("given custom paddingX and paddingY props", () => {
    it("then renders without crash with custom spacing", () => {
      renderWithTheme(
        <WizardHeader
          currentPage={2}
          onBack={() => {}}
          paddingX="lg"
          paddingY="md"
        />,
      );
      expect(screen.getByLabelText("Back")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders with dark bg.primary background", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <WizardHeader currentPage={5} onBack={() => {}} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(
        darkTheme.colors.bg.primary,
      );
    });

    it("then progress bar renders in dark theme without crash", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      render(
        <ThemeProvider>
          <WizardHeader currentPage={5} onBack={() => {}} />
        </ThemeProvider>,
      );
      expect(screen.getByLabelText("Step 5 of 31")).toBeTruthy();
    });

    it("then hideProgress=true hides progress bar in dark theme", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      render(
        <ThemeProvider>
          <WizardHeader hideProgress onBack={() => {}} />
        </ThemeProvider>,
      );
      expect(screen.queryByLabelText("Step 1 of 31")).toBeNull();
    });
  });
});
