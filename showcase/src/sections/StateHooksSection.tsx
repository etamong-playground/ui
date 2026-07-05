import { useRouteState, useSessionState, useT } from "@etamong-playground/ui";

const TABS = ["overview", "details", "activity"] as const;
type Tab = (typeof TABS)[number];

export function StateHooksSection() {
  const t = useT();
  const [tab, setTab] = useRouteState<Tab>("tab", "overview", {
    serialize: (v) => v,
    deserialize: (raw) => (TABS.includes(raw as Tab) ? (raw as Tab) : "overview"),
  });
  const [count, setCount] = useSessionState<number>("demo-count", 0);

  return (
    <div className="sc-section">
      <div className="sc-prose">
        <h2>{t("section.state")}</h2>
        <p>
          Two router-agnostic hooks for the "F5 keeps me on this view with the
          same tab/filter/sort selected" requirement.
        </p>
        <ul>
          <li>
            <code>useRouteState</code> — URL query string. Restores on refresh,
            syncs with browser back/forward.
          </li>
          <li>
            <code>useSessionState</code> — <code>sessionStorage</code>, keyed
            per route. Never enters the URL.
          </li>
        </ul>
        <p>
          Both work with hash routers. <code>useRouteState</code> writes to the
          regular query string (<code>?tab=details#/state</code>) when the hash
          route has no <code>?</code>.
        </p>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">useRouteState — tab persisted in URL</div>
        <p className="sc-card-body">
          Select a tab, then refresh — the tab is restored from the URL.
          Check the address bar for <code>?tab=…</code>.
        </p>
        <div className="sc-tabs">
          {TABS.map((id) => (
            <button
              key={id}
              type="button"
              className={"sc-tab" + (tab === id ? " sc-tab--active" : "")}
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
            >
              {id}
            </button>
          ))}
        </div>
        <div className="sc-tab-content">
          <p>Active tab: <strong>{tab}</strong></p>
          <p className="sc-muted">This value survives a page refresh and is restored from the URL.</p>
        </div>
        <pre className="sc-code">{`const [tab, setTab] = useRouteState("tab", "overview", {
  serialize: (v) => v,               // plain string — no quotes in URL
  deserialize: (raw) => raw as Tab,
});`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">useSessionState — counter per session</div>
        <p className="sc-card-body">
          Backed by <code>sessionStorage</code>, keyed to this route. Survives
          an in-session navigation away and back. Cleared when the browser tab
          is closed.
        </p>
        <div className="sc-demo-row">
          <button
            type="button"
            className="sc-btn"
            onClick={() => setCount((c) => c - 1)}
          >
            −
          </button>
          <span className="sc-count">{count}</span>
          <button
            type="button"
            className="sc-btn"
            onClick={() => setCount((c) => c + 1)}
          >
            +
          </button>
          <button
            type="button"
            className="sc-btn"
            onClick={() => setCount(0)}
          >
            Reset
          </button>
        </div>
        <p className="sc-card-body sc-muted">
          Navigate away and back — the count is preserved within this session.
        </p>
        <pre className="sc-code">{`const [count, setCount] = useSessionState("count", 0);
// functional updater form works too:
setCount((prev) => prev + 1);`}</pre>
      </div>
    </div>
  );
}
