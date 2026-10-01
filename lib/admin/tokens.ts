/**
 * Tokens de design do painel admin (seção 1 da especificação).
 * Tema escuro streaming por padrão (mesma identidade do mockup);
 * `.light` no <html> restaura o tema claro.
 * CSS variables correspondentes em app/globals.css; tokens Tailwind
 * (bg-surface, text-textPrimary…) mapeados em tailwind.config.ts.
 */
export const adminColors = {
  bg: "#1E1830",
  surface: "#2A2340",
  surfaceMuted: "#352C4D",
  border: "#453A5C",
  textPrimary: "#F5F3F8",
  textSecondary: "#B3A9C2",
  accent: "#9B5DE5",
  accentMuted: "#3A2E5C",
  success: "#46D369",
  warning: "#B7791F",
  danger: "#E5484D",
  light: {
    bg: "#FAFAF9",
    surface: "#FFFFFF",
    surfaceMuted: "#F2F1EF",
    border: "#E5E3E0",
    textPrimary: "#18181B",
    textSecondary: "#6B6862",
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
