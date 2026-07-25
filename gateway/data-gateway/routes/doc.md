# Data Gateway API 文件

> 最後更新：2026-07-25

---

## 目錄

- [公開 API（不需 JWT）](#公開-api-不需-jwt)
  - [GET /health](#get-health)
  - [POST /api/setup](#post-api-setup)
- [資料 API（需 JWT）](#資料-api-需-jwt)
  - [GET /api/:collection](#get-api-collection)
  - [GET /api/:collection/:model](#get-api-collection-model)
  - [POST /api/:collection/:model](#post-api-collection-model)
  - [GET /api/:id](#get-api-id)
  - [PUT /api/:id](#put-api-id)
  - [PATCH /api/:id](#patch-api-id)
  - [DELETE /api/:id](#delete-api-id)
- [內部 API（Gateway 內部調用）](#內部-api-gateway-內部調用)
  - [POST /inner-api/auth/verify-user](#post-inner-api-auth-verify-user)
- [頁面路由（瀏覽器）](#頁面路由-瀏覽器)
  - [GET /](#get)
  - [GET /setup](#get-setup)
  - [GET /admin](#get-admin)
  - [GET /logout](#get-logout)
- [附錄](#附錄)
  - [Composite ID 格式](#composite-id-格式)
  - [JWT Context 注入](#jwt-context-注入)
  - [通用錯誤回應](#通用錯誤回應)

---

## 公開 API（不需 JWT）

### GET /health

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
3. 查 L2 `site:config:{tenant}` 讀取 `資料庫` 欄位（加密的 L3 連線資訊）
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

## 資料 API（需 JWT）

> 所有資料 API 需攜帶有效 JWT（匿名或已認證皆可），透過 Cookie、Authorization header 或 query param `?token=` 傳遞。

### GET /api/:collection

列出指定 collection 下的所有 model type 及其記錄數量。

**URL Params**：

| 參數 | 說明 |
|------|------|
| `collection` | Collection 名稱（如 `使用者`、`圖片`） |

**Query Params**：無

**Response `200 OK`**：

```json
{
  "success": true,
  "data": {
    "collection": "使用者",
    "models": [
      { "type": "角色", "count": 5 },
      { "type": "使用者", "count": 1 }
    ],
    "totalRecords": 6
  }
}
```

---

### GET /api/:collection/:model

列出指定 model type 的所有記錄。

**URL Params**：

| 參數 | 說明 |
|------|------|
| `collection` | Collection 名稱 |
| `model` | Model type（composite ID 的第二段） |

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

**Response `200 OK`**：

```json
{
  "success": true,
  "data": [ ... ],
  "source": "L2",
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalPages": 1,
    "limit": 50,
    "offset": 0,
    "count": 5,
    "totalCount": 6
  }
}
```

| 欄位 | 說明 |
|------|------|
| `source` | 資料來源層級：`"L2"`（系統 DB）或 `"L3"`（租戶 DB） |
| `pagination.page` | 目前頁碼（從 1 開始） |
| `pagination.pageSize` | 每頁筆數 |
| `pagination.totalPages` | 總頁數 |
| `pagination.count` | 此頁回傳筆數 |
| `pagination.totalCount` | 該 model type 的總筆數 |

> 想知道某個 collection 下各 model type 的筆數？用 `GET /api/:collection` 即可，它會回傳每個 model type 的 `count` 及 `totalRecords`。

---

### POST /api/:collection/:model

新增一筆記錄。

**URL Params**：

| 參數 | 說明 |
|------|------|
| `collection` | Collection 名稱 |
| `model` | Model type |

**Request Body**：任意 JSON 資料

| 欄位 | 型態 | 必填 | 說明 |
|------|------|------|------|
| `id` | string | 否 | 若未提供，自動以 `{collection}:{model}:{nanoid}` 產生 |
| 其餘欄位 | any | 視需求 | 該 model type 的資料欄位 |

**id 格式驗證**：若提供 `id`，必須符合 `collection:model:nanoid` 格式，且 `collection` 與 `model` 須與 URL 參數一致。

**Response `200 OK`**：

```json
{
  "success": true,
  "data": {
    "id": "使用者:使用者:admin",
    "帳號": "admin",
    ...
  },
  "source": "L2"
}
```

---

### GET /api/:id

以 composite ID 取得單筆記錄。

**URL Params**：

| 參數 | 說明 |
|------|------|
| `id` | Composite ID，格式為 `collection:model:nanoid` |

**Response `200 OK`**：

```json
{
  "success": true,
  "data": { ... },
  "source": "L2"
}
```

**Response `404`**：

```json
{
  "success": false,
  "error": "找不到資料"
}
```

---

### PUT /api/:id

以 composite ID 更新單筆記錄（upsert）。

**URL Params**：

| 參數 | 說明 |
|------|------|
| `id` | Composite ID，格式為 `collection:model:nanoid` |

**Request Body**：更新的 JSON 資料（需包含 `id` 或與路由 id 一致）

**Response `200 OK`**：

```json
{
  "success": true,
  "data": { ... },
  "source": "L2"
}
```

---

### PATCH /api/:id

以 composite ID **部分更新**單筆記錄（只傳需要修改的欄位）。

**URL Params**：

| 參數 | 說明 |
|------|------|
| `id` | Composite ID，格式為 `collection:model:nanoid` |

**Request Body**：只包含要修改的欄位，例如：

```json
{
  "名稱": {
    "zh-tw": "新名稱"
  }
}
```

> 與 `PUT` 的差異：PUT 是**整個取代**（需傳完整物件），PATCH 只**合併**指定欄位，未提供的欄位保持不變。不允許修改 `id`。

**Response `200 OK`**：

```json
{
  "success": true,
  "data": { ... },
  "source": "L2"
}
```

**Response `404`**：

```json
{
  "success": false,
  "error": "找不到資料或更新失敗"
}
```

---

### DELETE /api/:id

以 composite ID 刪除單筆記錄。

**URL Params**：

| 參數 | 說明 |
|------|------|
| `id` | Composite ID，格式為 `collection:model:nanoid` |

**Response `200 OK`**：

```json
{
  "success": true,
  "data": true
}
```

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

### GET /

首頁，顯示 Data Gateway 概覽與 9 大亮點。

### GET /setup

安裝設定頁面，首次使用時自動導向。

### GET /admin

管理後臺頁面，需有效 JWT 驗證，否則導向 auth-gateway 登入頁。

顯示 L1 / L2 / L3 服務狀態與 API Endpoints 列表。

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
| `site:config:localhost` | localhost 租戶的網站設定 |

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
