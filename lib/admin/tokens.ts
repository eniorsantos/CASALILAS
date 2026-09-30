/**
 * Tokens de design do painel admin (seção 1 da especificação).
 * CSS variables correspondentes em app/globals.css; tokens Tailwind
 * (bg-surface, text-textPrimary…) mapeados em tailwind.config.ts.
 */
export const adminColors = {
  bg: "#FAFAF9",
  surface: "#FFFFFF",
  surfaceMuted: "#F2F1EF",
  border: "#E5E3E0",
  textPrimary: "#18181B",
  textSecondary: "#6B6862",
  accent: "#6D4FC7",
  accentMuted: "#EDE9FB",
  success: "#1A9C6E",
  warning: "#B7791F",
  danger: "#C0362C",
  dark: {
    bg: "#17161C",
    surface: "#201F27",
    surfaceMuted: "#2A2933",
    border: "#35333F",
    textPrimary: "#F5F4F7",
    textSecondary: "#A9A6B3",
  },
} as const;

export const adminTypography = {
  fontFamily: "Inter",
  pageTitle: { size: 22, weight: "700" },
  sectionTitle: { size: 16, weight: "600" },
  body: { size: 14, weight: "400" },
  label: { size: 12, weight: "500", color: adminColors.textSecondary },
  tableCell: { size: 13, weight: "400" },
} as const;
