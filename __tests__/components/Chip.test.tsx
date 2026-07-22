/**
 * Tests for src/components/Chip.tsx
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { lightTheme, darkTheme } from "@/theme/theme";
import { Chip } from "@/components/Chip";

function renderWithTheme(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider>{children}</ThemeProvider>
    ),
  });
}

describe("Chip", () => {
  afterEach(() => jest.restoreAllMocks());

  describe("given default props (variant='default')", () => {
    it("then renders label text", () => {
      renderWithTheme(<Chip label="Islamic" />);
      expect(screen.getByText("Islamic")).toBeTruthy();
    });

    it("then uses bg.muted background for default variant", () => {
      const { toJSON } = renderWithTheme(<Chip label="Islamic" />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.bg.muted);
    });

    it("then applies sm border radius", () => {
      const { toJSON } = renderWithTheme(<Chip label="Islamic" />);
      expect(JSON.stringify(toJSON())).toContain(String(lightTheme.radii.sm));
    });

    it("then is a static View (no role button) when onPress is absent", () => {
      renderWithTheme(<Chip label="Islamic" />);
      expect(screen.queryByRole("button")).toBeNull();
    });

    it("then has default accessibilityLabel equal to label", () => {
      renderWithTheme(<Chip label="Islamic" />);
      expect(screen.getByLabelText("Islamic")).toBeTruthy();
    });
  });

  describe("given variant='brand'", () => {
    it("then applies accent.primary background", () => {
      const { toJSON } = renderWithTheme(<Chip label="Active" variant="brand" />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.accent.primary);
    });
  });

  describe("given variant='success'", () => {
    it("then applies status.success background", () => {
      const { toJSON } = renderWithTheme(<Chip label="Online" variant="success" />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.status.success);
    });
  });

  describe("given variant='warning'", () => {
    it("then applies status.warning background", () => {
      const { toJSON } = renderWithTheme(<Chip label="Pending" variant="warning" />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.status.warning);
    });
  });

  describe("given variant='error'", () => {
    it("then applies status.error background", () => {
      const { toJSON } = renderWithTheme(<Chip label="Rejected" variant="error" />);
      expect(JSON.stringify(toJSON())).toContain(lightTheme.colors.status.error);
    });
  });

  describe("given onPress callback", () => {
    it("then renders as a pressable button", () => {
      renderWithTheme(<Chip label="Remove" onPress={() => {}} />);
      expect(screen.getByRole("button")).toBeTruthy();
    });

    it("then fires onPress when tapped", () => {
      const onPress = jest.fn();
      renderWithTheme(<Chip label="Remove" onPress={onPress} />);
      fireEvent.press(screen.getByRole("button"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("given disabled={true} with onPress", () => {
    it("then does not fire onPress", () => {
      const onPress = jest.fn();
      renderWithTheme(<Chip label="Disabled" onPress={onPress} disabled />);
      fireEvent.press(screen.getByRole("button"));
      expect(onPress).not.toHaveBeenCalled();
    });

    it("then has accessibilityState disabled=true", () => {
      renderWithTheme(<Chip label="Disabled" onPress={() => {}} disabled />);
      const btn = screen.getByRole("button");
      expect(btn.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe("given iconLeft prop", () => {
    it("then renders without crash", () => {
      renderWithTheme(
        <Chip label="Tag" iconLeft={<></>} />,
      );
      expect(screen.getByText("Tag")).toBeTruthy();
    });
  });

  describe("given iconRight prop", () => {
    it("then renders without crash", () => {
      renderWithTheme(
        <Chip label="Tag" iconRight={<></>} />,
      );
      expect(screen.getByText("Tag")).toBeTruthy();
    });
  });

  describe("given custom accessibilityLabel", () => {
    it("then uses the custom label", () => {
      renderWithTheme(
        <Chip label="Online" accessibilityLabel="User is online" variant="success" />,
      );
      expect(screen.getByLabelText("User is online")).toBeTruthy();
    });
  });

  describe("given dark theme", () => {
    it("then renders brand chip with dark accent color", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Chip label="Active" variant="brand" />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.accent.primary);
    });

    it("then renders default chip with dark muted background", () => {
      jest
        .spyOn(require("react-native"), "useColorScheme")
        .mockReturnValue("dark");
      const { toJSON } = render(
        <ThemeProvider>
          <Chip label="Tag" />
        </ThemeProvider>,
      );
      expect(JSON.stringify(toJSON())).toContain(darkTheme.colors.bg.muted);
    });
  });
});
