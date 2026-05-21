import { createTheme, type MantineColorsTuple } from "@mantine/core";

/**
 * Design tokens cho toàn bộ FE.
 * Mọi màu/spacing/radius PHẢI lấy từ đây hoặc từ Mantine theme — không hardcode hex/px rời rạc.
 * Xem FRONTEND_GUIDELINES.md để biết quy tắc sử dụng.
 */

// Brand blue — tông xanh clean kiểu admin SaaS (Able Pro style). Index 6 là màu primary.
const brand: MantineColorsTuple = [
  "#e7f0ff",
  "#cfe0ff",
  "#9cc0ff",
  "#659eff",
  "#3a82ff",
  "#1f72ff",
  "#0d6bff", // primary
  "#005ae6",
  "#0050cc",
  "#0044b3",
];

export const theme = createTheme({
  primaryColor: "brand",
  primaryShade: { light: 6, dark: 7 },
  colors: {
    brand,
  },

  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  headings: {
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: "600",
  },

  defaultRadius: "md",

  // Spacing scale dùng chung (8px base). Tham chiếu bằng token, không dùng px tự do.
  spacing: {
    xs: "0.5rem", // 8
    sm: "0.75rem", // 12
    md: "1rem", // 16
    lg: "1.5rem", // 24
    xl: "2rem", // 32
  },

  radius: {
    sm: "0.375rem",
    md: "0.625rem",
    lg: "1rem",
  },

  shadows: {
    xs: "0 1px 2px rgba(15, 23, 42, 0.06)",
    sm: "0 2px 8px rgba(15, 23, 42, 0.08)",
    md: "0 6px 18px rgba(15, 23, 42, 0.08)",
  },

  // Mặc định component để toàn app nhất quán mà không phải lặp prop.
  components: {
    Card: {
      defaultProps: {
        shadow: "sm",
        radius: "md",
        withBorder: true,
        padding: "lg",
      },
    },
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    Paper: {
      defaultProps: {
        radius: "md",
      },
    },
    TextInput: {
      defaultProps: {
        radius: "md",
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: "md",
      },
    },
    Select: {
      defaultProps: {
        radius: "md",
      },
    },
  },

  other: {
    // Token bố cục dùng trong AppLayout.
    layout: {
      navbarWidth: 260,
      headerHeight: 64,
      bodyBg: "#f4f7fb",
    },
  },
});
