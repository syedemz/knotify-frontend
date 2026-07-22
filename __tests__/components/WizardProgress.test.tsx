/**
 * Tests for src/components/WizardProgress.tsx
 */
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { WizardProgress } from "@/components/WizardProgress";
import { TOTAL_PAGES } from "@/features/onboarding/pageMap";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("WizardProgress", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given TOTAL_PAGES constant", () => {
    it("then TOTAL_PAGES equals 31", () => {
      expect(TOTAL_PAGES).toBe(31);
    });
  });

  describe("given default props (current=1)", () => {
    it("then renders without crash", () => {
      renderWithTheme(<WizardProgress current={1} />);
      // Accessible by its label
      expect(screen.getByLabelText("Step 1 of 31")).toBeTruthy();
    });

    it("then renders with accessibilityRole progressbar on the container", () => {
      renderWithTheme(<WizardProgress current={1} />);
      const container = screen.getByLabelText("Step 1 of 31");
      expect(container.props.accessibilityRole).toBe("progressbar");
    });

    it("then has correct accessibilityValue min/max/now", () => {
      renderWithTheme(<WizardProgress current={5} />);
      const container = screen.getByLabelText("Step 5 of 31");
      expect(container.props.accessibilityValue).toEqual({
        min: 1,
        max: TOTAL_PAGES,
        now: 5,
      });
    });

    it("then renders accessibilityLabel describing step", () => {
      renderWithTheme(<WizardProgress current={3} />);
      expect(screen.getByLabelText("Step 3 of 31")).toBeTruthy();
    });
  });

  describe("given current=1 (start of wizard)", () => {
    it("then uses accent.primary fill color from light theme", () => {
      const { toJSON } = renderWithTheme(<WizardProgress current={1} />);
      expect(JSON.stringify(toJSON())).toContain(
        lightTheme.colors.accent.primary,
      );
    });

    it("then uses bg.muted remainder background from light theme", () => {
      const { toJSON } = renderWithTheme(<WizardProgress current={1} />);
      expect(JSON.stringify(toJSON())).toContain(
        lightTheme.colors.bg.muted,
      );
    });

    it("then renders fill segment testID", () => {
      renderWithTheme(<WizardProgress current={1} />);
      expect(screen.getByTestId("wizard-progress-fill")).toBeTruthy();
    });

    it("then renders remainder segment testID when not at 100%", () => {
      renderWithTheme(<WizardProgress current={1} />);
      expect(screen.getByTestId("wizard-progress-remainder")).toBeTruthy();
    });
  });

  describe("given current=TOTAL_PAGES (end of wizard)", () => {
    it("then renders without crash at 100% progress", () => {
      renderWithTheme(<WizardProgress current={TOTAL_PAGES} />);
      expect(screen.getByLabelText(`Step ${TOTAL_PAGES} of 31`)).toBeTruthy();
    });

    it("then accessibilityValue.now equals TOTAL_PAGES", () => {
      renderWithTheme(<WizardProgress current={TOTAL_PAGES} />);
      const container = screen.getByLabelText(`Step ${TOTAL_PAGES} of 31`);
      expect(container.props.accessibilityValue.now).toBe(TOTAL_PAGES);
    });

    it("then does not render remainder segment at 100%", () => {
      renderWithTheme(<WizardProgress current={TOTAL_PAGES} />);
      expect(screen.queryByTestId("wizard-progress-remainder")).toBeNull();
    });
  });

  describe("given current beyond TOTAL_PAGES (boundary safety)", () => {
    it("then clamps the fill and does not throw", () => {
      expect(() => {
        renderWithTheme(<WizardProgress current={TOTAL_PAGES + 5} />);
      }).not.toThrow();
    });
  });

  describe("given custom trackBg prop", () => {
    it("then renders without crash with trackBg='surface'", () => {
      renderWithTheme(
        <WizardProgress current={5} trackBg="surface" />,
      );
      expect(screen.getByLabelText("Step 5 of 31")).toBeTruthy();
    });
  });

  describe("given custom fillColor prop", () => {
    it("then renders without crash with fillColor='secondary'", () => {
      renderWithTheme(
        <WizardProgress current={5} fillColor="secondary" />,
      );
      expect(screen.getByLabelText("Step 5 of 31")).toBeTruthy();
    });
  });

  describe("given custom trackHeight prop", () => {
    it("then renders without crash with trackHeight='sm'", () => {
      renderWithTheme(
        <WizardProgress current={5} trackHeight="sm" />,
      );
      expect(screen.getByLabelText("Step 5 of 31")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then uses dark accent.primary fill color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <WizardProgress current={10} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(
        darkTheme.colors.accent.primary,
      );
    });

    it("then uses dark bg.muted remainder background", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <WizardProgress current={10} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.muted);
    });
  });
});
