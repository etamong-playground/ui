/**
 * `<DataTable>` — house-pattern tabular display per
 * `etamong-lab/planning` wiki concept `tabular-fit-and-nowrap.md`.
 *
 * At wide viewports renders a real `<table>`. Below the configured
 * breakpoint (default 720px), or whenever the carrier element is
 * narrower than that, the rows collapse to one stacked card each
 * (the column header becomes a label, the cell value the value).
 * Never `overflow-x: auto`. Every column stays visible at every
 * viewport.
 *
 *   <DataTable
 *     columns={[
 *       { key: "name", label: "App", nowrap: true,
 *         render: a => <a href={...}>{a.slug}</a> },
 *       { key: "version", label: "Version", nowrap: true },
 *       { key: "built", label: "Built", nowrap: true,
 *         render: a => a.builtAt ?? "—" },
 *     ]}
 *     rows={apps}
 *     rowKey={a => a.slug}
 *     primaryColumn="name"
 *   />
 *
 * `primaryColumn` (default = first column) is the row's identifying
 * field. In wide mode it's just the first cell; in card mode it's
 * the card header (rendered without the label).
 */

import type { ReactNode } from "react";

export interface DataTableColumn<R> {
  /** Stable key — used for React keys and the optional render fallback. */
  key: string;
  /** Header label / card-row label. */
  label: ReactNode;
  /** Apply `white-space: nowrap` to this column's `<td>` and to the value side of the stacked card. Default false. */
  nowrap?: boolean;
  /** Render the cell for this row. Default: read `row[key]` if it's a primitive. */
  render?: (row: R) => ReactNode;
  /** Hide the column entirely (wide and narrow). Useful for conditional surfaces. */
  hidden?: boolean;
  /** Hide in narrow card mode only (e.g. action buttons that live in a separate row). */
  hiddenNarrow?: boolean;
  /** Hide in wide table mode only — rare; for fields that only make sense in the card view. */
  hiddenWide?: boolean;
  /** Optional `<th>` width hint (CSS value). */
  width?: string;
  /** Optional alignment. Default left. */
  align?: "left" | "right" | "center";
  /** Extra class merged onto both `<th>` and `<td>` for this column. */
  className?: string;
}

export interface DataTableProps<R> {
  columns: DataTableColumn<R>[];
  rows: R[];
  rowKey: (row: R, index: number) => string | number;
  /** Column key whose value is the row's primary identifier (appears as the card header). Defaults to the first non-hidden column. */
  primaryColumn?: string;
  /** Optional below-card action row (buttons). Hidden in wide mode unless rendered as a column. */
  rowActions?: (row: R) => ReactNode;
  /** Shown when `rows` is empty. */
  emptyState?: ReactNode;
  /** Extra class merged onto the outer wrapper. */
  className?: string;
  /** Force a mode. Default: container-query driven (`auto`). */
  mode?: "auto" | "wide" | "cards";
}

function getCell<R>(col: DataTableColumn<R>, row: R): ReactNode {
  if (col.render) return col.render(row);
  const v = (row as Record<string, unknown>)[col.key];
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return v as ReactNode;
}

function cellClass<R>(col: DataTableColumn<R>): string {
  const out = ["etu-dt-cell"];
  if (col.nowrap) out.push("etu-dt-nowrap");
  if (col.align && col.align !== "left") out.push(`etu-dt-align-${col.align}`);
  if (col.className) out.push(col.className);
  return out.join(" ");
}

export function DataTable<R>(props: DataTableProps<R>): ReactNode {
  const { rows, rowKey, rowActions, emptyState, className, mode = "auto" } = props;
  const cols = props.columns.filter((c) => !c.hidden);
  const primaryKey = props.primaryColumn ?? cols[0]?.key;

  const outerCls = [
    "etu-dt",
    mode === "wide" ? "etu-dt--force-wide" : "",
    mode === "cards" ? "etu-dt--force-cards" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if (rows.length === 0 && emptyState) {
    return <div className={outerCls}>{emptyState}</div>;
  }

  const wideCols = cols.filter((c) => !c.hiddenWide);
  const cardCols = cols.filter((c) => !c.hiddenNarrow);

  return (
    <div className={outerCls}>
      {/* Wide: real table */}
      <table className="etu-dt-table" role="table">
        <thead>
          <tr>
            {wideCols.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cellClass(c)}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.label}
              </th>
            ))}
            {rowActions ? <th className="etu-dt-cell etu-dt-nowrap" aria-label="actions" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={rowKey(row, i)}>
              {wideCols.map((c) => (
                <td key={c.key} className={cellClass(c)}>
                  {getCell(c, row)}
                </td>
              ))}
              {rowActions ? (
                <td className="etu-dt-cell etu-dt-nowrap etu-dt-actions">
                  {rowActions(row)}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Narrow: row-per-field cards */}
      <ul className="etu-dt-cards" role="list">
        {rows.map((row, i) => {
          const primary = primaryKey
            ? cardCols.find((c) => c.key === primaryKey)
            : undefined;
          const rest = cardCols.filter((c) => c.key !== primaryKey);
          return (
            <li key={rowKey(row, i)} className="etu-dt-card">
              {primary ? (
                <div className="etu-dt-card-header">{getCell(primary, row)}</div>
              ) : null}
              <dl className="etu-dt-card-fields">
                {rest.map((c) => (
                  <div key={c.key} className="etu-dt-card-field">
                    <dt className="etu-dt-card-label">{c.label}</dt>
                    <dd className={"etu-dt-card-value" + (c.nowrap ? " etu-dt-nowrap" : "")}>
                      {getCell(c, row)}
                    </dd>
                  </div>
                ))}
              </dl>
              {rowActions ? (
                <div className="etu-dt-card-actions">{rowActions(row)}</div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
