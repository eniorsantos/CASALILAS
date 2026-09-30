/**
 * Design tokens do app — extraídos do mockup (mockup-telas-app.html).
 * Marca roxa em fundo escuro arroxeado; display em Bebas Neue, corpo em Inter.
 * (A spec sugeria vermelho Netflix #E50914; o mockup — referência visual
 * final — define o roxo #9B5DE5 como acento. Seguir o mockup.)
 */
export const colors = {
  background: "#1E1830",
  surface: "#2A2340",
  surfaceElevated: "#352C4D",
  border: "#453A5C",
  primary: "#9B5DE5", // CTA, badges, progresso
  primaryWarm: "#D9B8FF", // badges "EM ALTA", destaques sobre o primário
  textPrimary: "#F5F3F8",
  textSecondary: "#B3A9C2",
  textMuted: "#8E84A3",
  success: "#46D369",
  onPrimary: "#FFFFFF",
  onLightButton: "#111111",
} as const;

export const typography = {
  displayFamily: "BebasNeue",
  bodyFamily: "Inter",
  hero: { size: 30, weight: "400" as const }, // Bebas já é condensada/bold por desenho
  title: { size: 20, weight: "700" as const },
  subtitle: { size: 15, weight: "500" as const },
  body: { size: 14, weight: "400" as const },
  caption: { size: 12, weight: "400" as const },
} as const;

export type AppColors = typeof colors;
