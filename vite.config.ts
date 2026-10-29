import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: {
    port: 5173,
    // The browser calls /api/... on 5173; Vite forwards it to the backend.
    // Same origin in dev = no CORS problems, and the refresh cookie just works.
    proxy: {
      "/api": { target: "http://localhost:8081", changeOrigin: true },
    },
  },
});