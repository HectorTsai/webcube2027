# Site Gateway API 文件

> 最後更新：2026-08-06

---

## 目錄

- [公開 API（不需登入）](#公開-api不需登入)
  - [GET /api/health](#get-api-health)
  - [GET /api/version](#get-api-version)
  - [POST /api/setup](#post-api-setup)
  - [POST /api/site/apply](#post-apisiteapply)
  - [POST /api/site/test-connection](#post-apisitetest-connection)
  - [GET /api/sites](#get-apisites)
- [頁面路由（瀏覽器）](#頁面路由瀏覽器)
  - [GET /（語言自動偵測）](#get-語言自動偵測)
  - [GET /:lang/](#get-lang)
  - [GET /:lang/setup](#get-langsetup)
  - [GET /:lang/doc.md](#get-langdocmd)
  - [GET /:lang/history.md](#get-langhistorymd)

---

## 公開 API（不需登入）

### GET /api/health

健康檢查端點，回傳 data-gateway 連線狀態與 SitePool 快取狀態。

**Response `200 OK`**：

```json
{
  "status": "ok",
  "service": "site-gateway",
  "version": "0.6.0",
  "data_gateway_url": "http://localhost:8002",
  "data_gateway": { "configured": true, "reachable": true, "status": "ok" },
  "site_pool": { "status": { "totalItems": 0 }, "items": [] }
}
```

| 欄位 | 說明 |
|------|------|
| `status` | `"ok"` / `"degraded"` / `"error"` |
| `data_gateway` | data-gateway 是否已設定且可連線 |
| `site_pool` | SitePool 快照（快取數、命中率、待 flush 項目） |

### GET /api/version

回傳目前 site-gateway 版本號（從 `deno.json` 動態讀取）。

**Response `200 OK`**：

```json
{ "version": "0.6.0" }
```

### POST /api/setup

首次安裝端點，設定 auth-gateway 與 data-gateway 的 URL，並向 data-gateway 註冊取得 API Key。

**Request Body**：

```json
{
  "auth_gateway_url": "http://localhost:8001",
  "data_gateway_url": "http://localhost:8002",
  "master_key": "由 data-gateway 管理員提供"
}
```

**Response `200 OK`**：

```json
{ "success": true }
```

site-gateway 註冊的權限僅 `網站資訊`（讀/寫），只操作 L2 的 `網站資訊` collection，沒有 seed。

### POST /api/site/apply

註冊新網站（租戶）。domain 即租戶 ID，寫入 L2 `網站資訊` collection（經 SitePool 延遲寫入），並可委託 auth-gateway 建立網站管理員。

**Request Body**：

```json
{
  "domain": "example.com",
  "名稱": "範例網站",
  "描述": "這是範例",
  "模式": "production",
  "l3": { "adapter": "sqlite", "path": "./data/example.com.db" },
  "admin": { "帳號": "admin", "密碼": "password123", "名稱": "管理員" }
}
```

| 欄位 | 必填 | 說明 |
|------|------|------|
| `domain` | ✔ | 租戶 ID（hostname，自動正規化小寫） |
| `名稱` | ✔ | 網站顯示名稱 |
| `l3.adapter` | | 資料庫類型（預設 `sqlite`） |
| `l3.path` | | SQLite 檔案路徑（預設 `./data/{domain}.db`） |
| `admin` | | 網站管理員（委託 auth-gateway `/api/register` 建立） |

**Response `200 OK`**：

```json
{ "success": true, "data": { "id": "網站資訊:網站資訊:example.com", "domain": "example.com", "名稱": "範例網站", "狀態": "active", "admin_created": true } }
```

L3 資料庫不需在此初始化 — data-gateway 收到帶 `X-Tenant` header 的請求時，會依網站資訊的 `資料庫` 欄位自動建立 L3 連線。

### POST /api/site/test-connection

測試 L3 資料庫連線（site-gateway 本地以 `@dui/database` 直接測試，不依賴 data-gateway）。

**Request Body**：

```json
{ "l3": { "adapter": "sqlite", "path": "./data/test.db" } }
```

**Response**：

```json
{ "success": true, "message": "連線成功" }
```

### GET /api/sites

列出所有網站（租戶）— 查詢 data-gateway L2 `網站資訊` collection 的全部記錄，並附加 SitePool 狀態。

**Response `200 OK`**：

```json
{
  "success": true,
  "data": [
    { "id": "網站資訊:網站資訊:example.com", "domain": "example.com", "名稱": "範例網站", "狀態": "active" }
  ],
  "site_pool": { "status": { "totalItems": 1 } }
}
```

---

## 頁面路由（瀏覽器）

### GET /（語言自動偵測）

依 `Accept-Language` / `lang` cookie 自動重新導向至 `/:lang/`。

### GET /:lang/

首頁。顯示網站管理特色、SitePool 快取狀態卡（快取數、命中率、待 flush 項目）。

### GET /:lang/setup

安裝設定頁面。填寫 auth-gateway URL、data-gateway URL 與 Master Key。

### GET /:lang/doc.md

本文件（Markdown 自動轉 HTML）。

### GET /:lang/history.md

版本紀錄（Markdown 自動轉 HTML）。
