import { defineConfig } from "tsup";

export default defineConfig({
  // helpers.ts is a second entry: pure framework-agnostic helpers (cross-locale
  // keywords, theme/no-flash script) so a non-React runtime can import them
  // without pulling in React or cmdk.
  entry: ["src/index.ts", "src/helpers.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  external: ["react", "react-dom"],
  // styles.css is a separate, opt-in export — copy it verbatim into dist.
  onSuccess: "cp src/styles.css dist/styles.css",
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
});
