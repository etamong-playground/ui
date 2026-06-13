/**
 * `<DocsHub>` — in-app docs surface with optional LLM skill download.
 *
 * Apps drop in a sectioned reference doc (시작하기 / 사이트 배포 / 콘솔 / ...)
 * plus a one-file Claude-skill artifact users can download to drive their
 * own LLM (Claude Code, Codex, etc.) against the app's API/console.
 *
 * Router-agnostic: section state is internal by default, controllable via
 * `sectionId` + `onSectionChange` if the consumer wants to put it in the URL.
 *
 * Status: alpha (>=0.20.0-alpha) — API may change. Pages is the pilot
 * consumer; once stable, fan out + drop the `-alpha` tag.
 */

import { useState, type ReactNode } from "react";

export interface DocsHubSection {
  /** Stable key used in the left nav + as the section anchor. */
  id: string;
  /** Sidebar label. */
  label: ReactNode;
  /** Optional one-line summary shown under the section heading. */
  summary?: ReactNode;
  /** Body content — apps supply their own JSX (or rendered markdown). */
  content: ReactNode;
}

export interface DocsHubSkill {
  /** Skill slug — used as the download filename `<name>.md`. */
  name: string;
  /** One-line description (skill frontmatter `description:`). */
  description: string;
  /** The skill body in markdown. */
  body: string;
  /** Optional CTA label override. Default: "📥 Claude skill 받기". */
  buttonLabel?: ReactNode;
}

export interface DocsHubProps {
  /** App display name shown in the page head (left of the skill button). */
  appName?: ReactNode;
  /** Optional sub-heading under `appName`. */
  description?: ReactNode;
  /** Section list. At least one section. */
  sections: DocsHubSection[];
  /** Skill artifact downloaded by the top-right button. Omit to hide it. */
  skill?: DocsHubSkill;
  /** Controlled active section. Pair with `onSectionChange`. */
  sectionId?: string;
  /** Active-section callback (controlled mode). */
  onSectionChange?: (id: string) => void;
  /** Initial section id (uncontrolled). Default: first section. */
  defaultSectionId?: string;
  /** Extra class merged with `etu-docs-hub`. */
  className?: string;
}

function buildSkillMarkdown(skill: DocsHubSkill): string {
  // Standard Claude-skill envelope: name/description frontmatter, then body.
  const fm = `---\nname: ${skill.name}\ndescription: ${skill.description.replace(/\n/g, " ")}\n---`;
  const body = skill.body.trim();
  return `${fm}\n\n${body}\n`;
}

function downloadSkill(skill: DocsHubSkill): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([buildSkillMarkdown(skill)], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${skill.name}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function DocsHub({
  appName,
  description,
  sections,
  skill,
  sectionId,
  onSectionChange,
  defaultSectionId,
  className,
}: DocsHubProps) {
  const first = sections[0]?.id ?? "";
  const [uncontrolled, setUncontrolled] = useState(defaultSectionId ?? first);
  const activeId = sectionId ?? uncontrolled;
  const active = sections.find((s) => s.id === activeId) ?? sections[0];

  const select = (id: string) => {
    if (sectionId === undefined) setUncontrolled(id);
    onSectionChange?.(id);
  };

  return (
    <div className={"etu-docs-hub" + (className ? " " + className : "")}>
      <header className="etu-docs-hub-head">
        <div className="etu-docs-hub-head-text">
          {appName && <h1 className="etu-docs-hub-app-name">{appName}</h1>}
          {description && <p className="etu-docs-hub-description">{description}</p>}
        </div>
        {skill && (
          <button
            type="button"
            className="etu-docs-hub-skill-btn"
            onClick={() => downloadSkill(skill)}
            title={`${skill.name}.md`}
          >
            {skill.buttonLabel ?? "📥 Claude skill 받기"}
          </button>
        )}
      </header>
      <div className="etu-docs-hub-body">
        <nav className="etu-docs-hub-nav" aria-label="문서 섹션">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className={
                "etu-docs-hub-nav-item" +
                (s.id === active?.id ? " etu-docs-hub-nav-item--active" : "")
              }
              onClick={() => select(s.id)}
              aria-current={s.id === active?.id ? "page" : undefined}
            >
              {s.label}
            </button>
          ))}
        </nav>
        <article className="etu-docs-hub-section" id={`docs-section-${active?.id}`}>
          {active?.summary && (
            <p className="etu-docs-hub-section-summary">{active.summary}</p>
          )}
          {active?.content}
        </article>
      </div>
    </div>
  );
}

/** Exported for apps that want to render or share the skill markdown without
 *  triggering a download (e.g., a "copy to clipboard" affordance). */
export function buildSkillMarkdownText(skill: DocsHubSkill): string {
  return buildSkillMarkdown(skill);
}
