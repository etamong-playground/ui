/**
 * `<AppInfoSection>` — the canonical "앱 정보" card. Per user direction
 * (planning concepts/spa-navigation-state companion: app version + build
 * time live in a settings / backoffice "앱 정보" section, not in the page
 * footer), this is the consolidated layout. Wraps `<DeployInfo>` for the
 * build-version line so apps stop hand-rolling that placement.
 *
 * Use it on the `/settings` or `/console/about` route — wherever the
 * app's "About" surface lives.
 */

import type { ReactNode } from "react";
import { DeployInfo } from "./deployInfo";

export interface AppInfoLink {
  label: string;
  href: string;
  /** Default: opens in a new tab when `href` is absolute. */
  external?: boolean;
}

export interface AppInfoSectionProps {
  /** App display name (e.g. "schedule-manager", "🎪 Festplan"). */
  name?: ReactNode;
  /** Optional one-liner under the name. */
  description?: ReactNode;
  /** Optional logo / icon node to the left of the name. */
  icon?: ReactNode;
  /**
   * Semver / release version (`package.json` `version` — e.g. "1.4.2").
   * Distinct from the commit SHA, which goes through `version`.
   */
  appVersion?: string;
  /** Deployed commit SHA — forwarded to `<DeployInfo>`. */
  version?: string;
  /** Build timestamp (ISO 8601) — forwarded to `<DeployInfo>`. */
  builtAt?: string;
  /**
   * Extra link rows ("도움말", "이용약관", "개인정보처리방침"). External
   * links open in a new tab.
   */
  links?: AppInfoLink[];
  /**
   * Free-form rows under the standard fields. Use for app-specific
   * meta (plan name, quota, owner email, …).
   */
  children?: ReactNode;
  /** Section heading. Default: "앱 정보". Pass `null` to omit. */
  heading?: ReactNode | null;
  /** Extra class merged with `etu-app-info`. */
  className?: string;
}

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

export function AppInfoSection({
  name,
  description,
  icon,
  appVersion,
  version,
  builtAt,
  links,
  children,
  heading = "앱 정보",
  className,
}: AppInfoSectionProps) {
  return (
    <section className={"etu-app-info" + (className ? " " + className : "")}>
      {heading !== null && <h2 className="etu-app-info-heading">{heading}</h2>}
      <div className="etu-app-info-card">
        {(name || icon) && (
          <div className="etu-app-info-identity">
            {icon && <div className="etu-app-info-icon">{icon}</div>}
            <div className="etu-app-info-identity-text">
              {name && <div className="etu-app-info-name">{name}</div>}
              {description && (
                <div className="etu-app-info-description">{description}</div>
              )}
            </div>
          </div>
        )}
        <dl className="etu-app-info-meta">
          {appVersion && (
            <div className="etu-app-info-row">
              <dt>버전</dt>
              <dd>{appVersion}</dd>
            </div>
          )}
          {(version || builtAt) && (
            <div className="etu-app-info-row">
              <dt>빌드</dt>
              <dd>
                <DeployInfo version={version} builtAt={builtAt} />
              </dd>
            </div>
          )}
          {children}
        </dl>
        {links && links.length > 0 && (
          <div className="etu-app-info-links">
            {links.map((l) => {
              const ext = l.external ?? isExternal(l.href);
              return (
                <a
                  key={l.href}
                  className="etu-app-info-link"
                  href={l.href}
                  target={ext ? "_blank" : undefined}
                  rel={ext ? "noreferrer" : undefined}
                >
                  {l.label}
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
