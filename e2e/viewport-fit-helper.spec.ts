import { fleetTest as test } from "../src/testing-playwright";
import { defineViewportFitTests } from "../src/testing-viewport-fit";

// Regression guard for defineViewportFitTests: Playwright ≥ 1.38 rejects a
// non-destructured test callback ("First argument must use the object
// destructuring pattern"). A broken helper throws at registration, failing the
// whole run — so simply registering + running these IS the test. It also
// exercises the assertion end-to-end against the showcase chrome primitives.
defineViewportFitTests(test, {
  urls: ["/#/overview"],
  profiles: [{ name: "desktop-1280", viewport: { width: 1280, height: 800 } }],
});
