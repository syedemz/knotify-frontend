/**
 * Tests for src/components/SearchInput.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { SearchInput } from "@/components/SearchInput";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("SearchInput", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props", () => {
    it("then renders without crash", () => {
      renderWithTheme(<SearchInput value="" onChangeText={() => {}} />);
      expect(screen.getByPlaceholderText("Search")).toBeTruthy();
    });

    it("then applies pill border radius", () => {
      const { toJSON } = renderWithTheme(
        <SearchInput value="" onChangeText={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.pill));
    });

    it("then applies bg.input background", () => {
      const { toJSON } = renderWithTheme(
        <SearchInput value="" onChangeText={() => {}} />,
      );
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.input);
    });
  });

  describe("given onChange interaction", () => {
    it("then fires onChangeText on text input", () => {
      const onChangeText = jest.fn();
      renderWithTheme(<SearchInput value="" onChangeText={onChangeText} />);
      fireEvent.changeText(screen.getByPlaceholderText("Search"), "test query");
      expect(onChangeText).toHaveBeenCalledWith("test query");
    });
  });

  describe("given a non-empty value", () => {
    it("then shows a clear button", () => {
      renderWithTheme(
        <SearchInput value="hello" onChangeText={() => {}} />,
      );
      expect(screen.getByLabelText("Clear search")).toBeTruthy();
    });

    it("then clear button calls onChangeText with empty string", () => {
      const onChangeText = jest.fn();
      renderWithTheme(
        <SearchInput value="hello" onChangeText={onChangeText} />,
      );
      fireEvent.press(screen.getByLabelText("Clear search"));
      expect(onChangeText).toHaveBeenCalledWith("");
    });
  });

  describe("given an empty value", () => {
    it("then does not show clear button", () => {
      renderWithTheme(<SearchInput value="" onChangeText={() => {}} />);
      expect(screen.queryByLabelText("Clear search")).toBeNull();
    });
  });

  describe("given size='sm'", () => {
    it("then renders without crash", () => {
      renderWithTheme(<SearchInput value="" onChangeText={() => {}} size="sm" />);
      expect(screen.getByPlaceholderText("Search")).toBeTruthy();
    });
  });

  describe("given size='lg'", () => {
    it("then renders without crash", () => {
      renderWithTheme(<SearchInput value="" onChangeText={() => {}} size="lg" />);
      expect(screen.getByPlaceholderText("Search")).toBeTruthy();
    });
  });

  describe("given disabled={true}", () => {
    it("then reduces opacity", () => {
      const { toJSON } = renderWithTheme(
        <SearchInput value="" onChangeText={() => {}} disabled />,
      );
      expect(JSON.stringify(toJSON())).toContain("0.5");
    });

    it("then does not show clear button even when value is non-empty", () => {
      renderWithTheme(
        <SearchInput value="hello" onChangeText={() => {}} disabled />,
      );
      expect(screen.queryByLabelText("Clear search")).toBeNull();
    });
  });

  describe("given custom placeholder", () => {
    it("then shows the custom placeholder text", () => {
      renderWithTheme(
        <SearchInput value="" onChangeText={() => {}} placeholder="Find people" />,
      );
      expect(screen.getByPlaceholderText("Find people")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders with dark bg.input", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <SearchInput value="" onChangeText={() => {}} />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.input);
    });
  });
});
