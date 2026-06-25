import { useEffect, useState } from "react";
import { openCommandPalette } from "./keywords";

export interface CommandPaletteTriggerProps {
  /** Visible placeholder-style label, e.g. "Search…". */
  label?: string;
  /** Extra class merged with `etu-palette-trigger`. */
  className?: string;
}

/**
 * A search-box-styled button that opens the command palette — so users discover
 * it exists. Shows a magnifier + label + the ⌘K / Ctrl+K hint and dispatches the
 * `command-palette:open` event. Styled from @etamong-playground/ui tokens; drop it in a
 * sidebar/header.
 */
export function CommandPaletteTrigger({ label = "Search…", className }: CommandPaletteTriggerProps) {
  const [isMac, setIsMac] = useState(false);
  useEffect(() => {
    const p = (navigator.platform || navigator.userAgent || "").toLowerCase();
    setIsMac(/mac|iphone|ipad|ipod/.test(p));
  }, []);

  return (
    <button
      type="button"
      onClick={() => openCommandPalette()}
      className={"etu-palette-trigger" + (className ? " " + className : "")}
      aria-label={label}
    >
      <svg
        className="etu-palette-trigger-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <span className="etu-palette-trigger-label">{label}</span>
      <kbd className="etu-palette-trigger-kbd">{isMac ? "⌘" : "Ctrl+"}K</kbd>
    </button>
  );
}
