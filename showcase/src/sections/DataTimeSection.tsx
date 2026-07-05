import {
  CopyButton,
  DataTable,
  RelTime,
  formatAbsTime,
  formatRelTime,
  useClipboard,
  useT,
  type DataTableColumn,
} from "@etamong-playground/ui";

interface ExportRow {
  name: string;
  kind: string;
  description: string;
}

const EXPORTS: ExportRow[] = [
  { name: "CommandPalette", kind: "component", description: "⌘K command palette" },
  { name: "Sidebar", kind: "component", description: "Desktop nav shell" },
  { name: "MobileTabBar", kind: "component", description: "Mobile bottom bar" },
  { name: "NavigationBar", kind: "component", description: "iOS-style page bar" },
  { name: "Toaster", kind: "component", description: "Toast queue renderer" },
  { name: "toast()", kind: "function", description: "Show a transient toast" },
  { name: "uiConfirm()", kind: "function", description: "Modal confirm promise" },
  { name: "uiPrompt()", kind: "function", description: "Modal text prompt promise" },
  { name: "useRouteState", kind: "hook", description: "URL-synced in-page state" },
  { name: "useSessionState", kind: "hook", description: "sessionStorage state" },
  { name: "formatRelTime()", kind: "function", description: "Relative time string" },
  { name: "formatAbsTime()", kind: "function", description: "Absolute KST time" },
  { name: "DataTable", kind: "component", description: "Responsive table / cards" },
  { name: "CopyButton", kind: "component", description: "Copy-to-clipboard button" },
];

const now = new Date();
const times: Date[] = [
  new Date(now.getTime() - 30 * 1000),
  new Date(now.getTime() - 5 * 60 * 1000),
  new Date(now.getTime() - 2 * 60 * 60 * 1000),
  new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
  new Date(now.getTime() + 90 * 1000),
];

export function DataTimeSection() {
  const t = useT();
  const { copied, copy } = useClipboard({ toastOnSuccess: "복사됨" });

  const columns: DataTableColumn<ExportRow>[] = [
    { key: "name", label: "Export", nowrap: true },
    { key: "kind", label: "Kind", nowrap: true },
    { key: "description", label: "Description" },
  ];

  return (
    <div className="sc-section">
      <div className="sc-prose">
        <h2>{t("section.data")}</h2>
        <p>
          Tabular display, relative/absolute time formatting, and clipboard
          utilities.
        </p>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">DataTable</div>
        <p className="sc-card-body">
          At wide viewports renders a real <code>{"<table>"}</code>; below 720 px
          collapses to stacked card rows. Never <code>overflow-x: auto</code>.
          Resize this window to see the switch.
        </p>
        <DataTable
          columns={columns}
          rows={EXPORTS}
          rowKey={(r) => r.name}
          primaryColumn="name"
          emptyState={<p>No exports</p>}
        />
        <pre className="sc-code">{`<DataTable
  columns={[{ key: "name", label: "Export", nowrap: true }, …]}
  rows={items}
  rowKey={(r) => r.name}
  primaryColumn="name"
/>`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">RelTime + formatRelTime + formatAbsTime</div>
        <p className="sc-card-body">
          <code>{"<RelTime>"}</code> auto-refreshes every 15 s (under 1 min),
          every minute (under 1 hour), every 10 minutes beyond.{" "}
          <code>formatRelTime</code> and <code>formatAbsTime</code> are
          standalone functions using <code>Intl</code>.
        </p>
        <div className="sc-time-examples">
          {times.map((d, i) => (
            <div key={i} className="sc-time-row">
              <div className="sc-time-cell">
                <RelTime when={d} />
              </div>
              <code className="sc-time-cell sc-muted">
                {formatRelTime(d)}
              </code>
              <code className="sc-time-cell sc-muted">
                {formatAbsTime(d, { style: "datetime" })}
              </code>
            </div>
          ))}
        </div>
        <pre className="sc-code">{`<RelTime when={item.createdAt} />

formatRelTime("2026-06-13T03:29:00Z")
// → "3분 전"

formatAbsTime(date, { style: "datetime" })
// → "2026. 06. 13. 12:29" (KST)`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">CopyButton + useClipboard</div>
        <p className="sc-card-body">
          Token-styled copy button with success-state flip. Falls back to{" "}
          <code>execCommand("copy")</code> on non-https. Fires a toast on
          success/error by default.
        </p>
        <div className="sc-demo-row sc-demo-row--wrap">
          <div>
            <p className="sc-label">With label:</p>
            <CopyButton value="hello-world-token-abc123" />
          </div>
          <div>
            <p className="sc-label">Icon only:</p>
            <CopyButton value="hello-world-token-abc123" iconOnly ariaLabel="Copy token" />
          </div>
          <div>
            <p className="sc-label">useClipboard hook:</p>
            <button
              type="button"
              className="etu-copy-button"
              onClick={() => copy("custom-value")}
            >
              {copied ? "✓ 복사됨" : "커스텀 복사"}
            </button>
          </div>
        </div>
        <pre className="sc-code">{`<CopyButton value={token} />
<CopyButton value={slug} iconOnly ariaLabel="복사" />

const { copied, copy } = useClipboard();
<button onClick={() => copy(value)}>
  {copied ? "✓ 복사됨" : "복사"}
</button>`}</pre>
      </div>
    </div>
  );
}
