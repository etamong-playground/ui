import { useEffect, useState } from "react";
import { useT } from "@etamong-playground/ui";

interface EtuVar {
  name: string;
  value: string;
}

function isColorValue(v: string): boolean {
  return typeof CSS !== "undefined" && CSS.supports("color", v.trim());
}

function isLengthValue(v: string): boolean {
  return /^-?\d*\.?\d+(px|rem|em)$/.test(v.trim());
}

function getEtuVars(): EtuVar[] {
  const result: EtuVar[] = [];
  try {
    const cs = getComputedStyle(document.documentElement);
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSStyleRule && rule.selectorText === ":root") {
            const style = rule.style;
            for (let i = 0; i < style.length; i++) {
              const name = style[i];
              if (name.startsWith("--etu-") && !name.includes("-cmdk-") && !name.includes("-navbar-chevron")) {
                result.push({ name, value: cs.getPropertyValue(name).trim() });
              }
            }
          }
        }
      } catch {
        // Cross-origin sheets are inaccessible — skip
      }
    }
  } catch {
    // SSR or permission error
  }
  return result;
}

function TokenSwatch({ name, value }: EtuVar) {
  if (isColorValue(value)) {
    return (
      <div className="sc-token-swatch">
        <div className="sc-token-color" style={{ background: `var(${name})` }} />
        <code className="sc-token-name">{name}</code>
        <span className="sc-token-value">{value}</span>
      </div>
    );
  }
  if (isLengthValue(value)) {
    return (
      <div className="sc-token-swatch">
        <div className="sc-token-radius" style={{ borderRadius: `var(${name})` }} />
        <code className="sc-token-name">{name}</code>
        <span className="sc-token-value">{value}</span>
      </div>
    );
  }
  return (
    <div className="sc-token-swatch sc-token-swatch--text">
      <code className="sc-token-name">{name}</code>
      <span className="sc-token-value">{value}</span>
    </div>
  );
}

export function Overview({ navigate }: { navigate: (id: string) => void }) {
  const t = useT();
  const [etuVars, setEtuVars] = useState<EtuVar[]>([]);

  useEffect(() => {
    const read = () => setEtuVars(getEtuVars());
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  const swatchVars = etuVars.filter((v) => isColorValue(v.value) || isLengthValue(v.value));
  const textVars = etuVars.filter((v) => !isColorValue(v.value) && !isLengthValue(v.value));

  return (
    <div className="sc-section">
      <div className="sc-prose">
        <h2>{t("section.overview")}</h2>
        <p>
          This site is the living showcase for{" "}
          <a
            href="https://github.com/etamong-playground/ui"
            target="_blank"
            rel="noreferrer"
          >
            @etamong-playground/ui
          </a>
          {" "}— a shared React frontend scaffold for a personal homelab app fleet.
          The site itself <em>dogfoods the library</em>: the sidebar, mobile tab bar,
          navigation bar, command palette, theme system, and i18n provider you see
          right now are all library components.
        </p>
        <ul>
          <li>Open the command palette with <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd> or press <kbd>/</kbd></li>
          <li>Use <kbd>g</kbd> + a letter to jump sections (g+o overview, g+p palette, g+n notifications…)</li>
          <li>Toggle theme and language in the sidebar footer (desktop) or nav bar (mobile)</li>
        </ul>
        <div className="sc-links">
          <a
            className="sc-link-chip"
            href="https://github.com/etamong-playground/ui"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          <a
            className="sc-link-chip"
            href="https://github.com/etamong-playground/ui/pkgs/npm/ui"
            target="_blank"
            rel="noreferrer"
          >
            npm (GitHub Packages)
          </a>
        </div>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">Quick navigation</div>
        <div className="sc-nav-grid">
          {(
            [
              ["palette", "Command Palette & Shortcuts"],
              ["composition", "Page Composition & Settings"],
              ["notifications", "Notifications"],
              ["chrome", "Chrome (shell, identity, back, empty)"],
              ["data", "Data & Time"],
              ["state", "State Hooks"],
              ["error", "Error Page"],
              ["appinfo", "App Info & DeployInfo"],
            ] as [string, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className="sc-nav-chip"
              onClick={() => navigate(`#/${id}`)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {swatchVars.length > 0 && (
        <div className="sc-card">
          <div className="sc-card-header">
            Design tokens — <code>--etu-*</code> colors & radii ({swatchVars.length})
          </div>
          <div className="sc-token-grid">
            {swatchVars.map((v) => (
              <TokenSwatch key={v.name} {...v} />
            ))}
          </div>
        </div>
      )}

      {textVars.length > 0 && (
        <div className="sc-card">
          <div className="sc-card-header">
            Design tokens — other ({textVars.length})
          </div>
          <div className="sc-token-list">
            {textVars.map((v) => (
              <TokenSwatch key={v.name} {...v} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
