# site-gateway 版本紀錄

> 版本紀錄已從規格書獨立出來。以里程碑計數：每個里程碑 `+0.1.0`，初始 `0.1.0`。

| 版本 | 日期 | 說明 |
|------|------|------|
| 0.6.0 | 2026-08-06 | **依 gateway 規格書全面重構**：(1) 新增 `SitePool`（繼承 `@dui/pool` BasePool）快取 L2 網站資訊，變更延遲寫入（onFlush 每 5 秒 batch 寫回 L2 的 `PUT /api/l2/` 0.16.0 批次根路由，失敗保留 dirty flag 重試）、太久未讀自動清除、`getStatus()` 供 health 輸出。(2) 新增 `/api/version`、`/api/health`（含 data-gateway 連線狀態與 site_pool 快照）。(3) `_layout.tsx` 改用 `GatewayLayout` 標準外殼（版本 badge + data-gateway 狀態 badge）；首頁改用 `GatewayHero`/`StatusCard`/`FeatureGrid`/`TechStackRow`/`WaveBackground`。(4) `_middleware.ts` 補上語言注入與 JWT 驗證注入（`@dui/util/jwt` 的 `extractToken`/`verifyToken`，注入 `jwt_payload`/`tenant`/`jwt_type`/`帳號`/`角色`/`權限`）。(5) `/api/site/apply` 移除不存在的 `/api/l3/init` 與 `/api/l2/info` 呼叫，改以 SitePool 延遲寫入 L2 網站資訊（欄位依 Model：模式/設定/資料庫/狀態），管理員建立失敗時自動回滾。(6) `/api/site/test-connection` 改為本地 `createAdapter` 測試（data-gateway 無此端點）。(7) `/api/sites` 修正 L2 路徑為 `/api/l2/網站資訊/網站資訊`。(8) setup 補上 `setAuthGatewayUrl()`（供 verifyToken 拉取 Ed25519 公鑰）。`deno.json` 加入 `@dui/pool` 相依。規格書同步更新（SitePool 設計、資料邊界：只操作 L2 網站資訊、無 seed），`docs/版本紀錄.md` 併入本檔。 |
| 0.5.0 | 2026-08-03 | site/apply 移除角色建立：刪除 `defaultRoleDefs` 與對 data-gateway `/api/l2/bulk-create` 的呼叫，預設角色（會員/貴賓/黑名單）與管理員角色改由 auth-gateway 安裝時寫入的 L2 seed 提供。修正網站資訊寫入：URL 由錯誤的 `/api/l2/_collection_/網站資訊/_model_/{id}` 改為 `POST /api/l2/網站資訊/網站資訊`；ID 由錯誤的 2 段式 `網站資訊:{domain}` 改為 3 段式 `網站資訊:網站資訊:{domain}`。規格書同步更新。 |
| 0.4.0 | 2026-08-03 | 整合 auth-gateway `/api/register`：`/api/site/apply` 改為呼叫 auth-gateway 的 `/api/register` 建立網站管理員（取代直接呼叫 data-gateway 的 `/api/l2/create-admin`）。規格書同步更新 site/apply 說明與 TODO 註記。 |
| 0.3.0 | 2026-08-03 | 安全整合：setup 流程擴充 — 安裝時需輸入 Master Key，自動呼叫 data-gateway `POST /api/register-gateway` 註冊取得 API Key 並儲存；所有 data-gateway L2/L3 呼叫加入 `X-API-Key` header。 |
| 0.2.0 | 2026-08-03 | 網站管理 API 實作：POST /api/site/apply（含 L3 初始化、管理員帳號建立、網站資訊寫入）、POST /api/site/test-connection、GET /api/sites；持有網站資訊 model；data-gateway 中相關路由已移除 |
| 0.1.0 | 2026-08-03 | 初始版本：site-gateway 骨架建立（main.ts、deno.json、ConfigStore、安裝檢查 middleware、setup 流程）；持有「網站資訊」model；網站管理 API 待從 data-gateway 搬入 |
