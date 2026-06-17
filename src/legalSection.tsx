/**
 * Legal section primitives — the `/more` → `법률 정보 ›` → `/more/legal`
 * three-level shape used by every fleet app. See planning concept
 * `legal-section-pattern` for the rule.
 *
 * Exports:
 *
 *   useLegalAvailability(appSlug, options?)
 *     Fetches the legal hub's `/api/public-manifest` (the projection of
 *     `legal:public-list` — see `legal-hub-architecture`) and returns the
 *     doc kinds published for this app. localStorage-backed SWR: serves a
 *     cached value immediately, revalidates in the background, falls back
 *     to a stale cached value if the network fails. The top-level
 *     `법률 정보 ›` row never depends on this hook — `<LegalMenuItem>` is
 *     unconditional — so a fetch failure can never make a menu row appear
 *     or disappear.
 *
 *   <LegalMenuItem appSlug to="/more/legal">
 *     The single row that lives on `/more`. Always renders, regardless
 *     of hub state. Router-agnostic: pass `onClick` for SPA navigation,
 *     or rely on the default `<a href={to}>` for full-page nav.
 *
 *   <LegalPage appSlug>
 *     The list rendered at `/more/legal`. Driven by `useLegalAvailability`:
 *     one row per published L2 kind (terms, privacy, …) followed by the
 *     always-present L1 identity row. Each row opens
 *     `https://legal.m.etamong.com/#<anchor>` in a new tab. Empty L2 state
 *     shows the L1 row plus a muted "현재 등록된 법률 문서가 없습니다." line.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";

// ----- Constants --------------------------------------------------------

/** Production legal hub host. Override via `manifestUrl` / `hubBaseUrl` props. */
export const LEGAL_HUB_BASE_URL = "https://legal.m.etamong.com";

/** Default manifest endpoint. Override per-prop for tests / staging. */
export const LEGAL_MANIFEST_URL = `${LEGAL_HUB_BASE_URL}/api/public-manifest`;

/** Recognized L2 doc kinds. The hub may add more; unknown kinds render with a humanized label. */
export type LegalKind = "terms" | "privacy" | (string & {});

/** Fixed render order. Unknown kinds sort after these in the order the hub returned them. */
const KIND_ORDER: Record<string, number> = { terms: 1, privacy: 2 };

const DEFAULT_KIND_LABELS: Record<string, string> = {
  terms: "이용약관",
  privacy: "개인정보처리방침",
};

const SOFT_TTL_MS = 60 * 60 * 1000; // 1 hour — refetch in background
const HARD_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — discard cache

// ----- Hook -------------------------------------------------------------

export interface LegalAvailability {
  /** Doc kinds the hub reports as published for this app, in fixed render order. */
  kinds: LegalKind[];
  /** "loaded" = fresh fetch; "stale" = cached over the soft TTL; "loading" = no value yet; "error" = no cached fallback either. */
  status: "loaded" | "stale" | "loading" | "error";
  /** Force a re-fetch (e.g. after the operator publishes a new doc). */
  refresh: () => void;
}

interface CachedEntry {
  kinds: LegalKind[];
  fetchedAt: number;
}

interface ManifestResponse {
  services?: Record<string, { privacy?: boolean; terms?: boolean; identity?: boolean } & Record<string, boolean>>;
}

export interface UseLegalAvailabilityOptions {
  /** Override the manifest URL — useful for tests or self-hosted hubs. */
  manifestUrl?: string;
  /** Disable the network fetch (e.g. SSR / Storybook). The hook returns `{kinds: [], status: "loading"}`. */
  disabled?: boolean;
}

function cacheKey(appSlug: string, manifestUrl: string): string {
  return `etu:legal-availability:${manifestUrl}:${appSlug}`;
}

function readCache(key: string): CachedEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry;
    if (!Array.isArray(parsed.kinds) || typeof parsed.fetchedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, entry: CachedEntry): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Quota / private-mode — silently skip; the hook still serves the in-memory value.
  }
}

