import { defineConfig } from "tsup";

// Two configs because the bundled barrels need different module directives.
//
// - `index.ts` ships as a Next.js client module via `banner.js = '"use client";'`
//   so RSC consumers (server components) can import any export. Several
//   sub-modules call `createContext()` at module-init time and the RSC build of
//   React doesn't expose it — without the directive the barrel crashes the
//   server build. esbuild strips bare `"use client"` source directives during
//   bundling (it warns "module level directives cause errors when bundled"),
//   so `banner` is the only reliable way to land it in the output.
// - `helpers.ts` + `testing.ts` must STAY server-safe: helpers is the
//   framework-agnostic entry by contract, and testing pulls Playwright/MSW
//   which apps run in their own node test runner. No `"use client"` banner
//   on those — apply it per-config rather than globally.
const sharedEsbuildOptions = {
  external: ["react", "react-dom", "@playwright/test", "msw", "@grafana/faro-web-sdk"],
  format: ["esm", "cjs"] as const,
  dts: true,
  treeshake: true,
  esbuildOptions(options: { jsx?: string }) {
    options.jsx = "automatic";
  },
};

export default defineConfig([
  {
    ...sharedEsbuildOptions,
    entry: ["src/index.ts"],
    clean: true,
    // Two post-build steps:
    //  1. copy styles.css verbatim (separate export, not bundled).
    //  2. Prepend `"use client";` to the bundled JS/CJS so Next.js RSC
    //     consumers treat the barrel as a client module. esbuild's `banner`
    //     option strips bare `"use client"` as a "module level directive" —
    //     observed during the v0.29.1 fix — so we have to inject after
    //     bundling. node -e keeps the script dep-free.
    onSuccess:
      "cp src/styles.css dist/styles.css && " +
      'node -e \'for (const f of ["dist/index.js","dist/index.cjs"]) { const fs=require("fs"); fs.writeFileSync(f, "\\"use client\\";\\n" + fs.readFileSync(f,"utf8")); }\'',
  },
  {
    ...sharedEsbuildOptions,
    // rum stays server-safe like helpers/testing: no React, faro is an
    // optional peer kept external, and both entry points guard on
    // `typeof window`.
    entry: ["src/helpers.ts", "src/testing.ts", "src/rum.ts"],
    clean: false,
  },
]);
