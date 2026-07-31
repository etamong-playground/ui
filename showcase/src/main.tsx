import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Pretendard Variable (subset woff2, bundled via the `pretendard` package) is
// licensed under the SIL Open Font License 1.1 — full text distributed at
// /PRETENDARD-OFL.txt (showcase/public/PRETENDARD-OFL.txt).
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "@etamong-playground/ui/styles.css";
import "./showcase.css";
import { I18nProvider, ViewportProvider } from "@etamong-playground/ui";
import { messages } from "./messages";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("No #root element");

createRoot(root).render(
  <StrictMode>
    <I18nProvider appKey="ui-showcase" messages={messages}>
      <ViewportProvider>
        <App />
      </ViewportProvider>
    </I18nProvider>
  </StrictMode>,
);
