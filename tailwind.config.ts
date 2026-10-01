/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Tokens do painel admin (lib/admin/tokens.ts) via CSS variables —
      // ex.: bg-surface, border-border, text-textPrimary, text-accent.
      // Tokens do tema streaming (mockup) — ex.: bg-st-bg, text-st-dim.
      colors: {
        adminBg: "var(--bg)",
        surface: "var(--surface)",
        surfaceMuted: "var(--surface-muted)",
        adminBorder: "var(--border)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        accent: "var(--accent)",
        accentMuted: "var(--accent-muted)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        "st-bg": "var(--st-bg)",
        "st-surface": "var(--st-surface)",
        "st-surface-2": "var(--st-surface-2)",
        "st-surface-3": "var(--st-surface-3)",
        "st-accent": "var(--st-accent)",
        "st-accent-warm": "var(--st-accent-warm)",
        "st-text": "var(--st-text)",
        "st-dim": "var(--st-dim)",
        "st-border": "var(--st-border)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Bebas Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};
