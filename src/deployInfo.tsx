/**
 * Build-version + deploy-time badge. Apps bake the deployed commit SHA and the
 * build timestamp into their frontend at build time (CI build-arg →
 * `VITE_BUILD_SHA`/`NEXT_PUBLIC_BUILD_SHA` etc.) and render this in a
 * backoffice/console footer so operators can see *what* is live and *when* it
 * shipped. Styled from the @etamong-playground/ui tokens.
 */

export interface DeployInfoProps {
  /** Deployed commit SHA (full or short). Displayed shortened to 7 chars. */
  version?: string;
  /** ISO-8601 build/deploy timestamp. Rendered relative; absolute in the tooltip. */
  builtAt?: string;
  /** Leading label. Default "deployed". */
  label?: string;
  /** If set, the version renders as a link (e.g. the commit URL). */
  href?: string;
  /** Extra class merged with `etu-deploy-info`. */
  className?: string;
}

import { formatRelTime, formatAbsTime } from "./time";

/**
 * Renders e.g. `deployed a1b2c3d · 2 days ago`. Returns null when neither a
 * version nor a timestamp is available (e.g. a local dev build), so callers can
 * mount it unconditionally.
 */
export function DeployInfo({ version, builtAt, label = "deployed", href, className }: DeployInfoProps) {
  if (!version && !builtAt) return null;

  const short = version ? version.slice(0, 7) : null;
  const rel = builtAt ? formatRelTime(builtAt) : null;
  const title = [
    version && `commit ${version}`,
    builtAt && `built ${formatAbsTime(builtAt, { withZoneSuffix: true })}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <span className={"etu-deploy-info" + (className ? " " + className : "")} title={title || undefined}>
      <span className="etu-deploy-info-label">{label}</span>
      {short &&
        (href ? (
          <a className="etu-deploy-info-ver" href={href} target="_blank" rel="noreferrer">
            {short}
          </a>
        ) : (
          <code className="etu-deploy-info-ver">{short}</code>
        ))}
      {rel && <span className="etu-deploy-info-time">· {rel}</span>}
    </span>
  );
}
