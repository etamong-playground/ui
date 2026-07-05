import { useState } from "react";
import { ErrorPage, useT } from "@etamong-playground/ui";

export function ErrorPageSection() {
  const t = useT();
  const [showRetry, setShowRetry] = useState(true);
  const [showHome, setShowHome] = useState(true);
  const [showRef, setShowRef] = useState(true);

  return (
    <div className="sc-section">
      <div className="sc-prose">
        <h2>{t("section.error")}</h2>
        <p>
          Friendly full-page error surface. Pairs with the{" "}
          <code>httperr</code> <code>ref</code> pattern — show the clean message
          + the 8-hex reference code. No repo URLs / stack traces / file paths
          leak through (fleet rule:{" "}
          <code>concepts/no-repo-exposure</code>).
        </p>
      </div>

      <div className="sc-card">
        <div className="sc-card-header">Controls</div>
        <div className="sc-demo-row sc-demo-row--wrap">
          <label className="sc-checkbox">
            <input
              type="checkbox"
              checked={showRetry}
              onChange={(e) => setShowRetry(e.target.checked)}
            />
            onRetry button
          </label>
          <label className="sc-checkbox">
            <input
              type="checkbox"
              checked={showHome}
              onChange={(e) => setShowHome(e.target.checked)}
            />
            onHome button
          </label>
          <label className="sc-checkbox">
            <input
              type="checkbox"
              checked={showRef}
              onChange={(e) => setShowRef(e.target.checked)}
            />
            refCode
          </label>
        </div>
      </div>

      <div className="sc-card sc-error-frame">
        <div className="sc-card-header">Preview</div>
        <ErrorPage
          title="문제가 발생했어요"
          description="잠시 후 다시 시도해 주세요. 같은 문제가 계속되면 아래 코드를 알려주세요."
          refCode={showRef ? "a1b2c3d4" : undefined}
          onRetry={showRetry ? () => alert("retry clicked (demo)") : undefined}
          onHome={showHome ? () => alert("home clicked (demo)") : undefined}
        />
      </div>

      <div className="sc-card">
        <pre className="sc-code">{`// Next.js error.tsx:
"use client";
export default function Error({ error, reset }) {
  return (
    <ErrorPage
      title="문제가 발생했어요"
      description="잠시 후 다시 시도해 주세요."
      refCode={error.digest}
      onRetry={reset}
      onHome={() => location.assign("/")}
    />
  );
}

// Vite catch-all route:
<ErrorPage
  title="페이지를 찾을 수 없어요"
  onHome={() => navigate("/")}
/>`}</pre>
      </div>
    </div>
  );
}
