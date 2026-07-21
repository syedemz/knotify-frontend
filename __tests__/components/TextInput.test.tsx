/**
 * Tests for src/components/TextInput.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { TextInput } from "@/components/TextInput";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("TextInput", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props", () => {
    it("then renders without crash", () => {
      renderWithTheme(<TextInput value="" onChangeText={() => {}} />);
      expect(screen.getByRole("none")).toBeTruthy();
    });

    it("then displays the current value", () => {
      renderWithTheme(<TextInput value="hello" onChangeText={() => {}} />);
      expect(screen.getByDisplayValue("hello")).toBeTruthy();
    });

    it("then applies bg.input background", () => {
      const { toJSON } = renderWithTheme(
        <TextInput value="" onChangeText={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.input);
    });

    it("then applies md border radius", () => {
      const { toJSON } = renderWithTheme(
        <TextInput value="" onChangeText={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.md));
    });
  });

  describe("given onChange interaction", () => {
    it("then fires onChangeText when user types", () => {
      const onChangeText = jest.fn();
      renderWithTheme(<TextInput value="" onChangeText={onChangeText} />);
      fireEvent.changeText(screen.getByRole("none"), "new text");
      expect(onChangeText).toHaveBeenCalledWith("new text");
    });
  });

  describe("given error={true}", () => {
    it("then applies status.error border color", () => {
      const { toJSON } = renderWithTheme(
        <TextInput value="" onChangeText={() => {}} error />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.status.error);
    });
  });

  describe("given disabled={true}", () => {
    it("then marks the input as not editable", () => {
      renderWithTheme(<TextInput value="val" onChangeText={() => {}} disabled />);
      // editable=false on RNTextInput means the element can still be found
      // We verify the accessibilityState
      expect(screen.getByRole("none").props.editable).toBe(false);
    });

    it("then applies reduced opacity", () => {
      const { toJSON } = renderWithTheme(
        <TextInput value="" onChangeText={() => {}} disabled />,
      );
      expect(JSON.stringify(toJSON())).toContain("0.5");
    });
  });

  describe("given placeholder", () => {
    it("then renders placeholder text", () => {
      renderWithTheme(
        <TextInput value="" onChangeText={() => {}} placeholder="Enter name" />,
      );
      expect(screen.getByPlaceholderText("Enter name")).toBeTruthy();
    });
  });

  describe("given accessibilityLabel", () => {
    it("then exposes the label to assistive technology", () => {
      renderWithTheme(
        <TextInput
          value=""
          onChangeText={() => {}}
          accessibilityLabel="Full name"
        />,
      );
      expect(screen.getByLabelText("Full name")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then applies dark bg.input color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <TextInput value="" onChangeText={() => {}} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.input);
    });
  });
});
