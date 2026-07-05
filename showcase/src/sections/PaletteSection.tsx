import { useState } from "react";
import {
  CommandPaletteTrigger,
  openCommandPalette,
  useT,
} from "@etamong-playground/ui";
import { FeatureTag } from "../FeatureTag";

export function PaletteSection() {
  const t = useT();
  const [pendingDemo, setPendingDemo] = useState<string | null>(null);

  return (
    <div className="sc-section">
      <div className="sc-prose">
        <h2>{t("section.palette")}</h2>
        <p>
          The command palette is already mounted globally — open it with{" "}
          <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>, press <kbd>/</kbd> (outside an
          input), or click the trigger below. It&apos;s wired with navigation
          actions for every section in this showcase.
        </p>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>CommandPaletteTrigger</span>
          <FeatureTag id="command-palette" />
        </div>
        <p className="sc-card-body">
          The discoverable &ldquo;Search… ⌘K&rdquo; button. Drop it in the
          sidebar or header so users find the palette. Clicking it dispatches
          the open event — no prop-drilling needed.
        </p>
        <div className="sc-demo-row">
          <CommandPaletteTrigger label={t("palette.search")} />
        </div>
        <pre className="sc-code">{`<CommandPaletteTrigger label={t("palette.search")} />`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">openCommandPalette()</div>
        <p className="sc-card-body">
          Dispatches the <code>command-palette:open</code> event from anywhere —
          use when your own UI element should trigger the palette.
        </p>
        <div className="sc-demo-row">
          <button
            type="button"
            className="etu-back-button"
            onClick={() => openCommandPalette()}
          >
            Open palette programmatically
          </button>
        </div>
        <pre className="sc-code">{`import { openCommandPalette } from "@etamong-playground/ui";
openCommandPalette();`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>useGoToShortcuts</span>
          <FeatureTag id="go-to-shortcuts" />
        </div>
        <p className="sc-card-body">
          Two-key navigation: press <kbd>g</kbd> then a letter within 1.5 s.
          Korean-IME-safe (uses <code>e.code</code> fallback). This showcase has
          these bindings active right now:
        </p>
        <div className="sc-shortcut-table">
          {[
            ["g + o", "Overview"],
            ["g + p", "Palette"],
            ["g + n", "Notifications"],
            ["g + c", "Chrome"],
            ["g + d", "Data & Time"],
            ["g + s", "State Hooks"],
            ["g + e", "Error Page"],
            ["g + a", "App Info"],
            ["g + v", "Versions"],
          ].map(([keys, label]) => (
            <div key={keys} className="sc-shortcut-row">
              <kbd className="sc-kbd">{keys}</kbd>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <div className="sc-demo-row" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="etu-copy-button"
            onMouseDown={() => setPendingDemo("g")}
            onMouseUp={() => setTimeout(() => setPendingDemo(null), 1500)}
          >
            Simulate &ldquo;g&rdquo; armed
          </button>
          {pendingDemo === "g" && (
            <span className="sc-pending-hint" aria-live="polite">
              g + …
            </span>
          )}
        </div>
        <pre className="sc-code">{`const pending = useGoToShortcuts(
  [{ key: "h", href: "#/overview" }, { key: "p", href: "#/palette" }],
  (href) => navigate(href),
);
// render \`pending\` ("g" | null) as a small indicator`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>crossLocaleKeywords</span>
          <FeatureTag id="cross-locale-keywords" />
        </div>
        <p className="sc-card-body">
          Build a cmdk <code>keywords</code> string that matches in both Korean
          and English — so searching &ldquo;알림&rdquo; or &ldquo;notifications&rdquo; both work.
        </p>
        <pre className="sc-code">{`import { crossLocaleKeywords } from "@etamong-playground/ui";

const keywords = crossLocaleKeywords(
  [ko, en],
  (d) => d.nav.notifications,
);
// → "알림 notifications" (both locales, one string)`}</pre>
      </div>
    </div>
  );
}
