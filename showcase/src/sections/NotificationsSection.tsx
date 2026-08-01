import { useState } from "react";
import { NotificationBell, toast, uiConfirm, uiPrompt, useT } from "@etamong-playground/ui";
import { FeatureTag } from "../FeatureTag";

const demoBellItems = [
  { id: "1", content: <div><strong>배포 완료</strong><div className="sc-muted">3분 전</div></div> },
  { id: "2", content: <div><strong>리뷰 요청</strong><div className="sc-muted">1시간 전</div></div> },
  { id: "3", content: <div><strong>새 댓글</strong><div className="sc-muted">어제</div></div> },
];

export function NotificationsSection() {
  const t = useT();
  const [confirmResult, setConfirmResult] = useState<boolean | null>(null);
  const [promptResult, setPromptResult] = useState<string | null | undefined>(undefined);

  return (
    <div className="sc-section">
      <div className="sc-prose">
        <h2>{t("section.notifications")}</h2>
        <p>
          Mount <code>{"<Toaster />"}</code> and <code>{"<DialogHost />"}</code>{" "}
          once at the app root. Then call <code>toast()</code>,{" "}
          <code>uiConfirm()</code>, and <code>uiPrompt()</code> from anywhere —
          they talk to the mounted hosts via module-level pub/sub.
        </p>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>NotificationBell</span>
          <FeatureTag id="notification-bell" />
        </div>
        <p className="sc-card-body">
          Bell trigger + unread badge; click opens a popover (desktop/tablet) or a
          bottom sheet (mobile). <strong>Placement convention:</strong> a{" "}
          <code>{"<Sidebar>"}</code> nav row (<code>variant="row"</code>, see the live
          sidebar to the left) on tablet/desktop, or{" "}
          <code>{"<NavigationBar trailing>"}</code> on mobile — never the sidebar
          footer, and never paired with the theme toggle (that lives in{" "}
          <code>{"<UserMenu themeToggle>"}</code> now). This standalone trigger below
          is the same component in its default <code>variant="trigger"</code> form,
          for a plain header/toolbar mount.
        </p>
        <div className="sc-demo-row">
          <NotificationBell items={demoBellItems} title="알림" placement="bottom-left" />
        </div>
        <pre className="sc-code">{`// Header/toolbar — standalone trigger (default)
<NotificationBell items={items} />

// Sidebar row (desktop/rail) — mounted via SidebarItem.render
{ id: "notifications", render: () => (
    <NotificationBell variant="row" label="알림함" items={items} />
) }

// Mobile — NavigationBar's trailing edge (sidebar is hidden < 720px)
<NavigationBar trailing={<NotificationBell items={items} />} />`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>toast()</span>
          <FeatureTag id="toast" />
        </div>
        <p className="sc-card-body">
          Transient bottom-center notification. Returns an id for early dismissal.
        </p>
        <div className="sc-demo-row sc-demo-row--wrap">
          <button
            type="button"
            className="sc-btn sc-btn--ok"
            onClick={() => toast("저장됐어요", "ok")}
          >
            toast "ok"
          </button>
          <button
            type="button"
            className="sc-btn sc-btn--err"
            onClick={() => toast("오류가 발생했어요", "err")}
          >
            toast "err"
          </button>
          <button
            type="button"
            className="sc-btn sc-btn--info"
            onClick={() => toast("참고하세요", "info")}
          >
            toast "info"
          </button>
          <button
            type="button"
            className="sc-btn"
            onClick={() => toast("Custom duration (5 s)", "ok", 5000)}
          >
            toast 5 s
          </button>
        </div>
        <pre className="sc-code">{`import { toast } from "@etamong-playground/ui";

toast("저장됐어요", "ok");
toast("오류가 발생했어요", "err");
toast("참고하세요", "info");
toast("Custom duration", "ok", 5000);`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>uiConfirm()</span>
          <FeatureTag id="dialog" />
        </div>
        <p className="sc-card-body">
          Modal confirm; resolves <code>boolean</code>. Danger variant styles
          the confirm button red. Drop-in replacement for{" "}
          <code>window.confirm</code>.
        </p>
        <div className="sc-demo-row sc-demo-row--wrap">
          <button
            type="button"
            className="sc-btn"
            onClick={async () => {
              const ok = await uiConfirm({
                title: "계속할까요?",
                body: "이 작업은 되돌릴 수 없어요.",
                confirmLabel: "계속",
                cancelLabel: "취소",
              });
              setConfirmResult(ok);
            }}
          >
            uiConfirm (normal)
          </button>
          <button
            type="button"
            className="sc-btn sc-btn--err"
            onClick={async () => {
              const ok = await uiConfirm({
                title: "삭제할까요?",
                body: "되돌릴 수 없어요.",
                confirmLabel: "삭제",
                cancelLabel: "취소",
                danger: true,
              });
              setConfirmResult(ok);
            }}
          >
            uiConfirm (danger)
          </button>
        </div>
        {confirmResult !== null && (
          <p className="sc-result">
            Result: <code>{String(confirmResult)}</code>
          </p>
        )}
        <pre className="sc-code">{`const ok = await uiConfirm({
  title: "삭제할까요?",
  body: "되돌릴 수 없어요.",
  confirmLabel: "삭제",
  cancelLabel: "취소",
  danger: true,
});`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>uiPrompt()</span>
          <FeatureTag id="dialog" />
        </div>
        <p className="sc-card-body">
          Modal text prompt; resolves <code>string | null</code> (null on
          cancel). Drop-in replacement for <code>window.prompt</code>.
        </p>
        <div className="sc-demo-row">
          <button
            type="button"
            className="sc-btn"
            onClick={async () => {
              const name = await uiPrompt({
                title: "이름을 입력하세요",
                placeholder: "이름",
                defaultValue: "",
                confirmLabel: "확인",
              });
              setPromptResult(name);
            }}
          >
            uiPrompt
          </button>
        </div>
        {promptResult !== undefined && (
          <p className="sc-result">
            Result:{" "}
            <code>{promptResult === null ? "null (cancelled)" : `"${promptResult}"`}</code>
          </p>
        )}
        <pre className="sc-code">{`const name = await uiPrompt({
  title: "이름을 입력하세요",
  placeholder: "이름",
  confirmLabel: "확인",
});`}</pre>
      </div>
    </div>
  );
}
