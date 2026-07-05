import { useState } from "react";
import {
  Avatar,
  BackButton,
  EmptyState,
  UserMenu,
  useInAppBack,
  useT,
  type BaseMe,
} from "@etamong-playground/ui";

const mockMe: BaseMe = {
  email: "demo@example.com",
  preferred_username: "demo",
  name: "Demo User",
  is_admin: false,
};

const mockAdmin: BaseMe = {
  email: "admin@example.com",
  preferred_username: "admin",
  name: "Admin User",
  is_admin: true,
};

export function ChromeSection({ navigate }: { navigate: (path: string) => void }) {
  const t = useT();
  const [showEmpty, setShowEmpty] = useState(false);
  const back = useInAppBack({ fallback: "#/chrome" });

  return (
    <div className="sc-section">
      <div className="sc-prose">
        <h2>{t("section.chrome")}</h2>
        <p>
          The shell <em>is</em> the demo — the <strong>Sidebar</strong>,{" "}
          <strong>MobileTabBar</strong>, and <strong>NavigationBar</strong> you
          see surrounding this content are all library components. Below are
          additional chrome primitives.
        </p>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">UserMenu + Avatar</div>
        <p className="sc-card-body">
          Avatar trigger + dropdown with display name, "내 정보" link, 로그아웃.
          Shows a "로그인" link when <code>me</code> is <code>null</code>.
          Mock identity — no real auth endpoint.
        </p>
        <div className="sc-demo-row sc-demo-row--wrap">
          <div>
            <p className="sc-label">Regular user</p>
            <UserMenu
              me={mockMe}
              myInfoHref={null}
              onSignOut={() => alert("Signed out (demo)")}
              placement="bottom-left"
            />
          </div>
          <div>
            <p className="sc-label">Admin user</p>
            <UserMenu
              me={mockAdmin}
              myInfoHref={null}
              onSignOut={() => alert("Signed out (demo)")}
              placement="bottom-left"
            />
          </div>
          <div>
            <p className="sc-label">Anonymous (me=null)</p>
            <UserMenu me={null} signedOutAction={<span className="sc-muted">로그인 (demo)</span>} />
          </div>
        </div>
        <div className="sc-demo-row sc-demo-row--wrap" style={{ marginTop: 12 }}>
          <p className="sc-label">Avatar sizes:</p>
          {[24, 32, 40, 48].map((size) => (
            <Avatar key={size} fallback="demo@example.com" size={size} />
          ))}
          <Avatar src="https://github.com/github.png" fallback="github" size={40} />
        </div>
        <pre className="sc-code">{`<UserMenu me={me} myInfoHref="/me" onSignOut={handleSignOut} />
<Avatar src={me.picture} fallback={me.email} size={32} />`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">BackButton + useInAppBack</div>
        <p className="sc-card-body">
          Tracks an in-app history stack via <code>history.state</code>.{" "}
          <code>canGoBack</code> is true when a prior in-app entry exists;
          falling back to a URL when navigating from an external link.
        </p>
        <div className="sc-demo-row sc-demo-row--wrap">
          <button
            type="button"
            className="etu-back-button"
            onClick={() => {
              back.push("#/chrome");
            }}
          >
            back.push (grow stack)
          </button>
          <BackButton
            canGoBack={back.canGoBack}
            goBack={back.goBack}
            fallback={() => navigate("#/overview")}
          />
        </div>
        <p className="sc-card-body">
          <code>canGoBack</code>: <strong>{String(back.canGoBack)}</strong>
        </p>
        <pre className="sc-code">{`const back = useInAppBack({ fallback: "/more" });
back.push("#/detail/1");   // grows the stack
back.replace("#/detail/2"); // replaces, doesn't grow

<BackButton canGoBack={back.canGoBack} goBack={back.goBack}
  fallback={() => router.push("/more")} />

// Or the one-liner (mounts hook internally):
<BackButton fallback="/more" />`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">EmptyState</div>
        <p className="sc-card-body">
          The canonical "nothing here" card. Every list/grid view uses this.
        </p>
        <div className="sc-demo-row sc-demo-row--wrap">
          <button
            type="button"
            className="sc-btn"
            onClick={() => setShowEmpty((v) => !v)}
          >
            {showEmpty ? "Hide" : "Show"} empty state
          </button>
        </div>
        {showEmpty && (
          <div style={{ marginTop: 16 }}>
            <EmptyState
              title="아직 항목이 없어요"
              description="새 항목을 추가해 시작해 보세요."
              action={
                <button
                  type="button"
                  className="sc-btn"
                  onClick={() => setShowEmpty(false)}
                >
                  닫기
                </button>
              }
            />
          </div>
        )}
        <div style={{ marginTop: 12 }}>
          <p className="sc-label">Compact variant:</p>
          <EmptyState compact title="결과 없음" description="검색어를 바꿔 보세요." />
        </div>
        <pre className="sc-code">{`<EmptyState
  title="아직 항목이 없어요"
  description="새 항목을 추가해 시작해 보세요."
  action={<button onClick={onNew}>새 항목</button>}
/>
<EmptyState compact title="결과 없음" />`}</pre>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">StatusBanner</div>
        <p className="sc-card-body">
          Polls <code>/.well-known/maintenance.json</code> and renders a sticky
          strip when the operator has declared a <code>degraded</code> /{" "}
          <code>maintenance</code> incident. Mount once at the app root. A
          404 from that endpoint is a no-op — no banner, no error.
        </p>
        <p className="sc-card-body sc-muted">
          Not demoed here — requires a live service-admin backend to set an
          incident. See the README for <code>{"<StatusBanner />"}</code> and{" "}
          <code>useStatusBanner()</code>.
        </p>
      </div>
    </div>
  );
}
