import { useT } from "@etamong-playground/ui";
import { registry, srcUrl, versionUrl } from "./registry";

const NPM_PKG_URL = "https://www.npmjs.com/package/@etamong-playground/ui";

/** Compact badge row for a registry feature — renders inside .sc-card-header */
export function FeatureTag({ id }: { id: string }) {
  const t = useT();
  const entry = registry[id];
  if (!entry) return null;

  return (
    <span className="sc-feature-tag">
      <a
        href={versionUrl(entry.since)}
        className="sc-feature-tag-chip"
        target="_blank"
        rel="noreferrer"
        title={`Introduced in v${entry.since}`}
      >
        {t("versions.since")} v{entry.since}
      </a>
      <a
        href={srcUrl(entry)}
        className="sc-feature-tag-chip sc-feature-tag-chip--mono"
        target="_blank"
        rel="noreferrer"
        title="View source on GitHub"
      >
        src
      </a>
      <a
        href={NPM_PKG_URL}
        className="sc-feature-tag-chip"
        target="_blank"
        rel="noreferrer"
        title="@etamong-playground/ui on npm"
      >
        npm
      </a>
    </span>
  );
}
