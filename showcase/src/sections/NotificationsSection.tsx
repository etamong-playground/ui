import { useState } from "react";
import {
  NotificationBell,
  PushEnableRow,
  toast,
  uiConfirm,
  uiPrompt,
  useT,
  usePushPermission,
  type PushPermissionState,
  type UsePushPermissionResult,
} from "@etamong-playground/ui";
import { FeatureTag } from "../FeatureTag";

const demoBellItems = [
  { id: "1", content: <div><strong>배포 완료</strong><div className="sc-muted">3분 전</div></div> },
  { id: "2", content: <div><strong>리뷰 요청</strong><div className="sc-muted">1시간 전</div></div> },
  { id: "3", content: <div><strong>새 댓글</strong><div className="sc-muted">어제</div></div> },
];

// Illustrative-only — a real app never fabricates a permission result. This
// mock lets the gallery show every PushEnableRow state side by side, since
// the live browser can only ever be in one of them at a time.
function mockPermission(state: PushPermissionState): UsePushPermissionResult {
  return {
    state,
    supported: state !== "unsupported",
    canPrompt: state === "default",
    isBlocked: state === "denied",
    needsInstall: state === "needs-install",
    prompt: async () => state,
  };
}

const STATE_GALLERY: { state: PushPermissionState; label: string }[] = [
  { state: "default", label: "default — enable affordance" },
  { state: "needs-install", label: "needs-install — iOS, not yet added to Home Screen" },
  { state: "denied", label: "denied — re-enable explanation, no button" },
  { state: "granted", label: "granted (showGrantedConfirmation) — quiet confirmation" },
  { state: "unsupported", label: "unsupported — renders nothing" },
];

export function NotificationsSection() {
  const t = useT();
  const [confirmResult, setConfirmResult] = useState<boolean | null>(null);
  const [promptResult, setPromptResult] = useState<string | null | undefined>(undefined);
  // The real hook — reflects this browser's actual Notification.permission /
  // iOS-standalone status, same as any consuming app would get.
  const push = usePushPermission();

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
          bottom sheet (mobile). <strong>Placement convention (v0.48, planning#1133
          §6 correction):</strong> beside identity, via{" "}
          <code>{"<Sidebar footerAccessory>"}</code> with{" "}
          <code>variant="footer"</code> (see the live sidebar's identity footer to
          the left) on tablet/desktop, or <code>{"<NavigationBar trailing>"}</code>{" "}
          on mobile — never a nav-list row (that mount, <code>variant="row"</code>,
          is now deprecated), and never paired with the theme toggle (that lives in{" "}
          <code>{"<UserMenu themeToggle>"}</code>). This standalone trigger below
          is the same component in its default <code>variant="trigger"</code> form,
          for a plain header/toolbar mount.
        </p>
        <div className="sc-demo-row">
          <NotificationBell
            items={demoBellItems}
            title="알림"
            placement="bottom-left"
            push={{
              permission: push,
              onEnabled: () => toast("구독을 등록했어요 (데모)", "ok"),
            }}
          />
        </div>
        <p className="sc-card-body">
          Click the bell — this browser's real <code>usePushPermission()</code>{" "}
          state is currently <code>{push.state}</code>. When it's{" "}
          <code>"default"</code> the popover leads with{" "}
          <code>{"<PushEnableRow>"}</code> and the trigger carries a hollow
          setup dot (see below for what every other state looks like).
        </p>
        <pre className="sc-code">{`// Header/toolbar — standalone trigger (default)
<NotificationBell items={items} />

// Sidebar footer (desktop/rail) — beside identity, v0.48 canonical placement
<Sidebar
  footer={<UserMenu variant="full" .../>}
  footerAccessory={<NotificationBell variant="footer" items={items} />}
/>

// Mobile — NavigationBar's trailing edge (sidebar is hidden < 720px)
<NavigationBar trailing={<NotificationBell items={items} />} />

// Deprecated (v0.43–v0.47): nav-list row via SidebarItem.render. Kept
// working for existing consumers — new integrations use footerAccessory
// above unless the notification surface earns a nav row in its own right
// (a first-class triageable object with URL-worthy state — see the
// NotificationBell doc comment for the full test).
{ id: "notifications", render: () => (
    <NotificationBell variant="row" label="알림함" items={items} />
) }

// Opt-in push-permission affordance (v0.44, planning#1140) — omit \`push\`
// and NotificationBell is unchanged.
const push = usePushPermission();
<NotificationBell
  items={items}
  push={{ permission: push, onEnabled: () => subscribeAppSide() }}
/>`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">
          <span>usePushPermission / PushEnableRow</span>
          <FeatureTag id="push-permission" />
        </div>
        <p className="sc-card-body">
          The same <code>{"<PushEnableRow>"}</code> the bell popover uses
          above, standalone — this is the settings-page placement. One
          component, five states, driven entirely by{" "}
          <code>usePushPermission()</code>'s <code>state</code>. No banner:
          it's an inline row, meant to sit where intent already exists.
        </p>
        <div className="sc-card" style={{ background: "var(--etu-bg)" }}>
          <div className="sc-card-header">
            <span>Live — this browser's real state ({push.state})</span>
          </div>
          <PushEnableRow permission={push} showGrantedConfirmation />
        </div>
        <p className="sc-card-body" style={{ marginTop: "1rem" }}>
          State gallery (mocked, for illustration — a real app never
          fabricates a permission result):
        </p>
        {STATE_GALLERY.map(({ state, label }) => (
          <div key={state} className="sc-card" style={{ background: "var(--etu-bg)", marginBottom: "0.6rem" }}>
            <div className="sc-card-header">
              <span>{label}</span>
            </div>
            <PushEnableRow permission={mockPermission(state)} showGrantedConfirmation />
            {state === "unsupported" && (
              <p className="sc-card-body">(renders null — nothing above this line)</p>
            )}
          </div>
        ))}
        <pre className="sc-code">{`const push = usePushPermission();
// { state, supported, canPrompt, isBlocked, needsInstall, prompt }

<PushEnableRow
  permission={push}
  onEnabled={() => subscribeAppSide()}   // registration.pushManager.subscribe(...) + your own POST
  showGrantedConfirmation                 // optional quiet "알림이 켜져 있어요"
/>`}</pre>
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