function sortKinds(kinds: LegalKind[]): LegalKind[] {
  return [...kinds].sort((a, b) => {
    const ra = KIND_ORDER[a] ?? 99;
    const rb = KIND_ORDER[b] ?? 99;
    if (ra !== rb) return ra - rb;
    return a.localeCompare(b);
  });
}

function pickKinds(manifest: ManifestResponse, appSlug: string): LegalKind[] {
  const entry = manifest.services?.[appSlug];
  if (!entry) return [];
  const out: LegalKind[] = [];
  for (const [k, v] of Object.entries(entry)) {
    if (k === "identity") continue; // L1 row is always rendered, not part of the L2 list
    if (v) out.push(k);
  }
  return sortKinds(out);
}

export function useLegalAvailability(
  appSlug: string,
  options: UseLegalAvailabilityOptions = {},
): LegalAvailability {
  const { manifestUrl = LEGAL_MANIFEST_URL, disabled = false } = options;
  const key = cacheKey(appSlug, manifestUrl);

  const initial = readCache(key);
  const initialFresh = initial !== null && Date.now() - initial.fetchedAt < HARD_TTL_MS;
  const [kinds, setKinds] = useState<LegalKind[]>(initialFresh ? initial.kinds : []);
  const [status, setStatus] = useState<LegalAvailability["status"]>(() => {
    if (disabled) return "loading";
    if (!initial) return "loading";
    if (Date.now() - initial.fetchedAt < SOFT_TTL_MS) return "loaded";
    return "stale";
  });
  const [tick, setTick] = useState(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (disabled) return;
    const cached = readCache(key);
    if (cached && Date.now() - cached.fetchedAt < SOFT_TTL_MS && tick === 0) {
      // Within soft TTL: skip the network call entirely.
      return;
    }
    let cancelled = false;
    fetch(manifestUrl, { credentials: "omit" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`manifest ${res.status}`);
        const body = (await res.json()) as ManifestResponse;
        if (cancelled || !aliveRef.current) return;
        const next = pickKinds(body, appSlug);
        setKinds(next);
        setStatus("loaded");
        writeCache(key, { kinds: next, fetchedAt: Date.now() });
      })
      .catch(() => {
        if (cancelled || !aliveRef.current) return;
        // Keep whatever the initial state was (stale cache or empty).
        setStatus((prev) => (prev === "loading" ? "error" : prev));
      });
    return () => {
      cancelled = true;
    };
  }, [appSlug, key, manifestUrl, disabled, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { kinds, status, refresh };
}

// ----- Shared row ------------------------------------------------------

interface LegalRowProps {
  icon: ReactNode;
  label: ReactNode;
  /** `›` for in-app nav, `↗` for external. */
  trailing: ReactNode;
  href: string;
  /** When set, called instead of the default link navigation. */
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  external?: boolean;
  isFirst?: boolean;
}

function LegalRow({ icon, label, trailing, href, onClick, external, isFirst }: LegalRowProps) {
  return (
    <a
      className={"etu-legal-row" + (isFirst ? "" : " etu-legal-row--divided")}
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick(e);
        }
      }}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
    >
      <span className="etu-legal-row-icon" aria-hidden>
        {icon}
      </span>
      <span className="etu-legal-row-label">{label}</span>
      <span className="etu-legal-row-trailing" aria-hidden>
        {trailing}
      </span>
    </a>
  );
}

// ----- LegalMenuItem ---------------------------------------------------

export interface LegalMenuItemProps {
  /** Hub `serviceId` — the codename slug, e.g. `alert-ops`, `xatu`. */
  appSlug: string;
  /** Route the in-app `/more/legal` page lives at. Default `/more/legal`. */
  to?: string;
  /** SPA navigation handler. Called instead of full-page navigation. */
  onNavigate?: (to: string) => void;
  /** Override the leading emoji / icon. Pass `null` to omit. */
  icon?: ReactNode | null;
  /** Override the row label. Default: `법률 정보`. */
  label?: ReactNode;
  /** Extra class merged with `etu-legal-card`. Wrap multiple `<LegalMenuItem>`s? Use the same card. */
  className?: string;
}

