/**
 * PolicyChangeBanner — a hub-driven amber banner that surfaces upcoming
 * legal-document changes for the current app. Fetches `/status.json` from
 * the legal hub, filters to this app's service ID, and renders a
 * dismissible full-width strip linking to the hub page.
 *
 * Renders null when nothing is pending, the hub is unreachable, or the
 * current pending set was already dismissed.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { LEGAL_HUB_BASE_URL } from "./legalSection";

// ----- Types ---------------------------------------------------------------

interface StatusDoc {
  serviceId: string;
  kind: string;
  title: string;
  docAnchor: string;
  upcoming: { version: string; effectiveDate: string; adverse?: boolean };
}

interface StatusJson {
  today: string;
  docs: StatusDoc[];
}

export interface PolicyChangeBannerProps {
  /** Hub `serviceId` — the codename slug, e.g. `"schedule-manager"`. */
  appSlug: string;
  /** Display language. Default `"ko"`. */
  locale?: "ko" | "en";
  /** Override the legal hub origin. Default `LEGAL_HUB_BASE_URL`. */
  hubBaseUrl?: string;
  /**
   * Router-agnostic link renderer. Default: `<a target="_blank" rel="noopener noreferrer">`.
   * Pass your framework's `<Link>` component when the hub is same-origin.
   */
  renderLink?: (href: string, children: React.ReactNode) => React.ReactNode;
  /** Extra class merged with the outer banner element. */
  className?: string;
}

// ----- Constants -----------------------------------------------------------

const KIND_LABELS: Record<string, { ko: string; en: string }> = {
  privacy: { ko: "개인정보처리방침", en: "Privacy Policy" },
  terms: { ko: "이용약관", en: "Terms of Service" },
  identity: { ko: "로그인 정책", en: "Login Policy" },
};

// ----- Helpers -------------------------------------------------------------

function kindLabel(kind: string, locale: "ko" | "en"): string {
  return KIND_LABELS[kind]?.[locale] ?? kind;
}

function dismissKey(docs: StatusDoc[]): string {
  return (
    "legal-policy-notice:" +
    docs
      .map((d) => `${d.kind}@${d.upcoming.version}`)
      .sort()
      .join(",")
  );
}

function earliestDate(docs: StatusDoc[]): string {
  return docs.map((d) => d.upcoming.effectiveDate).sort()[0] ?? "";
}

function isAdverse(docs: StatusDoc[]): boolean {
  return docs.some((d) => d.upcoming.adverse === true);
}

// Subscribe stub: this store never changes — useSyncExternalStore is used
// only to get a reliable "is this rendering on the client?" signal without
// setState-in-useEffect (which the lint rule react-hooks/set-state-in-effect
// forbids for synchronous side-effects inside effects).
const subscribe = () => () => {};

// ----- Component -----------------------------------------------------------

export function PolicyChangeBanner({
  appSlug,
  locale = "ko",
  hubBaseUrl = LEGAL_HUB_BASE_URL,
  renderLink,
  className,
}: PolicyChangeBannerProps) {
  // isClient is false on the server / first render; true on subsequent client renders.
  // useSyncExternalStore with differing server/client snapshots is the canonical
  // hydration-safe gate — avoids the "setState synchronously in useEffect" lint violation.
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  const [docs, setDocs] = useState<StatusDoc[] | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`${hubBaseUrl}/status.json`, { credentials: "omit" })
      .then((r) => (r.ok ? (r.json() as Promise<StatusJson>) : Promise.reject(r.status)))
      .then((data) => {
        if (!live) return;
        setDocs((data.docs ?? []).filter((d) => d.serviceId === appSlug));
      })
      .catch(() => {
        if (live) setDocs([]);
      });
    return () => {
      live = false;
    };
  }, [appSlug, hubBaseUrl]);

  useEffect(() => {
    if (!docs || docs.length === 0) return;
    try {
      setDismissed(localStorage.getItem(dismissKey(docs)) === "1");
    } catch {
      // Private-mode / quota — treat as not dismissed.
    }
  }, [docs]);

  if (!isClient || !docs || docs.length === 0 || dismissed) return null;

  const date = earliestDate(docs);
  const adverse = isAdverse(docs);
  const docHref = `${hubBaseUrl}/#${docs[0].docAnchor}`;

  const docNames =
    locale === "ko"
      ? docs.map((d) => kindLabel(d.kind, "ko")).join("·")
      : docs.map((d) => kindLabel(d.kind, "en")).join(" and ");

  const bodyText =
    locale === "ko"
      ? adverse
        ? `${docNames}이(가) ${date}부터 변경됩니다. 이용자에게 영향이 있는 중요한 변경입니다.`
        : `${docNames}이(가) ${date}부터 변경됩니다.`
      : adverse
        ? `Important change: our ${docNames} will change on ${date}.`
        : `Our ${docNames} will change on ${date}.`;

  const linkLabel = locale === "ko" ? "자세히 보기" : "Learn more";
  const closeLabel = locale === "ko" ? "닫기" : "Dismiss";

  const link = renderLink ? (
    renderLink(docHref, linkLabel)
  ) : (
    <a href={docHref} target="_blank" rel="noopener noreferrer">
      {linkLabel}
    </a>
  );

  function handleDismiss() {
    try {
      localStorage.setItem(dismissKey(docs!), "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  return (
    <div
      role="region"
      aria-label={locale === "ko" ? "법률 정책 변경 안내" : "Policy change notice"}
      className={[
        "etu-policy-change-banner",
        adverse ? "etu-policy-change-banner--adverse" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="etu-policy-change-banner-body">
        {bodyText} {link}
      </span>
      <button
        type="button"
        className="etu-policy-change-banner-close"
        aria-label={closeLabel}
        onClick={handleDismiss}
      >
        ✕
      </button>
    </div>
  );
}
