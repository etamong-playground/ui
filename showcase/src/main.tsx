import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
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
