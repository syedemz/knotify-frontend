/**
 * Tests for src/components/RadioGroup.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { RadioGroup } from "@/components/RadioGroup";

const OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other", description: "Including non-binary" },
];

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("RadioGroup", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given options and no selection", () => {
    it("then renders all option labels", () => {
      renderWithTheme(
        <RadioGroup options={OPTIONS} value={undefined} onChange={() => {}} />,
      );
      expect(screen.getByText("Male")).toBeTruthy();
      expect(screen.getByText("Female")).toBeTruthy();
      expect(screen.getByText("Other")).toBeTruthy();
    });

    it("then each option has accessibilityRole radio", () => {
      renderWithTheme(
        <RadioGroup options={OPTIONS} value={undefined} onChange={() => {}} />,
      );
      const radios = screen.getAllByRole("radio");
      expect(radios.length).toBe(3);
    });

    it("then has accessibilityRole radiogroup on the container", () => {
      const { toJSON } = renderWithTheme(
        <RadioGroup options={OPTIONS} value={undefined} onChange={() => {}} />,
      );
      // RNTL does not map "radiogroup" to a querying role; verify via tree
      expect(JSON.stringify(toJSON())).toContain('"radiogroup"');
    });
  });

  describe("given a selected value", () => {
    it("then the selected radio has accessibilityState checked=true", () => {
      renderWithTheme(
        <RadioGroup options={OPTIONS} value="female" onChange={() => {}} />,
      );
      const radios = screen.getAllByRole("radio");
      const femaleRadio = radios.find(
        (r) => r.props.accessibilityLabel === "Female",
      );
      expect(femaleRadio?.props.accessibilityState.checked).toBe(true);
    });

    it("then applies accent.primary color for the selected label", () => {
      const { toJSON } = renderWithTheme(
        <RadioGroup options={OPTIONS} value="male" onChange={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });
  });

  describe("given onChange interaction", () => {
    it("then fires onChange with the option value on press", () => {
      const onChange = jest.fn();
      renderWithTheme(
        <RadioGroup options={OPTIONS} value={undefined} onChange={onChange} />,
      );
      fireEvent.press(screen.getByLabelText("Female"));
      expect(onChange).toHaveBeenCalledWith("female");
    });
  });

  describe("given an option with description", () => {
    it("then renders the description text", () => {
      renderWithTheme(
        <RadioGroup options={OPTIONS} value={undefined} onChange={() => {}} />,
      );
      expect(screen.getByText("Including non-binary")).toBeTruthy();
    });
  });

  describe("given disabled={true}", () => {
    it("then reduces opacity", () => {
      const { toJSON } = renderWithTheme(
        <RadioGroup options={OPTIONS} value={undefined} onChange={() => {}} disabled />,
      );
      expect(JSON.stringify(toJSON())).toContain("0.5");
    });

    it("then does not fire onChange when an option is pressed", () => {
      const onChange = jest.fn();
      renderWithTheme(
        <RadioGroup
          options={OPTIONS}
          value={undefined}
          onChange={onChange}
          disabled
        />,
      );
      fireEvent.press(screen.getByLabelText("Male"));
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("given accessibilityLabel on the group", () => {
    it("then exposes the group label via accessibilityLabel", () => {
      const { toJSON } = renderWithTheme(
        <RadioGroup
          options={OPTIONS}
          value={undefined}
          onChange={() => {}}
          accessibilityLabel="Choose gender"
        />,
      );
      // Verify the accessibilityLabel is in the rendered tree
      expect(JSON.stringify(toJSON())).toContain("Choose gender");
    });
  });

  describe("given dark theme", () => {
    it("then renders selected option with dark accent.primary", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <RadioGroup options={OPTIONS} value="male" onChange={() => {}} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.accent.primary);
    });
  });
});
