import { createTheme, type MantineColorsTuple } from "@mantine/core";

/**
 * THEME — phong cách thể thao, năng động, trẻ trung.
 * Mọi màu/spacing/radius lấy từ đây. Xem BOOKING_UI_GUIDELINES.md để biết quy tắc.
 */

// Primary: emerald dịu — thể thao nhưng ôn hòa, không chói. Index 6 = primary.
const brand: MantineColorsTuple = [
  "#e9f7f0",
  "#cdeadd",
  "#a6dcc4",
  "#79caa6",
  "#4fb98b",
  "#2faa77",
  "#1f9d6b", // primary
  "#17855a",
  "#126e4a",
  "#0c5739",
];

// Accent: coral ấm, dịu — CTA nổi bật mà không gắt.
const accent: MantineColorsTuple = [
  "#fcefec",
  "#f7d7cf",
  "#efb3a4",
  "#e88e76",
  "#e2704f",
  "#dd5e3a",
  "#d4542f", // accent
  "#bd4a29",
  "#a64022",
  "#8f361c",
];

export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: { light: 6, dark: 5 },
  colors: { brand, accent },

  fontFamily:
    "Poppins, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  headings: {
    fontFamily: "Poppins, Inter, sans-serif",
    fontWeight: "700",
  },

  defaultRadius: "lg",

  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
  },

  // Bóng đổ mềm, trung tính (chỉ phớt nhẹ tông xanh) để không gắt.
  shadows: {
    xs: "0 1px 3px rgba(18, 70, 50, 0.06)",
    sm: "0 4px 14px rgba(18, 70, 50, 0.07)",
    md: "0 10px 28px rgba(18, 70, 50, 0.09)",
    lg: "0 18px 44px rgba(18, 70, 50, 0.11)",
  },

  components: {
    Button: {
      defaultProps: { radius: "xl" }, // nút bo tròn pill — trẻ trung, thể thao
    },
    Card: {
      defaultProps: { radius: "lg", shadow: "sm", padding: "lg" },
    },
    Badge: {
      defaultProps: { radius: "sm" },
    },
  },

  other: {
    gradients: {
      hero: "linear-gradient(135deg, #126e4a 0%, #1f9d6b 60%, #2faa77 100%)",
      accent: "linear-gradient(135deg, #d4542f 0%, #e2704f 100%)",
    },
  },
});
