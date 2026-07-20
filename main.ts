// webcube — root entry point
// 組合所有 gateway routes 到同一個 Hono app，所有服務透過 InnerAPI 溝通
//
// 2026-07-20 初始建立
// TODO:
//   - 各 gateway 逐步抽出路由，掛載到此 app
//   - data-gateway: adapter + 資料中心 API
//   - ai-gateway: AI 服務 API
//   - render-gateway: 渲染核心
//   - page-gateway: 頁面管理
//   - cube-gateway: 方塊系統
//   - theme-gateway: 佈景主題

import { Hono } from "hono";
import { serveStatic } from "hono/serve-static";
import { 設定App } from "@dui/util/InnerAPI";
import { info, error } from "@dui/util/logger";

const app = new Hono();

// ── 靜態檔案服務 ──
app.use("/static/*", serveStatic({ root: "." }));

// ── 健康檢查 ──
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── 掛載 Gateway Routes ──
// TODO: 各 gateway 逐步 refactor 成可組合的 route module 後在此掛載

// ── 注入 app 實例給 InnerAPI ──
設定App(app);

// ── 啟動 ──
async function main() {
  try {
    await info("Root", "webcube server starting...");
    Deno.serve({ port: 8000 }, app.fetch);
    await info("Root", "webcube server started on http://localhost:8000");
  } catch (err) {
    await error("Root", `啟動失敗: ${err}`);
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
