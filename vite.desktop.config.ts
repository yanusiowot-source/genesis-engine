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
      "@tanstack/react-start/server": path.resolve("desktop/start-stub.ts"),
      "@tanstack/react-start": path.resolve("desktop/start-stub.ts"),
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
    modulePreload: {
      resolveDependencies: (_filename: string, deps: string[]) =>
        deps.filter(
          (d) =>
            !/(?:research-|languages-|packs-|hud-packs-|settings-packs-|locales\/one|nfw-bytes-|three\.module|pptxgen|OrbitControls)/.test(
              d,
            ),
        ),
    },
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "copy",
              test: /[\\/]src[\\/]lib[\\/]universe[\\/](?:i18n|i18n-be|copy-merge)/,
              priority: 20,
            },
            {
              name: "sky",
              test: /[\\/]galaxy-canvas/,
              priority: 15,
            },
            {
              name: "lucide",
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              priority: 12,
            },
          ],
        },
      },
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8080,
  },
});