export function LegalMenuItem({
  appSlug: _appSlug,
  to = "/more/legal",
  onNavigate,
  icon = "⚖️",
  label = "법률 정보",
  className,
}: LegalMenuItemProps) {
  // `appSlug` is unused on the menu row itself (the L2 list lives at `/more/legal`),
  // but we keep it in the prop set so all three primitives share the same calling
  // convention — apps pass `appSlug` once into both `<LegalMenuItem>` and `<LegalPage>`.
  void _appSlug;
  return (
    <div className={"etu-legal-card" + (className ? " " + className : "")}>
      <LegalRow
        icon={icon}
        label={label}
        trailing="›"
        href={to}
        onClick={onNavigate ? () => onNavigate(to) : undefined}
        isFirst
      />
    </div>
  );
}

// ----- LegalPage -------------------------------------------------------

export interface LegalPageProps {
  /** Hub `serviceId` — the codename slug, e.g. `alert-ops`, `xatu`. */
  appSlug: string;
  /** Override the L1 identity row label. Default: `etamong 식별/SSO 안내`. */
  identityLabel?: ReactNode;
  /** Override the legal hub base URL (e.g. for staging). */
  hubBaseUrl?: string;
  /** Override per-kind row labels (extends the defaults: terms → 이용약관, privacy → 개인정보처리방침). */
  kindLabels?: Record<string, ReactNode>;
  /** Override anchor for a specific (kind) — by default `<appSlug>-<kind>`. */
  anchorOverride?: Partial<Record<string, string>>;
  /** Forwarded to `useLegalAvailability`. */
  manifestUrl?: string;
  /** Empty-state line shown when the manifest reports zero L2 kinds. */
  emptyMessage?: ReactNode;
  /** Extra class merged with the wrapping card. */
  className?: string;
}

const KIND_ICONS: Record<string, string> = {
  terms: "📄",
  privacy: "🔒",
};

export function LegalPage({
  appSlug,
  identityLabel = "etamong 식별/SSO 안내",
  hubBaseUrl = LEGAL_HUB_BASE_URL,
  kindLabels,
  anchorOverride,
  manifestUrl,
  emptyMessage = "현재 등록된 법률 문서가 없습니다.",
  className,
}: LegalPageProps) {
  const { kinds, status } = useLegalAvailability(appSlug, manifestUrl ? { manifestUrl } : undefined);

  const labelFor = (kind: string): ReactNode =>
    kindLabels?.[kind] ?? DEFAULT_KIND_LABELS[kind] ?? kind;
  const iconFor = (kind: string): ReactNode => KIND_ICONS[kind] ?? "📜";
  const anchorFor = (kind: string): string => anchorOverride?.[kind] ?? `${appSlug}-${kind}`;

  const hasL2 = kinds.length > 0;
  // The empty-state hint shows only when we KNOW the L2 set is empty — i.e. a
  // successful fetch returned nothing for this app. While loading or after an
  // unrecoverable error we render just the L1 row, no hint either way, so a
  // transient offline state doesn't read as "this app legally has nothing".
  const showEmptyHint = !hasL2 && (status === "loaded" || status === "stale");

  return (
    <div className={"etu-legal-card" + (className ? " " + className : "")}>
      {kinds.map((kind, i) => (
        <LegalRow
          key={kind}
          icon={iconFor(kind)}
          label={labelFor(kind)}
          trailing="↗"
          href={`${hubBaseUrl}/#${anchorFor(kind)}`}
          external
          isFirst={i === 0}
        />
      ))}
      <LegalRow
        icon="🪪"
        label={identityLabel}
        trailing="↗"
        href={`${hubBaseUrl}/#identity`}
        external
        isFirst={!hasL2}
      />
      {showEmptyHint && (
        <p className="etu-legal-empty" role="status">
          {emptyMessage}
        </p>
      )}
    </div>
  );
}
