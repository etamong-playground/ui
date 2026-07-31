import { useEffect, useState } from "react";
import { useT } from "@etamong-playground/ui";

interface TokenRow {
  name: string;
  label: string;
}

const NEUTRAL_TOKENS: TokenRow[] = [
  { name: "--etu-bg", label: "bg" },
  { name: "--etu-surface", label: "surface" },
  { name: "--etu-surface-2", label: "surface-2" },
  { name: "--etu-surface-3", label: "surface-3" },
  { name: "--etu-border", label: "border" },
  { name: "--etu-border-strong", label: "border-strong" },
  { name: "--etu-text", label: "text" },
  { name: "--etu-text-muted", label: "text-muted" },
  { name: "--etu-text-subtle", label: "text-subtle" },
];

const ACCENT_TOKENS: TokenRow[] = [
  { name: "--etu-accent", label: "accent" },
  { name: "--etu-accent-strong", label: "accent-strong" },
  { name: "--etu-accent-text", label: "accent-text" },
  { name: "--etu-on-accent", label: "on-accent" },
  { name: "--etu-accent-soft", label: "accent-soft" },
];

const STATUS_TOKENS: TokenRow[] = [
  { name: "--etu-ok", label: "ok" },
  { name: "--etu-ok-soft", label: "ok-soft" },
  { name: "--etu-warn", label: "warn" },
  { name: "--etu-warn-soft", label: "warn-soft" },
  { name: "--etu-err", label: "err" },
  { name: "--etu-err-soft", label: "err-soft" },
];

const TYPE_SCALE_TOKENS: TokenRow[] = [
  { name: "--etu-fs-caption", label: "fs-caption" },
  { name: "--etu-fs-sm", label: "fs-sm" },
  { name: "--etu-fs-base", label: "fs-base" },
  { name: "--etu-fs-md", label: "fs-md" },
  { name: "--etu-fs-lg", label: "fs-lg" },
  { name: "--etu-fs-xl", label: "fs-xl" },
  { name: "--etu-fs-2xl", label: "fs-2xl" },
  { name: "--etu-fs-3xl", label: "fs-3xl" },
];

const SPACE_TOKENS: TokenRow[] = [
  { name: "--etu-space-1", label: "space-1" },
  { name: "--etu-space-2", label: "space-2" },
  { name: "--etu-space-3", label: "space-3" },
  { name: "--etu-space-4", label: "space-4" },
  { name: "--etu-space-5", label: "space-5" },
  { name: "--etu-space-6", label: "space-6" },
  { name: "--etu-space-7", label: "space-7" },
  { name: "--etu-space-8", label: "space-8" },
];

const SAMPLE_TEXT = "여정 Journey 0123";

function useComputedVars(names: readonly string[]): Record<string, string> {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      const next: Record<string, string> = {};
      for (const name of names) next[name] = cs.getPropertyValue(name).trim();
      setValues(next);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => mo.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [names.join(",")]);

  return values;
}

function PaletteRow({ tokens, values }: { tokens: TokenRow[]; values: Record<string, string> }) {
  return (
    <div className="sc-token-grid">
      {tokens.map((tok) => (
        <div className="sc-token-swatch" key={tok.name}>
          <div className="sc-token-color" style={{ background: `var(${tok.name})` }} />
          <code className="sc-token-name">{tok.name}</code>
          <span className="sc-token-value">{values[tok.name] || "…"}</span>
        </div>
      ))}
    </div>
  );
}

export function TokensSection() {
  const t = useT();
  const allNames = [
    ...NEUTRAL_TOKENS,
    ...ACCENT_TOKENS,
    ...STATUS_TOKENS,
    ...TYPE_SCALE_TOKENS,
    ...SPACE_TOKENS,
  ].map((tok) => tok.name);
  const values = useComputedVars(allNames);

  return (
    <div className="sc-section">
      <div className="sc-prose">
        <h2>{t("section.tokens")}</h2>
        <p>
          The v0.42 token system, read live off <code>getComputedStyle</code> — toggle
          theme (sidebar footer / nav bar) to see every value below update. Override{" "}
          <code>--etu-accent</code> on your app root and every <code>-soft</code> tint and{" "}
          <code>--etu-ring</code> cascade with it via <code>color-mix()</code>.
        </p>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>Neutrals</span>
        </div>
        <PaletteRow tokens={NEUTRAL_TOKENS} values={values} />
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>Accent</span>
        </div>
        <PaletteRow tokens={ACCENT_TOKENS} values={values} />
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>Status</span>
        </div>
        <PaletteRow tokens={STATUS_TOKENS} values={values} />
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>Type scale — <code>--etu-fs-*</code></span>
        </div>
        <div className="sc-typescale-list">
          {TYPE_SCALE_TOKENS.map((tok) => (
            <div className="sc-typescale-row" key={tok.name}>
              <code className="sc-typescale-token">{tok.name}</code>
              <span className="sc-typescale-value sc-muted">{values[tok.name] || "…"}</span>
              <span className="sc-typescale-sample" style={{ fontSize: `var(${tok.name})` }}>
                {SAMPLE_TEXT}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>Spacing scale — <code>--etu-space-*</code></span>
        </div>
        <div className="sc-spacing-list">
          {SPACE_TOKENS.map((tok) => (
            <div className="sc-spacing-row" key={tok.name}>
              <code className="sc-spacing-token">{tok.name}</code>
              <span className="sc-spacing-value sc-muted">{values[tok.name] || "…"}</span>
              <div className="sc-spacing-bar-track">
                <div className="sc-spacing-bar" style={{ width: `var(${tok.name})` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>Soft tints + <code>.etu-caption</code> / <code>.etu-tnum</code></span>
        </div>
        <p className="sc-card-body">
          Status badges pair a <code>-soft</code> background with the matching solid
          text color; the counter uses <code>.etu-tnum</code> (tabular-nums) so it
          doesn't jitter the row width as digits change.
        </p>
        <div className="sc-demo-row sc-demo-row--wrap">
          <span className="sc-badge sc-badge--accent">accent-soft</span>
          <span className="sc-badge sc-badge--ok">ok-soft</span>
          <span className="sc-badge sc-badge--warn">warn-soft</span>
          <span className="sc-badge sc-badge--err">err-soft</span>
          <span className="etu-caption">.etu-caption label text</span>
          <span className="etu-tnum sc-tnum-demo">01,234,567</span>
        </div>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span><code>.etu-page-col</code> widths</span>
        </div>
        <p className="sc-card-body">
          Centered content column at the page-width contract — narrow for focused
          forms, default for prose/detail pages, wide for tables.
        </p>
        <div className="sc-pagecol-track">
          <div className="etu-page-col etu-page-col--narrow sc-pagecol-demo">
            narrow · --etu-page-w-narrow (520px)
          </div>
          <div className="etu-page-col sc-pagecol-demo">
            default · --etu-page-w (680px)
          </div>
          <div className="etu-page-col etu-page-col--wide sc-pagecol-demo">
            wide · --etu-page-w-wide (1080px)
          </div>
        </div>
      </div>
    </div>
  );
}
