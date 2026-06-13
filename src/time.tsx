/**
 * Time-format helpers — the small piece every etamong-lab app reimplements.
 *
 * Two surfaces:
 *
 *  - `formatRelTime(when, now?)` — "3 minutes ago" / "3분 전" via the
 *    browser's `Intl.RelativeTimeFormat`. Locale comes from the
 *    document by default; pass `locale` to force.
 *  - `formatAbsTime(when, opts?)` — absolute formatting via
 *    `Intl.DateTimeFormat`. Defaults to a KST (`Asia/Seoul`) Korean
 *    rendering — the fleet's de-facto wall clock.
 *
 *  - `<RelTime when />` — small React component that auto-refreshes the
 *    relative label on a timer (every 30 s under a minute, every minute
 *    under an hour, then every 10 minutes). Title attribute always shows
 *    the absolute time so hovering reveals the exact timestamp.
 *
 * `when` accepts a `Date`, an ISO string, or an epoch milliseconds
 * number. Invalid inputs render to empty strings rather than throwing —
 * makes the helpers safe to use directly on partial data.
 */

import { useEffect, useState } from "react";

export type TimeLike = Date | string | number;

function toDate(when: TimeLike): Date | null {
  if (when instanceof Date) return Number.isNaN(when.getTime()) ? null : when;
  if (typeof when === "number") {
    const d = new Date(when);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof when === "string") {
    const d = new Date(when);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export interface FormatRelTimeOptions {
  /** Locale tag (e.g. "ko", "en"). Default: browser default. */
  locale?: string | string[];
  /**
   * `Intl.RelativeTimeFormat` numeric mode. Default: `"auto"` (gives
   * "yesterday" / "어제" instead of "1 day ago").
   */
  numeric?: "auto" | "always";
  /** Reference time for "now". Default: `Date.now()`. */
  now?: TimeLike;
}

const REL_STEPS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 30],
  ["month", 12],
  ["year", Infinity],
];

/**
 * Returns e.g. `"3분 전"` / `"in 2 hours"`. Empty string for invalid
 * inputs.
 */
export function formatRelTime(when: TimeLike, opts: FormatRelTimeOptions = {}): string {
  const d = toDate(when);
  if (!d) return "";
  const nowDate = opts.now !== undefined ? toDate(opts.now) : new Date();
  if (!nowDate) return "";
  const diffSec = (d.getTime() - nowDate.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(opts.locale, {
    numeric: opts.numeric ?? "auto",
  });
  let value = diffSec;
  for (const [unit, step] of REL_STEPS) {
    if (Math.abs(value) < step) return rtf.format(Math.round(value), unit);
    value /= step;
  }
  return rtf.format(Math.round(value), "year");
}

export interface FormatAbsTimeOptions {
  /** Locale tag. Default: `"ko-KR"`. */
  locale?: string | string[];
  /** Time zone. Default: `"Asia/Seoul"` (KST — the fleet's wall clock). */
  timeZone?: string;
  /** `Intl.DateTimeFormat` style preset. Default: `"datetime"`. */
  style?: "date" | "time" | "datetime" | "datetime-seconds";
  /** Custom `Intl.DateTimeFormat` options — overrides `style`. */
  formatOptions?: Intl.DateTimeFormatOptions;
  /** Wrap the result so it's tagged with the timezone (e.g. `… KST`). */
  withZoneSuffix?: boolean;
}

const STYLE_PRESETS: Record<NonNullable<FormatAbsTimeOptions["style"]>, Intl.DateTimeFormatOptions> = {
  date: { year: "numeric", month: "2-digit", day: "2-digit" },
  time: { hour: "2-digit", minute: "2-digit", hour12: false },
  datetime: {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  },
  "datetime-seconds": {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  },
};

const ZONE_SUFFIX_LABELS: Record<string, string> = {
  "Asia/Seoul": "KST",
  UTC: "UTC",
};

/**
 * Returns e.g. `"2026. 06. 13. 12:34"` in KST. Empty string for invalid
 * inputs.
 */
export function formatAbsTime(when: TimeLike, opts: FormatAbsTimeOptions = {}): string {
  const d = toDate(when);
  if (!d) return "";
  const timeZone = opts.timeZone ?? "Asia/Seoul";
  const locale = opts.locale ?? "ko-KR";
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    ...(opts.formatOptions ?? STYLE_PRESETS[opts.style ?? "datetime"]),
  };
  const out = new Intl.DateTimeFormat(locale, options).format(d);
  if (!opts.withZoneSuffix) return out;
  const suffix = ZONE_SUFFIX_LABELS[timeZone] ?? timeZone;
  return out + " " + suffix;
}

function refreshIntervalMs(diffMs: number): number {
  const abs = Math.abs(diffMs);
  if (abs < 60_000) return 15_000;
  if (abs < 3_600_000) return 60_000;
  return 10 * 60_000;
}

export interface RelTimeProps {
  /** The timestamp. */
  when: TimeLike;
  /** Forwarded to `formatRelTime`. */
  locale?: string | string[];
  /** Forwarded to `formatRelTime`. */
  numeric?: "auto" | "always";
  /**
   * Absolute-time options for the `title` attribute. Defaults to KST
   * datetime with the zone suffix.
   */
  absoluteOptions?: FormatAbsTimeOptions;
  /** Render as a different tag. Default: `<time>`. */
  as?: "time" | "span";
  /** Extra class. */
  className?: string;
}

/**
 * Auto-refreshing relative-time label. Renders as a `<time>` element
 * with `dateTime` + a `title` showing the absolute time.
 */
export function RelTime({
  when,
  locale,
  numeric,
  absoluteOptions,
  as = "time",
  className,
}: RelTimeProps) {
  const d = toDate(when);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!d) return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, refreshIntervalMs(d.getTime() - Date.now()));
    return () => window.clearInterval(id);
  }, [d?.getTime()]);
  if (!d) return null;
  const rel = formatRelTime(d, { locale, numeric });
  const abs = formatAbsTime(d, { withZoneSuffix: true, ...absoluteOptions });
  if (as === "span") {
    return (
      <span title={abs} className={className} data-tick={tick}>
        {rel}
      </span>
    );
  }
  return (
    <time dateTime={d.toISOString()} title={abs} className={className} data-tick={tick}>
      {rel}
    </time>
  );
}
