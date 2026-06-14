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
import { CopyButton } from "./copyButton";

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
  /**
   * Stable public URL serving the same skill markdown bytes as the
   * download button. Convention: `https://<app>.m.etamong.com/skill.md`.
   * When set, DocsHub shows a `curl … -o ~/.claude/skills/<slug>/SKILL.md`
   * one-liner as the primary install path (download stays as fallback).
   * The endpoint must be unauthenticated and return `text/markdown`.
   * See wiki/concepts/docs-hub.md.
   */
  publicUrl?: string;
  /** Optional CTA label override. Default: "📥 Claude skill 받기". */
  buttonLabel?: ReactNode;
  /**
   * Override or hide the auto-appended "Claude skill 사용법" section.
   * - `undefined` (default): DocsHub appends a standard usage section
   *   (Claude Code, Codex, plain LLM context).
   * - A custom `DocsHubSection`: use that instead.
   * - `null`: skip the auto-section entirely.
   */
  usageSection?: DocsHubSection | null;
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

function curlOneLiner(publicUrl: string, slug: string): string {
  return `curl -fsSL ${publicUrl} -o ~/.claude/skills/${slug}/SKILL.md`;
}

function defaultSkillUsageSection(skill: DocsHubSkill): DocsHubSection {
  const filename = `${skill.name}.md`;
  const oneLiner = skill.publicUrl
    ? curlOneLiner(skill.publicUrl, skill.name)
    : undefined;
  return {
    id: "__skill_usage__",
    label: "Claude skill 사용법",
    summary: oneLiner
      ? "한 줄 install 또는 파일 다운로드로 LLM과 함께 쓰는 법."
      : "다운로드한 .md 파일을 LLM과 함께 쓰는 법.",
    content: (
      <div className="etu-docs-hub-skill-usage">
        {oneLiner ? (
          <>
            <p>
              아래 한 줄이면 Claude Code 가 다음 세션부터 이 스킬을 인식해요.
              헤드리스/CI/SSH 어디서나 같은 명령으로 깔리고, 다시 실행하면
              최신 배포본으로 덮어써져요.
            </p>
            <div className="etu-docs-hub-skill-install">
              <code className="etu-docs-hub-skill-install-cmd">{oneLiner}</code>
              <CopyButton value={oneLiner} label="명령 복사" />
            </div>
            <p className="etu-docs-hub-skill-install-note">
              파일이 필요하면 우측 위 "📥" 버튼으로 <code>{filename}</code> 을
              직접 받아 <code>~/.claude/skills/{skill.name}/SKILL.md</code> 에
              두셔도 돼요 (오프라인/에어갭).
            </p>
          </>
        ) : (
          <p>
            위 "📥" 버튼이 <code>{filename}</code> 파일 한 개를 내려받아요. 그
            안에 이 페이지의 핵심이 마크다운으로 들어 있어서, 어느 LLM과도
            그대로 같이 쓸 수 있어요.
          </p>
        )}
        <h4>Claude Code (CLI)</h4>
        {oneLiner ? (
          <p>
            한 줄 install 후 Claude Code 를 재시작하거나 새 세션을 열면 스킬이
            자동으로 인식돼요. 대화 중에 "<em>{skill.name}</em> 스킬 써서…" 같이
            부르면 Claude 가 이 가이드를 바탕으로 동작해요.
          </p>
        ) : (
          <ol>
            <li>
              <code>~/.claude/skills/{skill.name}/SKILL.md</code> 경로로 옮기세요
              (디렉터리 이름과 파일 이름은 위와 그대로).
            </li>
            <li>
              Claude Code를 재시작하거나 새 세션을 열면 스킬이 자동으로
              인식돼요.
            </li>
            <li>
              대화 중에 "<em>{skill.name}</em> 스킬 써서…" 같이 부르면 Claude가
              이 가이드를 바탕으로 동작해요.
            </li>
          </ol>
        )}
        <h4>Codex / 기타 코딩 에이전트</h4>
        <p>
          툴이 권장하는 위치(예: <code>~/.codex/skills/</code>,
          <code>~/.codex/prompts/</code>)에 같은 파일을 두거나, 세션을 시작할
          때 첨부 파일로 올리세요. 프론트매터는 이름·설명만 담겨 있어서
          시스템 프롬프트 / 지시문 어느 자리에 넣어도 무해해요.
        </p>
        <h4>그 외 LLM (ChatGPT, Gemini, 자체 봇 등)</h4>
        <p>
          {skill.publicUrl ? (
            <>
              파일을 열어 본문을 통째로 첫 메시지(또는 시스템 프롬프트)에 붙여
              넣거나, <code>{skill.publicUrl}</code> 을 가져오게 해도 돼요.
              짧은 한 파일이라 컨텍스트 부담이 거의 없어요.
            </>
          ) : (
            <>
              파일을 열어 본문을 통째로 첫 메시지(또는 시스템 프롬프트)에 붙여
              넣으면 돼요. 짧은 한 파일이라 컨텍스트 부담이 거의 없어요.
            </>
          )}
        </p>
        <h4>업데이트</h4>
        <p>
          {oneLiner
            ? "이 페이지에 새 기능이 반영되면 같은 명령을 다시 실행해 덮어쓰면 돼요. URL 은 늘 최신 배포본을 가리켜요."
            : "이 페이지에 새 기능이 반영되면 같은 버튼으로 다시 받아 덮어쓰면 돼요. 스킬은 앱 변경과 같은 커밋에서 갱신돼요 — 늘 최신."}
        </p>
      </div>
    ),
  };
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
  const allSections = skill
    ? skill.usageSection === null
      ? sections
      : [...sections, skill.usageSection ?? defaultSkillUsageSection(skill)]
    : sections;
  const first = allSections[0]?.id ?? "";
  const [uncontrolled, setUncontrolled] = useState(defaultSectionId ?? first);
  const activeId = sectionId ?? uncontrolled;
  const active = allSections.find((s) => s.id === activeId) ?? allSections[0];

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
          {allSections.map((s) => (
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
