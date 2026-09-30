import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// A URL do backend (Next.js) vem de VITE_API_URL — ver .env.example
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
