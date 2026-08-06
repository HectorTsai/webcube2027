# Auth Gateway API 文件

> 最後更新：2026-08-06（版本號已重新編號為語意化版本）

---

## 目錄

- [公開 API（不需登入）](#公開-api不需登入)
  - [GET /api/version](#get-api-version)
  - [GET /api/health](#get-api-health)
  - [POST /api/setup](#post-api-setup)
  - [POST /api/anonymous-token](#post-api-anonymous-token)
  - [POST /api/register](#post-api-register)
  - [POST /api/login](#post-api-login)
  - [GET /api/me](#get-api-me)
  - [GET /api/user](#get-api-user)
  - [GET /api/user/:id](#get-api-userid)
  - [GET /api/user/all](#get-api-userall)
  - [GET /api/role](#get-api-role)
  - [GET /api/role/:id](#get-api-roleid)
  - [GET /api/role/all](#get-api-roleall)
  - [GET /api/logout](#get-api-logout)
  - [POST /api/logout](#post-api-logout)
  - [POST /api/verify-user](#post-api-verify-user)
- [Token 驗證 API](#token-驗證-api)
  - [GET /api/verify](#get-api-verify)
  - [POST /api/verify](#post-api-verify)
  - [GET /api/jwt-public-key](#get-api-jwt-public-key)
- [頁面路由（瀏覽器）](#頁面路由瀏覽器)
  - [GET /（語言自動偵測）](#get-語言自動偵測)
  - [GET /:lang/](#get-lang)
  - [GET /:lang/login](#get-langlogin)
  - [GET /:lang/setup](#get-langsetup)
  - [GET /:lang/doc](#get-langdoc)
  - [GET /:lang/history](#get-langhistory)
- [附錄](#附錄)
  - [JWT Payload 格式](#jwt-payload-格式)
  - [登出跨域同步](#登出跨域同步)
  - [通用錯誤回應](#通用錯誤回應)

---

## 公開 API（不需登入）

`/api/*` 下的端點**預設公開**（不需登入），由各 API 目錄的 `_middleware.ts` 自行限制。目前依賴 data-gateway 安裝設定的端點（login、verify-user）以目錄 middleware 要求「已安裝」，未安裝時回傳 403；其餘端點一律放行。

### GET /api/version

回傳目前 auth-gateway 版本號（從 `deno.json` 動態讀取，所有 Gateway 共用 `@dui/framework` 的 `versionHandler`）。

**Response `200 OK`**：

```json
{
  "version": "0.21.0"
}
```

---

### GET /api/health

健康檢查 — 代理至 data-gateway 的 `/api/health` 取得整體狀態，同時回傳本機 AccountPool 快取狀態與凍結數。所有 Gateway 共用 `@dui/framework` 的 `createHealthHandler`。

**Response `200 OK`**（data-gateway 正常時）：

```json
{
  "status": "ok",
  "service": "data-gateway",
  "version": "0.21.0",
  "uptime": 12345,
  "l1": "connected",
  "l2": "connected",
  "l3": { "total": 3, "active": 2 },
  "pool": { "status": "ready", "total": 5, "idle": 3 },
  "gateways": {
    "auth-gateway": "http://localhost:8001",
    "data-gateway": "http://localhost:8002"
  },
  "data_gateway_url": "http://localhost:8002",
  "account_pool": {
    "status": "ready",
    "frozen_count": 2,
    "items": [
      { "id": "使用者:使用者:admin", "帳號": "admin", "frozen": false, "idleMs": 45000 },
      { "id": "使用者:使用者:visitor", "帳號": "visitor", "frozen": true, "idleMs": 1200000 }
    ]
  }
}
```

**Response `503`**（data-gateway 離線時）：

```json
{
  "status": "error",
  "service": "auth-gateway",
  "version": "0.21.0",
  "uptime": 12345,
  "data_gateway_url": "http://localhost:8002",
  "l1": "disconnected",
  "l2": "disconnected",
  "account_pool": {
    "status": "ready",
    "frozen_count": 2,
    "items": []
  }
}
```

| HTTP 狀態碼 | 說明 |
|------------|------|
| 200 | data-gateway 正常，回代理結果 |
| 503 | data-gateway 離線或尚未設定 |

---

### POST /api/setup

首次安裝端點：向 data-gateway 註冊取得 API Key、寫入 L1/L2 seed、建立初始超管理者帳號。

**Request Body**：

```json
{
  "data_gateway_url": "http://localhost:8002",
  "master_key": "your-master-key",
  "帳號": "admin",
  "密碼": "admin-password"
}
```

| 欄位 | 型態 | 必填 | 說明 |
|------|------|------|------|
| `data_gateway_url` | string | 是 | data-gateway 服務 URL |
| `master_key` | string | 是 | data-gateway 的 Master Key（至少 8 字元），用於向 data-gateway `POST /api/register-gateway` 註冊 |
| `帳號` | string | 是 | 初始超管理者帳號 |
| `密碼` | string | 是 | 初始超管理者密碼（至少 6 字元） |

**處理流程**：

1. 檢查是否已安裝（已安裝則拒絕重複安裝）
2. 以 `master_key` 向 data-gateway 註冊（宣告 `使用者`、`角色` 兩 collection 的讀／寫權限），取得專屬 API Key
3. 寫入 L1（`data_gateway_url`、`data_gateway_api_key`）
4. 寫入 L1/L2 seed（以內容 hash 比對版本，依 collection:model 分組以批次 PUT 覆寫）
5. 以 bcryptjs 雜湊密碼，透過 L2 CRUD 建立超管理者帳號（角色 `使用者:角色:超級管理員`）

> 已安裝後再次呼叫回傳 **`400`** `{"success":false,"error":"auth-gateway 已完成安裝。若需重新安裝，請清除 L1 資料。"}`

---

### POST /api/anonymous-token

簽發訪客 JWT（1 小時有效期）。供未登入的服務或 WebCube 先取得租戶資訊與訪客權限。

**Request Body**：

```json
{
  "domain": "www.dui.com.tw"
}
```

**處理流程**：

1. 向 data-gateway 查詢訪客角色（`使用者:角色:訪客`）權限
2. 以 EdDSA (Ed25519) 簽發訪客 JWT（`type: "visitor"`，payload 含角色權限）

> data-gateway 尚未就緒時回退為空權限，仍可簽發訪客 JWT。

**Response `200 OK`**：

```json
{
  "success": true,
  "data": { "token": "eyJhbGciOiJFZERTQSJ9..." }
}
```

---

### POST /api/register

租戶公開註冊，**一律寫入 L3（租戶資料庫）**。本端以 bcryptjs 雜湊密碼後，透過 L3 CRUD 寫入使用者紀錄。

**規則**：
- 不接受指定角色（`角色` 欄位一律忽略）
- L3 第一位註冊 → 角色 `使用者:角色:管理員`（該租戶站台管理者）
- 其後註冊 → 角色 `使用者:角色:會員`
- L3 不存在（網站未啟用租戶資料庫）→ 回傳 `400`
- tenant 取得順序：`body.tenant` → cookie 訪客 JWT → Host header
- 系統安裝（setup）不經由此端點，直接操作 L2 資料庫

**Request Body**：

```json
{
  "帳號": "member",
  "密碼": "password",
  "tenant": "www.dui.com.tw"
}
```

| 欄位 | 型態 | 必填 | 說明 |
|------|------|------|------|
| `帳號` | string | 是 | 使用者帳號 |
| `密碼` | string | 是 | 使用者密碼 |
| `tenant` | string | 否 | 租戶 hostname（不帶時依序從 cookie 訪客 JWT / Host header 推斷） |
| `名稱` | object | 否 | MultilingualString 名稱 |

> 主要用於 site-gateway 的 `/api/site/apply` 建立網站管理員帳號（第一位註冊自動為管理員）。

**Response `200 OK`**：

```json
{
  "success": true,
  "data": {
    "id": "使用者:使用者:member",
    "帳號": "member",
    "角色": ["使用者:角色:管理員"]
  }
}
```

**Response `400`**：

```json
{
  "success": false,
  "error": "租戶 www.dui.com.tw 的 L3 資料庫不存在或未啟用"
}
```

---

### POST /api/login

使用者登入（**需已安裝**）：驗證帳號密碼，簽發已認證 JWT（24 小時有效期）並設定 HttpOnly Cookie。

**Request Body**（`tenant` 為選填——不帶時依序從 cookie 訪客 JWT 或 Host header 推斷；L2 使用者（超級管理員）屬系統層、不隸屬租戶，登入不需 tenant，僅 L3 站台管理員需要）：

```json
{
  "帳號": "admin",
  "密碼": "password",
  "tenant": "www.dui.com.tw"
}
```

**處理流程**：

1. 取得 tenant（可選，依序）：body 的 `tenant` → cookie 訪客 JWT → Host header 推斷（不含埠號）
2. 呼叫本端 `/api/verify-user` 驗證帳號密碼（bcrypt + 權限合併）
3. 簽發已認證 JWT（`type: "authenticated"`），`Set-Cookie: jwt=...; HttpOnly; SameSite=Lax; Max-Age=86400`

**Response `200 OK`**：

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJFZERTQSJ9...",
    "帳號": "admin",
    "角色": ["使用者:角色:超級管理員"],
    "tenant": "www.dui.com.tw"
  }
}
```

---

### GET /api/me

回傳目前登入使用者資訊（從 JWT cookie 解碼）。不須登入即可存取，回傳內容依 token 有效與否不同：

- 無效 token／未登入 → `{ \"authenticated\": false }`
- 已認證 → `{ \"authenticated\": true, id, 名稱, 角色, tenant }`

使用 `id`（composite ID）而非 `帳號` 作為使用者識別碼，以支援未來 OAuth（Google/Facebook/GitHub）等外部登入方式。`名稱` 依當前語言解析為單一字串（如 `"管理者"`），供 UI 顯示用。

支援跨域存取（`credentials: 'include'`），供其他 gateway（如 data-gateway）的瀏覽器端直接呼叫。

---

### GET /api/user

> **權限**：需已登入（authenticated JWT）且對「使用者」collection 有讀權限（管理員、超級管理員；角色 model 亦屬此 collection）。

回傳所有使用者的基本資料清單（不含敏感欄位如密碼雜湊）。透過 data-gateway CRUD API 查詢，名稱依當前語言回傳單一語言文字。

支援 data-gateway 的查詢參數（所有參數皆為選填）：

| 參數 | 型態 | 預設值 | 說明 |
|------|------|--------|------|
| `page` | number | 1 | 頁碼（從 1 開始），與 `pageSize` 搭配 |
| `pageSize` | number | 50 | 每頁筆數（最大 100） |
| `limit` | number | 50 | 每頁筆數上限 |
| `offset` | number | 0 | 跳過筆數 |
| `sort` | string | - | 排序欄位（如 `updatedAt`） |
| `order` | `asc` / `desc` | `desc` | 排序方向 |
| `{field}` | string | - | 欄位篩選，如 `?帳號=admin` |

**Response `200 OK`**：

```json
{
  "success": true,
  "data": [
    {
      "id": "使用者:使用者:admin",
      "帳號": "admin",
      "名稱": "管理者",
      "角色": ["使用者:角色:超級管理員"],
      "圖示": "圖示:圖示:使用者",
      "最後登入": "2026-08-03T..."
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalPages": 1,
    "limit": 50,
    "offset": 0,
    "count": 1,
    "totalCount": 1
  }
}
```

| HTTP 狀態碼 | 說明 |
|------------|------|
| 200 | 查詢成功 |
| 502 | data-gateway 連線失敗 |

---

### GET /api/user/:id

> **權限**：需已登入且對「使用者」collection 有讀權限。

回傳指定使用者的基本資料（不含敏感欄位如密碼雜湊）。透過 data-gateway 查詢，名稱依當前語言回傳單一語言文字。

**Response `200 OK`**：

```json
{
  \"success\": true,
  \"data\": {
    \"id\": \"使用者:使用者:admin\",
    \"帳號\": \"admin\",
    \"名稱\": \"管理者\",
    \"角色\": [\"使用者:角色:超級管理員\"],
    \"圖示\": \"圖示:圖示:使用者\",
    \"最後登入\": \"2026-08-03T...\"
  }
}
```

| HTTP 狀態碼 | 說明 |
|------------|------|
| 200 | 查詢成功 |
| 404 | 使用者不存在 |
| 502 | data-gateway 連線失敗 |

---

### GET /api/user/all

> **權限**：需已登入且對「使用者」collection 有讀權限。

同時查詢 data-gateway 的三層儲存（L1 記憶體、L2 SQLite、L3 Postgres），合併回傳所有使用者，並加上「來源」欄位標示資料來自哪一層。

名稱依當前語言解析為單一語言文字，並以 Title Case 美化（如 `"super administrator"` → `"Super Administrator"`）。

支援分頁參數 `page`（預設 1）與 `pageSize`（預設 50）。分頁採**順序填充**：依 L1→L2→L3 逐層索取所需筆數（整層落在 skip 範圍內時該層僅回報總數、不取資料），`totalCount` 為三層加總的精確值。

**Response `200 OK`**：

```json
{
  "success": true,
  "data": [
    {
      "id": "使用者:使用者:訪客",
      "帳號": "訪客",
      "名稱": "訪客",
      "角色": ["使用者:角色:訪客"],
      "圖示": "圖示:圖示:使用者",
      "最後登入": "2026-08-04T...",
      "來源": "L1"
    },
    {
      "id": "使用者:使用者:admin",
      "帳號": "admin",
      "名稱": "管理者",
      "角色": ["使用者:角色:超級管理員"],
      "圖示": "圖示:圖示:使用者",
      "最後登入": "2026-08-04T...",
      "來源": "L2"
    }
  ],
  "total": 2,
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalPages": 1,
    "limit": 50,
    "offset": 0,
    "count": 2,
    "totalCount": 2
  }
}
```

| 狀態碼 | 說明 |
|--------|------|
| 200 | 查詢成功 |
| 502 | data-gateway 連線失敗（單層失敗不影響其他層） |

---

### GET /api/role

> **權限**：需已登入且對「使用者」collection 有讀權限（角色 model 屬「使用者」collection）。

回傳所有角色清單。透過 data-gateway CRUD API 查詢，名稱依當前語言回傳單一語言文字。

支援 data-gateway 的查詢參數（所有參數皆為選填）：

| 參數 | 型態 | 預設值 | 說明 |
|------|------|--------|------|
| `page` | number | 1 | 頁碼（從 1 開始），與 `pageSize` 搭配 |
| `pageSize` | number | 50 | 每頁筆數（最大 100） |
| `limit` | number | 50 | 每頁筆數上限 |
| `offset` | number | 0 | 跳過筆數 |
| `sort` | string | - | 排序欄位（如 `updatedAt`） |
| `order` | `asc` / `desc` | `desc` | 排序方向 |
| `{field}` | string | - | 欄位篩選，如 `?名稱.zh-tw=超級管理員` |

**Response `200 OK`**：

```json
{
  "success": true,
  "data": [
    {
      "id": "使用者:角色:超級管理員",
      "名稱": "超級管理員",
      "權限": { ... }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalPages": 1,
    "limit": 50,
    "offset": 0,
    "count": 6,
    "totalCount": 6
  }
}
```

| HTTP 狀態碼 | 說明 |
|------------|------|
| 200 | 查詢成功 |
| 502 | data-gateway 連線失敗 |

---

### GET /api/role/:id

> **權限**：需已登入且對「使用者」collection 有讀權限。

回傳指定角色的基本資料。透過 data-gateway 查詢，名稱依當前語言回傳單一語言文字。

**Response `200 OK`**：

```json
{
  \"success\": true,
  \"data\": {
    \"id\": \"使用者:角色:超級管理員\",
    \"名稱\": \"超級管理員\",
    \"權限\": { ... }
  }
}
```

| HTTP 狀態碼 | 說明 |
|------------|------|
| 200 | 查詢成功 |
| 404 | 角色不存在 |
| 502 | data-gateway 連線失敗 |

---

### GET /api/role/all

> **權限**：需已登入且對「使用者」collection 有讀權限。

同時查詢 data-gateway 的三層儲存（L1 記憶體、L2 SQLite、L3 Postgres），合併回傳所有角色，並加上「來源」欄位標示資料來自哪一層。

名稱依當前語言解析為單一語言文字，並以 Title Case 美化。

支援分頁參數 `page`（預設 1）與 `pageSize`（預設 50）。分頁採**順序填充**：依 L1→L2→L3 逐層索取所需筆數（整層落在 skip 範圍內時該層僅回報總數、不取資料），`totalCount` 為三層加總的精確值。

**Response `200 OK`**：

```json
{
  "success": true,
  "data": [
    {
      "id": "使用者:角色:超級管理員",
      "名稱": "超級管理員",
      "權限": { ... },
      "來源": "L2"
    }
  ],
  "total": 6,
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalPages": 1,
    "limit": 50,
    "offset": 0,
    "count": 6,
    "totalCount": 6
  }
}
```

| 狀態碼 | 說明 |
|--------|------|
| 200 | 查詢成功 |
| 502 | data-gateway 連線失敗（單層失敗不影響其他層） |

---

### GET /api/logout

登出（瀏覽器導航形式，供登出連結使用）：清除 auth-gateway 自身網域的 `jwt` cookie，並依 `redirect` 參數導向（防 Open Redirect）。

**Request**：

```http
GET /api/logout?redirect=http%3A%2F%2Flocalhost%3A8002%2Fzh-tw%2F
```

`redirect` 目標為 data-gateway 時，自動附加 `logout=1` 標記導回，由 data-gateway 根 middleware 清除其自身網域的 `jwt` cookie 後重導回原頁。

### POST /api/logout

登出（API 形式，供其他 Gateway／WebCube 程式調用），行為同 GET。

---

### POST /api/verify-user

本端帳號密碼驗證 + 權限合併（**需已安裝**）。供 `/api/login` 與 `localProvider` 內部呼叫。

**Request Body**：

```json
{
  "帳號": "admin",
  "密碼": "password",
  "tenant": "www.dui.com.tw"
}
```

**處理流程**：

1. 透過 data-gateway CRUD API 查詢使用者（先 L2，再依 `tenant` 查 L3）
2. 本端以 bcryptjs 比對密碼
3. 查詢使用者所屬各角色權限，以 `mergePermissions()` 合併

**Response `200 OK`**：

```json
{
  "success": true,
  "data": {
    "id": "使用者:使用者:admin",
    "帳號": "admin",
    "角色": ["使用者:角色:超級管理員"],
    "權限": { "l2": { "default": { "讀": true, "寫": true } } }
  }
}
```

---

## Token 驗證 API

供其他 Gateway 本地驗證 JWT。

### GET /api/verify

從 Authorization Header 或 Cookie 讀取 token 並驗證，回傳 payload（含權限）。

### POST /api/verify

**Request Body**：

```json
{
  "token": "eyJhbGciOiJFZERTQSJ9..."
}
```

**Response `200 OK`**：

```json
{
  "valid": true,
  "payload": {
    "tenant": "www.dui.com.tw",
    "sub": "使用者:使用者:admin",
    "帳號": "admin",
    "角色": ["使用者:角色:超級管理員"],
    "權限": { "l2": { "default": { "讀": true, "寫": true } } },
    "type": "authenticated",
    "exp": 1234654290,
    "iat": 1234567890
  }
}
```

### GET /api/jwt-public-key

取得 Ed25519 公鑰（hex 編碼 SPKI 格式），供其他 gateway 本地驗證 JWT：

```json
{
  "publicKey": "302a300506032b6570032100...",
  "algorithm": "EdDSA"
}
```

---

## 頁面路由（瀏覽器）

> 所有頁面路由支援多國語言，URL 前綴 `/:lang/` 決定顯示語言。
> 未提供語言碼時（`GET /`），系統根據瀏覽器 `Accept-Language` 標頭自動偵測並重新導向。

### GET /（語言自動偵測）

根路徑未設定語言前綴時，依 `Accept-Language` 標頭偵測偏好語言並重新導向至 `/:lang/`。

### GET /:lang/

首頁（Gateway 資訊展示），不需登入。

### GET /:lang/login

登入頁面，簽發 HttpOnly JWT Cookie。

### GET /:lang/setup

安裝設定頁面（data-gateway URL、Master Key、超管理者帳號），首次使用時自動導向。

### GET /:lang/doc

本 API 說明文件（.md 自動轉 HTML）。

### GET /:lang/history

版本紀錄頁面，列出各版本變更說明（.md 自動轉 HTML，比照 doc.md）。首頁版本號 badge 及 `/api/version` 皆從 `deno.json` 動態讀取，無硬編碼。

---

## 附錄

### JWT Payload 格式

**訪客 JWT**（`POST /api/anonymous-token` 簽發，1 小時）：

```json
{
  "tenant": "www.dui.com.tw",
  "sub": "使用者:使用者:訪客",
  "帳號": "訪客",
  "角色": ["使用者:角色:訪客"],
  "權限": { "l2": { "default": { "讀": false, "寫": false } }, "l3": { "default": { "讀": true, "寫": false } } },
  "type": "visitor",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**已認證 JWT**（`POST /api/login` 簽發，24 小時）：

```json
{
  "tenant": "www.dui.com.tw",
  "sub": "使用者:使用者:admin",
  "帳號": "admin",
  "角色": ["使用者:角色:超級管理員"],
  "權限": { "l2": { "default": { "讀": true, "寫": true } }, "l3": { "default": { "讀": true, "寫": true } } },
  "type": "authenticated",
  "iat": 1234567890,
  "exp": 1234654290
}
```

> `權限` 欄位為合併多個角色後的權限地圖，data-gateway 可直接讀取進行存取控制。

### 登出跨域同步

auth-gateway 與 data-gateway 為不同網域，各自持有獨立的 HttpOnly `jwt` cookie。登出時由 auth-gateway 統一協調：自身 cookie 直接清除，其他 gateway 網域的 cookie 以「redirect 帶 `logout=1` 標記 → 對方根 middleware 清除」的方式同步處理。任何 gateway／WebCube 只需把登出連結指向 auth-gateway 的 `/api/logout` 即可。

### 通用錯誤回應

所有 API 在發生錯誤時統一回傳以下格式：

```json
{
  "success": false,
  "error": "錯誤訊息"
}
```

常見 HTTP 狀態碼：

| 狀態碼 | 說明 |
|--------|------|
| 400 | 請求資料格式錯誤或驗證失敗（含已安裝後重複呼叫 `/api/setup`） |
| 401 | 帳號密碼錯誤、token 無效或已過期 |
| 403 | 未安裝時存取需已安裝的 API（login、verify-user） |
| 500 | 伺服器內部錯誤 |
