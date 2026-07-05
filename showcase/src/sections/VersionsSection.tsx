import { useT } from "@etamong-playground/ui";
import { featureRoute, registry, srcUrl, versionUrl } from "../registry";

const GITHUB_TAG_BASE = "https://github.com/etamong-playground/ui/releases/tag";

function semverDesc(a: string, b: string): number {
  const [a1 = 0, a2 = 0, a3 = 0] = a.split(".").map(Number);
  const [b1 = 0, b2 = 0, b3 = 0] = b.split(".").map(Number);
  if (b1 !== a1) return b1 - a1;
  if (b2 !== a2) return b2 - a2;
  return b3 - a3;
}

export function VersionsSection({ navigate }: { navigate: (path: string) => void }) {
  const t = useT();

  // Group feature ids by since version
  const byVersion = new Map<string, string[]>();
  for (const [id, entry] of Object.entries(registry)) {
    const bucket = byVersion.get(entry.since) ?? [];
    bucket.push(id);
    byVersion.set(entry.since, bucket);
  }

  const versions = Array.from(byVersion.keys()).sort(semverDesc);

  return (
    <div className="sc-section">
      <div className="sc-prose">
        <h2>{t("section.versions")}</h2>
        <p>{t("versions.desc")}</p>
      </div>

      {versions.map((v) => {
        const ids = byVersion.get(v)!;
        const primaryUrl = versionUrl(v);
        const githubUrl = `${GITHUB_TAG_BASE}/v${v}`;
        // Show a separate GitHub link only when the primary URL is npmjs
        const showGitHub = primaryUrl.includes("npmjs.com");

        return (
          <div key={v} className="sc-versions-group">
            <div className="sc-versions-heading">
              <a
                href={primaryUrl}
                className="sc-versions-version"
                target="_blank"
                rel="noreferrer"
              >
                v{v}
              </a>
              {showGitHub && (
                <a href={githubUrl} className="sc-link-chip" target="_blank" rel="noreferrer">
                  GitHub
                </a>
              )}
            </div>

            <div className="sc-card">
              {ids.map((id, i) => {
                const entry = registry[id];
                const route = featureRoute[id];
                return (
                  <div
                    key={id}
                    className={"sc-versions-feature" + (i > 0 ? " sc-versions-feature--sep" : "")}
                  >
                    <div className="sc-versions-feature-top">
                      <span className="sc-versions-feature-label">{entry.label}</span>
                      <div className="sc-versions-feature-actions">
                        <a
                          href={srcUrl(entry)}
                          className="sc-feature-tag-chip sc-feature-tag-chip--mono"
                          target="_blank"
                          rel="noreferrer"
                          title="View source on GitHub"
                        >
                          src
                        </a>
                        {route && (
                          <button
                            type="button"
                            className="sc-feature-tag-chip"
                            onClick={() => navigate(route)}
                          >
                            {t("versions.viewDemo")} →
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="sc-versions-exports">
                      {entry.exports.map((e) => (
                        <code key={e} className="sc-versions-export">{e}</code>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
