/**
 * Tests for src/components/PasswordInput.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { PasswordInput } from "@/components/PasswordInput";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("PasswordInput", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props", () => {
    it("then renders without crash", () => {
      renderWithTheme(<PasswordInput value="" onChangeText={() => {}} />);
      // Should have the text input and the show/hide toggle
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("then is secure by default (secureTextEntry=true)", () => {
      renderWithTheme(<PasswordInput value="secret" onChangeText={() => {}} />);
      // The underlying RNTextInput with secureTextEntry won't show by display value
      // We check that the toggle button says "Show password"
      expect(screen.getByLabelText("Show password")).toBeTruthy();
    });

    it("then applies bg.input background", () => {
      const { toJSON } = renderWithTheme(
        <PasswordInput value="" onChangeText={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.input);
    });
  });

  describe("given onChange interaction", () => {
    it("then fires onChangeText when user types", () => {
      const onChangeText = jest.fn();
      renderWithTheme(<PasswordInput value="" onChangeText={onChangeText} />);
      // PasswordInput contains an RNTextInput. fireEvent.changeText works on
      // any element in the tree; we use getByLabelText fallback or the
      // placeholder to locate it. Use getAllByRole and check that the array
      // is non-empty before firing.
      const inputs = screen.getAllByRole("none");
      const firstInput = inputs[0];
      // noUncheckedIndexedAccess: guard before use
      if (firstInput !== undefined) {
        fireEvent.changeText(firstInput, "mypassword");
      }
      expect(onChangeText).toHaveBeenCalledWith("mypassword");
    });
  });

  describe("given show/hide toggle", () => {
    it("then toggles label from Show to Hide on press", () => {
      renderWithTheme(<PasswordInput value="secret" onChangeText={() => {}} />);
      expect(screen.getByLabelText("Show password")).toBeTruthy();
      fireEvent.press(screen.getByLabelText("Show password"));
      expect(screen.getByLabelText("Hide password")).toBeTruthy();
    });
  });

  describe("given error={true}", () => {
    it("then applies status.error border color", () => {
      const { toJSON } = renderWithTheme(
        <PasswordInput value="" onChangeText={() => {}} error />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.status.error);
    });
  });

  describe("given disabled={true}", () => {
    it("then reduces opacity", () => {
      const { toJSON } = renderWithTheme(
        <PasswordInput value="" onChangeText={() => {}} disabled />,
      );
      expect(JSON.stringify(toJSON())).toContain("0.5");
    });
  });

  describe("given dark theme", () => {
    it("then renders with dark bg.input color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <PasswordInput value="" onChangeText={() => {}} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.input);
    });
  });
});
