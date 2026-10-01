/**
 * Base do tema para TODO o frontend (mockup-telas-app.html).
 * Fonte única de verdade para web/Vite; o Next.js espelha via CSS vars
 * (app/globals.css `.theme-streaming`) e o mobile em `src/theme/tokens.ts`.
 * Paleta: fundo roxo-escuro, acento roxo, display Bebas Neue + corpo Inter.
 */
export const themeColors = {
  bg: "#1E1830",
  surface: "#2A2340",
  surface2: "#352C4D",
  surface3: "#453A5C",
  accent: "#9B5DE5",
  accentWarm: "#D9B8FF",
  text: "#F5F3F8",
  dim: "#B3A9C2",
  border: "#453A5C",
  success: "#46D369",
} as const;

export type ThemeColorName = keyof typeof themeColors;

export const themeTypography = {
  displayFamily: "Bebas Neue",
  bodyFamily: "Inter",
  hero: { size: 30, weight: 400 },
  title: { size: 20, weight: 700 },
  subtitle: { size: 15, weight: 500 },
  body: { size: 14, weight: 400 },
  caption: { size: 12, weight: 400 },
} as const;

/** Gradientes de fallback dos tiles (g1..g6 do mockup), pares [de, para]. */
export const tileGradients: Array<readonly [string, string]> = [
  ["#6A2C91", "#2B0F3D"],
  ["#4A3F91", "#1A1730"],
  ["#7C3AAD", "#2E1240"],
  ["#5B3E9E", "#201735"],
  ["#8B4FC9", "#2A1440"],
  ["#9B3FA0", "#2E0F35"],
] as const;
