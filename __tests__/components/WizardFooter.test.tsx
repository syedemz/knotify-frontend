/**
 * Tests for src/components/WizardFooter.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { WizardFooter } from "@/components/WizardFooter";
import { setActiveLocale } from "@/labels";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("WizardFooter", () => {
  beforeEach(() => {
    setActiveLocale("en");
  });

  afterEach(() => jest.restoreAllMocks());

  describe("given default props (Continue only, no Back)", () => {
    it("then renders the Continue button", () => {
      renderWithTheme(<WizardFooter onContinue={() => {}} />);
      expect(screen.getByLabelText("Continue")).toBeTruthy();
    });

    it("then does not render Back button when onBack is not provided", () => {
      renderWithTheme(<WizardFooter onContinue={() => {}} />);
      // There should be only one button (the Continue button)
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(1);
    });

    it("then firing Continue calls onContinue", () => {
      const onContinue = jest.fn();
      renderWithTheme(<WizardFooter onContinue={onContinue} />);
      fireEvent.press(screen.getByLabelText("Continue"));
      expect(onContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe("given disabled={true}", () => {
    it("then Continue button does not fire onContinue", () => {
      const onContinue = jest.fn();
      renderWithTheme(<WizardFooter onContinue={onContinue} disabled />);
      fireEvent.press(screen.getByLabelText("Continue"));
      expect(onContinue).not.toHaveBeenCalled();
    });

    it("then Continue button has accessibilityState disabled=true", () => {
      renderWithTheme(<WizardFooter onContinue={() => {}} disabled />);
      const btn = screen.getByRole("button");
      expect(btn.props.accessibilityState.disabled).toBe(true);
    });

    it("then applies disabled color to Continue button", () => {
      const { toJSON } = renderWithTheme(
        <WizardFooter onContinue={() => {}} disabled />,
      );
      expect(JSON.stringify(toJSON())).toContain(
        lightTheme.colors.accent.primaryDisabled,
      );
    });
  });

  describe("given loading={true}", () => {
    it("then Continue button does not fire onContinue while loading", () => {
      const onContinue = jest.fn();
      renderWithTheme(<WizardFooter onContinue={onContinue} loading />);
      fireEvent.press(screen.getByRole("button"));
      expect(onContinue).not.toHaveBeenCalled();
    });

    it("then Continue button label is hidden during loading", () => {
      renderWithTheme(<WizardFooter onContinue={() => {}} loading />);
      // The label text should not appear when loading
      expect(screen.queryByText("Continue")).toBeNull();
    });
  });

  describe("given onBack provided", () => {
    it("then renders both Continue and Back buttons", () => {
      renderWithTheme(
        <WizardFooter onContinue={() => {}} onBack={() => {}} />,
      );
      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(2);
    });

    it("then Back button renders the wizard.footer.back label", () => {
      renderWithTheme(
        <WizardFooter onContinue={() => {}} onBack={() => {}} />,
      );
      expect(screen.getByLabelText("Back")).toBeTruthy();
    });

    it("then firing Back calls onBack", () => {
      const onBack = jest.fn();
      renderWithTheme(
        <WizardFooter onContinue={() => {}} onBack={onBack} />,
      );
      // The Back button is ghost variant — get by its accessibilityLabel
      fireEvent.press(screen.getByLabelText("Back"));
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it("then firing Continue does not call onBack", () => {
      const onBack = jest.fn();
      const onContinue = jest.fn();
      renderWithTheme(
        <WizardFooter onContinue={onContinue} onBack={onBack} />,
      );
      fireEvent.press(screen.getByLabelText("Continue"));
      expect(onBack).not.toHaveBeenCalled();
      expect(onContinue).toHaveBeenCalledTimes(1);
    });
  });

  describe("given custom continueLabel", () => {
    it("then renders the custom label text", () => {
      renderWithTheme(
        <WizardFooter onContinue={() => {}} continueLabel="Get started" />,
      );
      expect(screen.getByLabelText("Get started")).toBeTruthy();
    });

    it("then does not show the default Continue label when custom is provided", () => {
      renderWithTheme(
        <WizardFooter onContinue={() => {}} continueLabel="Get started" />,
      );
      expect(screen.queryByText("Continue")).toBeNull();
    });
  });

  describe("given Urdu locale", () => {
    it("then Continue label renders in Urdu", () => {
      setActiveLocale("ur");
      renderWithTheme(<WizardFooter onContinue={() => {}} />);
      expect(screen.getByLabelText("جاری رکھیں")).toBeTruthy();
    });

    it("then Back label renders in Urdu when onBack provided", () => {
      setActiveLocale("ur");
      renderWithTheme(
        <WizardFooter onContinue={() => {}} onBack={() => {}} />,
      );
      expect(screen.getByLabelText("واپس")).toBeTruthy();
    });
  });

  describe("given custom bg token", () => {
    it("then renders with surface background color", () => {
      const { toJSON } = renderWithTheme(
        <WizardFooter onContinue={() => {}} bg="surface" />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.surface);
    });
  });

  describe("given custom padding and gap tokens", () => {
    it("then renders without crash with custom spacing", () => {
      renderWithTheme(
        <WizardFooter
          onContinue={() => {}}
          onBack={() => {}}
          padding="xxl"
          gap="md"
        />,
      );
      expect(screen.getByLabelText("Continue")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then Continue button renders with dark accent.primary color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <WizardFooter onContinue={() => {}} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(
        darkTheme.colors.accent.primary,
      );
    });

    it("then renders Back button in dark theme without crash", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      render(
        <ThemeProvider>
          <WizardFooter onContinue={() => {}} onBack={() => {}} />
        </ThemeProvider>,
      );
      expect(screen.getAllByRole("button")).toHaveLength(2);
    });
  });
});
