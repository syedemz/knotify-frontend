/**
 * Tests for src/components/Select.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Select } from "@/components/Select";

const OPTIONS = [
  { value: "en", label: "English" },
  { value: "ur", label: "Urdu" },
  { value: "fr", label: "French" },
];

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Select", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given no selected value", () => {
    it("then renders placeholder text in the trigger", () => {
      renderWithTheme(
        <Select options={OPTIONS} value={undefined} onChange={() => {}} />,
      );
      expect(screen.getByText("Select an option")).toBeTruthy();
    });

    it("then trigger has role button", () => {
      renderWithTheme(
        <Select options={OPTIONS} value={undefined} onChange={() => {}} />,
      );
      expect(screen.getByRole("button")).toBeTruthy();
    });
  });

  describe("given a selected value", () => {
    it("then shows the selected option label in the trigger", () => {
      renderWithTheme(
        <Select options={OPTIONS} value="ur" onChange={() => {}} />,
      );
      expect(screen.getByText("Urdu")).toBeTruthy();
    });
  });

  describe("given trigger press", () => {
    it("then opens the options modal", () => {
      renderWithTheme(
        <Select options={OPTIONS} value={undefined} onChange={() => {}} />,
      );
      fireEvent.press(screen.getByRole("button"));
      expect(screen.getByText("English")).toBeTruthy();
      expect(screen.getByText("Urdu")).toBeTruthy();
      expect(screen.getByText("French")).toBeTruthy();
    });
  });

  describe("given option selection", () => {
    it("then fires onChange with the selected value", () => {
      const onChange = jest.fn();
      renderWithTheme(
        <Select options={OPTIONS} value={undefined} onChange={onChange} />,
      );
      fireEvent.press(screen.getByRole("button"));
      // Press the first option
      fireEvent.press(screen.getByText("English"));
      expect(onChange).toHaveBeenCalledWith("en");
    });

    it("then closes the modal after selection", () => {
      const onChange = jest.fn();
      renderWithTheme(
        <Select options={OPTIONS} value={undefined} onChange={onChange} />,
      );
      fireEvent.press(screen.getByRole("button"));
      fireEvent.press(screen.getByText("Urdu"));
      // After selection, the options list should not be visible
      expect(screen.queryByText("French")).toBeNull();
    });
  });

  describe("given error={true}", () => {
    it("then applies status.error border color on the trigger", () => {
      const { toJSON } = renderWithTheme(
        <Select options={OPTIONS} value={undefined} onChange={() => {}} error />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.status.error);
    });
  });

  describe("given disabled={true}", () => {
    it("then reduces opacity", () => {
      const { toJSON } = renderWithTheme(
        <Select options={OPTIONS} value={undefined} onChange={() => {}} disabled />,
      );
      expect(JSON.stringify(toJSON())).toContain("0.5");
    });

    it("then does not open the modal on press", () => {
      renderWithTheme(
        <Select options={OPTIONS} value={undefined} onChange={() => {}} disabled />,
      );
      fireEvent.press(screen.getByRole("button"));
      // Options should not be visible
      expect(screen.queryByText("English")).toBeNull();
    });
  });

  describe("given custom accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <Select
          options={OPTIONS}
          value={undefined}
          onChange={() => {}}
          accessibilityLabel="Choose language"
        />,
      );
      expect(screen.getByLabelText("Choose language")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders with dark bg.input on trigger", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Select options={OPTIONS} value={undefined} onChange={() => {}} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.input);
    });
  });
});
