import {
  AppInfoSection as LibAppInfoSection,
  DeployInfo,
  useT,
} from "@etamong-playground/ui";
import { FeatureTag } from "../FeatureTag";

const BUILD_SHA = import.meta.env.VITE_BUILD_SHA;
const BUILD_TIME = import.meta.env.VITE_BUILD_TIME;

export function AppInfoSection() {
  const t = useT();

  return (
    <div className="sc-section">
      <div className="sc-prose">
        <h2>{t("section.appinfo")}</h2>
        <p>
          The canonical app-info card for settings / backoffice routes. Wraps{" "}
          <code>{"<DeployInfo>"}</code> for the build-version row so apps stop
          hand-rolling that placement. Not a global footer.
        </p>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>AppInfoSection</span>
          <FeatureTag id="app-info-section" />
        </div>
        <LibAppInfoSection
          name="@etamong-playground/ui"
          description="Shared React frontend scaffold for etamong-lab apps"
          appVersion="0.49.0"
          version={BUILD_SHA}
          builtAt={BUILD_TIME}
          links={[
            { label: "GitHub", href: "https://github.com/etamong-playground/ui" },
            { label: "npm (GitHub Packages)", href: "https://github.com/etamong-playground/ui/pkgs/npm/ui" },
          ]}
        />
        <pre className="sc-code">{`<AppInfoSection
  name="schedule-manager"
  description="회의실 예약 관리 시스템"
  appVersion={pkg.version}
  version={import.meta.env.VITE_BUILD_SHA}
  builtAt={import.meta.env.VITE_BUILD_TIME}
  links={[{ label: "도움말", href: "/help" }]}
/>`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>DeployInfo (standalone)</span>
          <FeatureTag id="deploy-info" />
        </div>
        <p className="sc-card-body">
          Renders <code>deployed &lt;sha7&gt; · &lt;rel time&gt;</code>. Returns{" "}
          <code>null</code> when neither <code>version</code> nor{" "}
          <code>builtAt</code> is set — safe to mount unconditionally. In local
          dev these env vars are unset, so this badge is invisible there.
        </p>
        <div className="sc-demo-row">
          {BUILD_SHA || BUILD_TIME ? (
            <DeployInfo version={BUILD_SHA} builtAt={BUILD_TIME} />
          ) : (
            <span className="sc-muted">
              (not set in local dev — rendered as null)
            </span>
          )}
        </div>
        <pre className="sc-code">
          {"// CI sets these env vars before the Vite build:\n" +
            "// VITE_BUILD_SHA=${{ github.sha }}\n" +
            "// VITE_BUILD_TIME=${{ github.event.head_commit.timestamp }}\n" +
            "\n" +
            "<DeployInfo\n" +
            "  version={import.meta.env.VITE_BUILD_SHA}\n" +
            "  builtAt={import.meta.env.VITE_BUILD_TIME}\n" +
            "/>"}
        </pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">Not demoed here</div>
        <ul className="sc-card-body">
          <li>
            <strong>createFetch / HttpError</strong> — requires a backend API
            endpoint. See the README.
          </li>
          <li>
            <strong>useMe / signIn / signOut</strong> — requires{" "}
            <code>oauth2-proxy</code>. Mocked in the Chrome section's UserMenu
            demo.
          </li>
          <li>
            <strong>AdminGate / AdminBadge / BackofficeLayout</strong> — requires
            authenticated <code>me.is_admin</code>. See the README.
          </li>
          <li>
            <strong>registerServiceWorker / networkFirstSwSource</strong> —
            requires a service worker file and HTTPS. See the README.
          </li>
          <li>
            <strong>InstallBanner</strong> — requires the{" "}
            <code>beforeinstallprompt</code> event (Chrome/Android only) or iOS
            Safari. See the README.
          </li>
          <li>
            <strong>NotificationBell, DocsHub, LegalSection</strong> — network-bound;
            require fleet infrastructure endpoints. See the README.
          </li>
          <li>
            <strong>AuthGate / useIdentity / fleet auth</strong> — requires the
            unified <code>/auth/*</code> + <code>/api/me</code> fleet
            endpoints. See the README.
          </li>
        </ul>
      </div>
    </div>
  );
}
