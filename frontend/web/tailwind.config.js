/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Base do tema (mockup) — mesma fonte de frontend/shared/src/theme.ts
      colors: {
        "st-bg": "var(--st-bg)",
        "st-surface": "var(--st-surface)",
        "st-surface-2": "var(--st-surface-2)",
        "st-surface-3": "var(--st-surface-3)",
        "st-accent": "var(--st-accent)",
        "st-accent-warm": "var(--st-accent-warm)",
        "st-text": "var(--st-text)",
        "st-dim": "var(--st-dim)",
        "st-border": "var(--st-border)",
        "st-success": "var(--st-success)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Bebas Neue", "Impact", "sans-serif"],
      },
    },
  },
  plugins: [],
};
