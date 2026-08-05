# Data Gateway API 文件

> 最後更新：2026-08-03

---

## 目錄

- [公開 API（不需 API Key）](#公開-api不需-api-key)
  - [GET /api/health](#get-api-health)
  - [POST /api/setup](#post-api-setup)
  - [POST /api/register-gateway](#post-api-register-gateway)
- [L1/L2/L3 資料 API（需 X-API-Key）](#l1l2l3-資料-apix-api-key)
  - [通用 CRUD 路由](#通用-crud-路由)
  - [/api/l1/*（L1 bootstrap 資料）](#apil1l1-bootstrap-資料)
  - [/api/l2/*（L2 系統資料庫）](#apil2l2-系統資料庫)
  - [/api/l3/*（L3 租戶資料庫）](#apil3l3-租戶資料庫)
- [頁面路由（瀏覽器）](#頁面路由瀏覽器)
  - [GET /（語言自動偵測）](#get-語言自動偵測)
  - [GET /:lang/](#get-lang)
  - [GET /:lang/setup](#get-lang-setup)
  - [GET /:lang/doc.md](#get-langdocmd)
- [附錄](#附錄)
  - [Composite ID 格式](#composite-id-格式)
  - [通用錯誤回應](#通用錯誤回應)

---

## 公開 API（不需 API Key）

以下端點不屬於 L1/L2/L3 目錄，不須 API Key 即可存取。

### GET /api/health

健康檢查端點，回傳 L1/L2/L3 各層連線狀態（不依賴 JWT）。

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

---

### POST /api/setup

首次安裝端點，設定 L2 資料庫連線與 Master Key。

**Request Body**：

```json
{
  "master_key": "your-master-key",
  "l2": {
    "type": "sqlite",
    "filePath": "l2.db"
  }
}
```

| 欄位 | 型態 | 必填 | 說明 |
|------|------|------|------|
| `master_key` | string | 是 | Master Key（至少 8 字元），加密儲存，供其他 Gateway 之後呼叫 `/api/register-gateway` 註冊使用 |
| `l2.type` | string | 否 | 資料庫類型（預設 `surrealdb`），支援所有 adapter |
| `l2.filePath` | string | 否 | SQLite 專用，存於 `data/` 目錄下 |

**Response `200 OK`**：

```json
{
  "success": true
}
```

> **Seed 與管理員帳號不在本端點建立。** 角色／使用者 seed（L1：訪客角色＋訪客使用者；L2：訪客／超級管理員／管理員／會員／貴賓／黑名單角色＋訪客使用者）由 **auth-gateway 安裝流程**以 L1/L2 CRUD API 逐筆寫入；管理員帳號由 auth-gateway 的 `/api/register` 端點建立。
>
> **安全提示**：此端點僅限首次安裝呼叫。安裝完成後 `l2_connection` 寫入設定檔，後續所有請求都會回傳 **`400`** `{"success":false,"error":"系統已安裝，無法重複安裝"}`。

---

### POST /api/register-gateway

其他 Gateway（auth-gateway、site-gateway 等）以 Master Key 註冊，取得專屬 **API Key** 並宣告所需 collection 權限。註冊成功後 data-gateway 會自動以請求來源位址記錄該 Gateway 的 URL（存於 ConfigStore 的 `gateways` 表，可經 `GET /api/health` 查詢），供其他服務診斷各 Gateway 位置。

**Request Body**：

```json
{
  "name": "auth-gateway",
  "master_key": "your-master-key",
  "權限": {
    "使用者": { "讀": true, "寫": true },
    "角色": { "讀": true, "寫": true }
  }
}
```

**Response `200 OK`**：

```json
{
  "success": true,
  "api_key": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

---

## L1/L2/L3 資料 API（需 X-API-Key）

L1、L2、L3 三層的 CRUD 路由**結構完全同構**，差異只在操作的資料庫層級與 middleware：

- 所有請求需帶 **`X-API-Key: <gateway api key>`** header（由 `/api/register-gateway` 取得）
- 權限由各層 `_middleware.ts` 對照註冊權限表管控：GET 需「讀」權限、POST/PUT/PATCH/DELETE 需「寫」權限，否則回傳 `403`
- `extractCollection` 支援 **composite ID**：URL 段含 `:`（如 `使用者:角色:訪客`）時取第一段（`使用者`）作為 collection 判定
- **API 層無 JWT**：data-gateway 不解析 JWT，`/api/me` 由 auth-gateway 提供（前端跨域呼叫），網站清單 API（`/api/sites`）屬於 site-gateway

### 通用 CRUD 路由

以 `/api/lX`（X = 1／2／3）表示層級：

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/lX/:collection` | 列出 model types；若 `:collection` 含 `:` 則視為 composite ID 執行 getById |
| GET | `/api/lX/:collection/:model` | 列出紀錄（支援分頁、篩選、排序；單層路由：有 `X-Tenant` → L3，無 → L2） |
| POST | `/api/lX/:collection/:model` | 建立新紀錄（ID 自動以 `{collection}:{model}:{nanoid}` 產生，或由 body 提供）；**body 為陣列 → 批次建立**（id 可省略，已存在者逐筆回報失敗） |
| PUT | `/api/lX/:collection/:model` | **批次整筆更新（upsert）**，body 為 JSON 陣列（每筆含 `id`，單次最多 100 筆） |
| PATCH | `/api/lX/:collection/:model` | **批次部分更新**，body 為 JSON 陣列（每筆含 `id` + 欲合併欄位） |
| DELETE | `/api/lX/:collection/:model` | **批次刪除**，body 為 id 字串陣列（或含 `id` 之物件陣列） |
| PUT | `/api/lX/:id` | 單筆整筆更新（upsert），需完整物件 |
| PATCH | `/api/lX/:id` | 單筆部分更新（只合併指定欄位，不允許修改 `id`） |
| DELETE | `/api/lX/:id` | 單筆刪除 |

**批次操作**（PUT/PATCH/DELETE `/:collection/:model`，body 為 JSON 陣列）：逐筆驗證 composite ID 格式與路由的 collection/model 一致，逐筆執行、成功照常寫入，不因單筆失敗中止（部分成功）；回應：

```json
{
  "success": true,
  "source": "L2",
  "data": {
    "count": 3,
    "成功筆數": 2,
    "失敗筆數": 1,
    "成功": ["使用者:角色:test_a", "使用者:角色:test_b"],
    "失敗": ["其他:角色:bad"],
    "失敗原因": { "其他:角色:bad": "id collection \"其他\" 不符合路由 \"使用者\"" }
  }
}
```

**查詢參數**：

| 參數 | 型態 | 預設值 | 說明 |
|------|------|--------|------|
| `page` | number | 1 | 頁碼（從 1 開始），與 `pageSize` 搭配 |
| `pageSize` | number | 50 | 每頁筆數（最大 100） |
| `limit` | number | 50 | 每頁筆數上限（`page`/`pageSize` 未提供時使用） |
| `offset` | number | 0 | 跳過筆數（`page`/`pageSize` 未提供時使用） |
| `sort` | string | - | 排序欄位（如 `updatedAt`、`名稱.zh-tw`） |
| `order` | `asc` / `desc` | `desc` | 排序方向 |
| `{field}` | string | - | 欄位篩選，所有條件 AND 疊加（如 `?帳號=admin`） |

> 篩選支援 dot notation 巢狀欄位路徑（如 `名稱.zh-tw`）。欄位篩選與排序在 Pool 層級以記憶體過濾實作。

**Response**：

```json
{
  "success": true,
  "data": [ { ... }, { ... } ],
  "source": "L3",
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

### /api/l1/*（L1 bootstrap 資料）

- 操作 **L1**（本機 SQLite bootstrap 資料庫，啟動時自動初始化「使用者」collection）
- **供 auth-gateway 安裝時寫入 seed**：`POST /api/l1/角色/角色`（訪客角色）、`POST /api/l1/使用者/使用者`（訪客使用者），已存在（`409`）則跳過（冪等）
- 無合併行為，`source` 固定為 `"L1"`

---

### /api/l2/*（L2 系統資料庫）

- 操作 **L2**（系統資料庫），`effective_host` 未設定
- 供 auth-gateway 寫入 L2 seed（訪客／超級管理員／管理員／會員／貴賓／黑名單 角色、訪客使用者）與建立使用者記錄
- 角色資料可直接以 composite ID 查詢，如 `GET /api/l2/使用者:角色:訪客`（middleware 取第一段 `使用者` 判定 collection）

---

### /api/l3/*（L3 租戶資料庫）

- 操作 **L3**（租戶資料庫），支援 **`X-Tenant`** header 指定操作的租戶 domain（未指定時回退 L2）
- **單層路由**：有 `X-Tenant` → 以 L3 為主（**列表僅查 L3**、**單筆查詢 L3 找不到時降級回退 L2**）；無 → L2。不再自動合併 L1/L2/L3，需合併時由各 gateway 自行 fetch 組合

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

首頁，**不需登入**，直接顯示 **L1 / L2 / L3 資料庫狀態**。

語言碼從 URL 路徑 `:lang` 參數取得，由 `_lang_/_middleware.ts` 驗證後注入 Context（`c.get('lang')`）。

> data-gateway **無登入／登出流程**（根 middleware 不處理 `?token=`／`?logout=1`，navbar 無登入/登出按鈕），也沒有 admin/manager 管理頁。帳號服務統一由 auth-gateway 提供。

### GET /:lang/setup

安裝設定頁面（L2 資料庫連線、Master Key），首次使用時自動導向。

### GET /:lang/doc.md

本 API 說明文件（.md 自動轉 HTML）。

---

## 附錄

### Composite ID 格式

所有資料記錄統一使用三段落 Composite ID：

```
collection:model:nanoid
```

| 段落 | 說明 | 範例 |
|------|------|------|
| `collection` | 集合（資料表）名稱 | `使用者`、`圖片`、`網站資訊` |
| `model` | 模型類型 | `角色`、`使用者`、`網站資訊` |
| `nanoid` | 唯一識別碼（12 字元） | `abc123def456` |

範例：

| ID | 說明 |
|----|------|
| `使用者:角色:超級管理員` | 超級管理員角色 |
| `使用者:使用者:admin` | admin 使用者 |
| `網站資訊:網站資訊:localhost` | localhost 租戶的網站設定 |

> URL 路徑段含 `:` 時（如 `/api/l2/使用者:角色:訪客`），middleware 的 `extractCollection` 會取第一段（`使用者`）作為 collection 判定。

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
| 401 | `X-API-Key` 無效或未註冊 |
| 403 | collection 權限不足（註冊權限表未宣告對應讀／寫權限） |
| 404 | 找不到指定資料 |
| 409 | 已存在（建立重複 ID 時回傳） |
| 500 | 伺服器內部錯誤 |
