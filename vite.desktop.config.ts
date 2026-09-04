import path from "node:path";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), viteReact()],
  root: path.resolve("desktop/renderer"),
  base: "./",
  publicDir: path.resolve("public"),
  resolve: {
    alias: {
      "@": path.resolve("src"),
    },
  },
  worker: {
    format: "es",
  },
  build: {
    outDir: path.resolve("desktop/www"),
    emptyOutDir: true,
    sourcemap: false,
    target: "es2022",
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
});
