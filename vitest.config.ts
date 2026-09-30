import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    // Um processo por arquivo: cada suíte ganha seu próprio container
    // Postgres (DATABASE_URL e singleton isolados, sem corrida entre arquivos).
    pool: "forks",
    // bcrypt (12 rounds) + containers sobem devagar sob carga — 5s estoura.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
