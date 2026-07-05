import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

const __dirname = new URL(".", import.meta.url).pathname;

export default defineConfig({
  plugins: [react()],
  base: "./",
  resolve: {
    alias: [
      {
        find: "@etamong-playground/ui/styles.css",
        replacement: resolve(__dirname, "../src/styles.css"),
      },
      {
        find: "@etamong-playground/ui/helpers",
        replacement: resolve(__dirname, "../src/helpers.ts"),
      },
      {
        find: "@etamong-playground/ui",
        replacement: resolve(__dirname, "../src/index.ts"),
      },
    ],
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
});
