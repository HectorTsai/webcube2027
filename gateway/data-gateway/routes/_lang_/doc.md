# Data Gateway API 文件

> 最後更新：2026-07-26

---

## 目錄

- [公開 API（不需 JWT）](#公開-api-不需-jwt)
  - [GET /api/health](#get-api-health)
  - [POST /api/setup](#post-api-setup)
  - [POST /api/site/apply](#post-api-site-apply)
- [通用資料 API（開放讀取，寫入需登入）](#通用資料-api開放讀取寫入需登入)
  - [GET /:collection](#get-collection)
  - [GET /:collection/:model](#get-collection-model)
  - [POST /:collection/:model](#post-collection-model)
  - [GET /:id](#get-id)
  - [PUT /:id](#put-id)
  - [PATCH /:id](#patch-id)
  - [DELETE /:id](#delete-id)
- [管理後台 API（角色管控）](#管理後台-api角色管控)
  - [/api/l2/*（超級管理員 L2）](#apil2超級管理員-l2)
  - [角色權限對照](#角色權限對照)
- [內部 API（Gateway 內部調用）](#內部-api-gateway-內部調用)
  - [POST /inner-api/auth/verify-user](#post-inner-api-auth-verify-user)
- [頁面路由（瀏覽器）](#頁面路由-瀏覽器)
  - [GET /（語言自動偵測）](#get-語言自動偵測)
  - [GET /:lang/](#get-lang)
  - [GET /:lang/setup](#get-lang-setup)
  - [GET /:lang/l2（超級管理員專用）](#get-langl2超級管理員專用)
  - [GET /:lang/l2/sites（超級管理員專用）](#get-langl2sites超級管理員專用)
  - [GET /logout](#get-logout)
- [附錄](#附錄)
  - [Composite ID 格式](#composite-id-格式)
  - [JWT Context 注入](#jwt-context-注入)
  - [通用錯誤回應](#通用錯誤回應)

---

## 公開 API（不需 JWT）

### GET /api/health

健康檢查端點，回傳各層狀態。

**Response `200 OK`**：

```json
{
  "status": "ok",
  "service": "data-gateway",
  "l1": "connected",
  "l2": "connected",
  "l3": "sqlite ✓ 已就緒"
}
```

| 欄位 | 說明 |
|------|------|
| `status` | `"ok"`（全部正常）或 `"degraded"`（部分異常） |
| `service` | 固定為 `"data-gateway"` |
| `l1` | `"connected"` 或 `"disconnected"` |
| `l2` | `"connected"` 或 `"disconnected"` |
| `l3` | `"未設定"`（無 L3）、`"{類型} ✓ 已就緒"`（連線正常）、`"{類型} ✗ 連線失敗"`（異常） |

L3 狀態查詢流程：
1. 從請求中提取 JWT（Cookie / Authorization header）
2. 從 JWT payload 取得 `tenant`
3. 查 L2 `網站資訊` collection（ID: `網站資訊:網站資訊:{tenant}`）讀取 `資料庫` 欄位（加密的 L3 連線資訊）
4. 解密後嘗試建立 L3 連線，回傳資料庫類型與狀態

---

### POST /api/setup

首次安裝端點，設定 L2 資料庫連線、auth-gateway URL、建立管理員。

**Request Body**：

```json
{
  "管理員帳號": "admin",
  "管理員密碼": "password",
  "auth_gateway_url": "http://localhost:8001",
  "l2": {
    "type": "sqlite",
    "filePath": "l2.db"
  }
}
```

| 欄位 | 型態 | 必填 | 說明 |
|------|------|------|------|
| `管理員帳號` | string | 是 | 超級管理員帳號 |
| `管理員密碼` | string | 是 | 超級管理員密碼（bcrypt 雜湊儲存） |
| `auth_gateway_url` | string | 否 | auth-gateway 的 URL，寫入 L1 供 JWT 公鑰取得使用 |
| `l2.type` | string | 否 | 資料庫類型（預設 `surrealdb`），支援所有 adapter |
| `l2.filePath` | string | 否 | SQLite 專用，存於 `data/` 目錄下 |

**Response `200 OK`**：

```json
{
  "success": true
}
```

**自動建立項目**：
- 5 個預設角色（超級管理員、管理員、會員、貴賓、黑名單）
- 1 個超級管理員使用者記錄（ID: `使用者:使用者:{帳號}`）

> **安全提示**：此端點僅限首次安裝呼叫。安裝完成後 `l2_connection` 寫入 L1，後續所有請求都會回傳 **`400`** `{"success":false,"error":"系統已安裝，無法重複安裝"}`，防止有心人覆蓋管理員帳密。

---

### POST /api/site/apply

申請新網站 — 建立租戶網站記錄（含加密的 L3 資料庫連線資訊）。

**Request Body**：

```json
{
  "網址": "https://example.com",
  "名稱": { "zh-tw": "範例網站", "en": "Example Site" },
  "描述": { "zh-tw": "說明" },
  "商標": "Example",
  "模式": "PUBLIC",
  "佈景主題": "佈景主題/佈景主題/經典藍",
  "語言": ["zh-tw", "en"],
  "預設語言": "zh-tw",
  "l3": {
    "type": "sqlite",
    "filePath": "tenant.db"
  }
}
```

| 欄位 | 型態 | 必填 | 說明 |
|------|------|------|------|
| `網址` | string | 是 | 網站完整網址（用於擷取 tenant host） |
| `名稱` | object | 是 | 多國語言名稱，至少一種語言（如 `{"zh-tw":"..."}`） |
| `描述` | object | 否 | 多國語言描述 |
| `商標` | string | 否 | 商標文字 |
| `模式` | `PUBLIC` / `PRIVATE` | 否 | 運作模式，預設 `PUBLIC` |
| `語言` | string[] | 否 | 支援語言清單，預設 `["zh-tw","en"]` |
| `預設語言` | string | 否 | 預設語言，預設 `zh-tw` |
| `l3` | object | 是 | L3 資料庫連線資訊（伺服器端自動加密後存入） |

**l3 支援類型**：

- `sqlite`：指定 `filePath`
- 其他（`surrealdb`、`postgresql`、`mysql`、`mongodb`）：指定 `host`、`port`、`database`、`username`、`password`

**處理流程**：

1. 驗證必要欄位與網址格式
2. 使用 `@dui/util` 的 `encrypt()` 將 L3 連線資訊加密
3. 寫入 L2 `網站資訊` collection（ID: `網站資訊:網站資訊:{hostname}`）

**Response `200 OK`**：

```json
{
  "success": true,
  "data": { "id": "網站資訊:網站資訊:example.com" }
}
```

---

## 通用資料 API（開放讀取，寫入需登入）

> 此為 data-gateway 的主要資料端點。**讀取（GET）開放給任何 JWT（含 訪客/匿名）**，寫入（POST/PUT/PATCH/DELETE）需要已認證 JWT。
> 通用 API 的 GET 會**自動合併 L2（系統層）與 L3（租戶層）的資料**，回應 `source: "L2+L3"`。
> JWT 可透過 Cookie、Authorization header 或 query param `?token=` 傳遞。

### GET /:collection

列出指定 collection 下的所有 model type，或依 composite ID 查詢單筆。

| 參數 | 說明 |
|------|------|
| `:collection` | Collection 名稱（如 `使用者`），或 composite ID（含 `:` 時觸發 getById） |

**列出 model types（無 `:` 時）**：

自動合併 L2 與 L3 的 model types，同 type 的 count 相加。

```json
{
  "success": true,
  "data": {
    "collection": "使用者",
    "source": "L2+L3",
    "models": [
      { "type": "角色", "count": 5 },
      { "type": "使用者", "count": 1 }
    ],
    "totalModels": 2
  }
}
```

**getById（含 `:` 時）**：內部使用 `dataPool.getById(id, host?)`，L3 優先，無則查 L2。

```json
{
  "success": true,
  "data": { "id": "使用者:角色:admin", ... },
  "source": "L3"
}
```

---

### GET /:collection/:model

列出指定 model type 的紀錄，合併 L2 + L3 結果（依 id 去重），支援分頁、篩選、排序。

**Query Params**：

| 參數 | 型態 | 預設值 | 說明 |
|------|------|--------|------|
| `page` | number | 1 | 頁碼（從 1 開始），與 `pageSize` 搭配 |
| `pageSize` | number | 50 | 每頁筆數（最大 100） |
| `limit` | number | 50 | 每頁筆數上限（`page`/`pageSize` 未提供時使用） |
| `offset` | number | 0 | 跳過筆數（`page`/`pageSize` 未提供時使用） |
| `sort` | string | - | 排序欄位（如 `updatedAt`、`名稱.zh-tw`） |
| `order` | `asc` / `desc` | `desc` | 排序方向 |
| `{field}` | string | - | 欄位篩選，所有條件 AND 疊加（如 `?帳號=admin`） |

> 分頁：`page`/`pageSize` 和 `limit`/`offset` 同時提供時前者優先。
> 篩選範例：`/api/使用者/角色?名稱.zh-tw=管理員&sort=名稱.zh-tw&order=asc`

**Response**：

```json
{
  "success": true,
  "data": [ { ... }, { ... } ],
  "source": "L2+L3",
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalPages": 2,
    "limit": 50,
    "offset": 0,
    "count": 50,
    "totalCount": 83
  }
}
```

---

### POST /:collection/:model

建立新紀錄。需已認證 JWT（拒絕 訪客/匿名），資料寫入該使用者的 L3（若無 tenant 則寫入 L2）。

**Request Body**：

| 欄位 | 型態 | 必填 | 說明 |
|------|------|------|------|
| `id` | string | 否 | 若未提供，自動以 `{collection}:{model}:{nanoid}` 產生 |
| 其餘欄位 | any | 視需求 | 該 model type 的資料欄位 |

> `id` 格式驗證：若提供 `id`，必須符合 `collection:model:nanoid` 格式。

**Response**：

```json
{
  "success": true,
  "data": { "id": "使用者:角色:abc123", ... },
  "source": "L3"
}
```

---

### GET /:id

以 composite ID 取得單筆記錄。自動 L3 → L2 依序查找。

| 參數 | 說明 |
|------|------|
| `:id` | Composite ID，格式 `collection:model:nanoid`（如 `使用者:角色:admin`） |

**Response**：

```json
{
  "success": true,
  "data": { ... },
  "source": "L3"
}
```

---

### PUT /:id

整筆更新（upsert）。需已認證 JWT。

> 請求主體需包含完整物件。若 `body.id` 與路由 `:id` 不一致則拒絕。

---

### PATCH /:id

部分更新。需已認證 JWT。

> 只合併請求主體中的欄位，未提供的欄位保持不變。不允許修改 `id`。

---

### DELETE /:id

刪除單筆記錄。需已認證 JWT。

---

## 管理後台 API（角色管控）

管理後台 API 提供**角色管控的資料操作**，與通用 API 的差別在於統一的 L2 操作範圍：
- `/api/l2/*` → 限超級管理員，操作 L2（系統資料庫）

共用 `utils/crud.ts` 中的 CRUD handler，`effective_host = undefined`。

### /api/l2/*（超級管理員 L2）

僅限角色包含 `使用者:角色:超級管理員` 的使用者。Middleware 設定 `effective_host = undefined`，操作 L2。

**Middleware 行為**：
1. 提取並驗證 JWT
2. 非超管角色回傳 `403 {"success":false,"error":"僅超級管理員可存取"}`
3. 設定 `effective_host = undefined`（操作 L2）

| 方法 | 路徑 | Handler | 說明 |
|------|------|---------|------|
| GET | `/api/l2/:collection` | handleCollection | 列出 L2 model types；若 `:collection` 含 `:` 則視為 composite ID 執行 getById |
| GET | `/api/l2/:collection/:model` | handleList | 列出 L2 紀錄（支援分頁、篩選、排序） |
| POST | `/api/l2/:collection/:model` | handleCreate | 在 L2 建立新紀錄 |
| PUT | `/api/l2/:id` | handleUpdate | L2 整筆更新（upsert） |
| PATCH | `/api/l2/:id` | handlePatch | L2 部分更新 |
| DELETE | `/api/l2/:id` | handleDelete | 刪除 L2 紀錄 |

> 查詢參數與 Response 格式同通用 API，唯 `source` 固定為 `"L2"`。

### 角色權限對照

| 角色 | 通用 API GET | 通用 API 寫入 | `/api/l2/*` |
|------|-------------|---------------|-------------|
| 訪客（未登入） | ✅ L3（預設）／ L2+L3（?scope=all） | ❌ 401 | ❌ 401 |
| 一般使用者 | ✅ 同上 | ❌ 403 | ❌ 403 |
| 管理員 | ✅ 同上 | ✅ L3 | ❌ 403 |
| 超級管理員 | ✅ 同上 | ✅ L2/L3 | ✅ L2 |

---

## 內部 API（Gateway 內部調用）

> 內部 API 不受安裝檢查限制，但僅供其他 Gateway 內部調用，不開放給外部請求。

### POST /inner-api/auth/verify-user

驗證使用者帳號密碼（供 auth-gateway 登入流程調用）。

**Request Body**：

```json
{
  "帳號": "admin",
  "密碼": "password"
}
```

**Response `200 OK`**：

```json
{
  "success": true,
  "data": {
    "id": "使用者:使用者:admin",
    "帳號": "admin",
    "角色": ["使用者:角色:超級管理員"]
  }
}
```

**Response `401`**（帳號或密碼錯誤）：

```json
{
  "success": false,
  "error": "帳號或密碼錯誤"
}
```

---

## 頁面路由（瀏覽器）

> 所有頁面路由支援多國語言，URL 前綴 `/:lang/` 決定顯示語言。
> 未提供語言碼時（`GET /`），系統根據瀏覽器 `Accept-Language` 標頭自動偵測並重新導向。

### GET /（語言自動偵測）

根路徑未設定語言前綴時，系統自動偵測瀏覽器偏好語言並重新導向：

1. 解析 `Accept-Language` 標頭，依權重排序
2. 與 114 種支援語言碼比對（完全比對優先，主要語系次之）
3. 若無匹配，預設使用 `en`

**範例**：瀏覽器設定為 `zh-TW,zh;q=0.9,en;q=0.8` → 重新導向至 `/zh-tw/`

### GET /:lang/

首頁，顯示 Data Gateway 概覽與 9 大亮點。

語言碼從 URL 路徑 `:lang` 參數取得，由 `_lang_/_middleware.ts` 驗證後注入 Context（`c.get('lang')`）。

### GET /:lang/setup

安裝設定頁面，首次使用時自動導向。

### GET /:lang/l2（超級管理員專用）

L2 管理後臺頁面，僅限**超級管理員**（角色 `使用者:角色:超級管理員`）存取。

- 未登入 → 導向回首頁
- 非超級管理員 → 導向回首頁
- 超級管理員 → 顯示管理功能（含申請網站連結）、服務狀態、API 測試工具

顯示 L1 / L2 / L3 服務狀態，內建 API 測試主控台（預設路徑為 `/api/l2/...`，操作 L2 系統資料庫）。

### GET /:lang/l2/sites（超級管理員專用）

申請新網站頁面。提供表單填入網站資訊（網址、名稱、支援語言）與 L3 資料庫連線設定，送出後呼叫 `POST /api/site/apply` 建立租戶記錄。

### GET /logout

登出 — 清除 JWT Cookie 並導向 auth-gateway 登入頁。

---

## 附錄

### Composite ID 格式

所有資料記錄統一使用三段落 Compsite ID：

```
collection:model:nanoid
```

| 段落 | 說明 | 範例 |
|------|------|------|
| `collection` | 集合（資料表）名稱 | `使用者`、`圖片`、`site` |
| `model` | 模型類型 | `角色`、`使用者`、`config` |
| `nanoid` | 唯一識別碼（12 字元） | `abc123def456` |

範例：

| ID | 說明 |
|----|------|
| `使用者:角色:超級管理員` | 超級管理員角色 |
| `使用者:使用者:admin` | admin 使用者 |
| `網站資訊:網站資訊:localhost` | localhost 租戶的網站設定 |

### JWT Context 注入

API Middleware 驗證 JWT 後，注入以下 Hono Context 值供 handler 使用：

| `c.get(...)` | 型態 | 說明 |
|---|---|---|
| `jwt_payload` | `object` | 完整 JWT payload |
| `tenant` | `string` | 租戶 domain（如 `example.com`） |
| `jwt_type` | `string` | `"anonymous"`（匿名）或 `"authenticated"`（已認證） |

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
| 400 | 請求資料格式錯誤或驗證失敗 |
| 401 | 未提供 JWT 或 token 無效/過期 |
| 404 | 找不到指定資料 |
| 500 | 伺服器內部錯誤 |
